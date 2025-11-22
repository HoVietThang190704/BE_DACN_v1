import { Router, Request, Response } from 'express';
import { Livestream } from '../models/Livestream';
import { User } from '../models/users/User';
import { LivestreamMessage } from '../models/LivestreamMessage';
import { Product, IProduct } from '../models/Product';
import { authenticate } from '../shared/middleware/auth';
import { authorizeRoles } from '../shared/middleware/authorize';
const { v4: uuidv4 } = require('uuid');

const router = Router();

type LivestreamProductSummary = {
  id: string;
  name: string;
  price: number;
  unit?: string;
  thumbnail?: string;
  stockQuantity?: number;
};

const PRODUCT_SUMMARY_FIELDS = 'name price unit images stockQuantity owner';

const normalizeProductIds = (products: unknown): string[] => {
  if (!Array.isArray(products)) return [];
  const normalized = products
    .map((id) => (typeof id === 'string' || typeof id === 'number' ? String(id).trim() : ''))
    .filter(Boolean);
  return Array.from(new Set(normalized));
};

const orderProductDocs = (ids: string[], docs: IProduct[]): IProduct[] => {
  const docMap = new Map(docs.map((doc) => [doc._id.toString(), doc]));
  return ids
    .map((id) => docMap.get(id))
    .filter((doc): doc is IProduct => Boolean(doc));
};

const mapProductsToSummaries = (docs: IProduct[]): LivestreamProductSummary[] => {
  return docs.map((doc) => ({
    id: doc._id.toString(),
    name: doc.name,
    price: doc.price,
    unit: doc.unit,
    thumbnail: Array.isArray(doc.images) && doc.images.length > 0 ? doc.images[0] : '',
    stockQuantity: doc.stockQuantity,
  }));
};

const fetchProductSummariesByIds = async (productIds: string[]): Promise<LivestreamProductSummary[]> => {
  if (!productIds || productIds.length === 0) return [];
  const productDocs = await Product.find({ _id: { $in: productIds } }).select(PRODUCT_SUMMARY_FIELDS);
  const ordered = orderProductDocs(productIds, productDocs);
  return mapProductsToSummaries(ordered);
};

