import unsoldProducts from "../models/unsoldProducts";

const filterDate = async (products, day, currentPage, limit, res) => {
  const today = new Date();
  const dayOfPast = today - day * 24 * 60 * 60 * 1000;
  const filteredProducts = [];
  for (let item of products) {
    const date = new Date(item.createdAt);
    if (date >= dayOfPast) {
      filteredProducts.push(item);
    }
  }
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / limit);
  const totalMoney = filteredProducts.reduce((sum, record) => {
    return (sum +=
      record.shipments[0].purchasePrice * record.shipments[0].weight);
  }, 0);
  return res.status(200).json({
    status: 200,
    message: "Filter products success",
    body: {
      data: filteredProducts,
      totalMoney,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
      },
    },
  });
  //======================== CÒN TỔNG THẤT THOÁT FE TỰ TÍNH ĐI =)) =============================//
};
export const getUnsoldProducts = async (req, res) => {
  const {
    _page = 1,
    _order = "desc",
    _limit = 9999,
    _sort = "createdAt",
    _q = "",
  } = req.query;
  const options = {
    page: _page,
    limit: _limit,
    sort: {
      [_sort]: _order === "desc" ? -1 : 1,
    },
    populate: "shipments.shipmentId",
  };

  try {
    const query = {};
    const { day, today } = req.query;

    if (today) {
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const products = await unsoldProducts.paginate(query, options);
    const todayProducts = await unsoldProducts.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });
    const totalMoney = todayProducts.reduce((sum, record) => {
      return (sum +=
        record.shipments[0].purchasePrice * record.shipments[0].weight);
    }, 0);
    if (day) {
      return filterDate(products.docs, day, _page, _limit, res);
    }

    return res.status(200).json({
      status: 200,
      message: "Get products successfully",
      body: {
        data: products.docs,
        totalMoney,
        pagination: {
          currentPage: products.page,
          totalPages: products.totalPages,
          totalItems: products.totalDocs,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

export const getUnsoldProduct = async (req, res) => {
  try {
    const product = await unsoldProducts
      .findById(req.params.id)
      .populate("originalID");
    if (!product) {
      return res.status(404).json({
        status: 404,
        message: "Product not found",
      });
    }
    return res.status(200).json({
      status: 200,
      message: "Get product successfully",
      body: {
        data: product,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
