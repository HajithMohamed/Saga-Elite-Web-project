/**
 * Wraps any message in the standard Saga Elite email design.
 * Modern, responsive, and professional template.
 */
const buildEmailTemplate = (heading, bodyHtml) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${heading} | Saga Elite</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background-color: #000000; padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; }
        .header p { color: #D4AF37; font-size: 10px; letter-spacing: 3px; margin-top: 8px; text-transform: uppercase; font-weight: 500; }
        .content { padding: 40px 30px; color: #333333; line-height: 1.6; font-size: 16px; }
        .content h2 { color: #111111; font-size: 22px; margin-top: 0; margin-bottom: 25px; font-weight: 600; border-bottom: 2px solid #D4AF37; display: inline-block; padding-bottom: 5px; }
        .otp-box { background-color: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; text-align: center; margin: 25px 0; }
        .otp-code { font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #000000; }
        .footer { background-color: #f9f9f9; padding: 25px; text-align: center; border-top: 1px solid #eeeeee; }
        .footer p { color: #999999; font-size: 12px; margin: 5px 0; }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0; }
            .content { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <div style="background-color: #f4f4f4; padding: 40px 0;">
        <div class="container">
            <div class="header">
                <h1>SAGA ELITE</h1>
                <p>RARE FIT FOREVER</p>
            </div>
            <div class="content">
                <h2>${heading}</h2>
                ${bodyHtml}
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Saga Elite. All rights reserved.</p>
                <p>Limited Edition Fashion built for the bold.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

module.exports = buildEmailTemplate;
