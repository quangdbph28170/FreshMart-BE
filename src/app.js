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
import vnpayRouter from "./routers/vnpay";
import notificationRouter from "./routers/notification";
import momoRouter from "./routers/momo-pay";
import { createServer } from "http";
import { Server } from "socket.io";
import cron from "node-cron";
import Product from "./models/products";
import cartRouter from "./routers/carts";
import { addNotification } from "./controllers/notification";
import evaluationRouter from "./routers/evaluation";
import Orders from "./models/orders";
import voucherRouter from "./routers/vouchers";

const app = express();
const httpServer = createServer(app);

dotenv.config();

const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGODB_LOCAL;

const io = new Server(httpServer, { cors: "*" });

//Chạy 24h 1 lần kiểm tra những đơn hàng đã giao hàng thành công sau 3 ngày tự động chuyển thành trạng thái thành công
cron.schedule("* */24 * * *", async () => {
  const orders = await Orders.find({ status: "giao hành thành công" });
  for (const order of orders) {
    // Chuyển đổi chuỗi ngày từ MongoDB thành đối tượng Date
    const targetDate = new Date(order.updatedAt);
    // Lấy ngày hiện tại
    const currentDate = new Date();
    // Số mili giây trong 3 ngày
    const threeDaysInMillis = 3 * 24 * 60 * 60 * 1000;
    // Kiểm tra xem thời gian hiện tại đến ngày cụ thể có cách 3 ngày không
    const isRatherThreeDays = currentDate - targetDate >= threeDaysInMillis;

    if (isRatherThreeDays) {
      await addNotification({
        userId: order.userId,
        title: "Thông báo",
        message:
          "Đơn hàng (#)" +
          order.invoiceId +
          "  của bạn đã hoàn thành",
        link: "/my-order/" + order._id,
        type: "client",
      });
      await Orders.findByIdAndUpdate(order._id, {
        status: "đơn hàng hoàn thành",
      });
    }
  }
});

io.of("/admin").on("connection", (socket) => {
  cron.schedule("* 0,12 * * *", async () => {
    const response = [];
    const products = await Product.find();
    for (const product of products) {
      for (const shipment of product.shipments) {
        // Chuyển đổi chuỗi ngày từ MongoDB thành đối tượng Date
        const targetDate = new Date(shipment.date);
        // Lấy ngày hiện tại
        const currentDate = new Date();

        // Số mili giây trong 3 ngày
        const threeDaysInMillis = 3 * 24 * 60 * 60 * 1000;

        //Kiểm tra xem sản phẩm trong lô đã hết hạn chưa
        if (targetDate - currentDate <= 0 && shipment.willExpire != 2) {
          await Product.findOneAndUpdate(
            { _id: product._id, "shipments.idShipment": shipment.idShipment },
            {
              $set: {
                "shipments.$.willExpire": 2,
              },
            }
          );
          await addNotification({
            title: `Thông báo: Sản phẩm ${product.productName} đã hết Hạn`,
            message: `Hãy xem xét và cập nhật thông tin của các sản phẩm này`,
            link: "/manage/products/" + product._id,
            type: "admin",
          });
          response.push({
            productId: product._id,
            timeLeft: 0,
            shipmentId: shipment.idShipment,
          });
        }

        // Kiểm tra xem thời gian hiện tại đến ngày cụ thể có cách 3 ngày không
        const isWithinThreeDays = targetDate - currentDate < threeDaysInMillis;

        if (isWithinThreeDays && targetDate - currentDate > 0 && shipment.willExpire != 1) {
          await Product.findOneAndUpdate(
            { _id: product._id, "shipments.idShipment": shipment.idShipment },
            {
              $set: {
                "shipments.$.willExpire": 1,
              },
            }
          );
          const totalMilliseconds =
            threeDaysInMillis - (targetDate - currentDate);
          const totalSeconds = Math.floor(totalMilliseconds / 1000);
          const hours = Math.floor(totalSeconds / 3600);

          await addNotification({
            title: `Thông báo: Sản phẩm ${product.productName} sắp Hết Hạn sau ${hours} tiếng nữa`,
            message: `Hãy xem xét và cập nhật thông tin của các sản phẩm này`,
            link: "/manage/products/" + product._id,
            type: "admin",
          });

          response.push({
            productId: product._id,
            timeLeft: hours,
            shipmentId: shipment.idShipment,
          });
        }
      }
    }

    if (response.length > 0) {
      socket.emit("expireProduct", response);
    }
  });
  //thông báo cho người dùng trạng thái của order đã thay đổi và nếu "giao hàng thành công thì trả về order id để người dùng sang detail xác nhận đơn hàng thành công"
  socket.on("changeStatus", async (data) => {
    const socketData = JSON.parse(data);

    if (socketData.userId === null || !socketData.userId) return;
    const notification = await addNotification({
      userId: socketData.userId,
      title: "Thông báo",
      message:
        "Đơn hàng (#)" +
        socketData.invoiceId +
        "  của bạn đã " +
        socketData.status,
      link: "/my-order/" + socketData.orderId,
      type: "client",
    });

    io.to(socketData.userId).emit("statusNotification", {
      data: { ...notification._doc, status: socketData.status },
    });
  });
});

io.on("connection", (socket) => {
  //thông báo cho admin và người dùng đã đăng nhập mua hàng thành công/ có đơn hàng mới
  socket.on("purchase", async (data) => {
    const socketData = JSON.parse(data);
    console.log(socketData.userId);
    // Gửi thông báo đến trang client nếu người dùng đăng nhập
    if (socketData.userId) {
      const notification = await addNotification({
        userId: socketData.userId,
        title: "Thông báo",
        message: "Mua hàng thành công",
        link: "/my-order/" + socketData.orderId,
        type: "client",
      });
      io.to(socketData.userId).emit("purchaseNotification", {
        data: notification,
      });
    }

    const adminNotification = await addNotification({
      title: "Thông báo",
      message: "Có đơn hàng mới đang chờ xử lý",
      link: "/manage/orders",
      type: "admin",
    });
    // Gửi thông báo đến trang admin
    io.of("/admin").emit("purchaseNotification", { data: adminNotification });
  });

  socket.on("confirmOrder", async (data) => {
    const socketData = JSON.parse(data);
    const notification = await addNotification({
      title: "Thông báo",
      message:
        "Đơn hàng (#)" +
        socketData.invoiceId +
        " đã được người dùng thay đổi trạng thái thành: " +
        socketData.status,
      link: "/manage/orders",
      type: "admin",
    });

    io.of('/admin').emit("adminStatusNotification", {
      data: { ...notification._doc, status: socketData.status },
    });
  });

  socket.on("joinClientRoom", (userId) => {
    const id = JSON.parse(userId);
    // Thêm người dùng vào "room theo id người dùng" client khi truy cập trang client
    socket.join(id);
  });

  // socket.on('joinAdminRoom', () => {
  //   // Thêm người dùng vào "room" admin khi truy cập trang admin
  //   socket.join('adminRoom');
  // });
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
app.use("/api", vnpayRouter);
app.use("/api", notificationRouter);
app.use("/api", evaluationRouter);
app.use("/api", voucherRouter);
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("connected to db"))
  .catch((err) => console.log(`error in connect db : ${err}`));
httpServer.listen(PORT, () => {
  console.log(`listening success ${PORT}`);
});
