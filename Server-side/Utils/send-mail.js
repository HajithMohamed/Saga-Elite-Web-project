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
        },
        // Bound every send. register / verify-OTP / 2FA / forgot-password all
        // `await sendMail(...)` BEFORE responding, so an unreachable or slow
        // SMTP host would otherwise hang the HTTP request indefinitely and the
        // browser reports it as a "network error". These caps make a dead SMTP
        // reject in seconds instead, so the caller's try/catch can respond.
        connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
        greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 8000),
        socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 12000),
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
