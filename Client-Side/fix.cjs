const fs = require('fs');
const content = fs.readFileSync('src/components/common-components/MainHeader.jsx', 'utf8');
const match = content.match(/```(?:jsx)?\n([\s\S]*?)```/);
if (match) {
  fs.writeFileSync('src/components/common-components/MainHeader.jsx', match[1]);
  console.log('Fixed');
} else {
  console.log('No match found');
}
