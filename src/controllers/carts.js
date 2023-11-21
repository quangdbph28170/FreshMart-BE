import Cart from "../models/carts"
import Product from "../models/products"
import Shipment from "../models/shipment"

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

//Thêm sp vào giỏ hàng
export const addToCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, weight } = req.body;
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
                    weight,
                });
            } else {
                // sản phẩm đã có trong giỏ hàng: cập nhật lại số lượng
                productExist.weight += weight;
            }
            data = await cartExist.save();
            await data.populate("products.productId");
        }

        // Tính tổng giá tiền
        for (let item of data.products) {
            // tránh th sp trong giỏ hàng ko còn trong products nó sẽ lỗi price
            if (await Product.findById(item.productId)) {
                totalPrice += item.productId.price * item.weight;
            }
        }

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
        await checkWeight(productId, weight)
        const data = await Cart.findOneAndUpdate(
            { userId: req.user._id, "products.productId": productId },
            {
                $set: {
                    "products.$.weight": weight
                }
            }, { new: true }).populate("products.productId")
        return res.status(200).json({
            status: 200,
            message: "Update weight successfully",
            body: { data }
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
        let data = await Cart.findOne({ userId: req.user._id })

        for (let item of data.products) {
            //Check lại xem sp còn tồn tại trong products ko
            const productExist = await Product.findById(item.productId)
            //nếu ko còn
            if (!productExist) {
                //truy vấn vào shipment để lấy dữ liệu 
                const product = await Shipment.findOne({ "products.idProduct": item.productId })

                // update lại cart: loại bỏ sp đó khỏi cart
                data = await Cart.findOneAndUpdate({ userId: req.user._id, "products.productId": item.productId }, {
                    $pull: {
                        products: {
                            productId: item.productId
                        },
                    }
                }, { new: true })
                await data.populate("products.productId")
                for (let item of data.products) {
                    totalPrice = item.productId.price * item.weight;
                }
                return res.status(201).json({
                    status: 201,
                    message: "Sản phẩm " + item.productId + " hiện ko còn trong kho!",
                    body: { data, totalPrice }

                });
            }
            let totalWeight = 0
            //Nếu có trong kho thì Check xem sp đó trong kho hiện tại còn đủ số lượng ko
            for (let item of productExist.shipments) {
                totalWeight += item.weight
            }
            //nếu trong kho hết hàng totalWeight =0 => Xóa khỏi giỏ hàng
            if (totalWeight == 0) {
                data = await Cart.findOneAndUpdate({ userId: req.user._id, "products.productId": item.productId }, {
                    $pull: {
                        products: {
                            productId: item.productId
                        },
                    }
                }, { new: true })
                await data.populate("products.productId")
                for (let item of data.products) {
                    totalPrice = item.productId.price * item.weight;
                }
                return res.status(201).json({
                    status: 201,
                    message: "Sản phẩm " + productExist.productName + " hiện đã hết hàng!",
                    body: { data, totalPrice }
                })
            }
            //nếu vượt quá số cân cho phép thì update = tổng cân trong kho
            if (item.weight > totalWeight) {
                data = await Cart.findOneAndUpdate({ userId: req.user._id, "products.productId": item.productId }, {
                    $set: {
                        "products.$.weight": totalWeight
                    }
                }, { new: true })
                await data.populate("products.productId")
                for (let item of data.products) {
                    totalPrice = item.productId.price * item.weight;
                }
                return res.status(201).json({
                    status: 201,
                    message: "Sản phẩm " + productExist.productName + " hiện có thể mua là " + totalWeight + ("kg"),
                    body: { data, totalPrice }
                })
            }

        }
        await data.populate("products.productId")
        for (let item of data.products) {
            totalPrice = item.productId.price * item.weight;
        }
        if (!data || data.products.length == 0) {
            return res.status(201).json({
                status: 201,
                message: "Cart empty",
                body: { data, totalPrice }
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
        const errors = [];
        const products = req.body.products;

        for (let item of products) {
            const prd = await Product.findById(item._id);

            if (!prd) {
                errors.push({
                    _id: item._id,
                    message: "Invalid data!",
                });
                continue;
            }

            if (item.price !== prd.price) {
                errors.push({
                    _id: item._id,
                    price: item.price,
                    message: `Invalid price for product ${prd.productName}!`,
                });
            }

            if (item.name !== prd.productName) {
                errors.push({
                    _id: item._id,
                    name: item.name,
                    message: "Invalid data!",
                });
            }

            if (item.images !== prd.images[0].url) {
                errors.push({
                    _id: item._id,
                    image: item.images,
                    message: "Invalid product image!",
                });
            }

            const currentTotalWeight = prd.shipments.reduce(
                (accumulator, shipment) => accumulator + shipment.weight,
                0
            );

            if (prd.shipments.length === 0) {
                errors.push({
                    _id: item._id,
                    message: "The product is currently out of stock!",
                });
            } else if (item.weight > currentTotalWeight) {
                errors.push({
                    _id: item._id,
                    message: "Insufficient quantity of the product in stock!",
                    maxWeight: currentTotalWeight,
                });
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                status: 400,
                message: "Error",
                body: { error: errors },
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