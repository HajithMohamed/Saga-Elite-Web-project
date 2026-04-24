import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const headerPath = path.join(__dirname, 'src/components/common-components/MainHeader.jsx');
const footerPath = path.join(__dirname, 'src/components/common-components/MainFooter.jsx');
const homePath = path.join(__dirname, 'src/pages/shopping-view/Home.jsx');

function replaceReturnStatement(filePath, newReturnJSX) {
    if (!fs.existsSync(filePath)) {
        console.warn(`File ${filePath} does not exist`);
        return;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const returnRegex = /return\s*\(\s*(<[\s\S]*)\);\s*}/m;
    const match = content.match(returnRegex);
    
    if (match) {
        const componentEndIndexIndicator = content.lastIndexOf('}');
        const beforeReturn = content.substring(0, match.index);
        
        const newContent = beforeReturn + '\n  return (\n    <>\n' + newReturnJSX + '\n    </>\n  );\n}\n';
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`Updated ${filePath}`);
    } else {
        console.warn(`Could not find a return statement in ${filePath}`);
    }
}

// 1. Update MainHeader
const headerJSX = `
    <header className="bg-black shadow-[0_4px_30px_rgba(0,0,255,0.3)] text-white w-full z-50 border-b border-blue-900">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">SAGA ELITE</h1>
        <nav className="space-x-6">
          <a href="/" className="hover:text-blue-400 transition-colors">Home</a>
          <a href="/shop" className="hover:text-blue-400 transition-colors">Shop</a>
          <a href="/drops" className="hover:text-blue-400 transition-colors">Drops</a>
        </nav>
      </div>
    </header>
`;
replaceReturnStatement(headerPath, headerJSX);

// 2. Update MainFooter
const footerJSX = `
    <footer className="bg-black text-gray-400 py-12 border-t border-blue-900 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <span className="text-xl font-bold text-white tracking-widest uppercase">Saga Elite</span>
          <p className="mt-2 text-sm max-w-sm">4K commercial photography style with deep shadows and electric blue highlights.</p>
        </div>
        <div className="flex space-x-6">
          <a href="#" className="hover:text-blue-500 transition-colors">Instagram</a>
          <a href="#" className="hover:text-blue-500 transition-colors">Twitter</a>
          <a href="#" className="hover:text-blue-500 transition-colors">Discord</a>
        </div>
      </div>
    </footer>
`;
replaceReturnStatement(footerPath, footerJSX);

// 3. Update Home - 4-column gapless layout for drops
const homeJSX = `
    <div className="min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-black z-10" />
        <div className="relative z-20 text-center">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter shadow-blue-500/50 drop-shadow-2xl">
            Electric <span className="text-blue-500">Highlights</span>
          </h1>
          <p className="mt-6 text-xl text-gray-300">Deep shadows, raw style, 21:9 cinematic experience.</p>
        </div>
      </section>

      {/* Drops - 4 column gapless showcase */}
      <section className="w-full">
        <h2 className="text-3xl font-bold px-8 py-12 uppercase tracking-wide border-b border-blue-900/50">Exclusive Drops</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 w-full bg-black">
          {displayedProducts && displayedProducts.length > 0 ? (
            displayedProducts.map((product, idx) => (
              <div key={idx} className="group relative aspect-[3/4] overflow-hidden border border-blue-900/20 bg-gray-900 hover:border-blue-500 transition-colors duration-500 cursor-pointer">
                <img 
                  src={product?.image || "placeholder-blue.jpg"} 
                  alt={product?.name || "Drop"}
                  className="object-cover w-full h-full opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 filter contrast-125 saturate-150"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400">{product?.name || "Unnamed"}</h3>
                  <p className="font-mono text-blue-500/80">\${product?.price || "0.00"}</p>
                </div>
              </div>
            ))
          ) : (
             <div className="col-span-full py-20 text-center text-gray-600 font-mono">NO DROPS AVAILABLE</div>
          )}
        </div>
      </section>
    </div>
`;
replaceReturnStatement(homePath, homeJSX);

console.log("UI update successfully compiled and written!");