// Helper function to transform Mongoose document to API response
const transformLivestream = (doc: any, productSummaries?: LivestreamProductSummary[]) => {
  const obj = doc.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  if (productSummaries) {
    obj.productSummaries = productSummaries;
  }
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
router.post('/', authenticate, authorizeRoles('shop_owner', 'admin'), async (req: Request, res: Response) => {
  try {
    const { title, description, thumbnail, hostAvatar, products, startTime } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });

    const normalizedProductIds = normalizeProductIds(products);
    if (normalizedProductIds.length === 0) {
      return res.status(400).json({ error: 'products_required' });
    }

    const host = await User.findById(req.user.userId).select('userName email avatar role');
    if (!host) {
      return res.status(404).json({ error: 'host_not_found' });
    }

    const productDocs = await Product.find({ _id: { $in: normalizedProductIds } }).select(PRODUCT_SUMMARY_FIELDS);
    if (productDocs.length !== normalizedProductIds.length) {
      return res.status(400).json({ error: 'invalid_products' });
    }

    if (req.user.role !== 'admin') {
      const unauthorizedProduct = productDocs.find((doc) => doc.owner?.toString() !== req.user?.userId);
      if (unauthorizedProduct) {
        return res.status(403).json({ error: 'product_owner_mismatch' });
      }
    }

    const orderedProductDocs = orderProductDocs(normalizedProductIds, productDocs);
    const productSummaries = mapProductsToSummaries(orderedProductDocs);

    const resolvedHostName = host.userName || host.email || 'user';
    const sanitizedHostName = resolvedHostName.replace(/[^a-zA-Z0-9]/g, '') || 'user';
    const channelName = `${sanitizedHostName}-${uuidv4()}`;

    const livestream = new Livestream({
      title,
      description: description || '',
      thumbnail: thumbnail || '',
      hostAvatar: hostAvatar || host.avatar || '',
      hostId: host._id.toString(),
      hostName: resolvedHostName,
      products: normalizedProductIds,
      startTime: startTime ? new Date(startTime) : undefined,
      channelName,
      status: startTime ? 'SCHEDULED' : 'LIVE'
    });

    await livestream.save();
    return res.status(201).json(transformLivestream(livestream, productSummaries));
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

    // If some livestreams do not have hostAvatar set, try to fill from user profile
    const transformed = items.map(transformLivestream);

    const missingHostIds = transformed
      .filter((it: any) => !(it.hostAvatar) && it.hostId)
      .map((it: any) => it.hostId);

    if (missingHostIds.length > 0) {
      const users = await User.find({ _id: { $in: missingHostIds } }).select('avatar');
      const avatarMap: Record<string, string> = {};
      users.forEach((u: any) => {
        if (u && u._id) avatarMap[u._id.toString()] = u.avatar || '';
      });

      transformed.forEach((it: any) => {
        if ((!it.hostAvatar || it.hostAvatar === '') && it.hostId && avatarMap[it.hostId]) {
          it.hostAvatar = avatarMap[it.hostId];
        }
      });
    }

    return res.json(transformed);
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
    const productSummaries = await fetchProductSummariesByIds(item.products || []);
    const obj = transformLivestream(item, productSummaries);
    // If hostAvatar missing, try to fetch from user profile
    if ((!obj.hostAvatar || obj.hostAvatar === '') && obj.hostId) {
      try {
        const user = await User.findById(obj.hostId).select('avatar');
        if (user && user.avatar) obj.hostAvatar = user.avatar;
      } catch (err) {
        // ignore
      }
    }
    return res.json(obj);
  } catch (error) {
    console.error('get livestream error', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.put('/:id', authenticate, authorizeRoles('shop_owner', 'admin'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { title, description, thumbnail, hostAvatar, products } = req.body;
    
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });

    const item = await Livestream.findById(id);
    if (!item) return res.status(404).json({ error: 'not_found' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && item.hostId && item.hostId !== req.user.userId) {
      return res.status(403).json({ error: 'not_host' });
    }
    
    if (title) item.title = title;
    if (description !== undefined) item.description = description;
    if (thumbnail !== undefined) item.thumbnail = thumbnail;
    if (hostAvatar !== undefined) item.hostAvatar = hostAvatar;

    let productSummaries: LivestreamProductSummary[] | undefined;
    if (products !== undefined) {
      const normalizedProductIds = normalizeProductIds(products);
      if (normalizedProductIds.length === 0) {
        return res.status(400).json({ error: 'products_required' });
      }

      const productDocs = await Product.find({ _id: { $in: normalizedProductIds } }).select(PRODUCT_SUMMARY_FIELDS);
      if (productDocs.length !== normalizedProductIds.length) {
        return res.status(400).json({ error: 'invalid_products' });
      }

      if (!isAdmin) {
        const unauthorizedProduct = productDocs.find((doc) => doc.owner?.toString() !== req.user?.userId);
        if (unauthorizedProduct) {
          return res.status(403).json({ error: 'product_owner_mismatch' });
        }
      }

      const orderedProductDocs = orderProductDocs(normalizedProductIds, productDocs);
      productSummaries = mapProductsToSummaries(orderedProductDocs);
      item.products = normalizedProductIds;
    }
    
    await item.save();
    if (!productSummaries) {
      productSummaries = await fetchProductSummariesByIds(item.products || []);
    }
    return res.json(transformLivestream(item, productSummaries));
  } catch (error) {
    console.error('update livestream error', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.put('/:id/status', authenticate, authorizeRoles('shop_owner', 'admin'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });

    if (!['LIVE', 'SCHEDULED', 'ENDED'].includes(status)) {
      return res.status(400).json({ error: 'invalid_status' });
    }
    
    const item = await Livestream.findById(id);
    if (!item) return res.status(404).json({ error: 'not_found' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && item.hostId && item.hostId !== req.user.userId) {
      return res.status(403).json({ error: 'not_host' });
    }
    
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
    const productSummaries = await fetchProductSummariesByIds(item.products || []);
    return res.json(transformLivestream(item, productSummaries));
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
