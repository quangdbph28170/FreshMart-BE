import Cart from "../models/carts"
import Product from "../models/products"
import Shipment from "../models/shipment"
import { cartDB, cartValid } from "../validation/cart"

//Check cân nặng của sp (.) giỏ hàng khi add vào update 
const checkWeight = async (productId, weight, userId) => {
    let totalWeight = 0
    const checkProduct = await Product.findById(productId)
    const cartExist = await Cart.findOne({ userId })
    for (let item of checkProduct.shipments) {
        totalWeight += item.weight
    }
    //Trong kho hết hàng
    if (checkProduct.shipments.length == 0) {
        throw new Error("Sản phẩm hiện đã hết hàng!");
    }
    //Check cân gửi lên lớn hơn tổng cân trong kho
    if (weight > totalWeight) {
        throw new Error("Số cân còn lại trong kho không đủ!");
    }
    if (cartExist) {
        const productExits = cartExist.products.find(item => item.productId == productId)
        // console.log(productExits.weight,totalWeight);
        //Check xem cân sp gửi lên vs cân có trong giỏ hàng có lớn hơn tổng cân trong kho ko
        if (productExits) {
            if (weight + productExits.weight > totalWeight) {
                throw new Error("Số cân còn lại trong kho không đủ!");
            }
        }
    }

    //Check cân phải lớn hơn 0
    if (weight <= 0) {
        throw new Error("Vui lòng kiểm tra lại số cân!");
    }

}

//Tính tổng tiền
const calculateTotalPrice = async (data) => {
    let totalPrice = 0;
    for (let item of data.products) {
        //Đảm bảo tính tổng tiền những sp còn tồn tại (.) kho
        if (item.productId) {
            await data.populate("products.productId")
            await data.populate("products.productId.originId")
            totalPrice += item.productId.price * item.weight;
        }

    }
    return totalPrice;
}

