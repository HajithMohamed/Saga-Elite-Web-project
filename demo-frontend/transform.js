const fs = require("fs");
const path = require("path");

const homePath = path.join(__dirname, "index.html");

if (!fs.existsSync(homePath)) {
  throw new Error("index.html was not found in demo-frontend.");
}

console.log("index.html is now maintained directly as the home page source of truth.");
console.log(`Verified file: ${homePath}`);
