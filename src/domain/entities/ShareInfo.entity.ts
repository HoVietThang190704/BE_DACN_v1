export type ShareResourceType = 'post' | 'product';

export interface ShareMetaData {
  title?: string;
  description?: string;
  thumbnail?: string;
}

export interface ShareInfoProps {
  resourceId: string;
  resourceType: ShareResourceType;
  shareUrl: string;
  qrCodeDataUrl: string;
  meta?: ShareMetaData;
}

export class ShareInfoEntity {
  resourceId: string;
  resourceType: ShareResourceType;
  shareUrl: string;
  qrCodeDataUrl: string;
  meta?: ShareMetaData;

  constructor(props: ShareInfoProps) {
    this.resourceId = props.resourceId;
    this.resourceType = props.resourceType;
    this.shareUrl = props.shareUrl;
    this.qrCodeDataUrl = props.qrCodeDataUrl;
    this.meta = props.meta;
  }
}
