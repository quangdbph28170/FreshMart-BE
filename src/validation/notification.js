import joi from "joi";

export const notificationSchema = joi.object({
  isRead: joi.boolean().required(),
});
