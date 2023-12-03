import mongoose from 'mongoose';

/**
    Bảng thống kê số liệu
*/
const statisticsSchema = new mongoose.Schema(
    {
        /**
         Tổng doanh thu
        */
        salesRevenue: {
            type: Number,
            required: true,
        },
        /**
         Số lượng khách hàng đăng ký
        */
        customers: {
            type: Number,
            required: true,
        },
        /**
         Lợi nhuận
        */
        profit: {
            type: Number,
            required: true,
        },
        /**
         Trung bình tổng số tiền đã thanh toán
        */
        averageTransactionPrice: {
            type: Number,
            required: true,
        },
        /**
           Sản phẩm yêu thích và kém yêu thích nhất theo số sao đánh giá
        */
        favoriteProductAndLessFavoriteProduct: {
            favoriteProduct: {
                product: {
                    type: mongoose.Types.ObjectId,
                    required: true
                },
                productName: {
                    type: String,
                    required: true
                },
                startCount: {
                    type: Number,
                    required: true
                }
            },
            lessFavoriteProduct: {
                product: {
                    type: mongoose.Types.ObjectId,
                    required: true
                },
                productName: {
                    type: String,
                    required: true
                },
                startCount: {
                    type: Number,
                    required: true
                }
            }
        },
        /**
           Top 5 tổng tiền thu được theo sản phẩm bán đã bán
        */
        topFiveProductsSold: [
            {
                productId: {
                    type: mongoose.Types.ObjectId,
                    ref: 'Products',
                    required: true,
                },
                productName: {
                    type: String,
                    required: true,
                },
                totalWeight: {
                    type: Number,
                    required: true,
                }
            }
        ],
        /**
         Top 5 danh mục có tổng doanh thu cao nhất
        */
        topFiveCategoryByRevenue: [
            {
                categoryId: {
                    type: mongoose.Types.ObjectId,
                    ref: 'Category',
                    required: true,
                },
                categoryName: {
                    type: String,
                    required: true
                },
                totalPrice: {
                    type: Number,
                    required: true,
                }
            }
        ],
        /**
         Tổng số khách hàng đăng ký và số lượt khách truy cập giao dịch(mua hàng)
        */
        totalCustomerAndTransactions: [
            {
                customers: {
                    type: Number,
                    required: true,
                },
                transactions: {
                    type: Number,
                    required: true,
                },
                month: {
                    type: Number,
                    required: true,
                },
                year: {
                    type: Number,
                    required: true,
                }
            }
        ],
        /**
         Trung bình tổng số tiền 1 giao dịch và trung bình tổng số sản phẩm 1 giao dịch 
        */
        averagePriceAndUnitsPerTransaction: [
            {
                pricePerTransaction: {
                    type: Number,
                    required: true,
                },
                unitsPerTransaction: {
                    type: Number,
                    required: true,
                },
                month: {
                    type: Number,
                    required: true,
                },
                year: {
                    type: Number,
                    required: true,
                }
            }
        ],
        // Thống kế doanh thu theo ngày
        salesRevenueByDay: [
            [
                {
                    type: Number,
                    required: true,
                }
            ]
        ]
        // .... Còn nữa 
    },
    { timestamps: true, versionKey: false },
);

export default mongoose.model('Statistic', statisticsSchema);