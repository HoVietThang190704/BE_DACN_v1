# 🌱 Fresh Food Platform - Backend API

**Hệ thống Backend cho ứng dụng thương mại điện tử thực phẩm tươi sạch**  
Sử dụng **Monolith Architecture** với TypeScript, Node.js và Express.js

## 📋 Tổng quan

Dự án Fresh Food Platform là một ứng dụng backend hoàn chỉnh cho việc mua bán thực phẩm tươi sạch trực tuyến, tập trung vào:

- **🥬 Sản phẩm thực phẩm Việt Nam**: Rau củ, trái cây, thực phẩm hữu cơ
- **🚚 Theo dõi nguồn gốc**: Truy xuất từ trang trại đến người tiêu dùng  
- **🏆 Chứng nhận chất lượng**: VietGAP, GlobalGAP, Organic
- **👥 Quản lý người dùng**: Authentication, authorization, profiles
- **📦 Quản lý đơn hàng**: Từ giỏ hàng đến giao hàng

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/HoVietThang190704/BE_DACN_v1.git
cd BE_DACN_v1
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy template file
cp .env.example .env

# Edit .env with your actual values
# IMPORTANT: Never commit .env to git!
```

**Required environment variables:**
```env
NODE_ENV=development
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-super-secure-jwt-secret
PORT=3000
```

### 4. Start Development Server
```bash
npm run dev
```

**🎯 Server will be running at:**
- API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/health

## 🔒 Security Notes

**⚠️ NEVER commit sensitive data to git:**
- ✅ Use `.env` file for secrets (already in `.gitignore`)
- ✅ Use `.env.example` as template
- ❌ Don't put passwords/tokens directly in code
- ❌ Don't commit `.env` file to repository

## 🏗️ Kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                    Fresh Food Platform                  │
│                     (Port 3000)                        │
├─────────────────────────────────────────────────────────┤
│  📱 API Modules:                                        │
│  ├── 🔐 Auth      (JWT, Login, Register)              │
│  ├── 🥬 Products  (Catalog, Search, Filters)          │
│  ├── 📦 Orders    (Cart, Checkout, Tracking)          │
│  └── 👤 Users     (Profiles, Preferences)             │
├─────────────────────────────────────────────────────────┤
│  🛠️ Shared Services:                                   │
│  ├── 🔧 Config    (Environment, Database)             │
│  ├── 📝 Logging   (Winston, Error tracking)           │
│  ├── ⚡ Middleware (CORS, Security, Validation)       │
│  └── 🔌 Database  (PostgreSQL with Prisma ORM)       │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Công nghệ sử dụng

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js 
- **Architecture**: Monolith with Modules
- **Database**: MongoDB Atlas + Mongoose ODM
- **Authentication**: JWT + bcrypt
- **Logging**: Winston
- **API Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest
- **Deployment**: Render.com ready
- **Package Manager**: npm

## 🚀 Cài đặt và chạy

### Cài đặt dependencies:
```bash
# Clone repository
git clone https://github.com/HoVietThang190704/BE_DACN_v1.git
cd BE_DACN_v1

# Cài đặt dependencies
npm install
```

### Chạy development:
```bash
# Chạy ở development mode với hot reload
npm run dev

# App sẽ chạy tại http://localhost:3000
```

### Build production:
```bash
# Build TypeScript to JavaScript
npm run build

# Chạy production mode
npm start
```

## 🔗 API Endpoints

### 📊 System Health
- `GET /health` - Health check và system status
- `GET /api` - API documentation overview
- `GET /api/docs` - **Swagger UI Documentation** 🔥

### 🔐 Authentication ✅
- `POST /api/auth/register` - Đăng ký tài khoản mới (có validation)
- `POST /api/auth/login` - Đăng nhập với JWT token
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/profile` - Thông tin profile (TODO: JWT middleware)

### 🥬 Products  
- `GET /api/products` - Danh sách sản phẩm (có phân trang)
- `GET /api/products?search=rau` - Tìm kiếm sản phẩm
- `GET /api/products?category=vegetable` - Lọc theo danh mục
- `GET /api/products?certification=VietGAP` - Lọc theo chứng nhận
- `GET /api/products/:id` - Chi tiết sản phẩm

### 📦 Orders (TODO)
- `GET /api/orders` - Danh sách đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới
- `GET /api/orders/:id` - Chi tiết đơn hàng  
- `PUT /api/orders/:id/status` - Cập nhật trạng thái

### 👤 Users (TODO)
- `GET /api/users/profile` - Thông tin người dùng
- `PUT /api/users/profile` - Cập nhật profile
- `GET /api/users/orders` - Lịch sử đơn hàng

