import { Router } from "express";
import { createShipment, findAll, findOne, removeShipment, updateShipment } from "../controllers/shipment";


const shipmentRouter = Router();

shipmentRouter.post("/shipments", createShipment);
shipmentRouter.get("/shipments", findAll);
shipmentRouter.get("/shipments/:id", findOne);
shipmentRouter.patch("/shipments/:id", updateShipment);
shipmentRouter.delete("/shipments/:id", removeShipment);

export default shipmentRouter;
