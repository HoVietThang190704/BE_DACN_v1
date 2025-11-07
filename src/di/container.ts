/**
 * Dependency Injection Container
 * Centralizes dependency creation and injection
 */

// ==================== REPOSITORIES ====================
import { UserRepository } from '../data/repositories/UserRepository';
import { ProductRepository } from '../data/repositories/ProductRepository';
import { CategoryRepository } from '../data/repositories/CategoryRepository';
import { ShopRepository } from '../data/repositories/ShopRepository';
import { AddressRepository } from '../data/repositories/AddressRepository';
import { OrderRepository } from '../data/repositories/OrderRepository';
import { CartRepository } from '../data/repositories/CartRepository';
import { WishlistRepository } from '../data/repositories/WishlistRepository';
import { TicketRepository } from '../data/repositories/TicketRepository';
import { TicketCommentRepository } from '../data/repositories/TicketCommentRepository';

// ==================== USE CASES ====================
// User Use Cases
import { GetUserProfileUseCase } from '../domain/usecases/user/GetUserProfile.usecase';
import { UpdateUserProfileUseCase } from '../domain/usecases/user/UpdateUserProfile.usecase';
import { ResetPasswordUseCase } from '../domain/usecases/user/ResetPassword.usecase';
import { ChangePasswordUseCase } from '../domain/usecases/user/ChangePassword.usecase';
import { UpdateUserAvatarUseCase } from '../domain/usecases/user/UpdateUserAvatar.usecase';

// Product Use Cases
import { GetProductsUseCase } from '../domain/usecases/product/GetProducts.usecase';
import { GetProductByIdUseCase } from '../domain/usecases/product/GetProductById.usecase';
import { GetProductTraceabilityUseCase } from '../domain/usecases/product/GetProductTraceability.usecase';
import { GetCategoriesUseCase } from '../domain/usecases/product/GetCategories.usecase';
import { CreateProductUseCase } from '../domain/usecases/product/CreateProduct.usecase';
import { UpdateProductUseCase } from '../domain/usecases/product/UpdateProduct.usecase';
import { DeleteProductUseCase } from '../domain/usecases/product/DeleteProduct.usecase';
import { UploadProductImagesUseCase } from '../domain/usecases/product/UploadProductImages.usecase';

// Category Use Cases
import { GetCategoriesTreeUseCase } from '../domain/usecases/category/GetCategoriesTree.usecase';
import { GetCategoryByIdUseCase } from '../domain/usecases/category/GetCategoryById.usecase';
import { GetCategoryBreadcrumbUseCase } from '../domain/usecases/category/GetCategoryBreadcrumb.usecase';
import { CreateCategoryUseCase } from '../domain/usecases/category/CreateCategory.usecase';
import { UpdateCategoryUseCase } from '../domain/usecases/category/UpdateCategory.usecase';
import { DeleteCategoryUseCase } from '../domain/usecases/category/DeleteCategory.usecase';
// Shop Use Cases
import { CreateShopUseCase } from '../domain/usecases/shop/CreateShop.usecase';
import { UpdateShopUseCase } from '../domain/usecases/shop/UpdateShop.usecase';
import { DeleteShopUseCase } from '../domain/usecases/shop/DeleteShop.usecase';
import { GetShopByIdUseCase } from '../domain/usecases/shop/GetShopById.usecase';
import { FindPendingShopsUseCase } from '../domain/usecases/shop/FindPendingShops.usecase';
import { ApproveShopUseCase } from '../domain/usecases/shop/ApproveShop.usecase';
import { RejectShopUseCase } from '../domain/usecases/shop/RejectShop.usecase';

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
// Cart Use Cases
import { GetCartUseCase } from '../domain/usecases/cart/GetCart.usecase';
import { AddCartItemUseCase } from '../domain/usecases/cart/AddCartItem.usecase';
import { UpdateCartItemUseCase } from '../domain/usecases/cart/UpdateCartItem.usecase';
import { RemoveCartItemUseCase } from '../domain/usecases/cart/RemoveCartItem.usecase';
import { ClearCartUseCase } from '../domain/usecases/cart/ClearCart.usecase';

