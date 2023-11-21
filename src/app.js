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
import notificationRouter from "./routers/notification";
import momoRouter from "./routers/momo-pay";
import { createServer } from "http";
import { Server } from "socket.io";
import cron from "node-cron";
import product from "./models/products";
import cartRouter from "./routers/carts";
import { addNotification } from "./controllers/notification";
import evaluationRouter from "./routers/evaluation";

const app = express();
const httpServer = createServer(app);

dotenv.config();

const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGODB_LOCAL;

const io = new Server(httpServer, { cors: "*" });

io.on("connection", (socket) => {
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
      io.emit("expireProduct", response);
    }
  });

  //thông báo cho admin và người dùng đã đăng nhập mua hàng thành công/ có đơn hàng mới
  socket.on('purchase', async (data) => {
    const socketData = JSON.parse(data);
    // Gửi thông báo đến trang client nếu người dùng đăng nhập
    if (socketData.userId) {
      const notification = await addNotification({
        userId: socketData.userId,
        message: 'Mua hàng thành công',
        link: '/my-order/' + socketData.orderId,
      })
      io.to(socketData.userId).emit('purchaseNotification', { data: notification })
    }

    const adminNotification = await addNotification({
      message: 'Có đơn hàng mới',
      link: '/admin/orders',
      type: 'admin'
    })
    // Gửi thông báo đến trang admin
    io.to('adminRoom').emit('purchaseNotification', { data: adminNotification });
  });

  //thông báo cho người dùng trạng thái của order đã thay đổi và nếu "giao hàng thành công thì trả về order id để người dùng sang detail xác nhận đơn hàng thành công"
  socket.on('changeStatus', async (data) => {
    const socketData = JSON.parse(data);

    const notification = await addNotification({
      userId: socketData.userId,
      message: 'Đơn hàng (#)' + socketData.invoiceId + '  của bạn đã ' + socketData.status,
      link: '/my-order/' + socketData.orderId,
    })

    io.to(socketData.userId).emit('statusNotification', { data: notification })
  })


  socket.on('joinClientRoom', (userId) => {
    // Thêm người dùng vào "room theo id người dùng" client khi truy cập trang client
    socket.join(userId);
  });

  socket.on('joinAdminRoom', () => {
    // Thêm người dùng vào "room" admin khi truy cập trang admin
    socket.join('adminRoom');
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
app.use("/api", notificationRouter);
app.use("/api", evaluationRouter);
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("connected to db"))
  .catch((err) => console.log(`error in connect db : ${err}`));
httpServer.listen(PORT, () => {
  console.log(`listening success ${PORT}`);
});
