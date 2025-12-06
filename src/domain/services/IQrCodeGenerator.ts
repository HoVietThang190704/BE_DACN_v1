export interface IQrCodeGenerator {
  generateDataUrl(payload: string): Promise<string>;
}