// Wishlist Use Cases
import { GetWishlistUseCase } from '../domain/usecases/wishlist/GetWishlist.usecase';
import { AddWishlistItemUseCase } from '../domain/usecases/wishlist/AddWishlistItem.usecase';
import { RemoveWishlistItemUseCase } from '../domain/usecases/wishlist/RemoveWishlistItem.usecase';
import { ToggleWishlistItemUseCase } from '../domain/usecases/wishlist/ToggleWishlistItem.usecase';

// Ticket Use Cases
import { CreateTicketUseCase } from '../domain/usecases/ticket/CreateTicket.usecase';
import { GetTicketsUseCase } from '../domain/usecases/ticket/GetTickets.usecase';
import { GetTicketByIdUseCase } from '../domain/usecases/ticket/GetTicketById.usecase';
import { AssignTicketUseCase } from '../domain/usecases/ticket/AssignTicket.usecase';
import { UpdateTicketStatusUseCase } from '../domain/usecases/ticket/UpdateTicketStatus.usecase';

// ==================== CONTROLLERS ====================
import { UserController } from '../presentation/controllers/UserController';
import { ProductController } from '../presentation/controllers/ProductController';
import { CategoryController } from '../presentation/controllers/CategoryController';
import { ShopController } from '../presentation/controllers/ShopController';
import { AddressController } from '../presentation/controllers/AddressController';
import { OrderController } from '../presentation/controllers/OrderController';
import { CartController } from '../presentation/controllers/CartController';
import { WishlistController } from '../presentation/controllers/WishlistController';
import { TicketController } from '../presentation/controllers/TicketController';

// ==================== REPOSITORY INSTANCES ====================
const userRepository = new UserRepository();
const productRepository = new ProductRepository();
const categoryRepository = new CategoryRepository();
const shopRepository = new ShopRepository();
const addressRepository = new AddressRepository();
const orderRepository = new OrderRepository();
const cartRepository = new CartRepository();
const wishlistRepository = new WishlistRepository();
const ticketRepository = new TicketRepository();
const ticketCommentRepository = new TicketCommentRepository();

// ==================== USE CASE INSTANCES ====================
// User Use Cases
const getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
const updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository);
const resetPasswordUseCase = new ResetPasswordUseCase(userRepository);
const changePasswordUseCase = new ChangePasswordUseCase(userRepository);
const updateUserAvatarUseCase = new UpdateUserAvatarUseCase(userRepository);

// Product Use Cases
const getProductsUseCase = new GetProductsUseCase(productRepository);
const getProductByIdUseCase = new GetProductByIdUseCase(productRepository);
const getProductTraceabilityUseCase = new GetProductTraceabilityUseCase(productRepository);
const getCategoriesUseCase = new GetCategoriesUseCase(productRepository);
const createProductUseCase = new CreateProductUseCase(productRepository, categoryRepository);
const updateProductUseCase = new UpdateProductUseCase(productRepository);
const deleteProductUseCase = new DeleteProductUseCase(productRepository);
const uploadProductImagesUseCase = new UploadProductImagesUseCase(productRepository);

// Category Use Cases
const getCategoriesTreeUseCase = new GetCategoriesTreeUseCase(categoryRepository);
const getCategoryByIdUseCase = new GetCategoryByIdUseCase(categoryRepository);
const getCategoryBreadcrumbUseCase = new GetCategoryBreadcrumbUseCase(categoryRepository);
const createCategoryUseCase = new CreateCategoryUseCase(categoryRepository);
const updateCategoryUseCase = new UpdateCategoryUseCase(categoryRepository);
const deleteCategoryUseCase = new DeleteCategoryUseCase(categoryRepository, productRepository);
// const updateCategoryImageUseCase = new UpdateCategoryImageUseCase(categoryRepository);

// Shop use case instances
const createShopUseCase = new CreateShopUseCase(shopRepository, userRepository);
const updateShopUseCase = new UpdateShopUseCase(shopRepository);
const deleteShopUseCase = new DeleteShopUseCase(shopRepository);
const getShopByIdUseCase = new GetShopByIdUseCase(shopRepository);
const findPendingShopsUseCase = new FindPendingShopsUseCase(shopRepository);
const approveShopUseCase = new ApproveShopUseCase(shopRepository, userRepository);
const rejectShopUseCase = new RejectShopUseCase(shopRepository);

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

