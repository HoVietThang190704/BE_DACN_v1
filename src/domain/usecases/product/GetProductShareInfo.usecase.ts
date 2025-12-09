import { IProductRepository } from '../../repositories/IProductRepository';
import { IQrCodeGenerator } from '../../services/IQrCodeGenerator';
import { ShareInfoEntity } from '../../entities/ShareInfo.entity';

interface GetProductShareInfoParams {
  productId: string;
  locale?: string;
}

export class GetProductShareInfoUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly qrCodeGenerator: IQrCodeGenerator,
    private readonly frontendBaseUrl: string
  ) {}

  async execute(params: GetProductShareInfoParams): Promise<ShareInfoEntity> {
    const { productId, locale = 'vi' } = params;

    if (!productId) {
      throw new Error('Thiếu mã sản phẩm cần chia sẻ');
    }

    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    const normalizedLocale = this.normalizeLocale(locale);
    const shareUrl = this.buildShareUrl(normalizedLocale, product.id);
    const qrCodeDataUrl = await this.qrCodeGenerator.generateDataUrl(shareUrl);

    return new ShareInfoEntity({
      resourceId: product.id,
      resourceType: 'product',
      shareUrl,
      qrCodeDataUrl,
      meta: {
        title: product.name,
        description: product.description?.slice(0, 140),
        thumbnail: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : undefined,
      },
    });
  }

  private normalizeLocale(locale?: string): string {
    if (!locale) return 'vi';
    const pattern = /^[a-z]{2}(-[A-Z]{2})?$/;
    return pattern.test(locale) ? locale.toLowerCase() : 'vi';
  }

  private buildShareUrl(locale: string, productId: string): string {
    const base = this.frontendBaseUrl.replace(/\/$/, '');
    return `${base}/${locale}/main/products/${productId}`;
  }
}
