const crypto = require("crypto");

module.exports = () => {
    return crypto.randomInt(1000, 10000).toString();
};