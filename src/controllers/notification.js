import Notification from "../models/notification";
import { notificationSchema } from "../validation/notification";

export const addNotification = async (data) => {
    try {
        const notification = await Notification.create(data)

        return notification;
    } catch (error) {
        return error.message
    }
}

export const getAdminNotification = async (req, res) => {
    try {
        const adminNotification = await Notification.find({ type: 'admin' })

        return res.status(200).json({
            status: 200,
            message: 'Get admin notification successfully',
            body: {
                data: adminNotification || []
            }
        })
    } catch (error) {
        return res.status(400).json({
            status: 400,
            message: error.message,
        });
    }
}

export const getClientNotification = async (req, res) => {
    try {
        const clientNotification = await Notification.find({ type: 'client', userId: req.params.id })

        return res.status(200).json({
            status: 200,
            message: 'Get client notification successfully',
            body: {
                data: clientNotification || []
            }
        })
    } catch (error) {
        return res.status(400).json({
            status: 400,
            message: error.message,
        });
    }
}

export const updateStatusNotification = async (req, res) => {
    const { error } = notificationSchema.validate(req.body, {
        abortEarly: false,
    });
    if (error) {
        return res.status(401).json({
            status: 401,
            message: error.details.map((error) => error.message),
        });
    }
    try {
        if (req.body.isRead == true) {
            await Notification.findByIdAndUpdate(req.params.id, req.body)

            return res.status(200).json({
                status: 200,
                message: 'Update notification successfully',
            })
        }
        return res.status(400).json({
            status: 400,
            message: 'notification is read can not change status',
        })
    } catch (error) {
        return res.status(400).json({
            status: 400,
            message: error.message,
        });
    }
}