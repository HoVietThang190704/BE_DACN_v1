import { ICategoryRepository } from '../../repositories/ICategoryRepository';
import { uploadToCloudinary, deleteFromCloudinary } from '../../../shared/utils/cloudinary';
import { CategoryEntity } from '../../entities/Category.entity';

export class UpdateCategoryImageUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(categoryId: string, file: Express.Multer.File): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new Error('Không tìm thấy danh mục');
    }

    const { url, publicId } = await uploadToCloudinary(file, 'categories');

    try {
      if ((category as any).imagePublicId) {
        await deleteFromCloudinary((category as any).imagePublicId);
      }
    } catch (err) {
    }

    const updated = await this.categoryRepository.update(categoryId, {
      image: url,
      imagePublicId: publicId
    } as any);

    if (!updated) {
      throw new Error('Không thể cập nhật ảnh danh mục');
    }

    return updated;
  }
}
