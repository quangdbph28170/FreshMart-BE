import Statistic from '../models/statistics';

export const getStatistic = async (req, res) => {
    try {
        const statistic = await Statistic.find()

        if (!statistic) {
            return res.status(400).json({
                status: 400,
                message: 'Get Statistic failed',
            });
        }

        return res.status(200).json({
            body: {
                data: statistic
            },
            status: 200,
            message: "get statistic successed",
        })
    } catch (error) {
        return res.status(400).json({
            status: 400,
            message: error.message,
        });
    }
}

export const uploadData = async (data) => {
    try {
        await Statistic.create(data)
    } catch (error) {
        console.log({
            status: 400,
            message: error.message,
        });
    }
}