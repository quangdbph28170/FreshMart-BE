import { Router } from "express";
import authentication from "../middleware/authentication";
import { authorization } from "../middleware/authorization";
import { getStatistic } from "../controllers/statistics";


const shipmentRouter = Router();

shipmentRouter.get("/statistic", authentication, authorization, getStatistic);

export default shipmentRouter;
