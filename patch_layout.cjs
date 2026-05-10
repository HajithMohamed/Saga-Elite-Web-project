const fs = require('fs');
const path = 'Client-Side/src/pages/shopping-view/ProductListing.jsx';
let content = fs.readFileSync(path, 'utf8');

const startTag = '<div className="sticky top-16 z-30 bg-[#0a0a0a]/90 backdrop-blur-md border-y border-[#4d4635]/40">';
const endTag = '    </div>\n  );\n}';

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag) + endTag.length;

if (startIndex === -1 || endIndex === -1) {
    console.error("Tags not found");
    process.exit(1);
}

const newLayout = `
      {/* Editorial layout container: Grid with right filter sidebar */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-12 items-start relative">
          
          {/* Main Product Grid (Left Pane) */}
          <div className="flex-1 w-full min-w-0">
            {/* Top Bar inside main pane */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <FilterPills
                items={pills}
                active={activePill}
                onChange={handlePillChange}
              />
              <div className="flex items-center gap-4">
                <SortDropdown
                  value={sortParam}
                  onChange={(v) => {
                    const p = new URLSearchParams(searchParams);
                    if (v) p.set("sort", v);
                    else p.delete("sort");
                    setSearchParams(p);
                  }}
                />
                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setRefineOpen(!refineOpen)}
                  className="lg:hidden flex items-center gap-2 se-label tracking-widest text-[10px] uppercase text-[#e5e2e1] bg-[#131313] px-4 py-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-[#4d4635]/40"
                >
                  <SlidersHorizontal size={14} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1 w-2 h-2 rounded-full bg-[#f2ca50]" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Filter Drawer / Inline content could go here, for now relying on right sidebar on desktop */}
            <AnimatePresence>
              {refineOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="lg:hidden mb-8 overflow-hidden rounded-xl border border-[#4d4635]/30 bg-[#0a0a0a]"
                >
                  <FilterSidebar
                    selectedColors={colorsParam}
                    selectedSizes={sizesParam}
                    priceRange={[priceMinParam, priceMaxParam]}
                    onToggleColor={(c) => {
                      // existing color logic
                      const p = new URLSearchParams(searchParams);
                      let arr = [...colorsParam];
                      if (arr.includes(c)) arr = arr.filter((x) => x !== c);
                      else arr.push(c);
                      if (arr.length) p.set("colors", arr.join(","));
                      else p.delete("colors");
                      setSearchParams(p);
                    }}
                    onToggleSize={(s) => {
                      const p = new URLSearchParams(searchParams);
                      let arr = [...sizesParam];
                      if (arr.includes(s)) arr = arr.filter((x) => x !== s);
                      else arr.push(s);
                      if (arr.length) p.set("sizes", arr.join(","));
                      else p.delete("sizes");
                      setSearchParams(p);
                    }}
                    onChangePrice={(v) => {
                      const p = new URLSearchParams(searchParams);
                      if (v[0] > PRICE_MIN) p.set("min", v[0]); else p.delete("min");
                      if (v[1] < PRICE_MAX) p.set("max", v[1]); else p.delete("max");
                      setSearchParams(p);
                    }}
                    onClearAll={() => handleClearFilters(PRICE_MIN, PRICE_MAX)}
                    priceMin={PRICE_MIN}
                    priceMax={PRICE_MAX}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-y-12">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <ProductGridSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-32 flex flex-col items-center justify-center text-center px-4"
              >
                <div className="w-24 h-24 mb-6 border border-[#4d4635] flex items-center justify-center rounded-sm bg-[#131313]/50">
                  <span className="text-[#4d4635] text-4xl">ø</span>
                </div>
                <h3 className="text-[#e5e2e1] se-display text-2xl uppercase tracking-widest mb-2 font-bold">
                  NO MATCHES FOUND
                </h3>
                <p className="text-[#99907c] max-w-md mx-auto se-body text-sm">
                  Try exploring another collection or reducing your filter criteria.
                </p>
                <button
                  onClick={() => handleClearFilters(PRICE_MIN, PRICE_MAX)}
                  className="mt-8 px-8 py-3 bg-transparent border border-[#d4af37]/40 text-[#f2ca50] se-label text-[11px] uppercase tracking-widest hover:bg-[#d4af37]/10 transition-colors"
                >
                  Clear Filters
                </button>
              </motion.div>
            ) : (
              <div>
                <EditorialProductGrid
                  products={visibleProducts}
                  featuredEvery={filteredProducts.length < 6 ? Infinity : 7}
                  motionKey={activePill + filterParam + sortParam}
                />
                
                {/* Simulated "Mystery Gift" Cinematic Banner */}
                {visibleProducts.length >= 6 && (
                  <div className="my-16 w-full rounded-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80 z-10" />
                    <img 
                      src="https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=2670&auto=format&fit=crop" 
                      alt="Cinematic Mystery Gift" 
                      className="w-full h-80 object-cover brightness-50 group-hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6">
                      <p className="text-[#D4AF37] se-label text-[10px] uppercase tracking-[0.3em] font-semibold mb-3 tracking-widest">
                        Cinematic Promotional Banner
                      </p>
                      <h2 className="text-white text-3xl md:text-5xl font-display font-medium tracking-tight mb-8">
                        Every Order Unlocks<br/>a Mystery Gift
                      </h2>
                      <button className="bg-[#D4AF37] text-black font-semibold uppercase tracking-widest px-8 py-3.5 rounded-full hover:scale-105 transition-transform">
                        Explore Collection →
                      </button>
                    </div>
                  </div>
                )}

                {hasMore && (
                  <div className="mt-16 text-center">
                    <button
                      onClick={loadMore}
                      className="px-12 py-4 bg-transparent border border-[#D4AF37] text-[#D4AF37] font-semibold tracking-[0.2em] text-xs uppercase hover:bg-[#D4AF37] hover:text-black transition-colors"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar (Desktop only) */}
          <div className="hidden lg:block w-[320px] shrink-0">
             <FilterSidebar
                selectedColors={colorsParam}
                selectedSizes={sizesParam}
                priceRange={[priceMinParam, priceMaxParam]}
                onToggleColor={(c) => {
                  const p = new URLSearchParams(searchParams);
                  let arr = [...colorsParam];
                  if (arr.includes(c)) arr = arr.filter((x) => x !== c);
                  else arr.push(c);
                  if (arr.length) p.set("colors", arr.join(","));
                  else p.delete("colors");
                  setSearchParams(p);
                }}
                onToggleSize={(s) => {
                  const p = new URLSearchParams(searchParams);
                  let arr = [...sizesParam];
                  if (arr.includes(s)) arr = arr.filter((x) => x !== s);
                  else arr.push(s);
                  if (arr.length) p.set("sizes", arr.join(","));
                  else p.delete("sizes");
                  setSearchParams(p);
                }}
                onChangePrice={(v) => {
                  const p = new URLSearchParams(searchParams);
                  if (v[0] > PRICE_MIN) p.set("min", v[0]); else p.delete("min");
                  if (v[1] < PRICE_MAX) p.set("max", v[1]); else p.delete("max");
                  setSearchParams(p);
                }}
                onClearAll={() => handleClearFilters(PRICE_MIN, PRICE_MAX)}
                priceMin={PRICE_MIN}
                priceMax={PRICE_MAX}
             />
          </div>
        </div>
      </div>
    </div>
  );
}
export default ProductListing;`;

const updatedContent = content.substring(0, startIndex) + newLayout;
fs.writeFileSync(path, updatedContent);
console.log("Updated layout.");
