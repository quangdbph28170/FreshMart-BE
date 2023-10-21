import { Router } from "express";
import { createShipment } from "../controllers/shipment";

const shipmentRouter = Router();

shipmentRouter.post("/shipments", createShipment);

export default shipmentRouter;
