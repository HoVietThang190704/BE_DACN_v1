/**
 * Address Entity - Domain model for delivery addresses
 */

export interface IAddressEntity {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
  label?: string; // 'home', 'work', 'other'
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AddressEntity implements IAddressEntity {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
  label?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: IAddressEntity) {
    this.id = data.id;
    this.userId = data.userId;
    this.recipientName = data.recipientName;
    this.phone = data.phone;
    this.address = data.address;
    this.ward = data.ward;
    this.district = data.district;
    this.province = data.province;
    this.isDefault = data.isDefault;
    this.label = data.label;
    this.note = data.note;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Get full address string
   */
  getFullAddress(): string {
    return `${this.address}, ${this.ward}, ${this.district}, ${this.province}`;
  }

  /**
   * Validate phone number (Vietnamese format)
   */
  isValidPhone(): boolean {
    const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8}$/;
    return phoneRegex.test(this.phone);
  }

  /**
   * Validate address data
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.recipientName || this.recipientName.trim().length === 0) {
      errors.push('Tên người nhận không được để trống');
    }

    if (!this.phone || !this.isValidPhone()) {
      errors.push('Số điện thoại không hợp lệ');
    }

    if (!this.address || this.address.trim().length === 0) {
      errors.push('Địa chỉ không được để trống');
    }

    if (!this.ward || this.ward.trim().length === 0) {
      errors.push('Phường/Xã không được để trống');
    }

    if (!this.district || this.district.trim().length === 0) {
      errors.push('Quận/Huyện không được để trống');
    }

    if (!this.province || this.province.trim().length === 0) {
      errors.push('Tỉnh/Thành phố không được để trống');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if address is in campus area (for discount)
   */
  isInCampusArea(): boolean {
    const campusKeywords = ['đại học', 'campus', 'ký túc xá', 'ktx'];
    const fullAddress = this.getFullAddress().toLowerCase();
    return campusKeywords.some(keyword => fullAddress.includes(keyword));
  }

  /**
   * Convert to JSON
   */
  toJSON(): IAddressEntity {
    return {
      id: this.id,
      userId: this.userId,
      recipientName: this.recipientName,
      phone: this.phone,
      address: this.address,
      ward: this.ward,
      district: this.district,
      province: this.province,
      isDefault: this.isDefault,
      label: this.label,
      note: this.note,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
