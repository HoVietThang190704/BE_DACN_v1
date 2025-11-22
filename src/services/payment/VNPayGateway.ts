import crypto from 'crypto';
import qs from 'qs';
import { config } from '../../config';
import { IVNPayGateway, VNPayPaymentUrlResponse } from '../../domain/services/IVNPayGateway';

export interface CreateVNPayPaymentUrlInput {
  amount: number;
  transactionRef: string;
  orderInfo: string;
  clientIp?: string;
  returnUrl?: string;
  locale?: 'vn' | 'en';
  bankCode?: string;
}

export class VNPayGateway implements IVNPayGateway {
  private readonly tmnCode = config.VNPAY_TMNCODE;
  private readonly secret = config.VNPAY_HASH_SECRET;
  private readonly paymentUrl = config.VNPAY_PAYMENT_URL;
  private readonly defaultReturnUrl = config.VNPAY_RETURN_URL;

  private buildDateString(): string {
    const date = new Date();
    const yyyy = date.getFullYear().toString();
    const MM = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const HH = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    const ss = date.getSeconds().toString().padStart(2, '0');
    return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
  }

  private encodeValue(value: string): string {
    return encodeURIComponent(value).replace(/%20/g, '+');
  }

  private buildSignData(params: Record<string, string>): { encodedParams: Record<string, string>; signData: string } {
    const encodedParams: Record<string, string> = {};
    const sortedKeys = Object.keys(params).sort();
    const signData = sortedKeys
      .map((key) => {
        const encodedValue = this.encodeValue(params[key]);
        encodedParams[key] = encodedValue;
        return `${key}=${encodedValue}`;
      })
      .join('&');

    return { encodedParams, signData };
  }

  private createSecureHash(signData: string): string {
    return crypto.createHmac('sha512', this.secret).update(signData, 'utf-8').digest('hex').toUpperCase();
  }

  createPaymentUrl(input: CreateVNPayPaymentUrlInput): VNPayPaymentUrlResponse {
    if (!this.tmnCode || !this.secret || !this.paymentUrl) {
      throw new Error('Chưa cấu hình VNPay. Vui lòng kiểm tra TMNCode, Hash secret và URL.');
    }

    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Amount: Math.round(input.amount * 100).toString(),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: input.transactionRef,
      vnp_OrderInfo: input.orderInfo,
      vnp_OrderType: 'other',
      vnp_Locale: input.locale ?? 'vn',
      vnp_ReturnUrl: input.returnUrl || this.defaultReturnUrl,
      vnp_IpAddr: input.clientIp || '127.0.0.1',
      vnp_CreateDate: this.buildDateString()
    };

    if (input.bankCode) {
      params.vnp_BankCode = input.bankCode;
    }

    const { encodedParams, signData } = this.buildSignData(params);
    const secureHash = this.createSecureHash(signData);
    const paymentUrl = `${this.paymentUrl}?${qs.stringify(encodedParams, { encode: false })}&vnp_SecureHash=${secureHash}`;

    return {
      paymentUrl,
      params
    };
  }

  verifySignature(rawParams: Record<string, string | string[]>, secureHash?: string): boolean {
    if (!secureHash) {
      return false;
    }

    const params: Record<string, string> = {};
    Object.keys(rawParams).forEach((key) => {
      if (key === 'vnp_SecureHash' || key === 'vnp_SecureHashType') {
        return;
      }
      const value = rawParams[key];
      params[key] = Array.isArray(value) ? value[0] : value;
    });

    const { signData } = this.buildSignData(params);
    const calculated = this.createSecureHash(signData);
    return calculated === secureHash.toUpperCase();
  }
}
