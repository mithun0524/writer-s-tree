import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: "Writer's Tree API",
      version: '1.0.0',
      description: 'API documentation for Writer\'s Tree backend services',
      contact: {
        name: 'API Support',
        email: 'support@writerstree.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.writerstree.com/api/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        ClerkAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-clerk-user-id',
          description: 'Clerk user ID from authenticated session'
        }
      },
      schemas: {
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string' },
            title: { type: 'string', example: 'My Novel' },
            word_goal: { type: 'integer', example: 50000 },
            current_word_count: { type: 'integer', example: 15000 },
            tree_seed: { type: 'string' },
            tree_species: { type: 'string', enum: ['oak', 'willow', 'pine', 'maple', 'cherry'] },
            tree_season: { type: 'string', enum: ['spring', 'summer', 'autumn', 'winter'] },
            status: { type: 'string', enum: ['active', 'completed', 'archived'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            last_edited_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'PROJECT_NOT_FOUND' },
            message: { type: 'string', example: 'Project not found' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        }
      }
    },
    security: [
      {
        ClerkAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);
