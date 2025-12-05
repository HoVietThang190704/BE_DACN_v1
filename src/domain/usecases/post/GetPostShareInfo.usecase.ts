import { IPostRepository } from '../../repositories/IPostRepository';
import { IQrCodeGenerator } from '../../services/IQrCodeGenerator';
import { ShareInfoEntity } from '../../entities/ShareInfo.entity';

interface GetPostShareInfoParams {
  postId: string;
  locale?: string;
}

export class GetPostShareInfoUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly qrCodeGenerator: IQrCodeGenerator,
    private readonly frontendBaseUrl: string
  ) {}

  async execute(params: GetPostShareInfoParams): Promise<ShareInfoEntity> {
    const { postId, locale = 'vi' } = params;

    if (!postId) {
      throw new Error('Thiếu mã bài viết cần chia sẻ');
    }

    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new Error('Không tìm thấy bài viết');
    }

    if (post.visibility !== 'public') {
      throw new Error('Bài viết chưa được đặt ở chế độ công khai nên không thể chia sẻ liên kết.');
    }

    const normalizedLocale = this.normalizeLocale(locale);
    const shareUrl = this.buildShareUrl(normalizedLocale, post.id);
    const qrCodeDataUrl = await this.qrCodeGenerator.generateDataUrl(shareUrl);

    return new ShareInfoEntity({
      resourceId: post.id,
      resourceType: 'post',
      shareUrl,
      qrCodeDataUrl,
      meta: {
        title: post.content?.slice(0, 60) || undefined,
        description: post.content?.slice(0, 140) || undefined,
        thumbnail: Array.isArray(post.images) && post.images.length > 0 ? post.images[0] : undefined,
      },
    });
  }

  private normalizeLocale(locale?: string): string {
    if (!locale) return 'vi';
    const pattern = /^[a-z]{2}(-[A-Z]{2})?$/;
    return pattern.test(locale) ? locale.toLowerCase() : 'vi';
  }

  private buildShareUrl(locale: string, postId: string): string {
    const base = this.frontendBaseUrl.replace(/\/$/, '');
    return `${base}/${locale}/main/community/${postId}`;
  }
}
