# Upload Avatar với Cloudinary

## 📋 Tổng quan
API endpoint để cập nhật ảnh đại diện người dùng với Cloudinary storage.

## 🔧 Cấu hình Cloudinary

### 1. Thêm credentials vào file `.env`:
```env
CLOUDINARY_CLOUD_NAME=dtk2qgorj
CLOUDINARY_API_KEY=715298689516934
CLOUDINARY_API_SECRET=zQorXMBLZpFt0aymnYjj734fbsk
```

### 2. Cấu trúc lưu trữ trên Cloudinary:
- **Folder**: `fresh-food/avatars/`
- **Transformation**: 
  - Size: 500x500px (crop: fill, gravity: face)
  - Quality: auto
  - Format: auto (tự động chọn định dạng tối ưu)

## 📡 API Endpoint

### POST `/api/users/me/avatar`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Body (form-data):**
```
avatar: [file] (required)
```

**Supported formats:**
- JPG/JPEG
- PNG
- GIF
- WEBP

**Max file size:** 5MB

## 🎯 Cách sử dụng

### 1. Test với Swagger UI:

1. Truy cập: `http://localhost:3000/api/docs`
2. Click "Authorize" và nhập JWT token
3. Tìm endpoint `POST /api/users/me/avatar` trong tag "Users"
4. Click "Try it out"
5. Chọn file ảnh
6. Click "Execute"

### 2. Test với Postman:

```http
POST http://localhost:3000/api/users/me/avatar
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Body:
- avatar: [chọn file ảnh]
```

### 3. Test với cURL:

```bash
curl -X POST http://localhost:3000/api/users/me/avatar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@/path/to/image.jpg"
```

### 4. Test với JavaScript/TypeScript:

```javascript
const formData = new FormData();
formData.append('avatar', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/users/me/avatar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});

const result = await response.json();
console.log(result.data.avatar); // URL của ảnh mới
```

## 📤 Response Examples

### ✅ Success (200):
```json
{
  "success": true,
  "message": "Cập nhật ảnh đại diện thành công",
  "data": {
    "avatar": "https://res.cloudinary.com/dtk2qgorj/image/upload/v1730047891/fresh-food/avatars/abc123.jpg"
  }
}
```

### ❌ No file (400):
```json
{
  "success": false,
  "message": "Vui lòng chọn file ảnh để upload"
}
```

### ❌ Invalid file type (400):
```json
{
  "success": false,
  "message": "Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)"
}
```

### ❌ Unauthorized (401):
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### ❌ User not found (404):
```json
{
  "success": false,
  "message": "Không tìm thấy người dùng"
}
```

## 🏗️ Kiến trúc Implementation

### Clean Architecture Layers:

```
📁 Domain Layer
  └─ usecases/user/UpdateUserAvatar.usecase.ts
      - Business logic: upload, delete old avatar

📁 Presentation Layer
  └─ controllers/UserController.ts
      - uploadAvatar() method
      - HTTP request/response handling

📁 Infrastructure Layer
  ├─ shared/utils/cloudinary.ts
  │   - uploadToCloudinary()
  │   - deleteFromCloudinary()
  └─ shared/middleware/upload.ts
      - Multer configuration
      - File validation

📁 Routes
  └─ routes/users.ts
      - POST /api/users/me/avatar
      - Swagger documentation
```

## 🔐 Security Features

1. **Authentication**: Yêu cầu JWT token hợp lệ
2. **File Validation**: 
   - Chỉ chấp nhận file ảnh
   - Giới hạn kích thước 5MB
3. **Ownership Check**: User chỉ có thể upload avatar cho chính mình
4. **Auto Delete**: Tự động xóa avatar cũ khi upload mới

## 🚀 Features

- ✅ Upload ảnh lên Cloudinary
- ✅ Auto resize và optimize (500x500, face detection)
- ✅ Tự động xóa ảnh cũ
- ✅ Cập nhật URL trong database
- ✅ Full error handling
- ✅ Swagger documentation
- ✅ TypeScript type safety

## 📝 Notes

1. **Avatar cũ**: Nếu avatar cũ là từ Cloudinary, sẽ tự động xóa
2. **Avatar mặc định**: Nếu chưa có avatar, sẽ lưu URL mới
3. **URL format**: `https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{format}`
4. **Transformation**: Ảnh sẽ được tự động:
   - Crop về 500x500 (focus vào khuôn mặt)
   - Tối ưu hóa quality
   - Chuyển đổi format phù hợp với browser

## 🐛 Troubleshooting

### Issue: "ERESOLVE unable to resolve dependency"
**Solution**: Đã cài multer với `--legacy-peer-deps`

### Issue: "Invalid credentials"
**Solution**: Kiểm tra lại CLOUDINARY_* trong file .env

### Issue: "File too large"
**Solution**: File phải < 5MB, resize trước khi upload

### Issue: "Invalid file type"
**Solution**: Chỉ chấp nhận: jpg, jpeg, png, gif, webp
