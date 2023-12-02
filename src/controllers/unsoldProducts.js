import unsoldProducts from "../models/unsoldProducts";

export const getUnsoldProducts = async (req, res) => {
    const {
        _page = 1,
        _order = "asc",
        _limit = 9999,
        _sort = "createdAt",
        _q = "",
    } = req.query;
    const options = {
        page: _page,
        limit: _limit,
        sort: {
            [_sort]: _order === "desc" ? -1 : 1,
            "shipments.price": _order === "desc" ? -1 : 1,
        },
        populate:"shipments.shipmentId"

    };

    try {
        const products = await unsoldProducts.paginate({}, options);
        return res.status(200).json({
            status: 200,
            message: "Get products successfully",
            body: {
                data: products.docs,
                pagination: {
                    currentPage: products.page,
                    totalPages: products.totalPages,
                    totalItems: products.totalDocs,
                },
            },

        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
};
export const getUnsoldProduct = async (req, res) => {
    try {
        const product = await unsoldProducts.findById(req.params.id).populate("originalID");
        if (!product) {
            return res.status(404).json({
                status: 404,
                message: "Product not found",
            });
        }
        return res.status(200).json({
            status: 200,
            message: "Get product successfully",
            body: {
                data: product,

            },
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
};