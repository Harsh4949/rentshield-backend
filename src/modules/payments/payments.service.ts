import { prisma } from '../../config/database';
import { PaymentStatus, PaymentType, Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const paymentsService = {
  // ─── Billing Automation ───────────────────────────────────────

  async triggerMonthlyBilling() {
    const today = new Date();
    const activeTenancies = await prisma.tenancy.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: today },
        OR: [
          { endDate: null },
          { endDate: { gte: today } }
        ]
      },
      include: { paymentPlan: true }
    });

    let generatedCount = 0;
    for (const tenancy of activeTenancies) {
      if (!tenancy.paymentPlan) continue;

      // Check if rent record already exists for this month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const existing = await prisma.payment.findFirst({
        where: {
          planId: tenancy.paymentPlan.id,
          type: 'RENT',
          dueDate: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      if (!existing) {
        const dueDate = new Date(today.getFullYear(), today.getMonth(), tenancy.paymentPlan.dueDay);
        await prisma.payment.create({
          data: {
            planId: tenancy.paymentPlan.id,
            type: 'RENT',
            amount: tenancy.paymentPlan.rentAmount,
            balanceDue: tenancy.paymentPlan.rentAmount,
            dueDate,
            status: 'PENDING'
          }
        });
        generatedCount++;
      }
    }

    return { message: `Monthly billing triggered. ${generatedCount} new rent records created.` };
  },

  // ─── Payment Configuration ────────────────────────────────────

  async createPlan(data: {
    tenancyId: string;
    rentAmount: number;
    dueDay: number;
    depositAmount: number;
    lateFeeAmount?: number;
    lateFeeDays?: number;
  }) {
    return prisma.paymentPlan.create({ data });
  },

  async getDue(userId: string) {
    return prisma.payment.findMany({
      where: {
        status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
        plan: { tenancy: { tenantId: userId } }
      },
      include: { plan: { include: { tenancy: { include: { property: true } } } } },
      orderBy: { dueDate: 'asc' }
    });
  },

  // ─── Payment Processing ───────────────────────────────────────

  async initiatePayment(paymentId: string, userId: string, amount?: number) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { plan: { include: { tenancy: true } } }
    });

    if (!payment) throw new Error('Payment record not found');
    if (payment.plan.tenancy.tenantId !== userId) throw new Error('Permission denied');

    const amountToPay = amount || payment.balanceDue;
    if (amountToPay <= 0) throw new Error('Payment amount must be greater than zero');
    if (amountToPay > payment.balanceDue) throw new Error('Payment amount exceeds balance due');

    const newAmountPaid = payment.amountPaid + amountToPay;
    const newBalanceDue = payment.balanceDue - amountToPay;
    const newStatus: PaymentStatus = newBalanceDue === 0 ? 'COMPLETED' : 'PARTIALLY_PAID';

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: newStatus,
        amountPaid: newAmountPaid,
        balanceDue: newBalanceDue,
        paidDate: new Date(),
        gatewayOrderId: `order_${Date.now()}`
      }
    });

    await this.createLedgerEntry({
      paymentId,
      tenancyId: payment.plan.tenancyId,
      type: 'CREDIT',
      amount: amountToPay,
      description: `Payment for ${payment.type} (Paid: ${amountToPay})`
    });

    return { success: true, payment: updatedPayment };
  },

  async getLedger(tenancyId: string) {
    return prisma.ledgerEntry.findMany({
      where: { tenancyId },
      orderBy: { createdAt: 'desc' }
    });
  },

  async createLedgerEntry(data: {
    paymentId?: string;
    tenancyId: string;
    type: string;
    amount: number;
    description: string;
  }) {
    const lastEntry = await prisma.ledgerEntry.findFirst({
      where: { tenancyId: data.tenancyId },
      orderBy: { createdAt: 'desc' }
    });

    const balance = (lastEntry?.balance || 0) + (data.type === 'CREDIT' ? data.amount : -data.amount);

    return prisma.ledgerEntry.create({
      data: {
        ...data,
        balance
      }
    });
  },

  // ─── Receipt Generation ───────────────────────────────────────

  async generateReceiptPdf(paymentId: string): Promise<string> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        plan: {
          include: {
            tenancy: {
              include: {
                tenant: true,
                property: true
              }
            }
          }
        }
      }
    });

    if (!payment) throw new Error('Payment not found');

    const storageDir = path.join(process.cwd(), 'artifacts', 'receipts');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const fileName = `receipt_${paymentId}_${Date.now()}.pdf`;
    const filePath = path.join(storageDir, fileName);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      doc.fontSize(25).font('Helvetica-Bold').text('RENT SHIELD - RECEIPT', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(`Receipt ID: ${payment.id.toUpperCase()}`, { align: 'right' });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('Tenant Details:', { underline: true });
      doc.fontSize(10).font('Helvetica').text(`Name: ${payment.plan.tenancy.tenant.firstName} ${payment.plan.tenancy.tenant.lastName}`);
      doc.text(`Email: ${payment.plan.tenancy.tenant.email}`);
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('Property Details:', { underline: true });
      doc.fontSize(10).font('Helvetica').text(`Address: ${payment.plan.tenancy.property.address}`);
      doc.text(`${payment.plan.tenancy.property.city}, ${payment.plan.tenancy.property.state}`);
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      doc.fontSize(14).font('Helvetica-Bold').text('Payment Summary', { align: 'center' });
      doc.moveDown();

      const items = [
        ['Payment Type', payment.type],
        ['Total Order Amount', `$${payment.amount.toFixed(2)}`],
        ['Amount Paid in this transaction', `$${payment.amountPaid.toFixed(2)}`],
        ['Remaining Balance', `$${payment.balanceDue.toFixed(2)}`],
        ['Status', payment.status]
      ];

      items.forEach(([label, value]) => {
        doc.fontSize(10).font('Helvetica').text(label, 50, doc.y, { continued: true });
        doc.text(value, { align: 'right' });
        doc.moveDown(0.5);
      });

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      doc.fontSize(10).font('Helvetica-Oblique').text('Thank you for using Rent Shield. This is a computer-generated receipt.', { align: 'center' });

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', (err) => reject(err));
    });
  }
};