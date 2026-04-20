export const openApiSpec = {
  openapi: '3.0.1',
  info: {
    title: 'RentShield API',
    version: '1.0.0',
    description: 'Swagger documentation for the RentShield backend APIs.',
  },
  servers: [
    {
      url: 'http://localhost:4000/api',
      description: 'Local development server',
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
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['TENANT', 'LANDLORD', 'ADMIN'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthToken: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          expiresIn: { type: 'string' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['TENANT', 'LANDLORD', 'ADMIN'] },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          token: { type: 'string' },
          expiresIn: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      Property: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          postalCode: { type: 'string' },
          price: { type: 'number' },
          bedrooms: { type: 'integer' },
          bathrooms: { type: 'number' },
          isPublished: { type: 'boolean' },
          ownerId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreatePropertyRequest: {
        type: 'object',
        required: ['title', 'description', 'address', 'city', 'state', 'postalCode', 'price', 'bedrooms', 'bathrooms'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          postalCode: { type: 'string' },
          price: { type: 'number' },
          bedrooms: { type: 'integer' },
          bathrooms: { type: 'number' },
          isPublished: { type: 'boolean' },
        },
      },
      UpdatePropertyRequest: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          postalCode: { type: 'string' },
          price: { type: 'number' },
          bedrooms: { type: 'integer' },
          bathrooms: { type: 'number' },
          isPublished: { type: 'boolean' },
        },
      },
      SearchResponse: {
        type: 'array',
        items: { $ref: '#/components/schemas/Property' },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          service: { type: 'string' },
          nosql: {
            type: 'object',
            properties: {
              redis: { type: 'string' },
              elasticsearch: { type: 'string' },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive a JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          '401': { description: 'Authentication failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/profile': {
      get: {
        tags: ['Auth'],
        summary: 'Get authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Authenticated user profile', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/properties': {
      get: {
        tags: ['Property'],
        summary: 'List properties',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'my',
            in: 'query',
            schema: { type: 'string', enum: ['true', 'false'] },
            description: 'If true, return authenticated user properties; otherwise return published properties',
          },
        ],
        responses: {
          '200': {
            description: 'List of properties',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Property' } } } },
          },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      post: {
        tags: ['Property'],
        summary: 'Create a new property',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreatePropertyRequest' },
            },
          },
        },
        responses: {
          '201': { description: 'Property created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Property' } } } },
          '400': { description: 'Validation or request error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/properties/{id}': {
      get: {
        tags: ['Property'],
        summary: 'Get property by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Property found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Property' } } } },
          '404': { description: 'Property not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      put: {
        tags: ['Property'],
        summary: 'Update a property',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdatePropertyRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Updated property', content: { 'application/json': { schema: { $ref: '#/components/schemas/Property' } } } },
          '400': { description: 'Validation or unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      delete: {
        tags: ['Property'],
        summary: 'Delete a property',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Property deleted', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          '400': { description: 'Validation or unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/search': {
      get: {
        tags: ['Search'],
        summary: 'Search published properties',
        parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Search results', content: { 'application/json': { schema: { $ref: '#/components/schemas/SearchResponse' } } } },
          '400': { description: 'Missing query', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health endpoint for backend and NoSQL services',
        responses: {
          '200': { description: 'Health report', content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } } },
        },
      },
    },
  },
};
