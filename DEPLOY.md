# Render.com Deployment Guide

## 🚀 Deploy trên Render.com

### Cách 1: Deploy từng service riêng biệt (Recommended)

#### 1. **Catalog Service**
- Tạo Web Service mới trên Render
- Connect với GitHub repo: `BE_DACN_v1`
- **Root Directory**: `apps/catalog`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**: 
  - `NODE_ENV=production`

#### 2. **Order Service**  
- Tạo Web Service mới trên Render
- Connect với GitHub repo: `BE_DACN_v1`
- **Root Directory**: `apps/order`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `NODE_ENV=production`

#### 3. **API Gateway**
- Tạo Web Service mới trên Render
- Connect với GitHub repo: `BE_DACN_v1`
- **Root Directory**: `apps/api-gateway`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `NODE_ENV=production`
  - `CATALOG_URL=https://your-catalog-service.onrender.com`
  - `ORDER_URL=https://your-order-service.onrender.com`

### Cách 2: Deploy bằng Docker (Alternative)

```yaml
# render.yaml
services:
  - type: web
    name: catalog-service
    env: docker
    dockerfilePath: ./apps/catalog/Dockerfile
    dockerContext: ./apps/catalog
    
  - type: web
    name: order-service  
    env: docker
    dockerfilePath: ./apps/order/Dockerfile
    dockerContext: ./apps/order
    
  - type: web
    name: api-gateway
    env: docker
    dockerfilePath: ./apps/api-gateway/Dockerfile
    dockerContext: ./apps/api-gateway
    envVars:
      - key: CATALOG_URL
        value: https://catalog-service.onrender.com
      - key: ORDER_URL
        value: https://order-service.onrender.com
```

## ⚙️ Environment Variables cần thiết:

### API Gateway:
- `PORT` (auto-assigned by Render)
- `NODE_ENV=production`
- `CATALOG_URL=https://your-catalog-service.onrender.com`
- `ORDER_URL=https://your-order-service.onrender.com`

### Catalog Service:
- `PORT` (auto-assigned by Render)
- `NODE_ENV=production`

### Order Service:
- `PORT` (auto-assigned by Render) 
- `NODE_ENV=production`

## 🔍 Health Check Endpoints:
- API Gateway: `/health`
- Catalog: `/products`
- Order: `/quote-shipping`

## 📝 Deployment Order:
1. Deploy **Catalog Service** trước
2. Deploy **Order Service**
3. Deploy **API Gateway** cuối (sau khi có URL của 2 service kia)

## 🎯 URLs sau khi deploy:
- Catalog: `https://catalog-service.onrender.com`
- Order: `https://order-service.onrender.com`  
- Gateway: `https://api-gateway.onrender.com`

## 🔧 Troubleshooting:
- Check logs trên Render dashboard
- Verify environment variables
- Test health endpoints
- Kiểm tra network connectivity giữa services