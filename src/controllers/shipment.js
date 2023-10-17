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
                        weight: data.weight,
                        date: data.date,
                        price: data.price,
                    }
                }
            })
        })

        return res.status(201).json({
            body: newShipment,
            status: 201,
            message: "Create shipment successfully",
        });
    } catch (error) {
        return res.status(400).json({
            status: 500,
            message: error.message,
        });
    }
}