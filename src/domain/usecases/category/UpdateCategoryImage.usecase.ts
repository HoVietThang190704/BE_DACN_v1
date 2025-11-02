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

    // Upload new image
    const { url, publicId } = await uploadToCloudinary(file, 'categories');

    // Delete old image from Cloudinary if we have stored public id
    try {
      if ((category as any).imagePublicId) {
        await deleteFromCloudinary((category as any).imagePublicId);
      }
    } catch (err) {
      // Log and continue; don't block update if deletion fails
    }

    // Persist new image and publicId
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
