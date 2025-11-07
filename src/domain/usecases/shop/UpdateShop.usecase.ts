import { ShopRepository } from '../../../data/repositories/ShopRepository';
import { ShopEntity } from '../../entities/Shop.entity';

export type UpdateShopDTO = Partial<{
  shopName: string;
  story: string;
  slug: string | null;
  isActive: boolean;
}>;

export class UpdateShopUseCase {
  constructor(private shopRepository: ShopRepository) {}

  private validate(input: UpdateShopDTO) {
    if (input.shopName && input.shopName.trim().length === 0) throw new Error('Tên shop không được để trống');
    if (input.shopName && input.shopName.trim().length > 150) throw new Error('Tên shop quá dài');
    if (input.slug && !/^[a-z0-9-]+$/.test(String(input.slug))) throw new Error('Slug chỉ chứa chữ thường, số và dấu gạch ngang');
  }

  async execute(id: string, data: UpdateShopDTO): Promise<ShopEntity | null> {
    this.validate(data);

    if (data.slug) {
      const slugExists = await this.shopRepository.slugExists(data.slug, id);
      if (slugExists) throw new Error('Slug đã tồn tại');
    }

    return await this.shopRepository.update(id, data as any);
  }
}
