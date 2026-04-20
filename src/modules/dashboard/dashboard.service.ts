import { prisma } from '../../config/database';
import { kycService } from '../kyc/kyc.service';
import { noticeService } from '../notice/notice.service';
import { societyService } from '../society/society.service';

export const dashboardService = {
  async getTenantDashboard(userId: string) {
    // Get KYC status
    const kycStatus = await kycService.getStatus(userId);

    // Get current tenancy
    const currentTenancy = await prisma.tenancy.findFirst({
      where: { tenantId: userId, status: 'ACTIVE' },
      include: {
        property: {
          include: {
            society: true,
            building: true
          }
        },
        paymentPlan: true
      }
    });

    // Next rent due
    let nextRentDue = null;
    if (currentTenancy?.paymentPlan) {
      const nextPayment = await prisma.payment.findFirst({
        where: {
          planId: currentTenancy.paymentPlan.id,
          status: 'PENDING'
        },
        orderBy: { dueDate: 'asc' }
      });
      if (nextPayment) {
        nextRentDue = {
          amount: nextPayment.amount,
          dueDate: nextPayment.dueDate
        };
      }
    }

    // Latest Notices
    const allNotices = await noticeService.listNoticesForUser(userId);
    const latestNotices = allNotices.slice(0, 5);

    // Society Summary
    let societySummary = null;
    if (currentTenancy?.property.societyId) {
      const societyDetails = await societyService.getSocietyDetails(currentTenancy.property.societyId);
      if (societyDetails) {
        societySummary = {
          name: societyDetails.name,
          emergencyContacts: societyDetails.emergencyContacts.slice(0, 3)
        };
      }
    }

    // Move-in widget
    const moveIn = await prisma.moveIn.findFirst({
      where: { tenancy: { tenantId: userId }, status: { not: 'COMPLETED' } }
    });
    const moveInWidget = moveIn ? { status: moveIn.status, scheduledAt: moveIn.scheduledAt } : null;

    // Exit widget
    const exitRequest = await prisma.exitRequest.findFirst({
      where: { tenancy: { tenantId: userId }, status: { not: 'CLOSED' } }
    });
    const exitWidget = exitRequest ? { status: exitRequest.status, date: exitRequest.desiredMoveOutDate } : null;

    // Open maintenance count
    const openMaintenanceCount = await prisma.maintenanceRequest.count({
      where: { tenantId: userId, status: { not: 'CLOSED' } }
    });

    // Open disputes count
    const openDisputesCount = await prisma.dispute.count({
      where: {
        tenantId: userId,
        status: { notIn: ['RESOLVED', 'CLOSED'] }
      }
    });

    // Quick actions - based on status
    const quickActions = [];
    if (kycStatus === 'NOT_STARTED') {
      quickActions.push({ action: 'START_KYC', label: 'Start KYC', enabled: true });
    }
    quickActions.push(
      { action: 'PAY_RENT', label: 'Pay Rent', enabled: !!nextRentDue },
      { action: 'RAISE_TICKET', label: 'Raise Ticket', enabled: true },
      { action: 'CHAT_LANDLORD', label: 'Chat Landlord', enabled: !!currentTenancy },
      { action: 'REQUEST_EXIT', label: 'Request Exit', enabled: !!currentTenancy && !exitWidget }
    );

    return {
      kycStatus,
      currentTenancy,
      nextRentDue,
      latestNotices,
      societySummary,
      moveInWidget,
      exitWidget,
      openMaintenanceCount,
      openDisputesCount,
      quickActions,
    };
  },
};