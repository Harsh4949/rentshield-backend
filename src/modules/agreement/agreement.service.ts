import { prisma } from '../../config/database';
import { AgreementStatus, SignatureType, Prisma } from '@prisma/client';

export const agreementService = {
  // ─── Template Management ──────────────────────────────────────
  
  async createTemplate(data: { name: string; state?: string; content: string; propertyType?: string }) {
    return prisma.agreementTemplate.create({ data });
  },

  async listTemplates(state?: string) {
    return prisma.agreementTemplate.findMany({
      where: state ? { state } : {},
      orderBy: { name: 'asc' }
    });
  },

  // ─── Agreement Lifecycle ──────────────────────────────────────

  async generateAgreement(tenancyId: string, templateId: string) {
    const tenancy = await prisma.tenancy.findUnique({
      where: { id: tenancyId },
      include: {
        tenant: true,
        property: { include: { owner: true } }
      }
    });

    const template = await prisma.agreementTemplate.findUnique({ where: { id: templateId } });
    if (!tenancy || !template) throw new Error('Tenancy or Template not found');

    // Dynamic Merge logic
    let content = template.content;
    const replacements: Record<string, string> = {
      '{{TENANT_NAME}}': `${tenancy.tenant.firstName} ${tenancy.tenant.lastName}`,
      '{{LANDLORD_NAME}}': `${tenancy.property.owner.firstName} ${tenancy.property.owner.lastName}`,
      '{{PROPERTY_ADDRESS}}': tenancy.property.address,
      '{{RENT_AMOUNT}}': tenancy.property.price.toString(),
      '{{START_DATE}}': tenancy.startDate.toLocaleDateString(),
      '{{END_DATE}}': tenancy.endDate ? tenancy.endDate.toLocaleDateString() : 'UNTIL FURTHER NOTICE'
    };

    for (const [key, value] of Object.entries(replacements)) {
      content = content.replace(new RegExp(key, 'g'), value);
    }

    return prisma.agreement.create({
      data: {
        tenancyId,
        templateId,
        status: 'DRAFT',
        version: 1
      }
    });
  },

  async signAgreement(userId: string, agreementId: string, type: SignatureType, signatureData: string) {
    const agreement = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: { tenancy: { include: { property: true } } }
    });

    if (!agreement) throw new Error('Agreement not found');
    
    // Authorization check
    const isLandlord = agreement.tenancy?.property.ownerId === userId;
    const isTenant = agreement.tenancy?.tenantId === userId;
    if (!isLandlord && !isTenant) throw new Error('Unauthorized to sign this agreement');

    const signature = await prisma.agreementSignature.create({
      data: {
        agreementId,
        userId,
        signatureType: type,
        signatureData
      }
    });

    // Check if both have signed
    const sigs = await prisma.agreementSignature.findMany({ where: { agreementId } });
    if (sigs.length >= 2) {
      await prisma.agreement.update({
        where: { id: agreementId },
        data: { status: 'SIGNED' }
      });
    } else {
      await prisma.agreement.update({
        where: { id: agreementId },
        data: { status: 'SIGNING' }
      });
    }

    return signature;
  },

  async applyStamping(agreementId: string) {
    const agreement = await prisma.agreement.findUnique({ where: { id: agreementId } });
    if (!agreement || agreement.status !== 'SIGNED') {
      throw new Error('Agreement must be SIGNED before stamping');
    }

    // MOCK: Generate unique Stamping ID and watermark URL
    const stampingId = `ESTAMP-${Math.floor(10000000 + Math.random() * 90000000)}`;
    
    return prisma.agreement.update({
      where: { id: agreementId },
      data: {
        stampingId,
        isStamped: true,
        status: 'REGISTERED',
        finalPdfUrl: `https://storage.rentshield.com/agreements/${agreementId}-watermarked.pdf`
      }
    });
  }
};
