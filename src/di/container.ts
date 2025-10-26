/**
 * Dependency Injection Container
 * Centralizes dependency creation and injection
 */

// ==================== REPOSITORIES ====================
import { UserRepository } from '../data/repositories/UserRepository';
import { ProductRepository } from '../data/repositories/ProductRepository';
import { CategoryRepository } from '../data/repositories/CategoryRepository';
import { AddressRepository } from '../data/repositories/AddressRepository';
import { OrderRepository } from '../data/repositories/OrderRepository';

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

// Address Use Cases
import { GetUserAddressesUseCase } from '../domain/usecases/address/GetUserAddresses.usecase';
import { CreateAddressUseCase } from '../domain/usecases/address/CreateAddress.usecase';
import { UpdateAddressUseCase } from '../domain/usecases/address/UpdateAddress.usecase';
import { DeleteAddressUseCase } from '../domain/usecases/address/DeleteAddress.usecase';
import { SetDefaultAddressUseCase } from '../domain/usecases/address/SetDefaultAddress.usecase';

// Order Use Cases
import { GetUserOrdersUseCase } from '../domain/usecases/order/GetUserOrders.usecase';
import { GetOrderByIdUseCase } from '../domain/usecases/order/GetOrderById.usecase';
import { CancelOrderUseCase } from '../domain/usecases/order/CancelOrder.usecase';
import { GetOrderStatisticsUseCase } from '../domain/usecases/order/GetOrderStatistics.usecase';

// ==================== CONTROLLERS ====================
import { UserController } from '../presentation/controllers/UserController';
import { ProductController } from '../presentation/controllers/ProductController';
import { CategoryController } from '../presentation/controllers/CategoryController';
import { AddressController } from '../presentation/controllers/AddressController';
import { OrderController } from '../presentation/controllers/OrderController';

// ==================== REPOSITORY INSTANCES ====================
const userRepository = new UserRepository();
const productRepository = new ProductRepository();
const categoryRepository = new CategoryRepository();
const addressRepository = new AddressRepository();
const orderRepository = new OrderRepository();

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

// Address Use Cases
const getUserAddressesUseCase = new GetUserAddressesUseCase(addressRepository);
const createAddressUseCase = new CreateAddressUseCase(addressRepository);
const updateAddressUseCase = new UpdateAddressUseCase(addressRepository);
const deleteAddressUseCase = new DeleteAddressUseCase(addressRepository);
const setDefaultAddressUseCase = new SetDefaultAddressUseCase(addressRepository);

// Order Use Cases
const getUserOrdersUseCase = new GetUserOrdersUseCase(orderRepository);
const getOrderByIdUseCase = new GetOrderByIdUseCase(orderRepository);
const cancelOrderUseCase = new CancelOrderUseCase(orderRepository);
const getOrderStatisticsUseCase = new GetOrderStatisticsUseCase(orderRepository);

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

export const addressController = new AddressController(
  getUserAddressesUseCase,
  createAddressUseCase,
  updateAddressUseCase,
  deleteAddressUseCase,
  setDefaultAddressUseCase
);

export const orderController = new OrderController(
  getUserOrdersUseCase,
  getOrderByIdUseCase,
  cancelOrderUseCase,
  getOrderStatisticsUseCase
);

// ==================== EXPORTS FOR REUSE ====================
export const repositories = {
  userRepository,
  productRepository,
  categoryRepository,
  addressRepository,
  orderRepository
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
  getCategoryBreadcrumbUseCase,
  // Address
  getUserAddressesUseCase,
  createAddressUseCase,
  updateAddressUseCase,
  deleteAddressUseCase,
  setDefaultAddressUseCase,
  // Order
  getUserOrdersUseCase,
  getOrderByIdUseCase,
  cancelOrderUseCase,
  getOrderStatisticsUseCase
};
