export interface VNPayPaymentUrlResponse {
  paymentUrl: string;
  params: Record<string, string>;
}

export interface IVNPayGateway {
  createPaymentUrl(input: {
    amount: number;
    transactionRef: string;
    orderInfo: string;
    clientIp?: string;
    returnUrl?: string;
    locale?: 'vn' | 'en';
    bankCode?: string;
  }): VNPayPaymentUrlResponse;

  verifySignature(params: Record<string, string | string[]>, secureHash?: string): boolean;
}