//Thêm sp vào giỏ hàng
export const addToCart = async (req, res) => {
    try {
        const { error } = cartDB.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(401).json({
                status: 401,
                message: error.details.map((error) => error.message),
            });
        }
        const userId = req.user._id;
        const { productId, productName, weight } = req.body;
        let totalPrice = 0;
        const checkProduct = await Product.findById(productId);
        if (!checkProduct) {
            return res.status(404).json({
                status: 404,
                message: "Product not found",
            });
        }
        // Check cân 
        await checkWeight(productId, weight, userId);
        console.log(productId, "new product")
        // check xem người dùng đã có giỏ hàng chưa
        let cartExist = await Cart.findOne({ userId });
        let data = null;

        if (!cartExist) {
            // nếu chưa có => Tạo luôn
            cartExist = await Cart.create({
                userId,
                products: [
                    {
                        productId,
                        productName,
                        weight,
                    },
                ],
            });
            data = cartExist;
        } else {
            // người dùng đã có giỏ hàng: check xem sp đó có trong giỏ hàng chưa
            const productExist = cartExist.products.find(
                (item) => item.productId == productId
            );

            if (!productExist) {
                // nếu chưa thì add sp đó vào giỏ hàng
                cartExist.products.push({
                    productId,
                    productName,
                    weight,
                });
            } else {
                // sản phẩm đã có trong giỏ hàng: cập nhật lại số lượng
                productExist.weight += weight;
            }
            data = await cartExist.save();
            await data.populate("products.productId");
        }

        // Tính tổng tiền
        totalPrice += await calculateTotalPrice(data)
        return res.status(200).json({
            message: "Add to cart successfully",
            body: { data, totalPrice },
            status: 200,
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
};

//Update số lượng 
export const updateProductWeightInCart = async (req, res) => {
    try {
        const { weight, productId } = req.body
        let totalPrice = 0;
        await checkWeight(productId, weight)
        const data = await Cart.findOneAndUpdate(
            { userId: req.user._id, "products.productId": productId },
            {
                $set: {
                    "products.$.weight": weight
                }
            }, { new: true })

        //Tính tổng lại tiền
        totalPrice = await calculateTotalPrice(data)

        return res.status(200).json({
            status: 200,
            message: "Update weight successfully",
            body: { data, totalPrice }
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}

// Lấy giỏ hàng
export const getCart = async (req, res) => {
    try {
        let totalPrice = 0;
        let data = await Cart.findOne({ userId: req.user._id });
        const errors = [];
        if (data || data.products.length > 0) {
            for (let item of data.products) {
                const productExist = await Product.findById(item.productId);
                // TH1: Nếu sp trong giỏ hàng ko còn tồn tại
                if (!productExist) {
                    // => Xóa nó khỏi cart
                    data = await Cart.findOneAndUpdate(
                        { userId: req.user._id, "products.productId": item.productId },
                        {
                            $pull: {
                                products: {
                                    productId: item.productId
                                },
                            }
                        },
                        { new: true }
                    );
                    //Tính lại tổng tiền
                    totalPrice += await calculateTotalPrice(data);
                    errors.push({
                        productName: item.productName,
                        message: "Product is no longer available!",
                    });
                } else {
                    let totalWeight = 0;
                    for (let shipment of productExist.shipments) {
                        totalWeight += shipment.weight;
                    }
                    //TH2: nếu sp đã hết hàng
                    if (productExist.shipments.length == 0) {
                        data = await Cart.findOneAndUpdate(
                            { userId: req.user._id, "products.productId": item.productId },
                            {
                                $pull: {
                                    products: {
                                        productId: item.productId
                                    },
                                }
                            },
                            { new: true }
                        );
                        //Tính lại tổng tiền
                        totalPrice += await calculateTotalPrice(data);
                        errors.push({
                            productName: item.productName,
                            message: "Product is currently out of stock!",
                        });
                    }
                    // TH3: nếu trong kho ko đủ số cân update lại bằng max cân có thể mua
                    if (item.weight > totalWeight) {
                        data = await Cart.findOneAndUpdate(
                            { userId: req.user._id, "products.productId": item.productId },
                            {
                                $set: {
                                    "products.$.weight": totalWeight
                                }
                            },
                            { new: true }
                        );
                        //Tính lại tổng tiền
                        totalPrice += await calculateTotalPrice(data);
                        errors.push({
                            productName: item.productName,
                            message: "Product can be purchased up to " + totalWeight + "kg!",
                        });
                    }
                }
            }
            //Tính lại tổng tiền
            totalPrice += await calculateTotalPrice(data);
        } else {
            return res.status(201).json({
                status: 201,
                message: "Cart empty",
                body: { data: [], totalPrice: 0 }
            });
        }

        if (errors.length > 0) {
            return res.status(201).json({
                status: 201,
                message: "Errors in the cart",
                body: { errors, data, totalPrice }
            });
        }

        return res.status(200).json({
            status: 200,
            message: "Get cart successfully",
            body: { data, totalPrice }
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}
//Xóa 1 sp (.) giỏ hàng
export const removeOneProductInCart = async (req, res) => {
    try {
        let totalPrice = 0
        const data = await Cart.findOneAndUpdate({ userId: req.user._id, "products.productId": req.params.id },
            {
                $pull: {
                    products: { productId: req.params.id }
                }
            }, { new: true }).populate("products.productId")
        if (!data) {
            return res.status(401).json({
                status: 401,
                message: "Remove product in cart failed",
            });
        }
        if (data.products.length == 0) {
            return res.status(201).json({
                status: 201,
                message: "Cart empty",
            });
        }
        for (let item of data.products) {
            totalPrice += item.productId.price * item.weight;
        }
        return res.status(200).json({
            status: 200,
            message: "Remove product in cart successfully",
            body: { data, totalPrice }
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}

//Xóa all sp (.) giỏ hàng
export const removeAllProductInCart = async (req, res) => {
    try {
        const data = await Cart.findOneAndUpdate({ userId: req.user._id },
            {
                products: []
            }, { new: true })

        return res.status(200).json({
            status: 200,
            message: "Cart empty",
            // body: { data}
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}

//Check cart local 
export const cartLocal = async (req, res) => {
    try {
        let totalPayment = 0;
        const errors = [];
        const products = req.body.products;
        const { error } = cartValid.validate(req.body, { abortEarly: false })
        if (error) {
            return res.status(401).json({
                status: 401,
                message: error.details.map((error) => error.message),
            });
        }
        for (let item of products) {
            const prd = await Product.findById(item.productId._id);
            if (!prd) {
                errors.push({
                    productId: item.productId,
                    productName: item.productId.productName,
                    message: "Product is not exsit!",
                });
            } else {
                if (item.productId.price !== prd.price) {
                    errors.push({
                        productId: item.productId._id,
                        price: prd.price,
                        productName: prd.productName,
                        message: `Invalid price for product!`,
                    });
                }

                if (item.productId.productName !== prd.productName) {
                    errors.push({
                        productId: item.productId._id,
                        productName: prd.productName,
                        message: "Invalid product name!",
                    });
                }
                if (item.productId.originId._id !== prd.originId) {
                    errors.push({
                        productId: item.productId._id,
                        originId: item.productId.originId,
                        productName: prd.productName,
                        message: "Invalid product origin!",
                    });
                }

                if (item.productId.images[0].url !== prd.images[0].url) {
                    errors.push({
                        productId: item.productId._id,
                        image: item.productId.images,
                        productName: prd.productName,
                        message: "Invalid product image!",
                    });
                }

                if (item.weight <= 0) {
                    errors.push({
                        productId: item.productId._id,
                        weight: item.weight,
                        productName: prd.productName,
                        message: "Invalid product weight!",
                    });
                }
                const currentTotalWeight = prd.shipments.reduce(
                    (accumulator, shipment) => accumulator + shipment.weight, 0);
                if (prd.shipments.length === 0) {
                    errors.push({
                        productId: item.productId._id,
                        productName: prd.productName,
                        message: "The product is currently out of stock!",
                    });
                } else if (item.weight > currentTotalWeight) {
                    errors.push({
                        productId: item.productId._id,
                        productName: prd.productName,
                        message: "Insufficient quantity of the product in stock!",
                        maxWeight: currentTotalWeight,
                    });
                }

                totalPayment += prd.price;
            }


        }

        if (errors.length > 0) {
            return res.status(400).json({
                status: 400,
                message: "Error",
                body: { error: errors },
            });
        }

        if (req.body.totalPayment !== totalPayment) {
            return res.status(400).json({
                status: 400,
                message: "Invalid totalPayment!",
                true: totalPayment,
                false: req.body.totalPayment
            });
        }

        return res.status(200).json({
            status: 200,
            message: "Valid",
            body: { data: true },
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
};