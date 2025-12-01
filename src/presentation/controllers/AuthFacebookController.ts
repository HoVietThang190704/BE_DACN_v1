import { Request, Response } from 'express';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../../models/users/User';
import { config } from '../../config';
import { logger } from '../../shared/utils/logger';

export default class AuthFacebookController {
  /**
   * Verify Facebook access token and login/register user
   * Client sends: { access_token: string }
   */
  static async token(req: Request, res: Response) {
    try {
      const { access_token } = req.body;
      if (!access_token) {
        return res.status(400).json({ 
          success: false, 
          message: 'access_token is required' 
        });
      }

      // Verify token with Facebook Graph API
      // https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow#checktoken
      const debugTokenUrl = `https://graph.facebook.com/debug_token?input_token=${access_token}&access_token=${config.FACEBOOK_APP_ID}|${config.FACEBOOK_APP_SECRET}`;
      
      let debugResponse;
      try {
        debugResponse = await axios.get(debugTokenUrl);
      } catch (err: any) {
        logger.error('Facebook token debug failed:', err.response?.data || err.message);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid Facebook access token' 
        });
      }

      const { data: tokenData } = debugResponse.data;
      
      // Check if token is valid
      if (!tokenData.is_valid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Facebook token is not valid' 
        });
      }

      // Check if app_id matches
      if (tokenData.app_id !== config.FACEBOOK_APP_ID) {
        return res.status(401).json({ 
          success: false, 
          message: 'Facebook token app_id mismatch' 
        });
      }

      const facebookId = tokenData.user_id;

      // Get user profile from Facebook
      const profileUrl = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${access_token}`;
      
      let profileResponse;
      try {
        profileResponse = await axios.get(profileUrl);
      } catch (err: any) {
        logger.error('Facebook profile fetch failed:', err.response?.data || err.message);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch Facebook profile' 
        });
      }

      const profile = profileResponse.data;
      const email = profile.email ? profile.email.toLowerCase() : null;
      const name = profile.name;
      const picture = profile.picture?.data?.url;

      logger.info(`Facebook login attempt - ID: ${facebookId}, Email: ${email || 'N/A'}`);

      // Try to find existing user by facebookId
      let user = await User.findOne({ facebookId: facebookId });

      if (!user && email) {
        // Try to find by email to link accounts
        user = await User.findOne({ email });
        if (user) {
          // Link Facebook account
          user.facebookId = facebookId;
          user.isVerified = true; // Facebook verified email
          if (!user.avatar && picture) user.avatar = picture;
          await user.save();
          logger.info(`Linked Facebook account to existing user: ${email}`);
        }
      }

      if (!user) {
        // Create new user
        const randomPassword = crypto.randomBytes(20).toString('hex');
        
        // If no email from Facebook, create a placeholder
        const userEmail = email || `${facebookId}@facebook.local`;
        
        const newUser = new User({
          email: userEmail,
          password: randomPassword,
          userName: name,
          avatar: picture,
          facebookId: facebookId,
          isVerified: email ? true : false, // Verified if we got email from Facebook
          role: 'customer'
        });
        
        await newUser.save();
        user = newUser;
        logger.info(`New user created via Facebook: ${userEmail}`);
      }

      // Generate JWT tokens
      const payloadJwt = { userId: user._id, email: user.email, role: user.role };
      const secret = config.JWT_SECRET as string;
      const accessToken = jwt.sign(payloadJwt, secret as jwt.Secret, { 
        expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] 
      });
      const refreshToken = jwt.sign(payloadJwt, secret as jwt.Secret, { 
        expiresIn: config.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] 
      });

      return res.json({
        success: true,
        message: 'Facebook login successful',
        user: {
          id: user._id,
          email: user.email,
          userName: (user as any).userName,
          phone: (user as any).phone,
          address: (user as any).address,
          facebookId: (user as any).facebookId,
          googleId: (user as any).googleId,
          avatar: user.avatar,
          role: user.role,
          isVerified: user.isVerified
        },
        accessToken,
        refreshToken
      });

    } catch (error: any) {
      logger.error('AuthFacebookController.token error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: config.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}
