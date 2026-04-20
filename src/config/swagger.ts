import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RentShield API',
      version: '1.0.0',
      description: 'RentShield is a comprehensive rental infrastructure platform providing smart digital agreements, deposit protection, and role-based workflows for tenants, landlords, service providers, society admins, platform admins, and support agents.',
    },
    servers: [
      {
        url: 'http://localhost:4000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['TENANT', 'LANDLORD', 'SERVICE_PROVIDER', 'SOCIETY_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_AGENT'] },
            isActive: { type: 'boolean' },
          },
        },
        Property: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            price: { type: 'number' },
            bedrooms: { type: 'integer' },
            bathrooms: { type: 'number' },
            isPublished: { type: 'boolean' },
            category: { type: 'string', enum: ['APARTMENT', 'VILLA', 'STUDIO', 'HOUSE', 'OTHER'] },
            furnishing: { type: 'string', enum: ['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'] },
            photoUrls: { type: 'array', items: { type: 'string' } },
            lat: { type: 'number' },
            lng: { type: 'number' }
          },
        },
        Tenancy: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            propertyId: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['DRAFT', 'PENDING_APPROVAL', 'SIGNED', 'ACTIVE', 'ENDED', 'CANCELLED'] },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['RENT', 'DEPOSIT', 'LATE_FEE', 'MAINTENANCE', 'OTHER'] },
            amount: { type: 'number' },
            amountPaid: { type: 'number' },
            balanceDue: { type: 'number' },
            dueDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'OVERDUE', 'PARTIALLY_PAID'] },
            receiptUrl: { type: 'string' }
          },
        },
        LedgerEntry: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenancyId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['DEBIT', 'CREDIT'] },
            amount: { type: 'number' },
            balance: { type: 'number' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          },
        },
        ServiceExpert: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            category: { type: 'object', properties: { name: { type: 'string' } } },
            bio: { type: 'string' },
            isVerified: { type: 'boolean' },
            rating: { type: 'number' },
            experienceYears: { type: 'integer' }
          },
        },
        ServiceBooking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            expertId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] },
            description: { type: 'string' },
            scheduledAt: { type: 'string', format: 'date-time' },
            finalPrice: { type: 'number' },
            chatSessionId: { type: 'string', format: 'uuid' }
          },
        },
        Document: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            category: { type: 'string', enum: ['AGREEMENTS', 'KYC', 'PAYMENTS', 'MOVE_IN', 'EXIT', 'SOCIETY', 'OTHER'] },
            fileUrl: { type: 'string' },
            fileType: { type: 'string' },
            permission: { type: 'string', enum: ['OWNER_ONLY', 'TENANT_LANDLORD', 'ALL_PARTIES', 'PUBLIC'] },
            isAutoGenerated: { type: 'boolean' },
            ocrMetadata: { type: 'object' },
            expiryDate: { type: 'string', format: 'date-time' }
          },
        },
        Notice: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            content: { type: 'string' },
            type: { type: 'string', enum: ['INFO', 'WARNING', 'URGENT'] },
            isPinned: { type: 'boolean' },
            category: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.router.ts'],
};

export const specs = swaggerJSDoc(options);