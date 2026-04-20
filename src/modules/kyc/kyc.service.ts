import { prisma } from '../../config/database';

export const kycService = {
  async getStatus(userId: string) {
    const kyc = await prisma.kyc.findUnique({
      where: { userId },
      select: { status: true },
    });
    return kyc?.status || 'NOT_STARTED';
  },

  async start(userId: string) {
    await prisma.kyc.upsert({
      where: { userId },
      update: { status: 'IN_PROGRESS' },
      create: { userId, status: 'IN_PROGRESS' },
    });
  },

  async uploadDocument(userId: string, type: string, fileUrl: string) {
    const kyc = await prisma.kyc.findUnique({ where: { userId } });
    if (!kyc) {
      throw new Error('KYC not started');
    }
    await prisma.kycDocument.create({
      data: { kycId: kyc.id, type, fileUrl },
    });
  },

  async submit(userId: string) {
    await prisma.kyc.update({
      where: { userId },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });
  },

  async getQueue() {
    return prisma.kyc.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        documents: true,
      },
    });
  },

  async review(kycId: string, decision: 'APPROVE' | 'REJECT', notes: string, reviewerId: string) {
    const status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    await prisma.kyc.update({
      where: { id: kycId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        notes,
      },
    });
  },
};