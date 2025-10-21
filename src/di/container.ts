/**
 * Dependency Injection Container
 * Centralizes dependency creation and injection
 */

// ==================== REPOSITORIES ====================
import { UserRepository } from '../data/repositories/UserRepository';
import { ProductRepository } from '../data/repositories/ProductRepository';
import { CategoryRepository } from '../data/repositories/CategoryRepository';

// ==================== USE CASES ====================
// User Use Cases
import { GetUserProfileUseCase } from '../domain/usecases/user/GetUserProfile.usecase';
import { UpdateUserProfileUseCase } from '../domain/usecases/user/UpdateUserProfile.usecase';
import { ResetPasswordUseCase } from '../domain/usecases/user/ResetPassword.usecase';
import { ChangePasswordUseCase } from '../domain/usecases/user/ChangePassword.usecase';

// Product Use Cases
import { GetProductsUseCase } from '../domain/usecases/product/GetProducts.usecase';
import { GetProductByIdUseCase } from '../domain/usecases/product/GetProductById.usecase';
import { GetProductTraceabilityUseCase } from '../domain/usecases/product/GetProductTraceability.usecase';
import { GetCategoriesUseCase } from '../domain/usecases/product/GetCategories.usecase';

// Category Use Cases
import { GetCategoriesTreeUseCase } from '../domain/usecases/category/GetCategoriesTree.usecase';
import { GetCategoryByIdUseCase } from '../domain/usecases/category/GetCategoryById.usecase';
import { GetCategoryBreadcrumbUseCase } from '../domain/usecases/category/GetCategoryBreadcrumb.usecase';

// ==================== CONTROLLERS ====================
import { UserController } from '../presentation/controllers/UserController';
import { ProductController } from '../presentation/controllers/ProductController';
import { CategoryController } from '../presentation/controllers/CategoryController';

// ==================== REPOSITORY INSTANCES ====================
const userRepository = new UserRepository();
const productRepository = new ProductRepository();
const categoryRepository = new CategoryRepository();

// ==================== USE CASE INSTANCES ====================
// User Use Cases
const getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
const updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository);
const resetPasswordUseCase = new ResetPasswordUseCase(userRepository);
const changePasswordUseCase = new ChangePasswordUseCase(userRepository);

// Product Use Cases
const getProductsUseCase = new GetProductsUseCase(productRepository);
const getProductByIdUseCase = new GetProductByIdUseCase(productRepository);
const getProductTraceabilityUseCase = new GetProductTraceabilityUseCase(productRepository);
const getCategoriesUseCase = new GetCategoriesUseCase(productRepository);

// Category Use Cases
const getCategoriesTreeUseCase = new GetCategoriesTreeUseCase(categoryRepository);
const getCategoryByIdUseCase = new GetCategoryByIdUseCase(categoryRepository);
const getCategoryBreadcrumbUseCase = new GetCategoryBreadcrumbUseCase(categoryRepository);

// ==================== CONTROLLER INSTANCES ====================
export const userController = new UserController(
  getUserProfileUseCase,
  updateUserProfileUseCase,
  resetPasswordUseCase,
  changePasswordUseCase
);

export const productController = new ProductController(
  getProductsUseCase,
  getProductByIdUseCase,
  getProductTraceabilityUseCase,
  getCategoriesUseCase
);

export const categoryController = new CategoryController(
  getCategoriesTreeUseCase,
  getCategoryByIdUseCase,
  getCategoryBreadcrumbUseCase
);

// ==================== EXPORTS FOR REUSE ====================
export const repositories = {
  userRepository,
  productRepository,
  categoryRepository
};

export const useCases = {
  // User
  getUserProfileUseCase,
  updateUserProfileUseCase,
  resetPasswordUseCase,
  changePasswordUseCase,
  // Product
  getProductsUseCase,
  getProductByIdUseCase,
  getProductTraceabilityUseCase,
  getCategoriesUseCase,
  // Category
  getCategoriesTreeUseCase,
  getCategoryByIdUseCase,
  getCategoryBreadcrumbUseCase
};
