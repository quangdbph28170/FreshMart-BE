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
import User from "./models/user";
import Shipment from "./models/shipment";
import Category from "./models/categories";
import voucherRouter from "./routers/vouchers";
import session from 'express-session';
import { connectToGoogle } from './config/googleOAuth';
import { months } from "./config/constants";

const app = express();
const httpServer = createServer(app);

dotenv.config();

const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGODB_LOCAL;

const io = new Server(httpServer, { cors: "*" });

//kiểm tra nếu đơn hàng có phương thức thanh toán là vnpay/momo mà chưa thanh toán sau 20 phút sẽ hủy đơn hàng
cron.schedule("1-59 * * * *", async () => {
  const tweentyMinutesInMilliseconds = 20 * 60 * 1000; // 20 phút tính bằng mili giây
  const orders = await Orders.find({ $or: [{ paymentMethod: 'vnpay' }, { paymentMethod: 'momo' }], pay: false, createdAt: { $lte: new Date(Date.now() - tweentyMinutesInMilliseconds) } })

  for (const order of orders) {
    await Orders.findByIdAndUpdate(order._id, {
      status: 'đã hủy'
    })
    for (let item of order.products) {

      const product = await Product.findById(item.productId)
      // update lại sold
      await Product.findByIdAndUpdate(item.productId, {
        $set: {
          sold: product.sold - 1
        }
      })
      for (let shipment of product.shipments) {
        // Trả lại cân ở bảng products
        await Product.findOneAndUpdate({ _id: product._id, "shipments.idShipment": shipment.idShipment }, {
          $set: {
            "shipments.$.weight": shipment.weight + item.weight
          }
        }, { new: true })

        //Bảng shipment
        await Shipment.findOneAndUpdate({ _id: shipment.idShipment, "products.idProduct": product._id }, {
          $set: {
            "products.$.weight": shipment.weight + item.weight
          }
        }, { new: true })

      }
    }
  }
})

