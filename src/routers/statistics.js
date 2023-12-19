import { Router } from "express";
import { getStatistic } from "../controllers/statistics";


const shipmentRouter = Router();

shipmentRouter.get("/statistic", getStatistic);

export default shipmentRouter;