// Cart use case instances
const getCartUseCase = new GetCartUseCase(cartRepository);
const addCartItemUseCase = new AddCartItemUseCase(cartRepository);
const updateCartItemUseCase = new UpdateCartItemUseCase(cartRepository);
const removeCartItemUseCase = new RemoveCartItemUseCase(cartRepository);
const clearCartUseCase = new ClearCartUseCase(cartRepository);

// Wishlist use case instances
const getWishlistUseCase = new GetWishlistUseCase(wishlistRepository);
const addWishlistItemUseCase = new AddWishlistItemUseCase(wishlistRepository);
const removeWishlistItemUseCase = new RemoveWishlistItemUseCase(wishlistRepository);
const toggleWishlistItemUseCase = new ToggleWishlistItemUseCase(wishlistRepository);

// Ticket use-cases
const createTicketUseCase = new CreateTicketUseCase(ticketRepository);
const getTicketsUseCase = new GetTicketsUseCase(ticketRepository);
const getTicketByIdUseCase = new GetTicketByIdUseCase(ticketRepository);
const assignTicketUseCase = new AssignTicketUseCase(ticketRepository);
const updateTicketStatusUseCase = new UpdateTicketStatusUseCase(ticketRepository);

// ==================== CONTROLLER INSTANCES ====================
export const userController = new UserController(
  getUserProfileUseCase,
  updateUserProfileUseCase,
  resetPasswordUseCase,
  changePasswordUseCase,
  updateUserAvatarUseCase
);

export const productController = new ProductController(
  getProductsUseCase,
  getProductByIdUseCase,
  getProductTraceabilityUseCase,
  getCategoriesUseCase,
  createProductUseCase,
  updateProductUseCase,
  deleteProductUseCase,
  uploadProductImagesUseCase
);

export const categoryController = new CategoryController(
  getCategoriesTreeUseCase,
  getCategoryByIdUseCase,
  getCategoryBreadcrumbUseCase,
  createCategoryUseCase,
  updateCategoryUseCase,
  deleteCategoryUseCase
  
);

export const shopController = new ShopController(
  createShopUseCase,
  updateShopUseCase,
  deleteShopUseCase,
  getShopByIdUseCase
  ,findPendingShopsUseCase
  ,approveShopUseCase
  ,rejectShopUseCase
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

export const cartController = new CartController(
  getCartUseCase,
  addCartItemUseCase,
  updateCartItemUseCase,
  removeCartItemUseCase,
  clearCartUseCase
);

export const wishlistController = new WishlistController(
  getWishlistUseCase,
  addWishlistItemUseCase,
  removeWishlistItemUseCase,
  toggleWishlistItemUseCase
);

export const ticketController = new TicketController(
  createTicketUseCase,
  getTicketsUseCase,
  getTicketByIdUseCase,
  ticketCommentRepository,
  ticketRepository,
  assignTicketUseCase,
  updateTicketStatusUseCase
);

// ==================== EXPORTS FOR REUSE ====================
export const repositories = {
  userRepository,
  productRepository,
  categoryRepository,
  shopRepository,
  addressRepository,
  orderRepository
  ,cartRepository
  ,wishlistRepository
  ,ticketRepository
};

export const useCases = {
  // User
  getUserProfileUseCase,
  updateUserProfileUseCase,
  resetPasswordUseCase,
  changePasswordUseCase,
  updateUserAvatarUseCase,
  // Product
  getProductsUseCase,
  getProductByIdUseCase,
  getProductTraceabilityUseCase,
  getCategoriesUseCase,
  createProductUseCase,
  updateProductUseCase,
  deleteProductUseCase,
  uploadProductImagesUseCase,
  // Category
  getCategoriesTreeUseCase,
  getCategoryByIdUseCase,
  getCategoryBreadcrumbUseCase,
  createCategoryUseCase,
  updateCategoryUseCase,
  deleteCategoryUseCase,
  
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
  ,
  // Cart
  getCartUseCase,
  addCartItemUseCase,
  updateCartItemUseCase,
  removeCartItemUseCase,
  clearCartUseCase
  ,
  // Wishlist
  getWishlistUseCase,
  addWishlistItemUseCase,
  removeWishlistItemUseCase,
  toggleWishlistItemUseCase
};

// expose ticket use-cases
export const ticketUseCases = {
  createTicketUseCase,
  getTicketsUseCase,
  getTicketByIdUseCase,
  assignTicketUseCase,
  updateTicketStatusUseCase
};
