import { prisma } from '../../config/database';
import { redis } from '../../config/redis';

const CACHE_TTL_SECONDS = 120;
const USER_CAPABILITIES_KEY = (userId: string) => `user_capabilities:${userId}`;

export interface UserCapabilities {
  modules: string[];
  features: string[];
}

export const permissionService = {
  async getUserCapabilities(userId: string): Promise<UserCapabilities> {
    const cacheKey = USER_CAPABILITIES_KEY(userId);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as UserCapabilities;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        userSubscriptions: {
          select: {
            subscription: {
              select: {
                subscriptionFeatures: {
                  select: {
                    feature: {
                      select: {
                        id: true,
                        name: true,
                        module: {
                          select: {
                            id: true,
                            name: true,
                            isActive: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const roleFeatures = await prisma.roleFeature.findMany({
      where: { role: user.role },
      include: {
        feature: {
          include: {
            module: true,
          },
        },
      },
    });

    const subscriptionFeatureNames = new Set<string>();
    for (const userSubscription of user.userSubscriptions) {
      for (const subscriptionFeature of userSubscription.subscription.subscriptionFeatures) {
        if (subscriptionFeature.feature) {
          subscriptionFeatureNames.add(subscriptionFeature.feature.name);
        }
      }
    }

    const allowedFeatureNames = new Set<string>();
    const allowedModuleNames = new Set<string>();

    for (const roleFeature of roleFeatures) {
      const feature = roleFeature.feature;
      if (!feature.module.isActive) {
        continue;
      }
      if (!subscriptionFeatureNames.has(feature.name)) {
        continue;
      }
      allowedFeatureNames.add(feature.name);
      allowedModuleNames.add(feature.module.name);
    }

    const capabilities: UserCapabilities = {
      modules: Array.from(allowedModuleNames),
      features: Array.from(allowedFeatureNames),
    };

    await redis.set(cacheKey, JSON.stringify(capabilities), 'EX', CACHE_TTL_SECONDS);
    return capabilities;
  },

  async canUserAccess(userId: string, featureName: string) {
    const capabilities = await this.getUserCapabilities(userId);
    return capabilities.features.includes(featureName);
  },

  async invalidateUserCapabilities(userId: string) {
    await redis.del(USER_CAPABILITIES_KEY(userId));
  },

  async clearAllCapabilitiesCache() {
    const keys = await redis.keys('user_capabilities:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};
