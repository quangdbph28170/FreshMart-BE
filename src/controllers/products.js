import Products from "../models/products";
import Shipment from "../models/shipment";
import Categories from "../models/categories";
import { validateProduct, validateProductClearance } from "../validation/products";
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
    _willExpire,
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
    query.price = { $gte: _minPrice, $lte: _maxPrice };
  } else if (_minPrice) {
    query.price = { $gte: _minPrice };
  } else if (_maxPrice) {
    query.price = { $lte: _maxPrice };
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

    if (_willExpire) {
      checkWillExpire(products, _willExpire, res)
      return
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

export const checkWillExpire = (products, checkWillExpire, res) => {
  try {
    const result = []
    for (const product of products.docs) {
      if (product.shipments[0]?.willExpire && product.shipments[0]?.willExpire == checkWillExpire) {
        result.push(product)
      }
    }

    return res.status(201).json({
      body: {
        data: result,
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
}

export const getRelatedProducts = async (req, res) => {
  try {
    const { cate_id, product_id } = req.params;
    const relatedProducts = await Products.find({
      categoryId: cate_id,
      _id: { $ne: product_id }, // Loại trừ sản phẩm đang xem
    }).limit(10).lean();

    // Random sản phẩm
    const shuffledProducts = relatedProducts.sort(() => 0.5 - Math.random());

    // Chọn 10 sản phẩm đầu tiên
    const selectedProducts = shuffledProducts.slice(0, 10);

    // Populate shipments.idShipment và origins cho từng sản phẩm
    const populatedProducts = await Products.populate(selectedProducts, [
      { path: 'shipments.idShipment' },
      { path: 'originId' },
    ]);
    if (!populatedProducts) {
      return res.status(404).json({
        status: 404,
        message: "No Product found",
      });
    } else {
      return res.status(200).json({
        body: {
          data: populatedProducts,
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
    const prd = await Products.findById(req.params.id)
    const product = await Products.findByIdAndUpdate(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({
        status: 404,
        message: "Product not found",
      });
    }
    await Categories.findByIdAndUpdate(prd.categoryId, {
      $pull: {
        products: req.params.id,
      },
    });
    await Categories.findByIdAndUpdate(req.body.categoryId, {
      $push: {
        products: req.params.id,
      },
    });

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
export const productClearance = async (req, res) => {
  try {
    const { productId, shipmentId, discount, productName } = req.body

    const { error } = validateProductClearance.validate(req.body, { abortEarly: false });
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
    // console.log(checkShipmentId)
    if (!checkShipmentId) {
      return res.status(404).json({
        status: 404,
        message: "Sản phẩm đã không còn trong lô hàng này!",
      });
    }
    console.log("no")
    // Tìm danh mục thanh lý
    const cateIsSale = await Categories.findOne({ isSale: true })
   if(!cateIsSale){
    return res.status(400).json({
      status: 400,
      message: "Phải tạo danh mục thanh lý trước!",
    });
   }
    const data = await Products.create({
      ...productExist.toObject(),
      categoryId: cateIsSale._id,
      _id: undefined,
      productName,
      originalID:productExist._id,
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

    //push vào danh mục
    await Categories.findByIdAndUpdate(cateIsSale._id, {
      $push: {
        products: data._id
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

