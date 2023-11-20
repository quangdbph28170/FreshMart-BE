import notification from "../models/notification";

export const addNotification = async (data) => {
    try {
        const notification = await notification.create(data)

        return notification;
    } catch (error) {
        return false
    }
}