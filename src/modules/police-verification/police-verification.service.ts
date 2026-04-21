import { prisma } from '../../config/database';
import { PoliceVerificationStatus } from '@prisma/client';

export const policeVerificationService = {
  async getStatusByTenancy(tenancyId: string) {
    return prisma.policeVerification.findUnique({
      where: { tenancyId },
    });
  },

  async initiate(tenancyId: string, aadhaarNumber: string) {
    const existing = await prisma.policeVerification.findUnique({ where: { tenancyId } });
    
    if (existing && existing.status === 'VERIFIED') {
      throw new Error('Police verification already completed for this tenancy');
    }

    return prisma.policeVerification.upsert({
      where: { tenancyId },
      update: {
        aadhaarNumber,
        status: 'INITIATED',
        otpVerified: false,
      },
      create: {
        tenancyId,
        aadhaarNumber,
        status: 'INITIATED',
      },
    });
  },

  async verifyOtp(tenancyId: string, otp: string) {
    // In a real scenario, we would call the service provider's API here.
    // As per user: "they initiate KYC using Aadhar OTP ... so for KYC we no need to connect with any institution in this case"
    // This implies we handle the verification or the provider does.
    // For this implementation, we'll simulate the success if OTP is '123456' or just accept any for now as a placeholder for the provider integration.
    
    const verification = await prisma.policeVerification.findUnique({ where: { tenancyId } });
    if (!verification) throw new Error('Verification process not found');

    // Simulate provider integration success
    return prisma.policeVerification.update({
      where: { tenancyId },
      data: {
        status: 'KYC_COMPLETED',
        otpVerified: true,
        // providerRef: 'EXT-SIM-12345',
      },
    });
  },

  async markAsVerified(tenancyId: string, reportUrl?: string) {
    return prisma.policeVerification.update({
      where: { tenancyId },
      data: {
        status: 'VERIFIED',
        reportUrl,
      },
    });
  },

  async updateMoveOutStatus(tenancyId: string, notes: string) {
    return prisma.policeVerification.update({
      where: { tenancyId },
      data: {
        status: 'MOVE_OUT_UPDATED',
        moveOutNotes: notes,
      },
    });
  },
};
