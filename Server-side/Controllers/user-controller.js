const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Product = require("../Models/Product");
const User = require("../Models/User");

const normalizeCartItem = (item) => {
  const product = item.product;
  const variant = product?.variants?.id(item.variant);

  if (!product || !variant) {
    return null;
  }

  const priceBeforeDiscount = product.basePrice + (variant.priceAdjustment || 0);
  const price = Math.round(
    priceBeforeDiscount * (1 - (product.discountPercent || 0) / 100)
  );

  return {
    id: item._id,
    quantity: item.quantity,
    addedAt: item.addedAt,
    product: {
      id: product._id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      category: product.category,
      discountPercent: product.discountPercent,
      basePrice: product.basePrice,
      image: product.images?.[0]?.url || null,
    },
    variant: {
      id: variant._id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
      priceAdjustment: variant.priceAdjustment,
    },
    unitPrice: price,
    subTotal: price * item.quantity,
  };
};

const normalizeWishlistItem = (product) => ({
  id: product._id,
  name: product.name,
  slug: product.slug,
  brand: product.brand,
  category: product.category,
  discountPercent: product.discountPercent,
  basePrice: product.basePrice,
  image: product.images?.[0]?.url || null,
});

const getCart = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.userInfo.id)
    .populate({
      path: "cart.product",
      populate: {
        path: "images",
        match: { isDeleted: false },
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  if (!user) {
    return next(new AppError("Authenticated user not found", 404));
  }

  const cart = user.cart
    .map(normalizeCartItem)
    .filter((item) => item !== null);

  const totalPrice = cart.reduce((sum, item) => sum + item.subTotal, 0);
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  res.status(200).json({
    success: true,
    message: "Cart loaded successfully",
    data: {
      cart,
      totalPrice,
      totalQuantity,
    },
  });
});

const getWishlist = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.userInfo.id)
    .populate({
      path: "wishlist",
      populate: {
        path: "images",
        match: { isDeleted: false },
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  if (!user) {
    return next(new AppError("Authenticated user not found", 404));
  }

  const wishlist = (user.wishlist || []).map(normalizeWishlistItem);

  res.status(200).json({
    success: true,
    message: "Wishlist loaded successfully",
    data: {
      wishlist,
    },
  });
});

const addToCart = catchAsync(async (req, res, next) => {
  const { productId, variantId, quantity = 1 } = req.body;

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  if (quantity <= 0) {
    return next(new AppError("Quantity must be at least 1", 400));
  }

  const product = await Product.findById(productId);

  if (!product || !product.isActive) {
    return next(new AppError("Product not found or no longer available", 404));
  }

  const selectedVariant = variantId
    ? product.variants.id(variantId)
    : product.variants[0];

  if (!selectedVariant) {
    return next(new AppError("Selected product variant not found", 400));
  }

  const user = await User.findById(req.userInfo.id);

  if (!user) {
    return next(new AppError("Authenticated user not found", 404));
  }

  const existingItem = user.cart.find(
    (item) =>
      item.product.toString() === productId.toString() &&
      item.variant.toString() === selectedVariant._id.toString()
  );

  const requestedQuantity = existingItem
    ? existingItem.quantity + quantity
    : quantity;

  if (requestedQuantity > selectedVariant.stock) {
    return next(
      new AppError(
        `Only ${selectedVariant.stock} units are available for this variant`,
        400
      )
    );
  }

  if (existingItem) {
    existingItem.quantity = requestedQuantity;
  } else {
    user.cart.push({
      product: product._id,
      variant: selectedVariant._id,
      quantity,
    });
  }

  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(req.userInfo.id)
    .populate({
      path: "cart.product",
      populate: {
        path: "images",
        match: { isDeleted: false },
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  const cart = updatedUser.cart
    .map(normalizeCartItem)
    .filter((item) => item !== null);

  res.status(200).json({
    success: true,
    message: "Product added to cart",
    data: { cart },
  });
});

const updateCartItem = catchAsync(async (req, res, next) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (!itemId) {
    return next(new AppError("Cart item ID is required", 400));
  }

  if (quantity == null || isNaN(quantity)) {
    return next(new AppError("Quantity must be provided", 400));
  }

  const user = await User.findById(req.userInfo.id);
  if (!user) {
    return next(new AppError("Authenticated user not found", 404));
  }

  const cartItem = user.cart.id(itemId);
  if (!cartItem) {
    return next(new AppError("Cart item not found", 404));
  }

  const product = await Product.findById(cartItem.product);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  const variant = product.variants.id(cartItem.variant);
  if (!variant) {
    return next(new AppError("Product variant not found", 400));
  }

  if (quantity <= 0) {
    cartItem.remove();
  } else {
    if (quantity > variant.stock) {
      return next(
        new AppError(
          `Only ${variant.stock} units are available for this variant`,
          400
        )
      );
    }
    cartItem.quantity = quantity;
  }

  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(req.userInfo.id)
    .populate({
      path: "cart.product",
      populate: {
        path: "images",
        match: { isDeleted: false },
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  const cart = updatedUser.cart
    .map(normalizeCartItem)
    .filter((item) => item !== null);

  res.status(200).json({
    success: true,
    message: "Cart updated successfully",
    data: { cart },
  });
});

const removeCartItem = catchAsync(async (req, res, next) => {
  const { itemId } = req.params;

  if (!itemId) {
    return next(new AppError("Cart item ID is required", 400));
  }

  const user = await User.findById(req.userInfo.id);
  if (!user) {
    return next(new AppError("Authenticated user not found", 404));
  }

  const cartItem = user.cart.id(itemId);
  if (!cartItem) {
    return next(new AppError("Cart item not found", 404));
  }

  cartItem.remove();
  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(req.userInfo.id)
    .populate({
      path: "cart.product",
      populate: {
        path: "images",
        match: { isDeleted: false },
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  const cart = updatedUser.cart
    .map(normalizeCartItem)
    .filter((item) => item !== null);

  res.status(200).json({
    success: true,
    message: "Item removed from cart",
    data: { cart },
  });
});

const addToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return next(new AppError("Product not found or no longer available", 404));
  }

  const user = await User.findById(req.userInfo.id);
  if (!user) {
    return next(new AppError("Authenticated user not found", 404));
  }

  if (user.wishlist.some((entry) => entry.toString() === productId.toString())) {
    return res.status(200).json({
      success: true,
      message: "Product already in wishlist",
    });
  }

  user.wishlist.push(product._id);
  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(req.userInfo.id)
    .populate({
      path: "wishlist",
      populate: {
        path: "images",
        match: { isDeleted: false },
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  const wishlist = (updatedUser.wishlist || []).map(normalizeWishlistItem);

  res.status(200).json({
    success: true,
    message: "Product added to wishlist",
    data: { wishlist },
  });
});

const removeFromWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  const user = await User.findById(req.userInfo.id);
  if (!user) {
    return next(new AppError("Authenticated user not found", 404));
  }

  const nextWishlist = user.wishlist.filter(
    (entry) => entry.toString() !== productId.toString()
  );

  user.wishlist = nextWishlist;
  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(req.userInfo.id)
    .populate({
      path: "wishlist",
      populate: {
        path: "images",
        match: { isDeleted: false },
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  const wishlist = (updatedUser.wishlist || []).map(normalizeWishlistItem);

  res.status(200).json({
    success: true,
    message: "Item removed from wishlist",
    data: { wishlist },
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
