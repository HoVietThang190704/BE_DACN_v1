import { Product } from '../../models/Product';
import { Post } from '../../models/Post';
import { Category } from '../../models/Category';
import { User } from '../../models/users/User';
import { elasticsearchService } from './index';
import { ProductEntity } from '../../domain/entities/Product.entity';
import { PostEntity } from '../../domain/entities/Post.entity';
import { CategoryEntity } from '../../domain/entities/Category.entity';

export async function countMongoDocuments(model: any): Promise<number> {
  return model.countDocuments();
}

export async function countEsDocuments(indexName: string): Promise<number> {
  try {
    return await elasticsearchService.countIndexDocuments(indexName);
  } catch (err) {
    return 0;
  }
}

export async function indexAllProducts() {
  const cursor = Product.find().populate('owner').populate('category').cursor();
  let count = 0;
  for await (const doc of cursor as any) {
    try {
      const owner = (doc as any).owner;
      const category = (doc as any).category;
      const entity = new ProductEntity({
        id: String(doc._id),
        name: doc.name,
        nameEn: doc.nameEn ?? undefined,
        category: { id: category?._id?.toString() ?? '', name: category?.name ?? undefined, slug: category?.slug ?? undefined },
        owner: { id: owner?._id?.toString() ?? '', userName: owner?.userName ?? owner?.email ?? '' },
        price: doc.price ?? 0,
        unit: doc.unit ?? '',
        description: doc.description ?? '',
        images: Array.isArray(doc.images) ? doc.images : [],
        inStock: Boolean(doc.inStock),
        stockQuantity: Number.isFinite(doc.stockQuantity) ? doc.stockQuantity : 0,
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        rating: doc.rating ?? 0,
        reviewCount: doc.reviewCount ?? 0,
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date()
      });

      await elasticsearchService.indexProduct(entity);
      count++;
    } catch (err) {
      console.warn('indexAllProducts failed for id=', String((doc as any)?._id), err);
    }
  }
  return count;
}

export async function indexAllPosts() {
  const cursor = Post.find().populate('userId').populate('sharedBy').cursor();
  let count = 0;
  for await (const doc of cursor as any) {
    try {
      const user = (doc as any).userId;
      const sharedBy = (doc as any).sharedBy;

      const entity = new PostEntity({
        id: String(doc._id),
        userId: doc.userId?.toString() ?? (user?._id?.toString() ?? ''),
        content: doc.content ?? '',
        images: Array.isArray(doc.images) ? doc.images : [],
        cloudinaryPublicIds: Array.isArray(doc.cloudinaryPublicIds) ? doc.cloudinaryPublicIds : [],
        likes: Array.isArray(doc.likes) ? doc.likes.map((x:any) => x.toString()) : [],
        likesCount: doc.likesCount ?? 0,
        commentsCount: doc.commentsCount ?? 0,
        sharesCount: doc.sharesCount ?? 0,
        visibility: doc.visibility ?? 'public',
        isEdited: Boolean(doc.isEdited),
        editedAt: doc.editedAt ?? undefined,
        originalPostId: doc.originalPostId?.toString() ?? undefined,
        sharedBy: sharedBy?._id?.toString() ?? (doc.sharedBy?.toString?.() ?? undefined),
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date()
      });

      const populated = { user: user ? { id: user._id.toString(), userName: user.userName, email: user.email, avatar: user.avatar } : undefined, sharedBy };
      await elasticsearchService.indexPost(entity, populated);
      count++;
    } catch (err) {
      console.warn('indexAllPosts failed for id=', String((doc as any)?._id), err);
    }
  }
  return count;
}

export async function indexAllCategories() {
  const docs = await Category.find().lean();
  let count = 0;
  for (const doc of (docs as any[])) {
    try {
      const entity = new CategoryEntity({
        id: String(doc._id),
        name: doc.name,
        nameEn: doc.nameEn ?? undefined,
        slug: doc.slug,
        description: doc.description ?? undefined,
        icon: doc.icon ?? undefined,
        image: doc.image ?? undefined,
        images: doc.image ? [String(doc.image)] : [],
        imagesPublicIds: doc.imagePublicId ? [String(doc.imagePublicId)] : [],
        parentId: doc.parentId?.toString() ?? null,
        level: doc.level ?? 0,
        order: doc.order ?? 0,
        isActive: Boolean(doc.isActive),
        productCount: doc.productCount ?? 0,
        children: undefined,
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date()
      });

      await elasticsearchService.indexCategory(entity);
      count++;
    } catch (err) {
      console.warn('indexAllCategories failed for id=', String((doc as any)?._id), err);
    }
  }
  return count;
}

export async function reindexIfNeeded() {
  const checks: Array<Promise<void>> = [];
  checks.push((async () => {
    const mongoCount = await countMongoDocuments(Product);
    const esCount = await countEsDocuments('products_v1');
    if (esCount < mongoCount) {
      console.info(`[Reindex] Products: ES has ${esCount}, Mongo has ${mongoCount}. Reindexing products...`);
      const total = await indexAllProducts();
      console.info(`[Reindex] Products indexed: ${total}`);
    } else {
      console.info(`[Reindex] Products OK: ES=${esCount}, Mongo=${mongoCount}`);
    }
  })());

  checks.push((async () => {
    const mongoCount = await countMongoDocuments(Post);
    const esCount = await countEsDocuments('posts_v1');
    if (esCount < mongoCount) {
      console.info(`[Reindex] Posts: ES has ${esCount}, Mongo has ${mongoCount}. Reindexing posts...`);
      const total = await indexAllPosts();
      console.info(`[Reindex] Posts indexed: ${total}`);
    } else {
      console.info(`[Reindex] Posts OK: ES=${esCount}, Mongo=${mongoCount}`);
    }
  })());

  checks.push((async () => {
    const mongoCount = await countMongoDocuments(Category);
    const esCount = await countEsDocuments('categories_v1');
    if (esCount < mongoCount) {
      console.info(`[Reindex] Categories: ES has ${esCount}, Mongo has ${mongoCount}. Reindexing categories...`);
      const total = await indexAllCategories();
      console.info(`[Reindex] Categories indexed: ${total}`);
    } else {
      console.info(`[Reindex] Categories OK: ES=${esCount}, Mongo=${mongoCount}`);
    }
  })());

  await Promise.all(checks);
}

export default {
  indexAllProducts,
  indexAllPosts,
  indexAllCategories,
  reindexIfNeeded
};