//Thống kê lại dữ liệu sau mỗi 30 phút 
cron.schedule("*/1 * * * *", async () => {
  try {
    //Lấy ra tất cả sản phẩm (ko lấy sp thanh lý/thất thoát)
    const products = await Product.find({ isSale: false });

    //lấy ra tất cả đơn hàng đã hoàn thành
    const orders = await Orders.find({ status: 'đơn hàng hoàn thành' }).populate('products.productId');

    //lấy ra tất cả tài khoản của người dùng (not admin)
    const users = await User.find({ role: 'member' })

    //Lấy ra tất cả danh mục (not type default)
    const categories = await Category.find({ type: 'normal' })

    /*console.log('data: ', products, orders, users, categories)*/

    /*==================*/

    // Tính tổng doanh thu theo đơn hàng đã hoàn thành
    const salesRevenue = orders ? orders.reduce((accumulator, order) => accumulator + order.totalPayment, 0) : 0;

    // Tổng khách hàng đã đăng ký tài khoản
    const customers = users ? users?.length : 0

    // Tính trung bình tổng số tiền đã thanh toán
    const averageTransactionPrice = salesRevenue > 0 && (orders && orders.length > 0) ? Number((salesRevenue / orders.length).toFixed(2)) : 0;

    // Lấy ra top 5 sản phẩm có số lượng bán ra nhiều nhất
    let topFiveProductsSold = []
    if (products.length > 0 && orders.length > 0) {
      for (const product of products) {
        let totalWeight = 0
        for (const order of orders) {
          for (const productOfOrder of order.products) {
            if (product._id.equals(productOfOrder.productId._id)) {
              totalWeight += productOfOrder.weight
            }
          }
        }
        topFiveProductsSold.push({
          productId: product._id,
          totalWeight: totalWeight,
        })
      }
    }
    topFiveProductsSold = topFiveProductsSold?.sort((a, b) => b?.totalWeight - a?.totalWeight).slice(0, 5) || []

    // Lấy ra top 5 danh mục có tổng doanh thu cao nhất
    let topFiveCategoryByRevenue = []
    if (categories.length > 0 && orders.length > 0) {
      for (const category of categories) {
        let totalPrice = 0
        for (const order of orders) {
          for (const productOfOrder of order.products) {
            if (category._id.equals(productOfOrder.productId.categoryId)) {
              totalPrice += productOfOrder.price * productOfOrder.weight
            }
          }
        }
        topFiveCategoryByRevenue.push({
          categoryId: category._id,
          totalPrice: totalPrice,
        })
      }
    }
    topFiveCategoryByRevenue = topFiveCategoryByRevenue?.sort((a, b) => b?.totalPrice - a?.totalPrice).slice(0, 5) || []

    // Lấy tổng số người và tổng số đơn hàng trong 1 tháng trong năm
    const totalCustomerAndTransactions = []
    for (const month of months) {
      let customers = 0
      let transactions = 0
      const currentYear = new Date().getFullYear()
      for (const user of users) {
        const targetUserDate = new Date(user.createdAt)
        if (month == targetUserDate.getMonth() + 1 && currentYear == targetUserDate.getFullYear()) {
          customers += 1
        }
      }
      for (const order of orders) {
        const targetOrderDate = new Date(order.createdAt)
        if (month == targetOrderDate.getMonth() + 1 && currentYear == targetOrderDate.getFullYear()) {
          transactions += 1
        }
      }
      totalCustomerAndTransactions.push({
        customers,
        transactions,
        month,
        year: currentYear,
      })
    }

    // Lấy tổng số người và tổng số đơn hàng trong 1 tháng trong năm
    const averagePriceAndUnitsPerTransaction = []
    for (const month of months) {
      let pricePerTransaction = 0
      let ordersInOnOneMonth = 0
      let unitsPerTransaction = 0
      const currentYear = new Date().getFullYear()
      for (const order of orders) {
        const targetOrderDate = new Date(order.createdAt)
        if (month == targetOrderDate.getMonth() + 1 && currentYear == targetOrderDate.getFullYear()) {
          ordersInOnOneMonth += 1
          pricePerTransaction += order.totalPayment
          unitsPerTransaction += order.products.length
        }
      }
      pricePerTransaction = pricePerTransaction / ordersInOnOneMonth || 0
      unitsPerTransaction = unitsPerTransaction / ordersInOnOneMonth || 0
      averagePriceAndUnitsPerTransaction.push({
        pricePerTransaction,
        unitsPerTransaction,
        month,
        year: currentYear,
      })
    }

    // Thống kế doanh thu theo ngày
    const salesRevenueByDay = []
    const mapOrders = (array) => {
      for (const order of array) {
        const targetDate = new Date(order.createdAt)
        let totalPriceOfDay = 0
        const orderSameDay = []
        const ordersLeft = []
        // Lấy ra tất cả order cùng ngày tháng năm
        for (const odr of array) {
          const filterDate = new Date(odr.createdAt)
          if (targetDate.getDate() == filterDate.getDate() && targetDate.getMonth() + 1 == filterDate.getMonth() + 1 && targetDate.getFullYear() == filterDate.getFullYear()) {
            totalPriceOfDay += odr.totalPayment
            orderSameDay.push(odr._id)
          } else {
            ordersLeft.push(odr)
          }
        }
        salesRevenueByDay.push(
          {
            salesRevenueData: [
              targetDate.getTime(),
              totalPriceOfDay
            ],
            orderByDay: orderSameDay
          }
        )
        mapOrders(ordersLeft)
        return
      }
    }
    mapOrders(orders)

    /*==================*/

    /* console.log({ 
        salesRevenue, 
        customers, 
        averageTransactionPrice, 
        topFiveProductsSold, 
        topFiveCategoryByRevenue, 
        totalCustomerAndTransactions, 
        averagePriceAndUnitsPerTransaction, 
        salesRevenueByDay 
    }); */

  } catch (error) {
    console.log(error.message);
  }
})


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
        pay: true,
      });
      for (let item of order.products) {
        const prd = await Product.findById(item.productId);
        // Update sold +
        await Product.findByIdAndUpdate(item.productId, {
          $set: {
            sold: prd.sold + 1
          }
        })
      }
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
          await Shipment.findByIdAndUpdate(
            { _id: shipment.idShipment, "products.idProduct": product._id },
            {
              $set: {
                "products.$.willExpire": 2,
              },
            }
          )
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
          await Shipment.findByIdAndUpdate(
            { _id: shipment.idShipment, "products.idProduct": product._id },
            {
              $set: {
                "products.$.willExpire": 1,
              },
            }
          )
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
app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: 'SECRET',
  }),
);

connectToGoogle()
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
