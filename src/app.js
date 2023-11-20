import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import categoryRouter from "./routers/categories";
import productRouter from "./routers/products";
import uploadRouter from "./routers/upload";
import shipmentRouter from "./routers/shipment";
import mailRouter from "./routers/mail";
import originRouter from "./routers/origin";
import orderRouter from "./routers/orders";
import authRouter from "./routers/auth";
import userRouter from "./routers/user";
import momoRouter from "./routers/momo-pay";
import { createServer } from "http";
import { Server } from "socket.io";
import cron from "node-cron";
import product from "./models/products";
import cartRouter from "./routers/carts";
const app = express();
const httpServer = createServer(app);

dotenv.config();

const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGODB_LOCAL;

const io = new Server(httpServer, { cors: "*" });

io.of("/admin").on("connection", (socket) => {
  cron.schedule("1-59 * * * *", async () => {
    const products = await product.find();
    const response = [];
    for (const product of products) {
      for (const shipment of product.shipments) {
        // Chuyển đổi chuỗi ngày từ MongoDB thành đối tượng Date
        const targetDate = new Date(shipment.date);

        // Lấy ngày hiện tại
        const currentDate = new Date();

        // Số mili giây trong 7 ngày
        const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;

        // Kiểm tra xem thời gian hiện tại đến ngày cụ thể có cách 7 ngày không
        const isWithinSevenDays = targetDate - currentDate < sevenDaysInMillis;

        if (isWithinSevenDays) {
          response.push({
            productId: product._id,
            shipmentId: shipment._id,
          });
        }
      }
    }

    if (response.length > 0) {
      io.of("/admin").emit("expireProduct", response);
    }
  });
});

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use("/api", categoryRouter);
app.use("/api", productRouter);
app.use("/api", uploadRouter);
app.use("/api", shipmentRouter);
app.use("/api", mailRouter);
app.use("/api", originRouter);
app.use("/api", orderRouter);
app.use("/api", authRouter);
app.use("/api", userRouter);
app.use("/api", momoRouter);
app.use("/api", cartRouter);
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("connected to db"))
  .catch((err) => console.log(`error in connect db : ${err}`));
httpServer.listen(PORT, () => {
  console.log(`listening success ${PORT}`);
});
