import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'namphpmailer@gmail.com',
      pass: 'rhlacgylyyzpiczf'
    },
    authMethod: 'PLAIN'
  });