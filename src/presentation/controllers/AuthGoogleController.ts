import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../../models/users/User';
import { config } from '../../config';
import { logger } from '../../shared/utils/logger';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default class AuthGoogleController {
  static async token(req: Request, res: Response) {
    try {
      const { id_token } = req.body;
      if (!id_token) return res.status(400).json({ success: false, message: 'id_token required' });

      const ticket = await client.verifyIdToken({ idToken: id_token, audience: process.env.GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload) return res.status(401).json({ success: false, message: 'Invalid Google token' });

      const googleId = payload.sub as string;
      const email = (payload.email || '').toLowerCase();
      const name = payload.name as string | undefined;
      const picture = payload.picture as string | undefined;
      const email_verified = payload.email_verified === true;

      // Try to find existing user by googleId
      let user = await User.findOne({ googleId: googleId });

      if (!user && email) {
        // Try to find by email
        user = await User.findOne({ email });
        if (user) {
          // Link account: set googleId and mark verified if Google says so
          user.googleId = googleId;
          if (email_verified) user.isVerified = true;
          if (!user.avatar && picture) user.avatar = picture;
          await user.save();
        }
      }

      if (!user) {
        // Create a new user. Password is required by schema, so set a random one.
        const randomPassword = crypto.randomBytes(20).toString('hex');
        const newUser = new User({
          email,
          password: randomPassword,
          userName: name,
          avatar: picture,
          googleId,
          isVerified: email_verified,
          role: 'customer'
        });
        await newUser.save();
        user = newUser;
      }

      // Issue application JWTs (access + refresh) using existing config
      const payloadJwt = { userId: user._id, email: user.email, role: user.role };
      const secret = config.JWT_SECRET as string;
      const accessToken = jwt.sign(payloadJwt, secret as jwt.Secret, { expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
      const refreshToken = jwt.sign(payloadJwt, secret as jwt.Secret, { expiresIn: config.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

      return res.json({
        success: true,
        message: 'Google login successful',
        user: {
          id: user._id,
          email: user.email,
          userName: (user as any).userName,
          phone: (user as any).phone,
          address: (user as any).address,
          facebookId: (user as any).facebookId || (user as any).facebookID,
          googleId: (user as any).googleId,
          role: user.role,
          isVerified: user.isVerified
        },
        accessToken,
        refreshToken
      });

    } catch (error) {
      logger.error('AuthGoogleController.token error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
