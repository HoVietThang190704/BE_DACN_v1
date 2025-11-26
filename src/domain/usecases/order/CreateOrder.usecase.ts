import { IOrderRepository } from '../../repositories/IOrderRepository';
import mongoose from 'mongoose';
import { ICartRepository } from '../../repositories/ICartRepository';
import { IProductRepository } from '../../repositories/IProductRepository';
import { IAddressRepository } from '../../repositories/IAddressRepository';
import { IVoucherRepository } from '../../repositories/IVoucherRepository';
import { ValidateVoucherUseCase } from '../voucher/ValidateVoucher.usecase';
import { PaymentMethod, PaymentStatus, ShippingAddress } from '../../entities/Order.entity';

interface ShippingAddressInput {
  recipientName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  province: string;
  note?: string;
  label?: string;
  isDefault?: boolean;
}

export interface CreateOrderInput {
  userId: string;
  cartItemIds?: string[];
  paymentMethod?: PaymentMethod;
  note?: string;
  voucherCode?: string;
  shippingAddressId?: string;
  shippingAddress?: ShippingAddressInput;
  saveShippingAddress?: boolean;
  productId?: string; // buy now product id
  quantity?: number; // buy now product quantity
}

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly cartRepository: ICartRepository,
    private readonly productRepository: IProductRepository,
    private readonly addressRepository: IAddressRepository,
    private readonly voucherRepository: IVoucherRepository,
    private readonly validateVoucherUseCase: ValidateVoucherUseCase
  ) {}

  private buildFullAddress(address: ShippingAddressInput | ShippingAddress): string {
    const parts = [address.address, address.ward, address.district, address.province]
      .map((part) => part?.trim())
      .filter(Boolean);
    return parts.join(', ');
  }

  private determineShippingFee(subtotal: number): number {
    if (subtotal >= 500_000) {
      return 0;
    }

    if (subtotal >= 250_000) {
      return 15_000;
    }

    return 25_000;
  }

  private determineEstimatedDelivery(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date;
  }

  async execute(input: CreateOrderInput) {
    const {
      userId,
      cartItemIds,
      paymentMethod = 'cod',
      note,
      voucherCode,
      shippingAddressId,
      shippingAddress,
      saveShippingAddress,
    } = input;

    const buyNow = !!input.productId;
    let cart = null;
    if (!buyNow) {
      cart = await this.cartRepository.findByUserId(userId);
      if (!cart || cart.items.length === 0) {
        throw new Error('Giỏ hàng của bạn đang trống');
      }
    }

    let selectedItems = [] as any[];
    if (buyNow) {
      const qty = Math.max(1, Math.floor(Number(input.quantity || 1)));
      selectedItems = [{
        id: `buynow-${input.productId}`,
        productId: input.productId,
        quantity: qty,
        price: undefined,
        thumbnail: undefined
      }];
    } else {
      // cart is validated above when !buyNow — use non-null assertion to satisfy TS
      selectedItems = cartItemIds && cartItemIds.length > 0
        ? cart!.items.filter((item) => cartItemIds.includes(item.id))
        : cart!.items;
    }

    if (selectedItems.length === 0) {
      throw new Error('Vui lòng chọn sản phẩm để đặt hàng');
    }

    const orderItems = [];
    let subtotal = 0;
    let managerId: string | null = null;

    for (const item of selectedItems) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new Error('Không tìm thấy sản phẩm trong hệ thống');
      }

      if (!product.inStock || (product.stockQuantity ?? 0) < item.quantity) {
        throw new Error(`Sản phẩm ${product.name} không đủ hàng trong kho`);
      }

      if (!product.owner?.id) {
        throw new Error('Không xác định được người bán của sản phẩm');
      }

      if (managerId && managerId !== product.owner.id) {
        throw new Error('Giỏ hàng chứa sản phẩm từ nhiều người bán. Vui lòng thanh toán riêng từng người bán.');
      }

      managerId = product.owner.id;

      const price = item.price ?? product.price;
      const itemSubtotal = price * item.quantity;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productImage: item.thumbnail ?? product.images?.[0],
        quantity: item.quantity,
        price,
        subtotal: itemSubtotal,
      });

      subtotal += itemSubtotal;
    }

    let resolvedAddress: ShippingAddress | null = null;

    if (shippingAddressId) {
      const address = await this.addressRepository.findById(shippingAddressId);
      if (!address || address.userId !== userId) {
        throw new Error('Không tìm thấy địa chỉ giao hàng');
      }

      resolvedAddress = {
        recipientName: address.recipientName,
        phone: address.phone,
        address: address.address,
        ward: address.ward,
        district: address.district,
        province: address.province,
        fullAddress: address.getFullAddress(),
      };
    } else if (shippingAddress) {
      resolvedAddress = {
        recipientName: shippingAddress.recipientName,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
        ward: shippingAddress.ward,
        district: shippingAddress.district,
        province: shippingAddress.province,
        fullAddress: this.buildFullAddress(shippingAddress),
      };

      if (saveShippingAddress) {
        await this.addressRepository.create({
          userId,
          recipientName: shippingAddress.recipientName,
          phone: shippingAddress.phone,
          address: shippingAddress.address,
          ward: shippingAddress.ward,
          district: shippingAddress.district,
          province: shippingAddress.province,
          isDefault: shippingAddress.isDefault ?? false,
          label: shippingAddress.label,
          note: shippingAddress.note,
        });
      }
    }

    if (!resolvedAddress) {
      throw new Error('Vui lòng cung cấp địa chỉ giao hàng');
    }

    const shippingFee = this.determineShippingFee(subtotal);

    if (!managerId) {
      throw new Error('Không xác định được người quản lý đơn hàng');
    }

    let discount = 0;
    let appliedVoucherId: string | undefined;

    if (voucherCode) {
      // Voucher should be validated against the full order total (subtotal + shipping fee)
      const orderTotalForVoucher = subtotal + shippingFee;
      try {
        const { voucher, discount: voucherDiscount } = await this.validateVoucherUseCase.execute({
          userId,
          code: voucherCode,
          subtotal: orderTotalForVoucher,
        });

        discount = voucherDiscount;
        appliedVoucherId = voucher.id;
      } catch (err: any) {
      }
    }

    const total = Math.max(0, subtotal + shippingFee - discount);

    const paymentStatus: PaymentStatus = paymentMethod === 'cod' ? 'pending' : 'pending';

    for (const item of orderItems) {
      if (typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0) {
        throw new Error(`Invalid product price for product ${item.productId}`);
      }
      if (typeof item.subtotal !== 'number' || !Number.isFinite(item.subtotal) || item.subtotal < 0) {
        throw new Error(`Invalid product subtotal for product ${item.productId}`);
      }
      if (!mongoose.Types.ObjectId.isValid(String(item.productId))) {
        throw new Error(`Invalid product id: ${item.productId}`);
      }
    }

    const computedSubtotal = orderItems.reduce((s, it) => s + (it.subtotal || 0), 0);
    if (computedSubtotal !== subtotal) {
      throw new Error('Order subtotal mismatch');
    }

    const order = await this.orderRepository.create({
      userId,
      managerId,
      items: orderItems,
      shippingAddress: resolvedAddress,
      subtotal,
      shippingFee,
      discount,
      total,
      status: 'pending',
      paymentMethod,
      paymentStatus,
      note,
      cancelReason: undefined,
      trackingNumber: undefined,
      estimatedDelivery: this.determineEstimatedDelivery(),
      deliveredAt: undefined,
    });

    await Promise.all(
      orderItems.map(async (item) => {
        const success = await this.productRepository.reduceStock(item.productId, item.quantity);
        if (!success) {
          throw new Error('Không thể cập nhật tồn kho cho sản phẩm');
        }
      })
    );

    if (!buyNow && selectedItems.length > 0) {
      await this.cartRepository.removeItems(userId, selectedItems.map((item) => item.id));
    }

    return order;
  }
}
