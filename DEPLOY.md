# Hướng dẫn Deploy lên Render.com

## 🚀 Deploy trên Render.com

### Cách 1: Deploy từng service riêng biệt (Khuyến nghị)

#### 1. **Service Catalog (Quản lý sản phẩm)**
- Tạo Web Service mới trên Render
- Kết nối với GitHub repo: `BE_DACN_v1`
- **Thư mục gốc**: `apps/catalog`
- **Lệnh Build**: `npm install && npm run build`
- **Lệnh Start**: `npm start`
- **Biến môi trường**: 
  - `NODE_ENV=production`

#### 2. **Service Order (Xử lý đơn hàng)**  
- Tạo Web Service mới trên Render
- Kết nối với GitHub repo: `BE_DACN_v1`
- **Thư mục gốc**: `apps/order`
- **Lệnh Build**: `npm install && npm run build`
- **Lệnh Start**: `npm start`
- **Biến môi trường**:
  - `NODE_ENV=production`

#### 3. **API Gateway (Cổng API chính)**
- Tạo Web Service mới trên Render
- Kết nối với GitHub repo: `BE_DACN_v1`
- **Thư mục gốc**: `apps/api-gateway`
- **Lệnh Build**: `npm install && npm run build`
- **Lệnh Start**: `npm start`
- **Biến môi trường**:
  - `NODE_ENV=production`
  - `CATALOG_URL=https://your-catalog-service.onrender.com`
  - `ORDER_URL=https://your-order-service.onrender.com`

### Cách 2: Deploy bằng Docker (Tùy chọn khác)

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

## ⚙️ Biến môi trường cần thiết:

### API Gateway:
- `PORT` (tự động gán bởi Render)
- `NODE_ENV=production`
- `CATALOG_URL=https://your-catalog-service.onrender.com`
- `ORDER_URL=https://your-order-service.onrender.com`

### Catalog Service:
- `PORT` (tự động gán bởi Render)
- `NODE_ENV=production`

### Order Service:
- `PORT` (tự động gán bởi Render) 
- `NODE_ENV=production`

## 🔍 Endpoint kiểm tra sức khỏe:
- API Gateway: `/health`
- Catalog: `/products`
- Order: `/quote-shipping`

## 📝 Thứ tự Deploy:
1. Deploy **Catalog Service** trước
2. Deploy **Order Service**
3. Deploy **API Gateway** cuối cùng (sau khi có URL của 2 service kia)

## 🎯 URLs sau khi deploy:
- Catalog: `https://catalog-service.onrender.com`
- Order: `https://order-service.onrender.com`  
- Gateway: `https://api-gateway.onrender.com`

## 🔧 Xử lý sự cố:
- Kiểm tra logs trên Render dashboard
- Xác minh các biến môi trường
- Test các health endpoint
- Kiểm tra kết nối mạng giữa các service