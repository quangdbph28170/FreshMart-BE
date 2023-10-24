import Products from "../models/products";
import Categories from "../models/categories";
import { validateProduct } from "../validation/products";
import mongoose from "mongoose";
export const getProducts = async (req, res) => {
  const {
    _page = 1,
    _order = "asc",
    _limit = 10,
    _sort = "createdAt",
    _q = "",
  } = req.query;
  const options = {
    page: _page,
    limit: _limit,
    sort: {
      [_sort]: _order === "desc" ? -1 : 1,
    },
    populate: "categoryId",
  };
  try {
    const products = await Products.paginate({}, options);
    return res.status(201).json({
      body: {
        products: products.docs,
        pagination: {
          currentPage: products.page,
          totalPages: products.totalPages,
          totalItems: products.totalDocs,
        },
      },
      status: 201,
      message: "Get products successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

export const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params
    
    const products = await Products.aggregate([{ $match: { categoryId: new mongoose.Types.ObjectId(id) } }, { $sample: { size: 10 } }])
    console.log(products);
    if (!products) {
      return res.status(404).json({
        status: 404,
        message: 'No Product found',
      });
    } else {
      return res.status(200).json({
        body: products,
        status: 200,
        message: 'Product found',
      })
    }

} catch (error) {
  return res.status(500).json({
    status: 500,
    message: error.message,
  });
}
}
export const getOneProduct = async (req, res) => {
  try {
    const product = await Products.findById(req.params.id).populate(
      "categoryId",
    );
    if (!product) {
      return res.status(404).json({
        status: 404,
        message: "Product not found",
      });
    }
    await product.populate("categoryId.productId");
    return res.status(201).json({
      body: product,
      status: 201,
      message: "Get product successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
export const createProduct = async (req, res) => {
  try {
    const { error } = validateProduct.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(401).json({
        status: 401,
        message: error.details.map((error) => error.message),
      });
    }

    const product = await Products.create(req.body);
    await Categories.findByIdAndUpdate(product.categoryId, {
      $push: { products: product._id },
    });

    return res.status(201).json({
      body: product,
      status: 201,
      message: "Create product successfully",
    });
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error.message,
    });
  }
};
export const updateProduct = async (req, res) => {
  try {
    const { error } = validateProduct.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(403).json({
        status: 403,
        message: error.details.map((error) => error.message),
      });
    }
    const { categoryId } = req.body;
    const product = await Products.findByIdAndUpdate(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({
        status: 404,
        message: "Product not found",
      });
    }
    await Categories.findByIdAndUpdate(product.categoryId, {
      $pull: {
        products: product._id,
      },
    });
    await Categories.findByIdAndUpdate(categoryId, {
      $addToSet: {
        products: product._id,
      },
    });

    return res.status(201).json({
      body: product,
      status: 201,
      message: "Update product successfully",
    });
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error.message,
    });
  }
};
export const removeProduct = async (req, res) => {
  try {
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        status: 404,
        message: "Product not found",
      });
    }
    const { categoryId } = product;

    await Categories.findByIdAndUpdate(categoryId, {
      $pull: {
        products: req.params.id,
      },
    });
    await Products.findByIdAndDelete(req.params.id);
    return res.status(201).json({
      status: 201,
      message: "Remove product successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
