import { Router, Request, Response } from 'express';
import { Livestream } from '../models/Livestream';
import { LivestreamMessage } from '../models/LivestreamMessage';
const { v4: uuidv4 } = require('uuid');

const router = Router();

// Helper function to transform Mongoose document to API response
const transformLivestream = (doc: any) => {
  const obj = doc.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

/**
 * @swagger
 * /api/livestreams:
 *   post:
 *     tags: [Livestreams]
 *     summary: Tạo livestream mới
 *     description: Tạo phiên livestream bán hàng mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - hostId
 *               - hostName
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Livestream bán rau củ tươi"
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               hostId:
 *                 type: string
 *               hostName:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Tạo livestream thành công
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, thumbnail, hostId, hostName, products, startTime } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    
    // Use username in channel name for better identification
    const sanitizedHostName = (hostName || 'user').replace(/[^a-zA-Z0-9]/g, '');
    const channelName = `${sanitizedHostName}-${uuidv4()}`;

    const livestream = new Livestream({
      title,
      description: description || '',
      thumbnail: thumbnail || '',
      hostId: hostId || '',
      hostName: hostName || '',
      products: products || [],
      startTime: startTime ? new Date(startTime) : undefined,
      channelName,
      status: startTime ? 'SCHEDULED' : 'LIVE'
    });

    await livestream.save();
    return res.status(201).json(transformLivestream(livestream));
  } catch (error) {
    console.error('create livestream error', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});
/**
 * @swagger
 * /api/livestreams:
 *   get:
 *     tags: [Livestreams]
 *     summary: Lấy danh sách livestream
 *     description: Lấy danh sách livestream (mặc định chỉ lấy LIVE và SCHEDULED)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [LIVE, SCHEDULED, ENDED]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = String(req.query.status || '');
    const filter: any = {};
    
    if (status) {
      // If specific status requested, filter by it
      filter.status = status;
    } else {
      // By default, exclude ENDED streams - only show LIVE and SCHEDULED
      filter.status = { $in: ['LIVE', 'SCHEDULED'] };
    }
    
    const items = await Livestream.find(filter).sort({ createdAt: -1 }).limit(100);
    return res.json(items.map(transformLivestream));
  } catch (error) {
    console.error('list livestreams error', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const item = await Livestream.findById(id);
    if (!item) return res.status(404).json({ error: 'not_found' });
    return res.json(transformLivestream(item));
  } catch (error) {
    console.error('get livestream error', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { title, description, thumbnail, products } = req.body;
    
    const item = await Livestream.findById(id);
    if (!item) return res.status(404).json({ error: 'not_found' });
    
    if (title) item.title = title;
    if (description !== undefined) item.description = description;
    if (thumbnail !== undefined) item.thumbnail = thumbnail;
    if (products) item.products = products;
    
    await item.save();
    return res.json(transformLivestream(item));
  } catch (error) {
    console.error('update livestream error', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    
    if (!['LIVE', 'SCHEDULED', 'ENDED'].includes(status)) {
      return res.status(400).json({ error: 'invalid_status' });
    }
    
    const item = await Livestream.findById(id);
    if (!item) return res.status(404).json({ error: 'not_found' });
    
    item.status = status;
    if (status === 'ENDED' && !item.endTime) {
      item.endTime = new Date();
      
      // Delete all chat messages when livestream ends
      try {
        const deleteResult = await LivestreamMessage.deleteMany({ livestreamId: id });
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} chat messages for livestream ${id}`);
      } catch (err) {
        console.error('Error deleting chat messages:', err);
      }
    }
    
    await item.save();
    return res.json(transformLivestream(item));
  } catch (error) {
    console.error('update livestream status error', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.put('/:id/viewers', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { viewerCount } = req.body;
    
    const item = await Livestream.findById(id);
    if (!item) return res.status(404).json({ error: 'not_found' });
    
    if (typeof viewerCount === 'number' && viewerCount >= 0) {
      item.viewerCount = viewerCount;
      await item.save();
    }
    
    return res.json(transformLivestream(item));
  } catch (error) {
    console.error('update viewer count error', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.get('/user/:userId/history', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    const items = await Livestream.find({ 
      hostId: userId, 
      status: 'ENDED' 
    })
    .sort({ endTime: -1 }) // Sort by most recent ended first
    .limit(50);
    
    return res.json(items.map(transformLivestream));
  } catch (error) {
    console.error('get user livestream history error', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export { router as livestreamRoutes };
