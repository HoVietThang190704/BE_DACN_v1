import { toDataURL } from 'qrcode';
import { IQrCodeGenerator } from '../../domain/services/IQrCodeGenerator';
import { logger } from '../../shared/utils/logger';

export class QrCodeService implements IQrCodeGenerator {
  async generateDataUrl(payload: string): Promise<string> {
    try {
      if (!payload) {
        throw new Error('QR payload is required');
      }
      return await toDataURL(payload, {
        errorCorrectionLevel: 'H',
        margin: 1,
        scale: 6,
        color: {
          dark: '#1c1917',
          light: '#ffffff',
        },
      });
    } catch (error) {
      logger.error('QrCodeService.generateDataUrl error:', error);
      throw new Error('Không thể tạo mã QR');
    }
  }
}
