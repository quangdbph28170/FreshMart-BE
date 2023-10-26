import Origin from "../models/origin";
import { originSchema } from "../validation/origin";

export const createOrigin = async (req, res) => {
    try {
        const { error } = originSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(401).json({
                status: 401,
                message: error.details.map((error) => error.message),
            });
        }
        const origin = await Origin.create(req.body)

        if(!origin) {
            return res.status(401).json({
                status: 400,
                message: "Create origin failed",
            });
        }

        return res.status(200).json({
            body: {
                data: origin
            },
            status: 200,
            message: "Create origin successed",
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}

export const findAll = async (req, res) => {
    try {
        const origin = await Origin.find()

        if(!origin) {
            return res.status(401).json({
                status: 400,
                message: "No Origins found",
            });
        }

        return res.status(200).json({
            body: {
                data: origin
            },
            status: 200,
            message: "Origin found",
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}

export const findOne = async (req, res) => {
    try {
        const { id } = req.params

        const origin = await Origin.findById(id)

        if(!origin) {
            return res.status(401).json({
                status: 400,
                message: "No origin found",
            });
        }

        return res.status(200).json({
            body: {
                data: origin
            },
            status: 200,
            message: "Origin found",
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}

export const updateOrigin = async (req, res) => {
    try {
        const { id } = req.params 
        const { error } = originSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(401).json({
                status: 401,
                message: error.details.map((error) => error.message),
            });
        }
        const origin = await Origin.findByIdAndUpdate(id, req.body, { new: true })

        if(!origin) {
            return res.status(401).json({
                status: 400,
                message: "Update origin failed",
            });
        }

        return res.status(200).json({
            body: {
                data: origin
            },
            status: 200,
            message: "Update origin successed",
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}

export const removeOrigin = async (req, res) => {
    try {
        const { id } = req.params

        const origin = await Origin.findByIdAndDelete(id)

        return res.status(200).json({
            status: 200,
            message: "Origin deleted successfully",
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}