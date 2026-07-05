const nodemailer = require("nodemailer");

let cachedTransporter = null;
let cachedTransportSignature = "";

const pickEnv = (...keys) => {
    for (const key of keys) {
        const value = process.env[key];
        if (value !== undefined && String(value).trim() !== "") {
            return String(value).trim();
        }
    }
    return "";
};

const parseBoolean = (value) => {
    if (value === undefined || value === null || value === "") return undefined;
    return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
};

const stripHtml = (html = "") =>
    String(html)
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();

const getTransportConfig = () => {
    const smtpHost = pickEnv("SMTP_HOST", "MAIL_HOST");
    const smtpPort = Number(pickEnv("SMTP_PORT", "MAIL_PORT") || 587);
    const smtpService = pickEnv("SMTP_SERVICE", "MAIL_SERVICE");
    const smtpUser = pickEnv("SMTP_USER", "MAIL_USER", "EMAIL_USER", "EMAIL");
    const smtpPass = pickEnv("SMTP_PASS", "MAIL_PASS", "EMAIL_PASS", "PASS");
    const secureEnv = parseBoolean(pickEnv("SMTP_SECURE", "MAIL_SECURE"));

    if (!smtpUser || !smtpPass) {
        throw new Error(
            "Email is not configured. Set SMTP_USER/SMTP_PASS or EMAIL/PASS in the environment."
        );
    }

    const transportConfig = {
        ...(smtpHost
            ? {
                host: smtpHost,
                port: smtpPort,
                secure: secureEnv ?? smtpPort === 465,
            }
            : {
                service: smtpService || "gmail",
            }),
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
        connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
        greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 8000),
        socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 12000),
    };

    const signature = JSON.stringify({
        host: smtpHost,
        port: smtpPort,
        service: smtpService || (!smtpHost ? "gmail" : ""),
        secure: secureEnv ?? smtpPort === 465,
        user: smtpUser,
    });

    return { transportConfig, signature, smtpUser };
};

const getTransporter = () => {
    const { transportConfig, signature, smtpUser } = getTransportConfig();
    if (!cachedTransporter || cachedTransportSignature !== signature) {
        cachedTransporter = nodemailer.createTransport(transportConfig);
        cachedTransportSignature = signature;
    }
    return { transporter: cachedTransporter, smtpUser };
};

const sendEmail = async (options) => {
    if (!options || typeof options !== "object") {
        throw new Error("Email options are required.");
    }

    const to = options.email || options.to;
    const subject = options.subject;
    const html = options.html || "";
    const text = options.text || options.message || stripHtml(html);

    if (!to) throw new Error("Email recipient is required.");
    if (!subject) throw new Error("Email subject is required.");
    if (!html && !text) throw new Error("Email content is required.");

    const { transporter, smtpUser } = getTransporter();

    const mailOptions = {
        from: `"${process.env.FROM_NAME || "Saga Elite"}" <${process.env.FROM_EMAIL || smtpUser}>`,
        to,
        subject,
        text,
        html,
        replyTo: options.replyTo,
    };

    return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
