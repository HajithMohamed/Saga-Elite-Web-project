/**
 * Wraps any message in the standard Saga Elite email design.
 */
const buildEmailTemplate = (heading, bodyHtml) => {
    return `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 30px;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px;">
                <h1 style="text-align: center; color: #000;">SAGA ELITE</h1>
                <p style="text-align: center; letter-spacing: 2px; font-size: 12px; color: #777;">
                    RARE FIT FOREVER
                </p>
                <hr style="margin: 25px 0;" />
                <h2 style="color: #000;">${heading}</h2>
                ${bodyHtml}
                <hr style="margin: 25px 0;" />
                <p style="font-size: 12px; color: #999; text-align: center;">
                    © ${new Date().getFullYear()} Saga Elite. All rights reserved.
                </p>
            </div>
        </div>
    `;
};

module.exports = buildEmailTemplate;
