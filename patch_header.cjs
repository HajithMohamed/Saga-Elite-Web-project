const fs = require('fs');
const path = 'Client-Side/src/components/shopping-components/Header.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#4d4635]/50 shadow-lg",
  "bg-black/50 backdrop-blur-xl border-b border-[#D4AF37]/15 shadow-xl"
);

content = content.replace(
  /<Link to="\/shopping\/product-list\?category=unisex" className="relative group se-label text-\[11px\] tracking-\[0\.22em\] text-\[#d0c5af\] hover:text-\[#f2ca50\] transition-colors duration-200">\s*<>Unisex<span className="absolute -bottom-0\.5 left-0 h-px w-0 bg-\[#f2ca50\] transition-all duration-300 group-hover:w-full \[box-shadow:0_0_6px_rgba\(242,202,80,0\.7\)\]" \/><\/>\s*<\/Link>/g,
  `<Link to="/shopping/product-list?category=Ladies" className="relative group text-sm tracking-[0.22em] uppercase font-bold text-[#d0c5af] hover:text-[#f2ca50] transition-colors duration-200">
    Ladies<span className="absolute -bottom-2 left-0 h-[2px] w-0 bg-[#f2ca50] transition-all duration-300 group-hover:w-full [box-shadow:0_0_8px_rgba(242,202,80,0.8)]" />
  </Link>
  <Link to="/shopping/product-list?category=Gents" className="relative group text-sm tracking-[0.22em] uppercase font-bold text-[#d0c5af] hover:text-[#f2ca50] transition-colors duration-200">
    Gents<span className="absolute -bottom-2 left-0 h-[2px] w-0 bg-[#f2ca50] transition-all duration-300 group-hover:w-full [box-shadow:0_0_8px_rgba(242,202,80,0.8)]" />
  </Link>
  <Link to="/shopping/product-list?category=unisex" className="relative group text-sm tracking-[0.22em] uppercase font-bold text-[#d0c5af] hover:text-[#f2ca50] transition-colors duration-200">
    Unisex<span className="absolute -bottom-2 left-0 h-[2px] w-0 bg-[#f2ca50] transition-all duration-300 group-hover:w-full [box-shadow:0_0_8px_rgba(242,202,80,0.8)]" />
  </Link>`
);

fs.writeFileSync(path, content);
console.log("Updated header.");
