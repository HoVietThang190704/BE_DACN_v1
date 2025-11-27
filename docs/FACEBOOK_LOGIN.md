# Hướng dẫn Đăng nhập bằng Facebook

## Tổng quan
Tính năng đăng nhập bằng Facebook cho phép người dùng đăng nhập vào hệ thống bằng tài khoản Facebook của họ thay vì tạo tài khoản mới.

## Cấu hình Backend

### 1. Tạo Facebook App
1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Tạo một App mới hoặc sử dụng App hiện có
3. Vào **Settings > Basic** để lấy:
   - **App ID**
   - **App Secret**

### 2. Cấu hình Environment Variables
Thêm các biến sau vào file `.env`:

```env
# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
```

### 3. Cấu hình Facebook App
Trong Facebook App Dashboard:
1. Vào **Products** > Thêm **Facebook Login**
2. Trong **Facebook Login Settings**:
   - **Valid OAuth Redirect URIs**: Thêm URL của frontend (ví dụ: `http://localhost:3000`)
   - **Client OAuth Settings**: Bật "Web OAuth Login"

## API Endpoint

### POST `/api/auth/facebook/token`

Đăng nhập hoặc đăng ký bằng Facebook access token.

**Request Body:**
```json
{
  "access_token": "EAABwzLixnjYBO..."
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Facebook login successful",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "userName": "User Name",
    "phone": null,
    "address": null,
    "facebookId": "facebook_user_id",
    "googleId": null,
    "avatar": "https://graph.facebook.com/...",
    "role": "customer",
    "isVerified": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Error - 400/401):**
```json
{
  "success": false,
  "message": "Invalid Facebook access token"
}
```

## Luồng hoạt động

### 1. Client Request
Frontend gửi Facebook access token đến backend:
```javascript
const response = await fetch('/api/auth/facebook/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ access_token: facebookAccessToken })
});
```

### 2. Backend Verification
Backend thực hiện các bước sau:

1. **Xác thực token với Facebook**:
   - Gọi Facebook Debug Token API để verify token
   - Kiểm tra `is_valid` và `app_id`

2. **Lấy thông tin người dùng**:
   - Gọi Facebook Graph API để lấy profile (id, name, email, picture)

3. **Tìm hoặc tạo user**:
   - Tìm user theo `facebookId`
   - Nếu không tìm thấy, tìm theo `email` để link account
   - Nếu vẫn không có, tạo user mới

4. **Tạo JWT tokens**:
   - Generate `accessToken` và `refreshToken`
   - Return về client

## Cấu trúc Database

User model đã có sẵn field `facebookId`:

```typescript
{
  email: string;
  userName?: string;
  password: string; // Random password cho Facebook users
  facebookId?: string; // Facebook User ID
  googleId?: string;
  avatar?: string;
  role: 'customer' | 'shop_owner' | 'admin';
  isVerified: boolean;
  // ... other fields
}
```

## Frontend Integration

### Sử dụng Facebook SDK
```html
<!-- Thêm Facebook SDK -->
<script async defer crossorigin="anonymous" 
  src="https://connect.facebook.net/en_US/sdk.js"></script>
```

### Initialize SDK
```javascript
window.fbAsyncInit = function() {
  FB.init({
    appId: 'YOUR_FACEBOOK_APP_ID',
    cookie: true,
    xfbml: true,
    version: 'v18.0'
  });
};
```

### Login Flow
```javascript
function loginWithFacebook() {
  FB.login(function(response) {
    if (response.authResponse) {
      const accessToken = response.authResponse.accessToken;
      
      // Send to backend
      fetch('/api/auth/facebook/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Save tokens
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          // Redirect to dashboard
        }
      });
    }
  }, {scope: 'public_profile,email'});
}
```

### Sử dụng React Facebook Login
```bash
npm install react-facebook-login
```

```jsx
import FacebookLogin from 'react-facebook-login';

function LoginPage() {
  const responseFacebook = async (response) => {
    if (response.accessToken) {
      const result = await fetch('/api/auth/facebook/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: response.accessToken })
      }).then(res => res.json());
      
      if (result.success) {
        // Handle successful login
      }
    }
  };

  return (
    <FacebookLogin
      appId="YOUR_FACEBOOK_APP_ID"
      autoLoad={false}
      fields="name,email,picture"
      callback={responseFacebook}
      icon="fa-facebook"
    />
  );
}
```

## Security

### Token Verification
- Backend verify token với Facebook API trước khi tin tưởng
- Kiểm tra `app_id` để đảm bảo token từ đúng app
- Kiểm tra `is_valid` để đảm bảo token chưa hết hạn

### Account Linking
- Nếu email đã tồn tại, link Facebook account với account hiện có
- Tự động verify email nếu Facebook xác nhận email

### Password Security
- Users đăng nhập bằng Facebook có random password
- Họ không thể login bằng email/password cho đến khi set password

## Testing

### Manual Testing với cURL
```bash
# Get Facebook access token từ Graph API Explorer
# https://developers.facebook.com/tools/explorer/

curl -X POST http://localhost:5000/api/auth/facebook/token \
  -H "Content-Type: application/json" \
  -d '{"access_token": "YOUR_FACEBOOK_ACCESS_TOKEN"}'
```

### Testing với Postman
1. Lấy access token từ Facebook Graph API Explorer
2. Tạo POST request đến `/api/auth/facebook/token`
3. Body: `{ "access_token": "..." }`
4. Kiểm tra response có `accessToken` và `refreshToken`

## Error Handling

| Error Code | Message | Description |
|------------|---------|-------------|
| 400 | access_token is required | Thiếu access token trong request |
| 401 | Invalid Facebook access token | Token không hợp lệ hoặc expired |
| 401 | Facebook token app_id mismatch | Token từ app khác |
| 500 | Failed to fetch Facebook profile | Lỗi khi gọi Facebook API |
| 500 | Internal server error | Lỗi server không xác định |

## Troubleshooting

### Token verification failed
- Kiểm tra FACEBOOK_APP_ID và FACEBOOK_APP_SECRET trong .env
- Đảm bảo token chưa hết hạn
- Kiểm tra token có scope đủ để lấy thông tin profile

### Can't get email from Facebook
- Một số user Facebook không public email
- Backend sẽ tạo placeholder email: `{facebookId}@facebook.local`
- User có thể update email sau trong profile settings

### Account linking issues
- Nếu email đã tồn tại, account sẽ được link tự động
- Check logs để xem quá trình linking

## Best Practices

1. **Always verify tokens server-side** - Never trust client data
2. **Handle missing email** - Not all Facebook users share email
3. **Implement account linking** - Allow users to link multiple OAuth providers
4. **Log important events** - Track logins, account creations, and links
5. **Use HTTPS in production** - Protect access tokens in transit

## References

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [Debug Token API](https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow#checktoken)
