// import User from "../models/users";
import Order from "../models/orders"
import Product from "../models/products"
import { validateCheckout, validatePhoneAndMail } from "../validation/checkout"
import { transporter } from "../config/mail"
// Kiểm tra order
const orderExist = (data, res) => {
    // console.log("data: " + data);
    if (!data) {
        return res.status(404).json({
            status: 404,
            message: "Order not found"
        })
    }
    if (data.length == 0) {
        return res.status(200).json({
            status: 200,
            message: "There are no orders"
        })
    }
    return res.status(201).json({
        body: { data },
        status: 201,
        message: "Get order successfully"
    })
};

//Tạo mới đơn hàng
export const CreateOrder = async (req, res) => {
    try {
        const { customerName, phoneNumber, email, shippingAddress, products } = req.body
        const { error } = validateCheckout.validate({ customerName, phoneNumber, email, shippingAddress }, { abortEarly: false });
        if (error) {
            return res.status(401).json({
                status: 401,
                message: error.details.map(error => error.message)
            })
        }
        if (!products || products.length === 0) {
            return res.status(400).json({
                status: 400,
                message: "Cannot place an order due to empty product"
            })
        }
        for (let item of products) {
            const product = await Product.findOne({ id: item._id }).populate("shipments.idShipment")
            let size = item.size
            for (let shipment of product.shipments) {
                if (size > 0) {
                 
                }


            }

        }
        const data = await Order.create(req.body)
        await data.populate("products.productId")
        await transporter.sendMail({
            from: 'namphpmailer@gmail.com',
            to: req.body.email,
            subject: "Thông báo đặt hàng thành công ✔",
            html: `<div>
                 <a target="_blank" href="http:localhost:5173"> <img src="https://spacingtech.com/html/tm/freozy/freezy-ltr/image/logo/logo.png" style="width:150px;color:#000"/></a>
                   <h4 style="color:#2986cc;font-size:20px;border-bottom:1px solid #2986cc">Thông tin chi tiết đơn hàng</h4> 
                   <p>Mã đơn hàng: ${data._id}</p>
                   <p>Người đặt hàng: ${data.customerName}</p>
                   <p>Số điện thoại: ${data.phoneNumber}</p>
                   <p>Địa chỉ nhận hàng: ${data.shippingAddress}</p>
                   <p>Thời gian đặt hàng: ${data.createdAt.toLocaleTimeString()}</p>
                   <div>Chi tiết sản phẩm: 
                   ${data.products.map(product => `
                  <div style="display: flex;padding:20px">
                    <img alt="image" src="${product.productId.images[0].url}" style="width: 90px; height: 90px;margin-right: 15px;border-radius:5px " />
                    <div>
                    <p style="font-size: 16px;color: #2a9dcc; margin:0"> ${product.productId.productName} (${product.size}kg)</p> 
                   <div>
                   <p style="font-size: 16px; color: red;"> ${product.price.toLocaleString("vi-VN")}đ x ${product.quantity} </p>
                   </div>
                    </div>
                    </div>
                `).join('')}
                   </div>
                   <p style="color: red;font-weight:bold";>Tổng tiền thanh toán: ${data.totalPayment.toLocaleString("vi-VN")}đ</p>
                   <p>Thanh toán thanh toán: ${data.pay == false ? "Thanh toán khi nhận hàng" : "Đã thanh toán online"}</p>
                   <p>Trạng thái đơn hàng: ${data.status}</p>
                  </div>`,
        })
        return res.status(201).json({
            body: { data },
            status: 201,
            message: "Order success"
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message
        })
    }
}
//Admin lấy tất cả đơn hàng
export const GetAllOrders = async (req, res) => {
    try {
        const data = await Order.find()
        orderExist(data, res);
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message
        })
    }
}
// Khách vãng lai(ko đăng nhập) tra cứu đơn hàng qua phone or email
export const OrdersForGuest = async (req, res) => {
    try {
        const { email, phoneNumber } = req.body
        const { error } = validatePhoneAndMail.validate(req.body)
        if (error) {
            return res.status(401).json({
                status: 401,
                message: error.message
            })
        }
        const data = email ? await Order.find({ email }) : await Order.find({ phoneNumber })
        orderExist(data, res);
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message
        })
    }
}
//Khách hàng (đã đăng nhập) tra cứu đơn hàng
export const OrdersForMember = async (req, res) => {
    try {
        const userId = req.user._id
        const data = await Order.find({ userId })
        orderExist(data, res);
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message
        })
    }
}

//Khách hàng(đã đăng nhập) lọc đơn hàng theo trạng thái
export const FilterOrdersForMember = async (req, res) => {
    try {
        const { status } = req.body
        const userId = req.user._id
        const data = await Order.find({ userId }, { status })
        orderExist(data, res);
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message
        })
    }
}
// Chi tiết đơn đặt hàng
export const OrderDetail = async (req, res) => {
    try {
        const oderId = req.params.id
        const data = await Order.findById(oderId)
        orderExist(data, res);
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message
        })
    }
}

// Khách hàng hủy đơn đặt hàng
export const CanceledOrder = async (req, res) => {
    try {
        const oderId = req.params.id
        const data = await Order.findByIdAndUpdate(oderId, { status: "Đã hủy" }, { new: true })
        if (!data) {
            return res.status(400).json({
                status: 400,
                message: "Cancel failed"
            })
        }
        return res.status(201).json({
            body: { data },
            status: 201,
            message: "Cancel successfully"
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message
        })
    }
}

// Admin cập nhật đơn hàng gồm: ngày dự kiến nhận hàng, trạng thái đơn hàng, trạng thái thanh toán.
export const UpdateOrder = async (req, res) => {
    try {
        const oderId = req.params.id
        const data = await Order.findByIdAndUpdate(oderId, req.req.body, { new: true })
        if (!data) {
            return res.status(400).json({
                status: 400,
                message: "Order update failed"
            })
        }
        return res.status(201).json({
            body: { data },
            status: 201,
            message: "Order update successfully"
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message
        })
    }
}