## 🌟 Tính năng nổi bật

### 🥬 Sản phẩm thực phẩm Việt Nam
- **200+ sản phẩm mẫu**: Rau củ, trái cây, thực phẩm hữu cơ từ các vùng miền Việt Nam
- **Theo dõi nguồn gốc**: Từ trang trại đến người tiêu dùng
- **Chứng nhận**: VietGAP, GlobalGAP, Organic, HACCP

### 🔍 Tìm kiếm và lọc
- Tìm kiếm theo tên sản phẩm (tiếng Việt)
- Lọc theo danh mục, chứng nhận, vùng miền
- Sắp xếp theo giá, độ tươi mới, đánh giá

### 🚚 Truy xuất nguồn gốc
- Thông tin trang trại sản xuất
- Lịch sử canh tác và thu hoạch  
- Chứng nhận an toàn thực phẩm

## 📦 Deploy lên Render.com

Xem chi tiết trong file [`DEPLOY.md`](./DEPLOY.md)

### Quick Deploy:
1. **Connect GitHub**: Kết nối repository với Render
2. **Web Service**: Tạo Web Service với build command `npm run build`  
3. **Start Command**: `npm start`
4. **Environment**: Node.js
5. **Instance Type**: Free tier

## 🔧 Environment Variables

```env
# Main Application
PORT=3000
NODE_ENV=production

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/DAChuyenNganh?retryWrites=true&w=majority

# JWT (TODO) 
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# External APIs (TODO)
VIETNAM_MAP_API_KEY=your-api-key
PAYMENT_GATEWAY_KEY=your-payment-key
```

## 📁 Cấu trúc thư mục

```
BE_DACN_v1/
├── src/                          # 📦 Source code chính
│   ├── app.ts                    # 🚀 Entry point của ứng dụng
│   ├── config.ts                 # ⚙️ Cấu hình app và environment
│   ├── routes/                   # 🛣️ API routes
│   │   ├── auth.ts              # 🔐 Authentication endpoints
│   │   ├── products.ts          # 🥬 Product catalog endpoints  
│   │   ├── orders.ts            # 📦 Order management endpoints
│   │   └── users.ts             # � User profile endpoints
│   ├── modules/                  # 🧩 Business logic modules
│   │   └── products/            # 🥬 Product domain logic
│   │       └── productService.ts # Product business rules
│   └── shared/                   # � Shared utilities
│       ├── middleware/          # Middleware functions
│       │   └── errorHandler.ts  # Global error handling
│       └── utils/               # Utility functions
│           └── logger.ts        # Logging configuration
├── logs/                         # 📝 Application logs
├── tsconfig.json                # 🔧 TypeScript configuration
├── package.json                 # 📦 Dependencies và scripts
├── DEPLOY.md                    # 🚀 Hướng dẫn deploy
└── README.md                    # 📖 Documentation
```

## 🧪 Testing

```bash
# Test health check
curl http://localhost:3000/health

# Test API overview
curl http://localhost:3000/api

# Test product catalog  
curl http://localhost:3000/api/products

# Test product search (Vietnamese)
curl "http://localhost:3000/api/products?search=rau%20cải"

# Test product filtering
curl "http://localhost:3000/api/products?category=vegetable&certification=VietGAP"
```

## 🚀 Development Roadmap

### ✅ Phase 1: Core Architecture (Completed)
- [x] Project structure setup với monolith architecture
- [x] Basic API endpoints với Express.js + TypeScript  
- [x] Product catalog với Vietnamese fresh food data
- [x] Health checks và logging system
- [x] Error handling middleware

### ✅ Phase 2: Database & Authentication (Completed) 
- [x] MongoDB Atlas connection với Mongoose ODM
- [x] User authentication với JWT và bcrypt
- [x] User registration và login endpoints với validation
- [x] **Swagger UI documentation** cho API testing
- [x] User schema với roles: customer, shop_owner, admin

### 📋 Phase 3: Business Logic (Planned)
- [ ] Complete CRUD operations for all entities
- [ ] Order management system 
- [ ] Shopping cart functionality
- [ ] User profile management
- [ ] Admin panel APIs

### 🚀 Phase 4: Production Ready (Planned)
- [ ] Unit testing với Jest
- [ ] API documentation với Swagger
- [ ] CI/CD pipeline setup
- [ ] Performance optimization
- [ ] Security hardening

## 👨‍💻 Tác giả

**HoVietThang190704**
- GitHub: [@HoVietThang190704](https://github.com/HoVietThang190704)
- Email: [your-email@domain.com]

## 📄 License

ISC License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

⭐ **Star repo này nếu bạn thấy hữu ích!**