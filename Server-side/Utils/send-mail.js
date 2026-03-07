const nodemailer = require('nodemailer')

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service : 'gmail',
        auth : {
            user : process.env.EMAIL,
            pass: process.env.PASS
        }
    })

    const mailOptions = {
        from: `"Saga Elite" <${process.env.EMAIL}>`, // adds a friendly sender name
        to: options.email,
        subject: options.subject,
        text: options.text || "Please view this email in HTML format.", // fallback text
        html: options.html, 
    }

    await transporter.sendMail(mailOptions)
}

module.exports = sendEmail