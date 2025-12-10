import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../../models/users/User';
import { config } from '../../config';
import { logger } from '../../shared/utils/logger';
import { HttpStatus } from '../../shared/constants/httpStatus';

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);

export default class AuthGoogleController {
  static async token(req: Request, res: Response) {
    try {
      const { id_token } = req.body;
      if (!id_token) return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'id_token required' });

      // TEMP DEBUG: decode token without verification to inspect `aud` claim
      let decodedAud: string | string[] | undefined | null = null;
      try {
        // jwt.decode only parses the token; it does NOT verify signature — safe for debugging
        const decoded = jwt.decode(id_token) as unknown as { aud?: string | string[] } | null;
        decodedAud = decoded?.aud;
        logger.info(`Debug: decoded id_token aud: ${JSON.stringify(decodedAud)}`);
        logger.info(`Debug: server GOOGLE_CLIENT_ID: ${config.GOOGLE_CLIENT_ID}`);
      } catch (dErr) {
        logger.warn('Debug: failed to decode id_token for inspection', dErr);
      }

      let ticket;
      try {
        // Support multiple acceptable audiences (helpful in dev/testing when tokens
        // may be issued to different OAuth client IDs). Configure via
        // `GOOGLE_CLIENT_AUDIENCES` (comma-separated) or fall back to `GOOGLE_CLIENT_ID`.
        const audiencesEnv = config.GOOGLE_CLIENT_AUDIENCES;
        const audiences = audiencesEnv
          ? audiencesEnv.split(',').map((s) => s.trim()).filter(Boolean)
          : [config.GOOGLE_CLIENT_ID];

        logger.info(`AuthGoogleController: verifying id_token against audiences: ${JSON.stringify(audiences)}`);

        ticket = await client.verifyIdToken({ idToken: id_token, audience: audiences });
      } catch (verifyErr) {
        logger.error('AuthGoogleController.verifyIdToken failed:', verifyErr);
        logger.info(`Debug (post-verify) decoded aud: ${JSON.stringify(decodedAud)}`);
        if (config.NODE_ENV !== 'production') {
          return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Invalid Google token (aud mismatch)', data: { token_aud: decodedAud, expected_aud: config.GOOGLE_CLIENT_ID } });
        }
        return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Invalid Google token' });
      }
      const payload = ticket.getPayload();
      if (!payload) return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Invalid Google token' });

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
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error' });
    }
  }
}
