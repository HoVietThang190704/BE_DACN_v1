import { Client, estypes } from '@elastic/elasticsearch';
import { config } from '../../config';
import { logger } from '../../shared/utils/logger';
import { ProductEntity } from '../../domain/entities/Product.entity';
import { PostEntity } from '../../domain/entities/Post.entity';
import { CategoryEntity } from '../../domain/entities/Category.entity';
import { buildSearchTokens, normalizeVietnameseText } from '../../shared/utils/textSearch';

const DEFAULT_LIMIT = 12;

export interface ProductSearchResult {
  items: ProductEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductSuggestion {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export interface PostSearchResult {
  items: PostEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const MAX_SUGGESTION_INPUTS = 32;

export class ElasticsearchService {
  private client: Client | null = null;
  private readonly node: string;
  private isReady = false;
  private readonly indices = {
    products: 'products_v1',
    posts: 'posts_v1',
    categories: 'categories_v1'
  } as const;

  constructor(node: string = config.ELASTICSEARCH_NODE) {
    this.node = node;
    if (!this.node) {
      logger.warn('[ElasticsearchService] ELASTICSEARCH_NODE is empty. Search features are disabled.');
    }
  }

  isEnabled(): boolean {
    return Boolean(this.node && this.node.trim().length);
  }

  async initialize(): Promise<void> {
    if (!this.isEnabled()) {
      logger.warn('[ElasticsearchService] Skipping initialization because ELASTICSEARCH_NODE is not configured.');
      return;
    }

    try {
      await this.ensureClient();
    } catch (error) {
      logger.error('[ElasticsearchService] Initialization failed:', error);
      throw error;
    }
  }

  private createClient(): Client {
    return new Client({
      node: this.node
    });
  }

  private async ensureClient(): Promise<Client> {
    if (!this.isEnabled()) {
      throw new Error('Elasticsearch node is not configured');
    }

    if (!this.client) {
      this.client = this.createClient();
    }

    if (!this.isReady) {
      await this.bootstrap();
      this.isReady = true;
    }

    return this.client;
  }

  private async bootstrap(): Promise<void> {
    try {
      const client = this.client ?? this.createClient();
      await client.ping();

      // Try to read server version and warn if it looks incompatible
      try {
        // client.info() returns version info — use any to avoid tight type coupling
        const info: any = await client.info();
        const version = info?.version?.number ?? info?.body?.version?.number ?? 'unknown';
        logger.info(`[ElasticsearchService] Connected to Elasticsearch server (version=${version})`);

        const major = typeof version === 'string' ? parseInt(version.split('.')[0], 10) : NaN;
        // If server version looks too old (e.g., < 7) warn — the client may not be compatible
        if (!Number.isNaN(major) && major < 7) {
          logger.warn('[ElasticsearchService] Elasticsearch server version seems old — client may be incompatible.');
        }
      } catch (infoErr) {
        logger.warn('[ElasticsearchService] Could not read Elasticsearch server info:', infoErr);
      }
      await this.ensureIndex(client, this.indices.products, this.productMappings());
      await this.ensureIndex(client, this.indices.posts, this.postMappings());
      await this.ensureIndex(client, this.indices.categories, this.categoryMappings());
      this.client = client;
      logger.info('[ElasticsearchService] Connected to Elasticsearch');
    } catch (error) {
      logger.error('[ElasticsearchService] Unable to connect to Elasticsearch:', error);
      throw error;
    }
  }

  private async ensureIndex(
    client: Client,
    index: string,
    body: {
      settings?: estypes.IndicesCreateRequest['settings'];
      mappings?: estypes.IndicesCreateRequest['mappings'];
    }
  ): Promise<void> {
    const exists = await client.indices.exists({ index });
    if (exists) {
      if (body.mappings?.properties) {
        try {
          await client.indices.putMapping({ index, properties: body.mappings.properties });
        } catch (mappingError) {
          logger.warn(`[ElasticsearchService] Failed to update mapping for ${index}:`, mappingError);
        }
      }
      if (body.settings) {
        try {
          await client.indices.putSettings({ index, settings: body.settings });
        } catch (settingsError) {
          logger.warn(`[ElasticsearchService] Failed to update settings for ${index}:`, settingsError);
        }
      }
      return;
    }

    await client.indices.create({
      index,
      settings: body.settings,
      mappings: body.mappings
    });
    logger.info(`[ElasticsearchService] Created index ${index}`);
  }

  // Return a document count for an index. Returns 0 if index doesn't exist.
  async countIndexDocuments(indexName: string): Promise<number> {
    try {
      const client = await this.ensureClient();
      const response = await client.count({ index: indexName });
      const value = (response as any)?.count ?? ((response as any)?.body?.count ?? 0);
      return Number(value) || 0;
    } catch (err: any) {
      // If index doesn't exist, elasticsearch client may throw. Return 0 to indicate missing.
      return 0;
    }
  }

  private productMappings(): {
    settings?: estypes.IndicesCreateRequest['settings'];
    mappings?: estypes.IndicesCreateRequest['mappings'];
  } {
    return {
      settings: {
        analysis: {
          normalizer: {
            lowercase_normalizer: {
              type: 'custom',
              filter: ['lowercase']
            }
          }
        }
      },
      mappings: {
        properties: {
          name: { type: 'text', analyzer: 'standard', fields: { keyword: { type: 'keyword', normalizer: 'lowercase_normalizer' } } },
          nameEn: { type: 'text', analyzer: 'standard' },
          unit: { type: 'keyword' },
          description: { type: 'text', analyzer: 'standard' },
          categoryId: { type: 'keyword' },
          categoryName: { type: 'text', analyzer: 'standard', fields: { keyword: { type: 'keyword', normalizer: 'lowercase_normalizer' } } },
          categorySlug: { type: 'keyword' },
          tags: { type: 'keyword' },
          price: { type: 'double' },
          rating: { type: 'double' },
          reviewCount: { type: 'integer' },
          inStock: { type: 'boolean' },
          stockQuantity: { type: 'integer' },
          images: { type: 'keyword' },
          ownerId: { type: 'keyword' },
          ownerName: { type: 'text', analyzer: 'standard' },
          suggest: { type: 'completion' },
          searchTerms: { type: 'keyword', normalizer: 'lowercase_normalizer' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' }
        }
      }
    };
  }

  private postMappings(): { mappings?: estypes.IndicesCreateRequest['mappings'] } {
    return {
      mappings: {
        properties: {
          userId: { type: 'keyword' },
          userName: { type: 'text', analyzer: 'standard' },
          userEmail: { type: 'keyword' },
          userAvatar: { type: 'keyword' },
          content: { type: 'text', analyzer: 'standard' },
          visibility: { type: 'keyword' },
          images: { type: 'keyword' },
          cloudinaryPublicIds: { type: 'keyword' },
          likes: { type: 'keyword' },
          likesCount: { type: 'integer' },
          commentsCount: { type: 'integer' },
          sharesCount: { type: 'integer' },
          isEdited: { type: 'boolean' },
          editedAt: { type: 'date' },
          originalPostId: { type: 'keyword' },
          sharedById: { type: 'keyword' },
          sharedByName: { type: 'text', analyzer: 'standard' },
          sharedByAvatar: { type: 'keyword' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' }
        }
      }
    };
  }

  private categoryMappings(): { mappings?: estypes.IndicesCreateRequest['mappings'] } {
    return {
      mappings: {
        properties: {
          name: { type: 'text', analyzer: 'standard' },
          nameEn: { type: 'text', analyzer: 'standard' },
          slug: { type: 'keyword' },
          description: { type: 'text', analyzer: 'standard' },
          parentId: { type: 'keyword' },
          level: { type: 'integer' },
          isActive: { type: 'boolean' },
          productCount: { type: 'integer' },
          suggest: { type: 'completion' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' }
        }
      }
    };
  }

  private buildProductDocument(product: ProductEntity) {
    const searchTokens = buildSearchTokens(
      product.name,
      product.nameEn,
      product.category?.name,
      product.owner?.userName,
      ...(product.tags ?? [])
    );

    const suggestionInputs = searchTokens.length > 0
      ? searchTokens.slice(0, MAX_SUGGESTION_INPUTS)
      : [product.name].filter(Boolean) as string[];

    return {
      name: product.name,
      nameEn: product.nameEn,
      unit: product.unit,
      description: product.description,
      categoryId: product.category?.id,
      categoryName: product.category?.name,
      categorySlug: product.category?.slug,
      tags: product.tags ?? [],
      price: product.price,
      rating: product.rating,
      reviewCount: product.reviewCount,
      inStock: product.inStock,
      stockQuantity: product.stockQuantity,
      images: product.images ?? [],
      ownerId: product.owner?.id,
      ownerName: product.owner?.userName,
      suggest: {
        input: suggestionInputs,
        weight: Math.max(1, Math.floor(product.rating * 10 + product.reviewCount))
      },
      searchTerms: searchTokens,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  }

  private buildPostDocument(post: PostEntity, populated?: any) {
    const user = populated?.user ?? (post as any).user;
    const sharedBy = populated?.sharedBy ?? (post as any).sharedBy;
    return {
      userId: post.userId,
      userName: user?.userName,
      userEmail: user?.email,
      userAvatar: user?.avatar,
      content: post.content,
      visibility: post.visibility,
      images: post.images ?? [],
      cloudinaryPublicIds: post.cloudinaryPublicIds ?? [],
      likes: post.likes ?? [],
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
      isEdited: post.isEdited,
      editedAt: post.editedAt,
      originalPostId: post.originalPostId,
      sharedById: sharedBy?.id ?? sharedBy ?? undefined,
      sharedByName: sharedBy?.userName,
      sharedByAvatar: sharedBy?.avatar,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    };
  }

  private buildCategoryDocument(category: CategoryEntity) {
    return {
      name: category.name,
      nameEn: category.nameEn,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId,
      level: category.level,
      isActive: category.isActive,
      productCount: category.productCount,
      suggest: {
        input: [category.name, category.slug, category.nameEn].filter(Boolean)
      },
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };
  }

  async indexProduct(product: ProductEntity): Promise<void> {
    try {
      const client = await this.ensureClient();
      await client.index({
        index: this.indices.products,
        id: product.id,
        document: this.buildProductDocument(product),
        refresh: 'wait_for'
      });
    } catch (error) {
      logger.error('[ElasticsearchService] indexProduct failed:', error);
    }
  }

  async removeProduct(productId: string): Promise<void> {
    try {
      const client = await this.ensureClient();
      await client.delete({ index: this.indices.products, id: productId, refresh: 'wait_for' });
    } catch (error) {
      logger.warn(`[ElasticsearchService] removeProduct skipped for ${productId}:`, error);
    }
  }

  async indexPost(post: PostEntity, populated?: any): Promise<void> {
    try {
      const client = await this.ensureClient();
      await client.index({
        index: this.indices.posts,
        id: post.id,
        document: this.buildPostDocument(post, populated),
        refresh: 'wait_for'
      });
    } catch (error) {
      logger.error('[ElasticsearchService] indexPost failed:', error);
    }
  }

  async removePost(postId: string): Promise<void> {
    try {
      const client = await this.ensureClient();
      await client.delete({ index: this.indices.posts, id: postId, refresh: 'wait_for' });
    } catch (error) {
      logger.warn(`[ElasticsearchService] removePost skipped for ${postId}:`, error);
    }
  }

  async indexCategory(category: CategoryEntity): Promise<void> {
    try {
      const client = await this.ensureClient();
      await client.index({
        index: this.indices.categories,
        id: category.id,
        document: this.buildCategoryDocument(category),
        refresh: 'wait_for'
      });
    } catch (error) {
      logger.error('[ElasticsearchService] indexCategory failed:', error);
    }
  }

  async removeCategory(categoryId: string): Promise<void> {
    try {
      const client = await this.ensureClient();
      await client.delete({ index: this.indices.categories, id: categoryId, refresh: 'wait_for' });
    } catch (error) {
      logger.warn(`[ElasticsearchService] removeCategory skipped for ${categoryId}:`, error);
    }
  }

  async searchProducts(query: string, options?: { page?: number; limit?: number }): Promise<ProductSearchResult> {
    const client = await this.ensureClient();
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(Math.max(options?.limit ?? DEFAULT_LIMIT, 1), 50);
    const from = (page - 1) * limit;

    const trimmedQuery = query.trim();
    const normalizedQuery = normalizeVietnameseText(trimmedQuery);
    const queryTokens = buildSearchTokens(trimmedQuery);
    const normalizedTokens = normalizedQuery && normalizedQuery !== trimmedQuery
      ? buildSearchTokens(normalizedQuery)
      : [];

    const combinedTermTokens = Array.from(new Set([...queryTokens, ...normalizedTokens]));

    const shouldQueries: estypes.QueryDslQueryContainer[] = [
      {
        multi_match: {
          query: trimmedQuery,
          fields: ['name^4', 'name.keyword^6', 'nameEn^2', 'categoryName^3', 'description', 'tags^2'],
          fuzziness: 'AUTO',
          operator: 'and'
        }
      },
      {
        match_phrase_prefix: {
          name: {
            query: trimmedQuery,
            boost: 2
          }
        }
      }
    ];

    if (normalizedQuery && normalizedQuery !== trimmedQuery) {
      shouldQueries.push(
        {
          multi_match: {
            query: normalizedQuery,
            fields: ['name^3', 'nameEn^2', 'categoryName^2', 'description'],
            fuzziness: 'AUTO',
            operator: 'and'
          }
        },
        {
          match_phrase_prefix: {
            name: {
              query: normalizedQuery,
              boost: 1.5
            }
          }
        }
      );
    }

    if (combinedTermTokens.length > 0) {
      shouldQueries.push({
        terms: {
          searchTerms: combinedTermTokens,
          boost: 2
        }
      });
    }

    let suggestedIds: string[] = [];
    try {
      const suggestBody: Record<string, any> = {
        completion_suggest: {
          prefix: trimmedQuery,
          completion: { field: 'suggest', size: 12, skip_duplicates: true, fuzzy: { fuzziness: 1 } }
        }
      };

      if (normalizedQuery && normalizedQuery !== trimmedQuery) {
        suggestBody.normalized = { prefix: normalizedQuery, completion: { field: 'suggest', size: 12, skip_duplicates: true, fuzzy: { fuzziness: 1 } } };
      }

      const suggestResp = await client.search({ index: this.indices.products, size: 0, suggest: suggestBody });
      const collect: any[] = [];
      const pushMaybeArray = (val: any | any[] | undefined | null) => {
        if (!val) return;
        if (Array.isArray(val)) collect.push(...val);
        else collect.push(val);
      };

      if (Array.isArray(suggestResp.suggest?.completion_suggest)) {
        const opts = suggestResp.suggest.completion_suggest[0]?.options;
        pushMaybeArray(opts);
      }
      if (Array.isArray(suggestResp.suggest?.normalized)) {
        const opts = suggestResp.suggest.normalized[0]?.options;
        pushMaybeArray(opts);
      }

      const dedup = new Set<string>();
      for (const opt of collect) {
        const id = String(opt?._id ?? '');
        if (!id) continue;
        if (dedup.has(id)) continue;
        dedup.add(id);
        suggestedIds.push(id);
        if (suggestedIds.length >= 12) break;
      }

      if (suggestedIds.length > 0) {
        shouldQueries.push({ ids: { values: suggestedIds, boost: 4 } });
      }
    } catch (e) {
      // silently ignore suggest prefetch errors; search will continue using shouldQueries already built
    }

    const response = await client.search<{ _source: any }>({
      index: this.indices.products,
      from,
      size: limit,
      query: {
        bool: {
          should: shouldQueries,
          minimum_should_match: 1
        }
      }
    });

    const hits = response.hits.hits ?? [];
    const total = typeof response.hits.total === 'number' ? response.hits.total : (response.hits.total?.value ?? hits.length);
    const items = hits.map(hit => this.fromProductSource(hit._id as string, hit._source ?? {}));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async suggestProducts(text: string, limit: number = 8): Promise<ProductSuggestion[]> {
    const trimmed = text.trim();
    if (trimmed.length < 1) {
      return [];
    }

    const client = await this.ensureClient();
    const normalized = normalizeVietnameseText(trimmed);

    const suggestBody: Record<string, any> = {
      primary: {
        prefix: trimmed,
        completion: {
          field: 'suggest',
          size: limit,
          skip_duplicates: true,
          fuzzy: {
            fuzziness: 1
          }
        }
      }
    };

    if (normalized && normalized !== trimmed) {
      suggestBody.normalized = {
        prefix: normalized,
        completion: {
          field: 'suggest',
          size: limit,
          skip_duplicates: true,
          fuzzy: {
            fuzziness: 1
          }
        }
      };
    }

    const response = await client.search({
      index: this.indices.products,
      size: 0,
      suggest: suggestBody
    });

    const collected: Array<{ _id?: string; _source?: Record<string, unknown> }> = [];
    const pushOptions = (key: string) => {
      const entries = response.suggest?.[key] as Array<{ options?: Array<{ _id?: string; _source?: Record<string, unknown> }> }> | undefined;
      if (entries && entries.length) {
        collected.push(...(entries[0].options ?? []));
      }
    };

    pushOptions('primary');
    pushOptions('normalized');

    if (!collected.length) {
      return [];
    }

    const dedupById = new Map<string, { _id?: string; _source?: Record<string, unknown> }>();
    for (const option of collected) {
      const key = option._id as string | undefined;
      if (!key || dedupById.has(key)) {
        continue;
      }
      dedupById.set(key, option);
      if (dedupById.size >= limit) {
        break;
      }
    }

    return Array.from(dedupById.values()).map(option => ({
      id: option._id as string,
      name: option._source?.name as string,
      price: Number(option._source?.price) || 0,
      image: Array.isArray(option._source?.images) ? option._source?.images[0] : undefined
    }));
  }

  async searchPosts(query: string, options?: { page?: number; limit?: number }): Promise<PostSearchResult> {
    const client = await this.ensureClient();
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(Math.max(options?.limit ?? DEFAULT_LIMIT, 1), 50);
    const from = (page - 1) * limit;

    const response = await client.search<{ _source: any }>({
      index: this.indices.posts,
      from,
      size: limit,
      query: {
        multi_match: {
          query,
          fields: ['content^4', 'userName^2', 'userEmail'],
          fuzziness: 'AUTO',
          operator: 'and'
        }
      }
    });

    const hits = response.hits.hits ?? [];
    const total = typeof response.hits.total === 'number' ? response.hits.total : (response.hits.total?.value ?? hits.length);
    const items = hits.map(hit => this.fromPostSource(hit._id as string, hit._source ?? {}));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  private fromProductSource(id: string, source: any): ProductEntity {
    return new ProductEntity({
      id,
      name: source.name ?? '',
      nameEn: source.nameEn ?? undefined,
      category: {
        id: source.categoryId ?? '',
        name: source.categoryName ?? undefined,
        slug: source.categorySlug ?? undefined
      },
      owner: {
        id: source.ownerId ?? '',
        userName: source.ownerName ?? undefined
      },
      price: Number(source.price) || 0,
      unit: source.unit ?? '',
      description: source.description ?? '',
      images: Array.isArray(source.images) ? source.images : [],
      inStock: Boolean(source.inStock),
      stockQuantity: Number.isFinite(source.stockQuantity) ? source.stockQuantity : 0,
      tags: Array.isArray(source.tags) ? source.tags : [],
      rating: Number(source.rating) || 0,
      reviewCount: Number(source.reviewCount) || 0,
      createdAt: source.createdAt ? new Date(source.createdAt) : new Date(),
      updatedAt: source.updatedAt ? new Date(source.updatedAt) : new Date()
    });
  }

  private fromPostSource(id: string, source: any): PostEntity {
    const entity = new PostEntity({
      id,
      userId: source.userId ?? '',
      content: source.content ?? '',
      images: Array.isArray(source.images) ? source.images : [],
      cloudinaryPublicIds: Array.isArray(source.cloudinaryPublicIds) ? source.cloudinaryPublicIds : [],
      likes: Array.isArray(source.likes) ? source.likes : [],
      likesCount: Number(source.likesCount) || 0,
      commentsCount: Number(source.commentsCount) || 0,
      sharesCount: Number(source.sharesCount) || 0,
      visibility: source.visibility ?? 'public',
      isEdited: Boolean(source.isEdited),
      editedAt: source.editedAt ? new Date(source.editedAt) : undefined,
      originalPostId: source.originalPostId ?? undefined,
      sharedBy: source.sharedById ?? undefined,
      createdAt: source.createdAt ? new Date(source.createdAt) : new Date(),
      updatedAt: source.updatedAt ? new Date(source.updatedAt) : new Date()
    });

    if (source.userId) {
      (entity as any).user = {
        id: source.userId,
        userName: source.userName,
        email: source.userEmail,
        avatar: source.userAvatar
      };
    }

    if (source.sharedById) {
      (entity as any).sharedBy = {
        id: source.sharedById,
        userName: source.sharedByName,
        avatar: source.sharedByAvatar
      };
    }

    return entity;
  }

}
