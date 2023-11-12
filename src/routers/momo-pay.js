import { Router } from "express";
import { handleResponseFromTransaction } from "../controllers/momo-pay";

const momoRouter = Router();

momoRouter.post("/response-momo", handleResponseFromTransaction);

export default momoRouter;
