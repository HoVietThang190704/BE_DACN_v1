# Quick Start Guide - Facebook Login

## Backend Setup (5 phút)

### 1. Cài đặt Facebook App
```
1. Truy cập: https://developers.facebook.com/apps
2. Tạo App mới > Chọn "Consumer" > Điền thông tin
3. Dashboard > Settings > Basic
   - Copy App ID
   - Copy App Secret
4. Products > Facebook Login > Settings
   - Valid OAuth Redirect URIs: http://localhost:3000
   - ✅ Save Changes
```

### 2. Cấu hình Backend
```bash
# Thêm vào file .env
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
```

### 3. Test API
```bash
# Restart server
npm run dev

# Kiểm tra endpoint có sẵn
curl http://localhost:5000/api/auth/facebook/token
# Response: {"success":false,"message":"access_token is required"}
# ✅ Nếu thấy response này = API đã sẵn sàng!
```

## Frontend Setup (10 phút)

### Option 1: React với Facebook SDK

#### 1. Thêm SDK vào HTML
```html
<!-- public/index.html hoặc app/layout.tsx -->
<script>
  window.fbAsyncInit = function() {
    FB.init({
      appId: 'YOUR_FACEBOOK_APP_ID',
      cookie: true,
      xfbml: true,
      version: 'v18.0'
    });
  };
</script>
<script async defer crossorigin="anonymous" 
  src="https://connect.facebook.com/en_US/sdk.js">
</script>
```

#### 2. Tạo Login Component
```tsx
// components/FacebookLoginButton.tsx
'use client';

export function FacebookLoginButton() {
  const handleLogin = () => {
    window.FB.login(async (response) => {
      if (response.authResponse) {
        const res = await fetch('http://localhost:5000/api/auth/facebook/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            access_token: response.authResponse.accessToken 
          })
        });
        
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('accessToken', data.accessToken);
          // Redirect to dashboard
          window.location.href = '/dashboard';
        }
      }
    }, { scope: 'public_profile,email' });
  };

  return (
    <button onClick={handleLogin} className="btn-facebook">
      Đăng nhập với Facebook
    </button>
  );
}
```

### Option 2: React với react-facebook-login

#### 1. Install Package
```bash
npm install react-facebook-login
```

#### 2. Sử dụng Component
```tsx
import FacebookLogin from 'react-facebook-login';

function LoginPage() {
  const responseFacebook = async (response) => {
    if (response.accessToken) {
      const res = await fetch('http://localhost:5000/api/auth/facebook/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: response.accessToken })
      });
      const data = await res.json();
      // Handle success
    }
  };

  return (
    <FacebookLogin
      appId="YOUR_FACEBOOK_APP_ID"
      fields="name,email,picture"
      callback={responseFacebook}
    />
  );
}
```

## Testing

### 1. Manual Test
```
1. Mở browser → http://localhost:3000/login
2. Click "Đăng nhập với Facebook"
3. Cho phép quyền truy cập
4. Kiểm tra:
   - localStorage có accessToken?
   - Redirect đến dashboard?
   - Backend log có "Facebook login successful"?
```

### 2. Test với Facebook Graph API Explorer
```
1. Truy cập: https://developers.facebook.com/tools/explorer/
2. Select App > Get Access Token
3. Copy access token
4. Test bằng cURL:

curl -X POST http://localhost:5000/api/auth/facebook/token \
  -H "Content-Type: application/json" \
  -d '{"access_token": "YOUR_ACCESS_TOKEN"}'

# Response: 
{
  "success": true,
  "user": {...},
  "accessToken": "...",
  "refreshToken": "..."
}
```

## Troubleshooting

### Lỗi thường gặp

**1. "Invalid Facebook access token"**
```
Nguyên nhân: Token expired hoặc App ID/Secret sai
Giải pháp:
- Kiểm tra .env có đúng FACEBOOK_APP_ID và FACEBOOK_APP_SECRET
- Lấy token mới từ Graph API Explorer
- Restart backend server
```

**2. "App_id mismatch"**
```
Nguyên nhân: Token từ app khác
Giải pháp:
- Đảm bảo frontend sử dụng đúng App ID
- Kiểm tra .env backend match với frontend config
```

**3. "Can't get email"**
```
Nguyên nhân: User không share email
Giải pháp:
- Backend tự động tạo placeholder email
- User có thể update email sau
- Không ảnh hưởng đến đăng nhập
```

**4. CORS Error**
```
Nguyên nhân: Frontend domain chưa được allow
Giải pháp:
Backend config.ts:
  FRONTEND_URL: 'http://localhost:3000'
```

## Environment Variables Checklist

### Backend (.env)
```env
✅ FACEBOOK_APP_ID=123456789012345
✅ FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890
✅ JWT_SECRET=your-secure-secret
✅ MONGODB_URI=mongodb+srv://...
✅ FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local hoặc .env)
```env
✅ NEXT_PUBLIC_FACEBOOK_APP_ID=123456789012345
✅ NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Next Steps

✅ **Hoàn thành**: Đăng nhập Facebook đã sẵn sàng!

📚 **Tìm hiểu thêm**:
- [Full Documentation](./FACEBOOK_LOGIN.md)
- [Frontend Example Code](./FacebookLoginButton.example.tsx)
- [API Testing với Swagger](http://localhost:5000/api/docs)

🎯 **Tính năng tiếp theo**:
- [ ] Link multiple OAuth providers (Google + Facebook)
- [ ] Update profile cho Facebook users
- [ ] Admin dashboard để quản lý users
