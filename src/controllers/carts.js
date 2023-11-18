import Cart from "../models/carts"
import Product from "../models/products"

//Check cân nặng của sp (.) giỏ hàng khi add vào update 
const checkWeight = async (productId, weight, userId) => {
    let totalWeight = 0
    const checkProduct = await Product.findById(productId)
    const cartExist = await Cart.findOne({ userId })
    for (let item of checkProduct.shipments) {
        totalWeight += item.weight
    }
    //Check cân gửi lên lớn hơn tổng cân trong kho
    if (weight > totalWeight) {
        throw new Error("The remaining weight is not enough");
    }
    if (cartExist) {
        const productExits = cartExist.products.find(item => item.productId == productId)
        // console.log(productExits.weight,totalWeight);
        //Check xem cân sp gửi lên vs cân có trong giỏ hàng có lớn hơn tổng cân trong kho ko
        if (productExits) {
            if (weight + productExits.weight > totalWeight) {
                throw new Error("The remaining weight is not enough");
            }
        }
    }

    //Check cân phải lớn hơn 0
    if (weight <= 0) {
        throw new Error("Weight is valid");
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
            totalPrice += item.productId.price * item.weight;
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
        const data = await Cart.findOne({ userId: req.user._id }).populate("products.productId")
        if (!data || data.products.length == 0) {
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