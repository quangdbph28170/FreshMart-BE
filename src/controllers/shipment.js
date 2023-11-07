import Products from "../models/products";
import Shipment from "../models/shipment";
import { validateShipment } from "../validation/shipment";

export const createShipment = async (req, res) => {
  const { error } = validateShipment.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(401).json({
      status: 401,
      message: error.details.map((error) => error.message),
    });
  }
  try {
    const newShipment = await Shipment.create(req.body);
    req.body.products.map(async (data) => {
      await Products.findByIdAndUpdate(data.idProduct, {
        $push: {
          shipments: {
            idShipment: newShipment._id,
            originWeight: data.weight,
            weight: data.weight,
            date: data.date,
            originPrice: data.price,
            price: data.price,
          },
        },
      });
    });

    return res.status(201).json({
      body: {
        data: newShipment,
      },
      status: 201,
      message: "Create shipment successfully",
    });
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error.message,
    });
  }
};

export const findAll = async (req, res) => {
  try {
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
      populate: "products.idProduct",
    };
    const shipments = await Shipment.paginate({}, options);

    if (!shipments.docs) {
      return res.status(404).json({
        status: 404,
        message: "There are no shipments",
      });
    }

    return res.status(201).json({
      body: {
        data: shipments.docs,
        pagination: {
          currentPage: shipments.page,
          totalPages: shipments.totalPages,
          totalItems: shipments.totalDocs,
        },
      },
      status: 201,
      message: "Get shipments successfully",
    });
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error.message,
    });
  }
};
export const findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findById(id).populate("products.idProduct");

    if (!shipment)
      return res
        .status(404)
        .json({ status: 404, message: "No Shipment found" });

    return res.status(200).json({
      body: {
        data: shipment,
      },
      status: 200,
      message: "Get Shipment success",
    });
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error.message,
    });
  }
};

export const updateShipment = async (req, res) => {
  const { error } = validateShipment.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(401).json({
      status: 401,
      message: error.details.map((error) => error.message),
    });
  }
  try {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment)
      return res
        .status(404)
        .json({ status: 404, message: "No Shipment found" });

    shipment.products.map(async (product) => {
      await Products.findByIdAndUpdate(product.idProduct, {
        $pull: {
          shipments: { idShipment: shipment._id },
        },
      });
    });
    if (req.body.isDisable == false) {
      req.body.products.map(async (product) => {
        await Products.findByIdAndUpdate(product.idProduct, {
          $push: {
            shipments: {
              idShipment: shipment._id,
              originWeight: product.weight,
              weight: product.weight,
              date: product.date,
              originPrice: product.price,
              price: product.price,
            },
          },
        });
      });
    }
    const shipmentUpdate = await Shipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    return res.status(200).json({
      status: 200,
      body: {
        data: shipmentUpdate,
      },
      message: "Updated shipment complete",
    });
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error.message,
    });
  }
};

export const removeShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findById(id);

    if (!shipment)
      return res
        .status(404)
        .json({ status: 404, message: "No Shipment found" });

    shipment.products.map(async (product) => {
      await Products.findByIdAndUpdate(product.idProduct, {
        $pull: {
          shipments: { idShipment: shipment._id },
        },
      });
    });

    await Shipment.findByIdAndRemove(shipment._id);

    return res.status(200).json({ status: 200, message: "Removed shipment" });
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error.message,
    });
  }
};
