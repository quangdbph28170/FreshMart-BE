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

io.on("connection", (socket) => {
  //chạy lại từ phút số 1 -> phút số 59 (vì đang test nên để thời gian ngắn)
  //chạy lại từ 0h(24h) và 12h nếu config (* 0,12 * * *)
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
          response.push(
            {
              message: "Sản phẩm có mã '" +
                product._id +
                "' trong lô hàng mã '" +
                shipment.idShipment +
                "' sắp hết hạn",
              productId: product._id,
              shipmentId: shipment.idShipment
            }
          );
        }
      }
    }

    if (response.length > 0) {
      io.to('adminRoom').emit("alert", response);
    }
  });

  //thông báo cho admin và người dùng đã đăng nhập mua hàng thành công/ có đơn hàng mới
  socket.on('purchase', (userId) => {
    console.log('Purchase event received:', userId);

    // Gửi thông báo đến trang admin
    if(userId) {
      io.to(userId).emit('purchaseNotification', "Mua hàng thành công")
    }
    io.to('adminRoom').emit('purchaseNotification', "Có đơn hàng mới");
  });

  //thông báo cho người dùng trạng thái của order đã thay đổi và nếu "giao hàng thành công thì trả về order id để người dùng sang detail xác nhận đơn hàng thành công"
  socket.on('changeStatus', (data) => {
    const socketData = JSON.parse(data);

    if(socketData.status.toLowerCase() === "giao hàng thành công") {
      io.to(socketData.userId).emit('statusNotification', {
        message: 'Đơn hàng (#)' + socketData.invoiceId + '  của bạn đã ' + socketData.status, 
        orderId: socketData.orderId 
      })
    } else {
      io.to(socketData.userId).emit('statusNotification', 'Đơn hàng (#)' + socketData.invoiceId + ' của bạn ' + socketData.status)
    }
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
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("connected to db"))
  .catch((err) => console.log(`error in connect db : ${err}`));
httpServer.listen(PORT, () => {
  console.log(`listening success ${PORT}`);
});


