import { Router } from "express";
import { createShipment, findAll, findOne, removeShipment, updateShipment } from "../controllers/shipment";
import { authorization } from "../middleware/authorization";
import authentication from "../middleware/authentication";


const shipmentRouter = Router();

shipmentRouter.post("/shipments", authentication, authorization, createShipment);
shipmentRouter.get("/shipments", authentication, authorization, findAll);
shipmentRouter.get("/shipments/:id", authentication, authorization, findOne);
shipmentRouter.patch("/shipments/:id", authentication, authorization, updateShipment);
shipmentRouter.delete("/shipments/:id", authentication, authorization, removeShipment);

export default shipmentRouter;
