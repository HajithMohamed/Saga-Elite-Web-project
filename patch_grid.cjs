const fs = require('fs');
const path = 'Client-Side/src/components/listing/EditorialProductGrid.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the grid class
content = content.replace(
  'className="grid gap-px bg-[#4d4635]/40 border border-[#4d4635]/40 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 [grid-auto-flow:dense] [grid-auto-rows:1fr]"',
  'className="grid gap-4 md:gap-8 grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 [grid-auto-flow:dense] [grid-auto-rows:1fr]"'
);

fs.writeFileSync(path, content);
console.log("Updated grid.");
