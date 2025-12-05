import { ShareInfoEntity } from '../../../domain/entities/ShareInfo.entity';

export interface ShareInfoDTO {
  resourceId: string;
  resourceType: 'post' | 'product';
  shareUrl: string;
  qrCodeDataUrl: string;
  meta?: {
    title?: string;
    description?: string;
    thumbnail?: string;
  };
}

export class ShareInfoMapper {
  static toDTO(entity: ShareInfoEntity): ShareInfoDTO {
    return {
      resourceId: entity.resourceId,
      resourceType: entity.resourceType,
      shareUrl: entity.shareUrl,
      qrCodeDataUrl: entity.qrCodeDataUrl,
      meta: entity.meta,
    };
  }
}
