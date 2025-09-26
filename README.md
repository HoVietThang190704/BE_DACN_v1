# 🚀 Backend Đồ án Chuyên ngành v1

Hệ thống Backend sử dụng kiến trúc **Microservices** với TypeScript và Node.js.

## 📋 Tổng quan

Dự án bao gồm 3 services chính:

- **🌐 API Gateway** (Port 4000): Cổng chính để định tuyến và tổng hợp dữ liệu
- **🛍️ Catalog Service** (Port 3001): Quản lý sản phẩm và danh mục  
- **📦 Order Service** (Port 3002): Xử lý đơn hàng và tính phí vận chuyển

## 🏗️ Kiến trúc

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│  Catalog Service │    │  Order Service  │
│    (Port 4000)  │    │   (Port 3001)    │    │   (Port 3002)   │
│                 │    │                  │    │                 │
│ • Proxy Routes  │    │ • Quản lý SP     │    │ • Tính phí ship │
│ • BFF Pattern   │    │ • Tìm kiếm       │    │ • Quote API     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛠️ Công nghệ sử dụng

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Architecture**: Microservices + API Gateway
- **Package Manager**: npm/pnpm
- **Deployment**: Render.com ready

## 🚀 Cài đặt và chạy

### Cài đặt dependencies:
```bash
# Cài đặt cho tất cả services
npm install
cd apps/api-gateway && npm install
cd ../catalog && npm install  
cd ../order && npm install
```

### Chạy development:
```bash
# Chạy tất cả services cùng lúc
npm run dev

# Hoặc chạy từng service riêng:
cd apps/api-gateway && npm run dev  # Port 4000
cd apps/catalog && npm run dev      # Port 3001
cd apps/order && npm run dev        # Port 3002
```

### Build production:
```bash
# Build tất cả services
npm run build

# Chạy production
npm start
```

## 🔗 API Endpoints

### API Gateway (http://localhost:4000)
- `GET /health` - Health check
- `GET /bff/checkout-summary?cartId=demo` - Tổng hợp dữ liệu checkout
- `GET /api/catalog/products` - Proxy tới catalog
- `GET /api/order/quote-shipping` - Proxy tới order

### Catalog Service (http://localhost:3001)  
- `GET /products` - Danh sách sản phẩm
- `GET /products?q=rau` - Tìm kiếm sản phẩm

### Order Service (http://localhost:3002)
- `GET /quote-shipping?cartId=demo` - Tính phí vận chuyển

## 📦 Deploy lên Render.com

Xem chi tiết trong file [`DEPLOY.md`](./DEPLOY.md)

### Quick Deploy:
1. **Catalog Service**: Root dir `apps/catalog`
2. **Order Service**: Root dir `apps/order`  
3. **API Gateway**: Root dir `apps/api-gateway`

## 🔧 Environment Variables

```env
# API Gateway
PORT=4000
NODE_ENV=production
CATALOG_URL=https://your-catalog-service.onrender.com
ORDER_URL=https://your-order-service.onrender.com

# Catalog Service
PORT=3001
NODE_ENV=production

# Order Service  
PORT=3002
NODE_ENV=production
```

## 📁 Cấu trúc thư mục

```
BE_DACN_v1/
├── apps/
│   ├── api-gateway/          # 🌐 API Gateway
│   │   ├── src/
│   │   │   ├── routes/       # BFF và Proxy routes
│   │   │   └── main.ts       # Entry point
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── catalog/              # 🛍️ Catalog Service  
│   │   ├── src/
│   │   │   └── index.ts      # Products API
│   │   └── package.json
│   └── order/                # 📦 Order Service
│       ├── src/
│       │   └── index.ts      # Shipping API
│       └── package.json
├── DEPLOY.md                 # Hướng dẫn deploy
├── render.yaml              # Render deployment config
└── pnpm-workspace.yaml      # Monorepo config
```

## 🧪 Testing

```bash
# Test API Gateway
curl http://localhost:4000/health

# Test Catalog
curl http://localhost:3001/products

# Test Order
curl http://localhost:3002/quote-shipping?cartId=demo

# Test BFF
curl "http://localhost:4000/bff/checkout-summary?cartId=demo"
```

## 👨‍💻 Tác giả

**HoVietThang190704**
- GitHub: [@HoVietThang190704](https://github.com/HoVietThang190704)
- Email: [your-email@domain.com]

## 📄 License

ISC License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

⭐ **Star repo này nếu bạn thấy hữu ích!**