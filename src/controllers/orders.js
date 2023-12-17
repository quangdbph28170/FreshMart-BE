import mongoose from "mongoose";
import Order from "../models/orders";
import Origin from "../models/origin";
import Product from "../models/products";
import UnsoleProduct from "../models/unsoldProducts";
import Shipment from "../models/shipment";
import { validateCheckout } from "../validation/checkout";
import { transporter } from "../config/mail";
import {
  doneOrder,
  failedOrder,
  messageCreateOrder,
  messageOrderSuccess,
  messageUpdateOrder,
  statusOrder,
  subjectCreateOrder,
  subjectUpdateOrder,
} from "../config/constants";
import Carts from "../models/carts";
import { vnpayCreate } from "./vnpay";
import vouchers from "../models/vouchers";

const checkCancellationTime = (order) => {
  const checkTime = new Date(order.createdAt);
  const currentTime = new Date();
  const timeDifference = (currentTime - checkTime) / 1000 / 60 / 60;
  if (timeDifference < 24) {
    return {
      canCancel: true,
    };
  } else {
    return {
      canCancel: false,
    };
  }
};
const formatDateTime = (dateTime) => {
  const date = new Date(dateTime);
  const formattedDate = `${date.getDate()}/${date.getMonth() + 1
    }/${date.getFullYear()}`;
  const formattedTime = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  return `${formattedDate} ${formattedTime}`;
};
export const sendMailer = async (email, data, amountReduced) => {
  let subject = null;
  let message = null;
  if (data.status == "chờ xác nhận") {
    subject = subjectCreateOrder;
    message = messageCreateOrder;
  } else if (data.status == "giao hàng thành công") {
    subject = subjectUpdateOrder;
    message = messageOrderSuccess;
  } else {
    subject = subjectUpdateOrder;
    message = messageUpdateOrder;
  }
  // console.log(email,data);

  let maxReduce = null
  let miniMumOrder = null
  let code = null
  if (data.voucher != null && amountReduced != null) {
    maxReduce = data.voucher.maxReduce
    if (maxReduce > 0) {
      maxReduce = "tối đa " + maxReduce.toLocaleString("vi-VN") + "VND";
    }
    miniMumOrder = data.voucher.miniMumOrder
    if (miniMumOrder > 0) {
      miniMumOrder = "đơn " + miniMumOrder.toLocaleString("vi-VN") + "VND";
    }
    // giảm 50% đơn 50k tối đa 10k
    code = `
    <p style="font-weight: bold; margin: 0;">Voucher đã sử dụng: Giảm ${amountReduced.toLocaleString("vi-VN")}VND</p>
    <div style="display: flex; align-items: center; background-color: #f9f9f9; border: 1px solid #ccc; border-radius: 5px; padding: 5px;">
      <img src="https://inmauhanoi.com/wp-content/uploads/2019/03/in-voucher-gia-re-lay-ngay-tai-ha-noi.png" alt="Voucher" style="width: 50px; height: 50px; margin-right: 10px;">
      <div>
        <p style="margin: 0;">Mã: ${data.voucher.code}</p>
        <p style="margin: 0;">Giảm ${data.voucher.percent}% ${miniMumOrder != null ? miniMumOrder : ""} ${maxReduce != null ? maxReduce : ""}</p>
      </div>
    </div>
  `;
  }
  await transporter.sendMail({
    from: "namphpmailer@gmail.com",
    to: email,
    subject: subject,
    html: `<div>
                  <a target="_blank" href="http:localhost:5173">
                    <img src="https://spacingtech.com/html/tm/freozy/freezy-ltr/image/logo/logo.png" style="width:80px;color:#000"/>
                  </a>
                  <p style="color:#2986cc;">Kính gửi Anh/chị: ${data.customerName
      } </p> 
                  <p>${message} </p>
                  <p style="font-weight:bold">Hóa đơn được tạo lúc: ${formatDateTime(
        data.createdAt
      )}</p>
                  <div style="border:1px solid #ccc;border-radius:10px; padding:10px 20px;width: max-content">
                  <p>Mã hóa đơn: ${data.invoiceId}</p>
                  <p>Khách hàng: ${data.customerName}</p>
                  <p>Điện thoại: ${data.phoneNumber}</p>
                  <p>Địa chỉ nhận hàng: ${data.shippingAddress}</p>
                  <table style="text-align:center">
                  <thead>
                    <tr style="background-color: #CFE2F3;">
                      <th style="padding: 10px;">STT</th>
                      <th style="padding: 10px;">Sản phẩm</th>
                      <th style="padding: 10px;">Cân nặng</th>
                      <th style="padding: 10px;">Đơn giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.products
        .map(
          (product, index) =>
            `
          <tr style="border-bottom:1px solid #ccc">
            <td style="padding: 10px;">${index + 1}</td>
            <td style="padding: 10px;"><img alt="image" src="${product.images
            }" style="width: 90px; height: 90px;border-radius:5px">
            <p>${product.productName} (${product.originName})</p>
            </td>
            <td style="padding: 10px;">${product.weight}kg</td>
            <td style="padding: 10px;">${product.price.toLocaleString(
              "vi-VN"
            )}VNĐ/kg</td>
          </tr>
       `
        )
        .join("")}
                  </tbody>
                </table>  
                <h4>Tổng: ${amountReduced != null
        ? (amountReduced + data.totalPayment).toLocaleString(
          "vi-VN"
        ) + "VND"
        : `${data.totalPayment.toLocaleString("vi-VN")}VND`
      }</h4> ${code != null ? `<p>${code}</p>` : ""}
                  <h3 style="color: red;font-weight:bold;margin-top:20px">Tổng tiền thanh toán: ${data.totalPayment.toLocaleString(
        "vi-VN"
      )}VNĐ</h3>
                  <p>Thanh toán: ${data.pay == false
        ? "Thanh toán khi nhận hàng"
        : "Đã thanh toán online"
      }</p>
                  <p>Trạng thái đơn hàng: ${data.status}</p>
                  </div>
                   <p>Xin cảm ơn quý khách!</p>
                   <p style="color:#2986CC;font-weight:500;">Bộ phận chăm sóc khách hàng FRESH MART: <a href="tel:0565079665">0565 079 665</a></p>
                </div>`,
  });
};
//Tạo mới đơn hàng
export const CreateOrder = async (req, res) => {
  try {
    const { products, paymentMethod } = req.body;
    const { error } = validateCheckout.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(401).json({
        status: 401,
        message: error.details.map((error) => error.message),
      });
    }
    if (!products || products.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "Cannot place an order due to empty product",
      });
    }
    const errors = [];
    for (let item of products) {
      if (item.weight <= 0) {
        errors.push({
          productId: item.productId,
          weight: item.weight,
          message: "Invalid Product Weight!",
        });
      }
      const prd = await Product.findById(item.productId);
      if (!prd) {
        errors.push({
          productId: item.productId,
          message: "Invalid data!",
        });
      } else {
        if (item.price != prd.price - (prd.price * prd.discount) / 100) {
          errors.push({
            productId: item.productId,
            price: prd.price - (prd.price * prd.discount) / 100,
            message: "Invalid Product Price!",
          });
        }
        if (item.productName != prd.productName) {
          errors.unshift({
            productId: item.productId,
            productName: prd.productName,
            message: "Invalid Product Name!",
          });
        }
        if (item.images != prd.images[0].url) {
          errors.push({
            productId: item.productId,
            images: prd.images[0].url,
            message: "Invalid Product Image!",
          });
        }
        const currentTotalWeight = prd.shipments.reduce(
          (accumulator, shipment) => accumulator + shipment.weight,
          0
        );
        if (prd.shipments.length === 0) {
          errors.push({
            productId: item.productId,
            message: "The product is currently out of stock!",
          });
        } else if (item.weight > currentTotalWeight) {
          errors.push({
            productId: item.productId,
            message: "Insufficient quantity of the product in stock!",
            maxWeight: currentTotalWeight,
          });
        }
      }
    }
    if (errors.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Error",
        body: { errors },
      });
    }
    let totalPayment = null; //--- tổng thanh toán -------//
    let amountReduced = null; //----- số tiền đã giảm------  //
    for (let item of products) {
      const prd = await Product.findById(item.productId);
      totalPayment +=
        (prd.price - (prd.price * prd.discount) / 100) * item.weight;
    }
    //KH đăng nhập
    if (req.user != null) {
      req.body["userId"] = req.user._id;
      //Nếu dùng mã voucher
      if (req.body.code) {
        //Ktra mã có tồn tại ko
        const voucherExist = await vouchers.findOne({ code: req.body.code });
        if (!voucherExist) {
          return res.status(404).json({
            status: 404,
            message: "Voucher does not exist!",
          });
        }
        //Hết số lượng
        if (voucherExist.quantity == 0) {
          return res.status(400).json({
            status: 400,
            message: "Voucher is out of quantity!",
          });
        }
        //Voucher ko còn hoạt động
        if (voucherExist.status == false) {
          return res.status(400).json({
            status: 400,
            message: "Voucher does not work!",
          });
        }

        //Voucher đã hết hạn
        const dateNow = new Date();
        const endOfDay = new Date(voucherExist.dateEnd);
        endOfDay.setHours(23, 59, 59, 999);
        if (endOfDay < dateNow) {
          return res.status(400).json({
            status: 400,
            message: "Voucher is out of date",
          });
        }
        //Voucher chưa được bắt đầu sử dụng
        const startOfDay = new Date(voucherExist.dateStart)
        startOfDay.setHours(0, 0, 0, 0);
        if (startOfDay > dateNow) {
          return res.status(400).json({
            status: 400,
            message: "Sorry, this voucher is not yet available for use!",
          });
        }
        //Chưa đạt yc với tối thiểu đơn hàng
        if (
          voucherExist.miniMumOrder > 0 &&
          voucherExist.miniMumOrder > totalPayment
        ) {
          return res.status(400).json({
            status: 400,
            message: "Orders are not satisfactory!",
          });
        }

        //Check xem user đã dùng voucher này chưa
        const userExist = await vouchers.findOne({
          code: req.body.code,
          "users.userId": req.body.userId,
        });
        if (userExist) {
          return res.status(400).json({
            status: 400,
            message:
              "This voucher code has already been used. Please enter a different code!",
          });
        }

        // tính số tiền giảm:
        const amount = (totalPayment * voucherExist.percent) / 100;
        // nếu sô tiền giảm vượt quá tối đa cho phép thì trừ đi số tiền tối đa
        if (voucherExist.maxReduce > 0) {
          if (amount > voucherExist.maxReduce) {
            totalPayment = totalPayment - voucherExist.maxReduce;
            amountReduced = voucherExist.maxReduce;
          } else {
            totalPayment =
              totalPayment - (totalPayment * voucherExist.percent) / 100;
            amountReduced = (totalPayment * voucherExist.percent) / 100;
          }
        } else {
          totalPayment =
            totalPayment - (totalPayment * voucherExist.percent) / 100;
          amountReduced = (totalPayment * voucherExist.percent) / 100;
        }
        //Check tổng tiền thanh toán
        if (req.body.totalPayment !== totalPayment) {
          return res.status(400).json({
            status: 400,
            message: "Invalid totalPayment!",
            true: totalPayment,
            false: req.body.totalPayment,
          });
        }
      }
    }
    //Check tổng tiền thanh toán
    if (req.body.totalPayment !== totalPayment) {
      return res.status(400).json({
        status: 400,
        message: "Invalid totalPayment!",
        true: totalPayment,
        false: req.body.totalPayment,
      });
    }
    //Lặp qua mảng products gửi lên
    for (let item of products) {
      const prd = await Product.findById(item.productId);
      // Update sold +
      await Product.findByIdAndUpdate(item.productId, {
        $set: {
          sold: prd.sold + 1,
        },
      });
      let itemWeight = item.weight;
      if (itemWeight != 0 || currentTotalWeight != 0) {
        //Lặp qua từng lô 1 trong bảng products
        for (let shipment of prd.shipments) {
          if (itemWeight == 0) {
            break;
          }
          //===========================================================//
          // - Táo có lô:
          //  A(30kg),
          //  B(50kg),
          // - Mua 50kg táo => xóa lô A đi và trừ 20kg ở lô B thì
          // - Mua 10kg táo => trừ 20kg táo ở lô A
          //===========================================================//
          //TH1: Nếu số lượng mua lớn hơn số lượng trong lô hàng hiện tại
          if (shipment.weight - itemWeight <= 0) {
            //Xóa sp nếu đó là sp thanh lý
            if (prd.isSale) {
              await Product.findByIdAndDelete(prd._id);
              // thay đổi số lượng của sản phẩm trong lô hàng về 0
              await Shipment.findOneAndUpdate(
                { _id: shipment.idShipment, "products.idProduct": prd.originalID },
                {
                  $set: {
                    "products.$.weight": 0,
                  },
                }
              );
            } else {
              // xóa lô hàng hiện tại trong record của sản phẩm hiện tại
              await Product.findOneAndUpdate(
                { _id: prd._id },
                {
                  $pull: {
                    shipments: {
                      idShipment: shipment.idShipment,
                    },
                  },
                }
              );
              // thay đổi số lượng của sản phẩm trong lô hàng về 0
              await Shipment.findOneAndUpdate(
                { _id: shipment.idShipment, "products.idProduct": prd._id },
                {
                  $set: {
                    "products.$.weight": 0,
                  },
                }
              );
            }
            itemWeight = -(shipment.weight - itemWeight);
          } else {
            //TH2 : số lượng mua bé hơn số lượng trong lô hàng hiện tại của sản phẩm
            // thay đổi số lượng trong lô hàng của sản phẩm
            if (prd.isSale) {
              await Product.findOneAndUpdate(
                { _id: prd._id, "shipments.idShipment": shipment.idShipment },
                {
                  $set: {
                    "shipments.$.weight": shipment.weight - itemWeight,
                  },
                }
              );
              // thay đổi số lượng sản phẩm trong lô hàng
              await Shipment.findOneAndUpdate(
                { _id: shipment.idShipment, "products.idProduct": prd.originalID },
                {
                  $set: {
                    "products.$.weight": shipment.weight - itemWeight,
                  },
                }
              );
            } else {
              await Product.findOneAndUpdate(
                { _id: prd._id, "shipments.idShipment": shipment.idShipment },
                {
                  $set: {
                    "shipments.$.weight": shipment.weight - itemWeight,
                  },
                }
              );
              // thay đổi số lượng sản phẩm trong lô hàng
              await Shipment.findOneAndUpdate(
                { _id: shipment.idShipment, "products.idProduct": prd._id },
                {
                  $set: {
                    "products.$.weight": shipment.weight - itemWeight,
                  },
                }
              );
            }
            itemWeight = 0;
          }
        }
      }
      //Lưu lại mã lô hàng đầu tiên của sp
      if (prd.shipments.length > 0) {
        const firstShipment = prd.shipments[0];
        item.shipmentId = firstShipment.idShipment;
        // item["shipmentId"] = firstShipment.idShipment;
      }
      const origin = await Origin.findById(item.originId);
      delete item.originId;
      item.originName = origin.name;
      //nếu là sp thanh lý thì lấy lại id sp gốc
      if (prd.originalID != null) {
        item.productId = prd.originalID;
        item.isSale = true
      } else {
        item.isSale = false
      }
    }
    // console.log(req.body.products);

    let data = await Order.create(req.body);

    // nếu đăng nhập thì xóa hết sp (.) cart
    if (req.user) {
      await Carts.findOneAndUpdate(
        { userId: req.user._id },
        {
          products: [],
        }
      );
      if (req.body.code) {
        const voucherExist = await vouchers.findOne({ code: req.body.code });
        //lưu mã voucher vào đơn hàng
        const voucher = {
          code: req.body.code,
          miniMumOrder: voucherExist.miniMumOrder,
          maxReduce: voucherExist.maxReduce,
          percent: voucherExist.percent
        }
        data = await Order.findOneAndUpdate(
          { _id: data._id },
          {
            $set: {
              voucher: voucher,
            },
          },
          { new: true }
        );

        //Trừ 1 vé voucher và thêm id user
        await vouchers.findOneAndUpdate(
          { code: req.body.code },
          {
            $set: {
              quantity: voucherExist.quantity - 1,
            },
            $push: {
              users: {
                userId: req.body.userId,
              },
            },
          }
        );
      }
    }
    let url = "";
    // kiểm tra phương thức thanh toán là momo
    if (paymentMethod === "vnpay") {
      url = await vnpayCreate(req, data._id);
    } else {
      await sendMailer(req.body.email, data, amountReduced);
    }

    return res.status(201).json({
      status: 201,
      message: "Order success",
      body: { data: { ...data._doc, url } },
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

//Admin lấy tất cả đơn hàng
export const GetAllOrders = async (req, res) => {
  const {
    _page = 1,
    _order = "asc",
    _limit = 9999,
    _sort = "createdAt",
    _status = "",
    _day,
    _invoiceId = "",
  } = req.query;

  const options = {
    page: _page,
    limit: _limit,
    sort: {
      [_sort]: _order === "desc" ? -1 : 1,
    },
    populate: "products.shipmentId"
  };

  try {
    const query = {};
    if (_status) {
      query.status = _status;
    }
    const data = await Order.paginate(query, options);
    if (_invoiceId) {
      const data = await Order.find({ invoiceId: _invoiceId });
      if (!data) {
        return res.status(404).json({
          body: {
            data: [],
          },
          status: 404,
          message: "Order not found!",
        });
      }
      return res.status(201).json({
        body: {
          data: data,
        },
        status: 201,
        message: "Get order successfully",
      });
    }
    if (_day) {
      filterOrderDay(data.docs, _day, res);
      return;
    }

    if (data.docs.length == 0) {
      return res.status(200).json({
        status: 200,
        message: "There are no orders",
        body: { data: [] },
      });
    }
    return res.status(201).json({
      body: {
        data: data.docs,
        pagination: {
          currentPage: data.page,
          totalPages: data.totalPages,
          totalItems: data.totalDocs,
        },
      },
      status: 201,
      message: "Get order successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
// Khách vãng lai(ko đăng nhập) tra cứu đơn hàng qua mã đơn hàng
export const OrdersForGuest = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const data = await Order.find({ invoiceId: invoiceId });
    if (data.length == 0) {
      return res.status(200).json({
        status: 200,
        message: "Order not found",
        body: { data: [] },
      });
    }
    return res.status(201).json({
      body: {
        data,
      },
      status: 201,
      message: "Get order successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
//Khách hàng (đã đăng nhập) tra cứu đơn hàng
export const OrdersForMember = async (req, res) => {
  const { _status = "", _day, _from, _to } = req.query;
  try {
    const userId = req.user._id;
    let data = await Order.find({ userId }).sort({ createdAt: -1 });
    if (data.length == 0) {
      return res.status(200).json({
        status: 200,
        message: "Order not found",
        body: { data: [] },
      });
    }
    if (_status) {
      if (!statusOrder.includes(_status)) {
        return res.status(402).json({
          status: 402,
          message: "Invalid status",
          statusOrder,
        });
      }
      data = await Order.find({ userId, status: _status });
    }
    //lọc theo ngày gần nhất
    if (_day) {
      filterOrderDay(data, _day, res);
      return;
    }
    if (_from && _to) {
      filterOrderDay(data, _day, res, _from, _to);
      return;
    }
    return res.status(201).json({
      body: {
        data,
      },
      status: 201,
      message: "Get order successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
// Hàm xử lý lọc đơn hàng theo ngày gần nhất
export const filterOrderDay = async (data, day, res, from, to) => {
  const today = new Date();
  const filterData = [];
  if (day) {
    //Tính ngày trong qua khứ
    const dayOfPast = today - day * 24 * 60 * 60 * 1000;
    for (let item of data) {
      const itemDate = new Date(item.createdAt);
      // console.log(itemDate );
      if (itemDate >= dayOfPast && itemDate <= today) {
        filterData.push(item);
      }
    }
  }
  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    //lấy đến cuối ngày đó = cả ngày hôm đó
    toDate.setHours(23, 59, 59, 999);
    for (let item of data) {
      const itemDate = new Date(item.createdAt);
      if (itemDate >= fromDate && itemDate <= toDate) {
        filterData.push(item);
      }
    }
  }
  // console.log(today, dayOfPast, filterData);
  if (filterData.length == 0) {
    return res.json({
      message: "Order not found",
      body: { data: [] },
    });
  }
  return res.status(201).json({
    body: {
      data: filterData,
      pagination: {
        currentPage: data.page,
        totalPages: data.totalPages,
        totalItems: data.totalDocs,
      },
    },
    message: "Filter order successfully",
    status: 201,
  });

  //  console.log(filterData);
};

//Khách hàng(đã đăng nhập) lọc
export const FilterOrdersForMember = async (req, res) => {
  try {
    const userId = req.user._id;
    const { _day, _status, invoiceId } = req.query;
    // console.log(req.query);
    let data = await Order.find({ userId }).sort({ createdAt: -1 });

    //lọc theo trạng thái đơn hàng
    if (_status) {
      if (!statusOrder.includes(_status)) {
        return res.status(402).json({
          status: 402,
          message: "Invalid status",
          statusOrder,
        });
      }
      data = await Order.find({ userId, status: _status });
    }
    //lọc theo ngày gần nhất
    if (_day) {
      filterOrderDay(data, _day, res);
      return;
    }
    //lọc theo mã đơn hàng
    if (invoiceId) {
      data = await Order.find({ invoiceId });
    }
    //Ko có đơn hàng nào
    if (data.length == 0) {
      return res.status(200).json({
        status: 200,
        message: "Order not found",
        body: { data: [] },
      });
    }

    return res.status(201).json({
      body: {
        data,
      },
      status: 201,
      message: "Get order successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
// Chi tiết đơn đặt hàng
export const OrderDetail = async (req, res) => {
  try {
    const orderId = req.params.id;
    let data = await Order.findById(orderId);
    let voucher = null;
    if (data.promotionCode != null) {
      voucher = await vouchers.findOne({ code: data.promotionCode });
    }

    if (!data) {
      return res.status(404).json({
        status: 404,
        message: "Not found order",
        body: { data: {} },
      });
    }
    const { canCancel } = checkCancellationTime(data);

    return res.status(201).json({
      body: { data, voucher },
      status: 201,
      message: "Get order successfully",
      canCancel,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

export const handleReturntWeight = async (order) => {
  try {
    for (let item of order.products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        continue
      }
      // update lại sold
      await Product.findByIdAndUpdate(item.productId, {
        $set: {
          sold: product.sold - 1,
        },
        shipments: []
      });
      const shipment = await Shipment.findOne({ _id: item.shipmentId })
      // const currentShipmetIndex = shipmentsIncludeProduct.indexOf(shipmentsIncludeProduct.find((ship) => ship._id.equals(shipment._id)))
      const shipmentsIncludeProduct = await Shipment.find({ "products.idProduct": item.productId }).sort({ createdAt: -1 })
      const productHaveShipment = await Product.findOne({ _id: product._id, "shipments.idShipment": item.shipmentId })
      if (productHaveShipment) {
        for (const shipmentOnProduct of productHaveShipment.shipments) {
          if (shipmentOnProduct.idShipment.equals(item.shipmentId)) {
            // Trả lại cân ở bảng products
            await Product.findOneAndUpdate(
              { _id: product._id, "shipments.idShipment": shipmentOnProduct.idShipment },
              {
                $set: {
                  "shipments.$.weight": shipmentOnProduct.weight + item.weight,
                },
              },
              { new: true }
            );
            //Bảng shipment
            await Shipment.findOneAndUpdate(
              { _id: shipmentOnProduct.idShipment, "products.idProduct": product._id },
              {
                $set: {
                  "products.$.weight": shipmentOnProduct.weight + item.weight,
                },
              },
              { new: true }
            );
          }
        }
      } else {
        // Lặp lô hàng của từng sản phẩm
        const currentDate = new Date().getTime()
        let currentWeight = item.weight
        for (const shipmentOfProduct of shipmentsIncludeProduct) {
          for (const productOnShipment of shipmentOfProduct.products) {
            const targerDate = new Date(productOnShipment.date).getTime();
            //Check xem lô hàng đã hết hạn hay chưa nếu hết hạn thì bỏ qua
            if (productOnShipment.idProduct.equals(product._id)) {
              if (targerDate - currentDate <= 0 || shipmentOfProduct.isDisable) {
                if (currentWeight > productOnShipment.originWeight) {
                  const unsoldProduct = await UnsoleProduct.findOne({ originalID: product.isSale ? product.originalID : product._id, "shipments.shipmentId": shipmentOfProduct._id })
                  if (unsoldProduct) {
                    await UnsoleProduct.findOneAndUpdate(
                      { originalID: product._id, "shipments.shipmentId": shipmentOfProduct._id },
                      {
                        $set: {
                          "shipments.$.weight": productOnShipment.originWeight,
                        },
                      },
                      { new: true }
                    );
                  }
                  //Bảng shipment
                  await Shipment.findOneAndUpdate(
                    { _id: shipmentOfProduct._id, "products.idProduct": product._id },
                    {
                      $set: {
                        "products.$.weight": productOnShipment.originWeight,
                      },
                    },
                    { new: true }
                  );
                  currentWeight = productOnShipment.originWeight - currentWeight
                } else {
                  const unsoldProduct = await UnsoleProduct.findOne({ originalID: product._id, "shipments.shipmentId": shipmentOfProduct._id })
                  if (unsoldProduct) {
                    await UnsoleProduct.findOneAndUpdate(
                      { originalID: product._id, "shipments.shipmentId": shipmentOfProduct._id },
                      {
                        $set: {
                          "shipments.$.weight": productOnShipment.weight + currentWeight,
                        },
                      },
                      { new: true }
                    );
                  }
                  //Bảng shipment
                  await Shipment.findOneAndUpdate(
                    { _id: shipmentOfProduct._id, "products.idProduct": product._id },
                    {
                      $set: {
                        "products.$.weight": productOnShipment.weight + currentWeight,
                      },
                    },
                    { new: true }
                  );
                  currentWeight = 0
                }
                return
              }
              if (productOnShipment.weight + currentWeight > productOnShipment.originWeight) {
                // Tạo lại lô hàng cho sản phẩm rồi rả lại cân ở bảng products
                await Product.findOneAndUpdate(
                  { _id: product._id },
                  {
                    $push: {
                      shipments: {
                        $each: [{
                          idShipment: shipmentOfProduct._id,
                          originWeight: productOnShipment.originWeight,
                          weight: productOnShipment.originWeight,
                          date: productOnShipment.date,
                          originPrice: productOnShipment.originPrice,
                          price: productOnShipment.price,
                          willExpire: productOnShipment.willExpire
                        }],
                        $position: 0 // Số 0 đại diện cho việc thêm vào đầu mảng
                      },
                    },
                  },
                  { new: true }
                )
                //Bảng shipment
                await Shipment.findOneAndUpdate(
                  { _id: shipmentOfProduct._id, "products.idProduct": product._id },
                  {
                    $set: {
                      "products.$.weight": productOnShipment.originWeight,
                    },
                  },
                  { new: true }
                );
                currentWeight = currentWeight - (productOnShipment.originWeight - productOnShipment.weight)
              } else {
                // Tạo lại lô hàng cho sản phẩm rồi rả lại cân ở bảng products
                await Product.findOneAndUpdate(
                  { _id: product._id },
                  {
                    $push: {
                      shipments: {
                        $each: [{
                          idShipment: shipmentOfProduct._id,
                          originWeight: productOnShipment.originWeight,
                          weight: productOnShipment.weight + currentWeight,
                          date: productOnShipment.date,
                          originPrice: productOnShipment.originPrice,
                          price: productOnShipment.price,
                          willExpire: productOnShipment.willExpire
                        }],
                        $position: 0 // Số 0 đại diện cho việc thêm vào đầu mảng
                      },
                    },
                  },
                  { new: true }
                )
                //Bảng shipment
                await Shipment.findOneAndUpdate(
                  { _id: shipmentOfProduct._id, "products.idProduct": product._id },
                  {
                    $set: {
                      "products.$.weight": productOnShipment.weight + currentWeight,
                    },
                  },
                  { new: true }
                );
                currentWeight = 0
              }

            }
          }
          if (shipmentOfProduct._id.equals(shipment._id)) {
            return
          }
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
}

// Khách hàng hủy đơn đặt hàng
export const CanceledOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    if (order.status == failedOrder) {
      return res.status(401).json({
        status: 401,
        message: "The previous order has been cancelled",
      });
    }
    const { canCancel } = checkCancellationTime(order);
    if (canCancel) {
      const data = await Order.findByIdAndUpdate(
        orderId,
        { status: failedOrder },
        { new: true }
      );
      if (!data) {
        return res.status(400).json({
          status: 400,
          message: "Cancel failed",
        });
      }

      await handleReturntWeight(order)

      return res.status(201).json({
        body: { data },
        status: 201,
        message: "Cancel successfully",
      });
    }
    return res.status(402).json({
      status: 402,
      message: "Can not cancel this order",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Khách hàng chấp nhận đặt hàng
export const ConfirmOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const data = await Order.findByIdAndUpdate(
      orderId,
      {
        status: doneOrder,
        pay: true,
      },
      { new: true }
    );
    for (let item of data.products) {
      const prd = await Product.findById(item.productId);
      // Update sold +
      await Product.findByIdAndUpdate(item.productId, {
        $set: {
          sold: prd.sold + 1,
        },
      });
    }

    if (!data) {
      return res.status(400).json({
        status: 400,
        message: "confirm failed",
      });
    }
    return res.status(201).json({
      body: { data },
      status: 201,
      message: "confirm successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Admin cập nhật đơn hàng gồm: ngày dự kiến nhận hàng, trạng thái đơn hàng, trạng thái thanh toán.
export const UpdateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const currentOrder = await Order.findById(orderId);
    if (!currentOrder) {
      return res.status(404).json({
        status: 404,
        message: "Order not found",
        body: { data: {} },
      });
    }
    let data = null
    if (currentOrder.status != "đơn hàng hoàn thành" && status == failedOrder) {
      data = await Order.findByIdAndUpdate(
        orderId,
        { ...req.body, userId: new mongoose.Types.ObjectId(req.body.userId) },
        {
          new: true,
        }
      );

    }else{
      return res.status(400).json({
        message: "The completed order is not canceled!",  
      });
    }
    if (!statusOrder.includes(status) && status != failedOrder) {
      return res.status(402).json({
        status: 402,
        message: "Invalid status",
        statusOrder,
      });
    }

    const currentStatusIndex = statusOrder.indexOf(currentOrder.status);
    const newStatusIndex = statusOrder.indexOf(status);
    if (newStatusIndex != currentStatusIndex + 1 && status != failedOrder) {
      return res.status(401).json({
        status: 400,
        message: "Trạng thái đơn hàng update phải theo tuần tự!",
        statusOrder,
      });
    }
    data = await Order.findByIdAndUpdate(
      orderId,
      { ...req.body, userId: new mongoose.Types.ObjectId(req.body.userId) },
      {
        new: true,
      }
    );

    if (status == 'đã hủy') {
      await handleReturntWeight(currentOrder)
    }

    sendMailer(data.email, data);
    return res.status(201).json({
      body: { data },
      status: 201,
      message: "Order update successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
//