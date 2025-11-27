/**
 * Facebook Login Button Component Example
 * 
 * Đây là ví dụ component React để tích hợp đăng nhập Facebook
 * Bạn có thể customize theo design của dự án
 */

'use client';

import { useState } from 'react';

interface FacebookLoginButtonProps {
  onSuccess?: (userData: any) => void;
  onError?: (error: string) => void;
  className?: string;
  text?: string;
}

export function FacebookLoginButton({
  onSuccess,
  onError,
  className = '',
  text = 'Đăng nhập với Facebook'
}: FacebookLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFacebookLogin = async () => {
    setIsLoading(true);

    try {
      // Check if Facebook SDK is loaded
      if (typeof window.FB === 'undefined') {
        throw new Error('Facebook SDK chưa được tải');
      }

      // Trigger Facebook Login
      window.FB.login(
        async (response: any) => {
          if (response.authResponse) {
            const accessToken = response.authResponse.accessToken;

            try {
              // Send access token to backend
              const result = await fetch('/api/auth/facebook/token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ access_token: accessToken }),
              });

              const data = await result.json();

              if (data.success) {
                // Save tokens to localStorage
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('user', JSON.stringify(data.user));

                onSuccess?.(data);
              } else {
                throw new Error(data.message || 'Đăng nhập thất bại');
              }
            } catch (error: any) {
              console.error('Backend error:', error);
              onError?.(error.message || 'Lỗi kết nối đến server');
            }
          } else {
            // User cancelled login
            onError?.('Đăng nhập bị hủy');
          }
        },
        { scope: 'public_profile,email' }
      );
    } catch (error: any) {
      console.error('Facebook login error:', error);
      onError?.(error.message || 'Đăng nhập Facebook thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFacebookLogin}
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <span>Đang đăng nhập...</span>
      ) : (
        <>
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>{text}</span>
        </>
      )}
    </button>
  );
}

// Global type declaration for Facebook SDK
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

/**
 * Facebook SDK Initialization Hook
 * 
 * Sử dụng hook này trong layout hoặc page component để load Facebook SDK
 */
export function useFacebookSDK(appId: string) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useState(() => {
    // Check if already loaded
    if (typeof window !== 'undefined' && window.FB) {
      setIsSDKLoaded(true);
      return;
    }

    // Initialize Facebook SDK
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: 'v18.0',
      });
      setIsSDKLoaded(true);
    };

    // Load SDK script
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/vi_VN/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  });

  return isSDKLoaded;
}

/**
 * Example Usage in Login Page:
 * 
 * ```tsx
 * 'use client';
 * 
 * import { FacebookLoginButton, useFacebookSDK } from '@/components/FacebookLoginButton';
 * import { useRouter } from 'next/navigation';
 * 
 * export default function LoginPage() {
 *   const router = useRouter();
 *   const isFBReady = useFacebookSDK(process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!);
 * 
 *   const handleSuccess = (data: any) => {
 *     console.log('Login successful:', data);
 *     router.push('/dashboard');
 *   };
 * 
 *   const handleError = (error: string) => {
 *     console.error('Login error:', error);
 *     alert(error);
 *   };
 * 
 *   return (
 *     <div className="flex flex-col gap-4 p-8">
 *       <h1>Đăng nhập</h1>
 *       
 *       <FacebookLoginButton
 *         onSuccess={handleSuccess}
 *         onError={handleError}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
