const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL;
    const smtpPass = process.env.SMTP_PASS || process.env.PASS;

    const transporter = nodemailer.createTransport({
        ...(smtpHost
            ? {
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
            }
            : {
                service: "gmail",
            }),
        auth: {
            user: smtpUser,
            pass: smtpPass,
        }
    });

    const mailOptions = {
        from: `"${process.env.FROM_NAME || "Saga Elite"}" <${process.env.FROM_EMAIL || smtpUser}>`,
        to: options.email,
        subject: options.subject,
        text: options.text || "Please view this email in HTML format.",
        html: options.html,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
