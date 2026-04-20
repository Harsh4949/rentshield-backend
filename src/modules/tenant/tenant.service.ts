import { prisma } from '../../config/database';

export const tenantService = {
  async getDashboardSummary(tenantId: string) {
    const [activeTenancies, openMaintenanceRequests, unpaidPayments] = await Promise.all([
      prisma.tenancy.count({
        where: { tenantId, status: 'ACTIVE' },
      }),
      prisma.maintenanceRequest.count({
        where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      prisma.payment.aggregate({
        where: {
          plan: { tenancy: { tenantId } },
          status: 'PENDING',
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      activeTenancies,
      openMaintenanceRequests,
      unpaidBalance: unpaidPayments._sum.amount || 0,
    };
  },

  async listTenancies(tenantId: string) {
    return prisma.tenancy.findMany({
      where: { tenantId },
      include: {
        property: {
          select: { title: true, address: true, city: true, state: true },
        },
        paymentPlan: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getTenancyDetails(tenantId: string, tenancyId: string) {
    const tenancy = await prisma.tenancy.findFirst({
      where: { id: tenancyId, tenantId },
      include: {
        property: true,
        paymentPlan: {
          include: {
            payments: {
              orderBy: { dueDate: 'desc' },
              take: 5,
            },
          },
        },
        maintenanceRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!tenancy) {
      throw new Error('Tenancy not found');
    }

    return tenancy;
  },


};
