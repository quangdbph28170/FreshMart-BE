import { transporter } from "../config/mail"
import { validateMail } from "../validation/mail";

export const sendMail = async (req, res) => {
  try {
    const mailOptions = {
      from: 'namphpmailer@gmail.com',
      to: req.body.email,
      subject: req.body.subject,
      html: `
            <div style="margin-bottom: 10px;">
            <img src="https://spacingtech.com/html/tm/freozy/freezy-ltr/image/logo/logo.png" style="width: 200px; height: auto; margin-right: 10px;" />
             <p>${req.body.content}</p>             
            </div>
          `,
    };
    const { error } = validateMail.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(401).json({
        status: 401,
        message: error.details.map(item => item.message),
      })
    }
    const result = await transporter.sendMail(mailOptions);
    return res.status(201).json({
      status:201,
      message:"Send mail successfully",
    })
  } catch (error) {
    return res.status(500).json({
      status:500,
      message:error.message
    })
  }
}
