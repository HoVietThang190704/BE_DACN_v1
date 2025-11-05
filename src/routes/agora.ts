import { Router, Request, Response } from 'express';
import { config } from '../config';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

const router = Router();

/**
 * @swagger
 * /api/agora/token:
 *   get:
 *     tags: [Agora]
 *     summary: Tạo Agora RTC Token
 *     description: Tạo token để join livestream channel
 *     parameters:
 *       - in: query
 *         name: channel
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên channel livestream
 *       - in: query
 *         name: uid
 *         schema:
 *           type: integer
 *           default: 0
 *         description: User ID (0 = auto generate)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [publisher, subscriber, audience]
 *           default: publisher
 *         description: Role trong livestream
 *     responses:
 *       200:
 *         description: Token được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 appId:
 *                   type: string
 *                 token:
 *                   type: string
 *                 uid:
 *                   type: integer
 *                 expiresAt:
 *                   type: integer
 */
router.get('/token', (req: Request, res: Response) => {
  try {
    const channel = String(req.query.channel || 'default');
    const uidParam = req.query.uid;
    const uid = uidParam ? Number(uidParam) : 0;
    const roleParam = String(req.query.role || 'publisher').toLowerCase();

    if (!config.AGORA_APP_ID || !config.AGORA_APP_CERT) {
      return res.status(500).json({ error: 'Agora APP_ID or APP_CERT not configured on server' });
    }

    const role = roleParam === 'audience' || roleParam === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

    const currentTs = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTs + config.AGORA_TOKEN_EXPIRE_SECONDS;

    const token = RtcTokenBuilder.buildTokenWithUid(
      config.AGORA_APP_ID,
      config.AGORA_APP_CERT,
      channel,
      uid,
      role,
      privilegeExpiredTs
    );

    return res.json({ appId: config.AGORA_APP_ID, token, uid, expiresAt: privilegeExpiredTs });
  } catch (error) {
    console.error('Error generating Agora token', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export { router as agoraRoutes };
