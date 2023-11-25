import Products from "../models/products";
import Shipment from "../models/shipment";
import Categories from "../models/categories";
import { validateProduct, validateLiquidationProduct } from "../validation/products";
import mongoose from "mongoose";
export const getProducts = async (req, res) => {
  const {
    _page = 1,
    _order = "asc",
    _limit = 9999,
    _sort = "createdAt",
    _q = "",
    _categoryId = "",
    _originId = "",
    _minPrice = "",
    _maxPrice = "",
    _isSale,

  } = req.query;
  const options = {
    page: _page,
    limit: _limit,
    sort: {
      [_sort]: _order === "desc" ? -1 : 1,
      "shipments.price": _order === "desc" ? -1 : 1,
    },
    populate: ["originId", "categoryId"],
  };
  const query = {};

  if (_q) {
    query.productName = { $regex: _q, $options: "i" };
  }

  if (_categoryId) {
    query.categoryId = _categoryId;
  }
  if (_isSale) {
    query.isSale = _isSale;
  }

  if (_minPrice && _maxPrice) {
    query["shipments.price"] = { $gte: _minPrice, $lte: _maxPrice };
  } else if (_minPrice) {
    query["shipments.price"] = { $gte: _minPrice };
  } else if (_maxPrice) {
    query["shipments.price"] = { $lte: _maxPrice };
  }

  if (_originId) {
    const originIds = _originId.split(",").map(id => id.trim());
    query.originId = { $in: originIds };
  }

  try {
    const products = await Products.paginate(query, options);
    const prd = await Products.find()
    let maxPrice = 0
    let minPrice = Number.MAX_SAFE_INTEGER

    for (let item of prd) {
      maxPrice = Math.max(maxPrice, item.price)
      minPrice = Math.min(minPrice, item.price)
    }
    // console.log(minPrice, maxPrice);
    return res.status(201).json({
      body: {
        data: products.docs,
        pagination: {
          currentPage: products.page,
          totalPages: products.totalPages,
          totalItems: products.totalDocs,
        },
        maxPrice,
        minPrice
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
    const { cate_id, product_id } = req.params;
    const products = await Products.aggregate([
      {
        $match: {
          categoryId: new mongoose.Types.ObjectId(cate_id),
          _id: { $ne: new mongoose.Types.ObjectId(product_id) },
        },
      },
      { $sample: { size: 10 } },
      {
        $lookup: {
          from: "shipments",
          localField: "idShipment",
          foreignField: "_id",
          as: "shipment",
        },
      },
      {
        $unwind: "$shipment" // Unwind the shipment array to access its fields
      },
      {
        $lookup: {
          from: "origins", // Change "origins" to your actual collection name
          localField: "shipment.originId",
          foreignField: "_id",
          as: "shipment.origin",
        },
      },
      {
        $group: {
          _id: "$_id",
          // Group back the products and push the shipments with populated originId back into the shipment array
          shipment: { $push: "$shipment" },
          // Add other fields you may want to keep
        },
      },
    ]);
    if (!products) {
      return res.status(404).json({
        status: 404,
        message: "No Product found",
      });
    } else {
      return res.status(200).json({
        body: {
          data: products,
        },
        status: 200,
        message: "Product found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
export const getProductSold = async (req, res) => {
  try {
    const products = await Products.find().populate(
      "categoryId"
    ).populate("originId")
    const data = products.sort((a, b) => b.sold - a.sold).slice(0, 10)
    if (!products) {
      return res.status(404).json({
        status: 404,
        message: "Product not found",
      });
    }
    return res.status(201).json({
      body: {
        data
      },
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
export const getOneProduct = async (req, res) => {
  try {
    const product = await Products.findById(req.params.id).populate(
      "categoryId"
    ).populate("originId")
    if (!product) {
      return res.status(404).json({
        status: 404,
        message: "Product not found",
      });
    }
    await product.populate("categoryId.productId");
    return res.status(201).json({
      body: {
        data: product,
      },
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
      body: {
        data: product,
      },
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

    const product = await Products.findByIdAndUpdate(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({
        status: 404,
        message: "Product not found",
      });
    }


    return res.status(201).json({
      body: {
        data: product,
      },
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
export const liquidationProduct = async (req, res) => {
  try {
    const { productId, shipmentId, discount, productName } = req.body

    const { error } = validateLiquidationProduct.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(401).json({
        status: 401,
        message: error.details.map((error) => error.message),
      });
    }


    // Kiểm tra id sp CẦN_THANH_LÝ
    const productExist = await Products.findById(productId);
    if (!productExist) {
      return res.status(404).json({
        status: 404,
        message: "Product not found!",
      });
    }
    //Kiểm tra id shipment
    const shipmentExist = productExist.shipments.find(item => item.idShipment == shipmentId);
    if (!shipmentExist) {
      return res.status(404).json({
        status: 404,
        message: "Shipment not found!",
      });
    }

    //Kiểm tra xem sp CẦN_THANH_LÝ còn trong lô hàng đó 
    const checkShipmentId = productExist.shipments.find(item => item.idShipment == shipmentId)
    console.log(checkShipmentId)
    if (!checkShipmentId) {
      return res.status(404).json({
        status: 404,
        message: "Sản phẩm đã không còn trong lô hàng này!",
      });
    }

    const data = await Products.create({
      ...productExist.toObject(),
      _id: undefined,
      productName,
      shipments: [
        {
          idShipment: shipmentExist.idShipment,
          originWeight: shipmentExist.originWeight,
          weight: shipmentExist.weight,
          date: shipmentExist.date,
          originPrice: shipmentExist.originPrice,
        }
      ],
      price: parseInt(productExist.price) - parseInt(discount / 100 * productExist.price),
      isSale: true,
      sold: 0
    });

    // Xóa cái lô của sp CẦN_THANH_LÝ ở bảng products
    await Products.findByIdAndUpdate(productId, {
      $pull: {
        shipments: {
          idShipment: shipmentId,
        }
      }
    }, { new: true })

    //Cập nhật lại trong bảng shipment id sp CẦN_THANH_LÝ => is sp THANH_LÝ
    await Shipment.findOneAndUpdate({ _id: shipmentId, "products.idProduct": productId }, {
      $set: {
        "products.$.idProduct": data._id
      }
    }, { new: true })

    return res.status(200).json({
      status: 200,
      message: "Đã thanh lý xong <3",
      body: { data }
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

