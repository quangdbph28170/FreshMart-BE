import mongoose from "mongoose";
import Order from "../models/orders";
import Product from "../models/products";
import Shipment from "../models/shipment";
import { validateCheckout } from "../validation/checkout";
import { transporter } from "../config/mail";
import { handleTransaction } from "./momo-pay";
import { statusOrder } from "../config/constants";
import Carts from "../models/carts";
import { vnpayCreate } from "./vnpay";
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
const sendMailer = async (email, data) => {


  // console.log(email,data);
  await transporter.sendMail({
    from: "namphpmailer@gmail.com",
    to: email,
    subject: "Thông báo đặt hàng thành công ✔",
    html: `<div>
                  <a target="_blank" href="http:localhost:5173">
                    <img src="https://spacingtech.com/html/tm/freozy/freezy-ltr/image/logo/logo.png" style="width:80px;color:#000"/>
                  </a>
                  <p style="color:#2986cc;">Kính gửi Anh/chị: ${data.customerName
      } </p> 
                  <p>Cảm ơn Anh/chị đã mua hàng tại FRESH MART. Chúng tôi cảm thấy may mắn khi được phục vụ Anh/chị. Sau đây là hóa đơn chi tiết về đơn hàng</p>
                  <p style="font-weight:bold">Hóa đơn được tạo lúc: ${formatDateTime(data.createdAt)}</p>
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
        .map((product, index) =>
          `
          <tr style="border-bottom:1px solid #ccc">
            <td style="padding: 10px;">${index + 1}</td>
            <td style="padding: 10px;"><img alt="image" src="${product.images
          }" style="width: 90px; height: 90px;border-radius:5px">
            <p>${product.productName}</p>
            </td>
            <td style="padding: 10px;">${product.weight}kg</td>
            <td style="padding: 10px;">${product.price.toLocaleString(
            "vi-VN"
          )}VNĐ</td>
          </tr>
       `

        )

        .join("")}
                  </tbody>
                </table>  
                  <p style="color: red;font-weight:bold;margin-top:20px">Tổng tiền thanh toán: ${data.totalPayment.toLocaleString(
          "vi-VN"
        )}VNĐ</p>
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
          message: 'Invalid Product Weight!'
        });
      }
      const prd = await Product.findById(item.productId);
      if (!prd) {
        errors.push({
          productId: item.productId,
          message: "Invalid data!",
        });
      } else {
        // if (!new mongoose.Types.ObjectId(item.originId._id).equals(prd.originId)) {
        //   errors.push({
        //     productId: item.productId,
        //     originId: item.originId,
        //     message: 'Invalid Product Origin!'
        //   });

        if (item.price != prd.price - prd.price * prd.discount/100) {
          errors.push({
            productId: item.productId,
            price: item.price,
            message: 'Invalid Product Price!'
          });
        }
        if (item.productName != prd.productName) {
          errors.unshift({
            productId: item.productId,
            productName: item.productName,
            message: 'Invalid Product Name!'
          });
        }
        if (item.images != prd.images[0].url) {
          errors.push({
            productId: item.productId,
            images: item.images,
            message: 'Invalid Product Image!'
          });
        }
        const currentTotalWeight = prd.shipments.reduce(
          (accumulator, shipment) => accumulator + shipment.weight, 0);
        if (prd.shipments.length === 0) {
          errors.push({
            productId: item.productId,
            message: "The product is currently out of stock!",
          });
        } else if (item.weight > currentTotalWeight) {
          errors.push({
            productId: item.productId,
            weight: item.weight,
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
    const prd = await Product.findById(item.productId);
    const totalPayment = products.reduce((accumulator, product) => {
      return accumulator + (prd.price - (prd.price * prd.discount/100)  - product.weight)
    }, 0)

    // kiểm tra phương thức thanh toán là momo
    if (paymentMethod === "vnpay") {
      await vnpayCreate(req, res)
    }
    
    if (req.body.totalPayment !== totalPayment) {
      return res.status(400).json({
        status: 400,
        message: "Invalid totalPayment!",
        true: totalPayment,
        false: req.body.totalPayment
      });
    }


    for (let item of products) {

      const prd = await Product.findById(item.productId);
      let itemWeight = item.weight;
      if (itemWeight != 0 || currentTotalWeight != 0) {
        for (let shipment of prd.shipments) {
          if (itemWeight == 0) {
            break;
          }
          //TH1: Nếu số lượng mua lớn hơn só lượng trong lô hàng hiện tại
          if (shipment.weight - itemWeight <= 0) {
            if (prd.isSale) {
              await Product.findByIdAndDelete(prd._id)
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
            }
            // thay đổi số lượng của sản phẩm trong lô hàng về 0
            await Shipment.findOneAndUpdate(
              { _id: shipment.idShipment, "products.idProduct": prd._id },
              {
                $set: {
                  "products.$.weight": 0,
                },
              }
            );
            itemWeight = -(shipment.weight - itemWeight);
          } else {
            //TH2 : số lượng mua bé hơn số lượng trong lô hàng hiện tại của sản phẩm
            // thay đổi số lượng trong lô hàng của sản phẩm
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
            itemWeight = 0;
          }
        }
      }
    }


    // console.log(req.user);
    if (req.user != null) {
      req.body["userId"] = req.user._id;
      await Carts.findOneAndUpdate({ userId: req.user._id }, {
        products: []
      })
    }
    const data = await Order.create(req.body);

    await sendMailer(req.body.email, data);
    return res.status(201).json({
      status: 201,
      message: "Order success",
      body: { data },
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
  };

  try {
    const query = {};
    if (_status) {
      query.status = _status;
    }
    const data = await Order.paginate(query, options);
    if (_invoiceId) {
      const data = await Order.findOne({ invoiceId: _invoiceId });
      if (!data) {
        return res.status(404).json({
          body: {
            data: {},
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
  const { _status = "", _day } = req.query;
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
export const filterOrderDay = async (data, day, res) => {
  const today = new Date();
  const dayOfPast = today - day * 24 * 60 * 60 * 1000;
  const filterData = [];

  for (let item of data) {
    const itemDate = new Date(item.createdAt);
    // console.log(itemDate );
    if (itemDate >= dayOfPast && itemDate <= today) {
      filterData.push(item);
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
    const data = await Order.findById(orderId);
    if (!data) {
      return res.status(404).json({
        status: 404,
        message: "Not found order",
        body: { data: {} },
      });
    }
    const { canCancel } = checkCancellationTime(data);
    return res.status(201).json({
      body: { data },
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

// Khách hàng hủy đơn đặt hàng
export const CanceledOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    if (order.status == "đã hủy đơn hàng") {
      return res.status(401).json({
        status: 401,
        message: "The previous order has been cancelled",
      });
    }
    const { canCancel } = checkCancellationTime(order);
    if (canCancel) {
      const data = await Order.findByIdAndUpdate(
        orderId,
        { status: "đã hủy đơn hàng" },
        { new: true }
      );
      if (!data) {
        return res.status(400).json({
          status: 400,
          message: "Cancel failed",
        });
      }

      for (let item of order.products) {

        const product = await Product.findById(item.productId)
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
      { status: "đơn hàng hoàn thành" },
      { new: true }
    );
    if (!data) {
      return res.status(400).json({
        status: 400,
        message: "cofirm failed",
      });
    }
    return res.status(201).json({
      body: { data },
      status: 201,
      message: "cofirm successfully",
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

    if (!statusOrder.includes(status)) {
      return res.status(402).json({
        status: 402,
        message: "Invalid status",
        statusOrder,
      });
    }
    const currentStatusIndex = statusOrder.indexOf(currentOrder.status);
    const newStatusIndex = statusOrder.indexOf(status);
    if (newStatusIndex != currentStatusIndex + 1) {
      return res.status(401).json({
        status: 400,
        message: "Trạng thái đơn hàng update phải theo tuần tự!",
        statusOrder,
      });
    }
    const data = await Order.findByIdAndUpdate(
      orderId,
      { ...req.body, userId: new mongoose.Types.ObjectId(req.body.userId) },
      {
        new: true,
      }
    );

    sendMailer(data.email, data)
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
