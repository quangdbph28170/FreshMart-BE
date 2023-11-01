import User from "../models/user";
import Order from "../models/orders"
import Product from "../models/products"
import Shipment from "../models/shipment"
import { validateCheckout, validatePhoneAndMail } from "../validation/checkout"
import { transporter } from "../config/mail"

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
            const prd = await Product.findById(item.productId)
            const currentTotalWeight = prd.shipments.reduce((accumulator, shipment) => accumulator + shipment.weight,0)
            let totalWeight = item.weight
            if (item.weight > currentTotalWeight) {
                return res.status(400).json({
                    status: 400,
                    message: "Ko đủ số lượng "
                })
            }
            if (totalWeight != 0 || currentTotalWeight != 0) {
                for (let shipment of prd.shipments) {
                    if (totalWeight == 0) {
                        break;
                    }
                    if (shipment.weight - totalWeight <= 0) {
                        await Product.findOneAndUpdate({ _id: prd._id, "shipments.idShipment": shipment.idShipment }, {
                            $set: {
                                'shipments.$.weight': 0
                            }
                        })
                        await Shipment.findOneAndUpdate({ _id: shipment.idShipment, "products.idProduct": prd._id }, {
                            $set: {
                                'products.$.weight': 0,
                                isDisable: true
                            }
                        })
                        totalWeight = -(shipment.weight - totalWeight)

                    } else {
                        await Product.findOneAndUpdate({ _id: prd._id, "shipments.idShipment": shipment.idShipment }, {
                            $set: {
                                'shipments.$.weight': shipment.weight - totalWeight
                            }
                        })
                        await Shipment.findOneAndUpdate({ _id: shipment.idShipment, "products.idProduct": prd._id }, {
                            $set: {
                                'products.$.weight': shipment.weight - totalWeight,
                            }
                        })
                        totalWeight = 0
                    }
                }
            }
        }
        // console.log(req.user);
        const data = await Order.create(req.body)
        if(req.user != null){
            await Order.findByIdAndUpdate(data._id, {userId: req.user._id})
            await User.findByIdAndUpdate(req.user._id,{
                $push:{
                    orders:data._id
                }
            })
        }
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
                    <p style="font-size: 16px;color: #2a9dcc; margin:0"> ${product.productId.productName} (${product.weight}kg)</p> 
                   <div>
                   <p style="font-size: 16px; color: red;"> ${product.price.toLocaleString("vi-VN")}VNĐ </p>
                   </div>
                    </div>
                    </div>
                `).join('')}
                   </div>
                   <p style="color: red;font-weight:bold";>Tổng tiền thanh toán: ${data.totalPayment.toLocaleString("vi-VN")}VNĐ</p>
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
    const { _page = 1, _order = "asc", _limit = 10, _sort = "createdAt", _q = "" } = req.query;

    const options = {
        page: _page,
        limit: _limit,
        sort: {
            [_sort]: _order === "desc" ? -1 : 1,
        },
    };

    try {
        const data = await Order.paginate({},options)
        if ( data.docs.length == 0) {
            return res.status(200).json({
                status: 200,
                message: "There are no orders"
            })
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
            message: "Get order successfully"
        })
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
        const data = email ? await Order.find({ email }) : await Order.find({ phoneNumber:phoneNumber })
        if(data.length == 0){
            return res.status(200).json({
                status: 200,
                message: "Order not found"
            })
        }
        return res.status(201).json({
            body: {
                data  
            },
            status: 201,
            message: "Get order successfully"
        })
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
        if(data.length == 0){
            return res.status(200).json({
                status: 200,
                message: "Order not found"
            })
        }
        return res.status(201).json({
            body: {
                data  
            },
            status: 201,
            message: "Get order successfully"
        })
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
        console.log(userId);
        const data = await Order.find({ userId,status })
        if(data.length == 0){
            return res.status(200).json({
                status: 200,
                message: "Order not found"
            })
        }
        return res.status(201).json({
            body: {
                data  
            },
            status: 201,
            message: "Get order successfully"
        })
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
        const orderId = req.params.id
        const data = await Order.findById(orderId).populate("products.productId")
        const { canCancel } = checkCancellationTime(data);
        return res.status(201).json({
            body: { data },
            status: 201,
            message: "Get order successfully",
            canCancel
        })
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
        const orderId = req.params.id
        const order = await Order.findById(orderId)
        const { canCancel } = checkCancellationTime(order);
        if (canCancel) {
            const data = await Order.findByIdAndUpdate(orderId, { status: "đã hủy" }, { new: true })
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
        }
        return res.status(402).json({
            status: 402,
            message: "Can not cancel this order"
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
        const orderId = req.params.id
        const { status } = req.body;
        const currentOrder = await Order.findById(orderId);
        if (!currentOrder) {
            return res.status(404).json({
                status: 404,
                message: "Order not found"
            });
        }
        const validStatuses = ["chờ xác nhận", "đang giao hàng", "đã hoàn thành", "đã hủy"];
        if (!validStatuses.includes(status)) {
            return res.status(402).json({
                status: 402,
                message: "Invalid status update"
            });
        }
        const currentStatusIndex = validStatuses.indexOf(currentOrder.status);
        const newStatusIndex = validStatuses.indexOf(status);
        if (newStatusIndex < currentStatusIndex) {
            return res.status(401).json({
                status: 400,
                message: "Invalid status update. Status can only be updated in a sequential order."
            });
        }
        const data = await Order.findByIdAndUpdate(orderId, req.req.body, { new: true })
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


