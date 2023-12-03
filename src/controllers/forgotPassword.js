
import { transporter } from "../config/mail";
import User from "../models/user"
import crypto from "crypto"
import bcrypt from "bcrypt"
import { forgotPasswordSchema } from "../validation/forgotPassword";

//Check mail => Tạo token nhận ở mail
export const generateVerificationToken = async (req, res, next) => {
    try {
        const emailExist = await User.findOne({ email: req.body.email })
        if (!emailExist) {
            return res.status(400).json({
                status: 400,
                message: "Email is not registered!",
            });
        }
        const Verification = crypto.randomBytes(3).toString('hex');
        const VerificationExpiration = 5 * 60 * 1000; // Hiệu lực trong 5 phút
        const mailOptions = {
            from: 'namphpmailer@gmail.com',
            to: req.body.email,
            subject: "FRESH MART - Quên mật khẩu",
            html: `
            <div style="margin-bottom: 10px;">
            <img style="width: 80px; height: auto; margin-right: 10px;" src="https://res.cloudinary.com/diqyzhuc2/image/upload/v1700971559/logo_ssgtuy_1_dktoff.png" />
            <p>Mã xác nhận của bạn là: <strong style="color:#f12; background-color:#bedaef; font-size:20px; border-radius:5px; padding:10px;">${Verification}</strong>.<br/> Mã này sẽ hết hiệu lực sau 5 phút. Vui lòng không để lộ mã xác nhận để bảo vệ tài khoản của bạn!</p>
          </div>
                `,
        };
        await transporter.sendMail(mailOptions);
        // Đặt cookie chứa mã đặt lại mật khẩu
        res.cookie("Verification", Verification, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
        });
        res.cookie("VerificationExpiration", Date.now() + VerificationExpiration, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
        });
        res.cookie("email", req.body.email)
        return res.status(200).json({
            status: 200,
            message: "NEXT",
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}

//Check xem token có hợp lệ ko 
export const verifyToken = async (req, res) => {
    try {
        const { Verification } = req.body;

        // Kiểm tra xem mã đặt lại mật khẩu có tồn tại trong cookie không
        if (!req.cookies.Verification || req.cookies.Verification !== Verification) {
            return res.status(400).json({
                status: 400,
                message: "Invalid reset token!",
            });
        }

        // Kiểm tra xem mã đặt lại mật khẩu còn hiệu lực không
        const VerificationExpiration = req.cookies.VerificationExpiration;
        if (Date.now() > VerificationExpiration) {
            return res.status(400).json({
                status: 400,
                message: "Reset token has expired!",
            });
        }

        res.clearCookie("Verification");
        res.clearCookie("VerificationExpiration");

        return res.status(200).json({
            status: 200,
            message: "Reset token is valid and not expired.",
            email: req.cookies.email,
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
};

//Đổi mật khẩu
export const forgotPassword = async (req, res) => {
    try {
        const email = req.cookies.email
        const Verification = req.cookies.Verification
        if (!email || !Verification) {
            return res.status(400).json({
                status: 400,
                message: "Please provide emails and confirmation codes!",
            });
        }
        const { error } = forgotPasswordSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                status: 400,
                message: error.details.map((error) => error.message),
            });
        }
        // console.log(userExist);
        const hashPassword = await bcrypt.hash(req.body.password, 10);
        // const validPass = await bcrypt.compare(req.body.password, userExist.password);
        // if (validPass) {
        //     return res.status(401).json({
        //         status: 401,
        //         message: "This password has been used!",
        //     })
        // }
        const user = await User.findOneAndUpdate({ email: email }, { password: hashPassword })
        res.clearCookie("email");
        return res.status(200).json({
            message: "Change password successfully",
            user
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}
