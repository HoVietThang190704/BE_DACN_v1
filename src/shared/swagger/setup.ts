import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { config } from '../../config';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fresh Food Platform API',
      version: '1.0.0',
      description: 'API documentation for Fresh Food Platform - Thương mại điện tử thực phẩm tươi sạch',
      contact: {
        name: 'HoVietThang190704',
        email: 'hovietthang1907@gmail.com',
        url: 'https://github.com/HoVietThang190704/BE_DACN_v1'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
        description: 'Development server'
      },
      {
        url: 'https://your-app.onrender.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Quản lý đăng nhập, đăng ký và xác thực người dùng'
      },
      {
        name: 'Products',
        description: 'Quản lý sản phẩm thực phẩm tươi sạch'
      },
      {
        name: 'Categories',
        description: 'Quản lý danh mục sản phẩm (cấu trúc cây đa cấp)'
      },
      {
        name: 'Orders',
        description: 'Quản lý đơn hàng và giỏ hàng'
      },
      {
        name: 'Users',
        description: 'Quản lý thông tin người dùng'
      },
      {
        name: 'System',
        description: 'Các API hệ thống và health check'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/models/*.ts'
  ]
};

const specs = swaggerJSDoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger JSON endpoint
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Fresh Food Platform API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      tryItOutEnabled: true
    }
  }));

  console.log('📖 Swagger docs available at: /api/docs');
};