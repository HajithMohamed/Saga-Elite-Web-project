import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Wishlist = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-none shadow-sm shadow-slate-200/50">
        <div className="flex justify-between items-center w-full px-8 py-6 max-w-screen-2xl mx-auto">
          <Link to="/shopping/home" className="font-manrope text-xl font-black tracking-[0.2em] text-slate-950 dark:text-white uppercase">ARCHITECT</Link>
          <div className="hidden md:flex items-center gap-10">
            <Link className="font-manrope font-light tracking-tight text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:opacity-70 transition-opacity duration-300" to="/shopping/home">Collections</Link>
            <Link className="font-manrope font-light tracking-tight text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:opacity-70 transition-opacity duration-300" to="/shopping/home">Curated</Link>
            <Link className="font-manrope font-light tracking-tight text-slate-950 dark:text-white border-b border-slate-950 dark:border-white pb-1 hover:opacity-70 transition-opacity duration-300" to="/shopping/wishlist">Wishlist</Link>
            <Link className="font-manrope font-light tracking-tight text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:opacity-70 transition-opacity duration-300" to="/shopping/account">Orders</Link>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center bg-surface-container-low px-4 py-2 rounded-lg scale-95 active:scale-100 transition-transform">
              <span className="material-symbols-outlined text-outline mr-2 text-sm">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-sm w-40 font-light" placeholder="Search..." type="text" />
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/shopping/cart')} className="text-slate-950 dark:text-white hover:opacity-70 transition-opacity duration-300 scale-95 active:scale-100">
                <span className="material-symbols-outlined">shopping_bag</span>
              </button>
              <button onClick={() => navigate('/shopping/account')} className="text-slate-950 dark:text-white hover:opacity-70 transition-opacity duration-300 scale-95 active:scale-100">
                <span className="material-symbols-outlined">person</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="pt-32 pb-24 px-8 max-w-screen-2xl mx-auto">
        <header className="mb-16">
          <p className="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-4">Personal Collection</p>
          <h1 className="text-5xl font-extrabold tracking-tight text-primary mb-2">Wishlist</h1>
          <div className="flex items-center gap-2">
            <div className="w-12 h-[1px] bg-primary"></div>
            <p className="text-on-surface-variant font-light">6 Items Saved for Later</p>
          </div>
        </header>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <article className="group">
            <div className="relative overflow-hidden aspect-[3/4] bg-surface-container-low rounded-lg mb-6 shadow-sm">
              <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="Minimalist matte black ceramic vase with architectural sharp edges on a white stone pedestal in soft diffused light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZXtFkQTvgRmBoHTekNyYYpp4RM48vkC7bIkYXLRZACGBg-Iqwboey3ZabGp5lGrfKG9XwmhI-5dfFzvOJRsWLrlhvB2_i-RFfF3FnixI3ISspMYmCrVhL2DMpdWu9bT0o5miZ01mMVLI_uM7edtoZPXVafY5JZSb1cTwt8p7mee1fSnRnDhDZUhd8Y7CDz7Yn9ILwYrGA8JwT7wLzKCRyx-U1RESWm2zC-yV150OLrF-7uEeUqa17uFvzOMQF01tjrgvAdJIdxtY" alt="Minimalist vase" />
              <button className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full text-primary hover:bg-white transition-colors duration-300">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>close</span>
              </button>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold tracking-tight mb-1 text-on-surface uppercase">The Monolith Vase</h3>
                <p className="text-on-surface-variant font-body text-sm mb-4">Limited Edition Obsidian</p>
                <p className="text-primary font-headline font-bold text-xl">$420.00</p>
              </div>
              <button className="bg-primary text-on-primary px-6 py-3 rounded-lg text-xs font-bold tracking-widest uppercase hover:opacity-80 transition-all duration-300 active:scale-95">
                Add to Bag
              </button>
            </div>
          </article>
          <article className="group">
            <div className="relative overflow-hidden aspect-[3/4] bg-surface-container-low rounded-lg mb-6 shadow-sm">
              <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="Elegant floor lamp with a slender charcoal metallic frame and a textured linen shade casting warm ambient glow" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDle35dPbYSEmGdYdlTtEQABnegnDfeB_eaiRIfXnHZXrV5YzD2ba5M48c7lSd4OHhV1wBMnltJE4bDLVOxxh0qyPZt6Mq9KUsn1KCv6DU5moOCWhLvKTGdvCI2ErceoTN8Gj6m-olBOyXQLE3cngGQyIwXWKxELZOkL-lNgVQdMxf9pW2E8aHI5pUMPAA9veBBs4Zm4kxF7VBVwSCw1_2XTnv2tXlJCvbbMLcWMS5gRsrA9Ntt2Lg9SeXusZTcE3xKixUXrPLNKxE" alt="Floor lamp" />
              <button className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full text-primary hover:bg-white transition-colors duration-300">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>close</span>
              </button>
              <div className="absolute bottom-4 left-4 bg-primary text-white text-[10px] px-3 py-1 rounded-full tracking-widest uppercase font-bold">In Stock</div>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold tracking-tight mb-1 text-on-surface uppercase">Linear Beam Lamp</h3>
                <p className="text-on-surface-variant font-body text-sm mb-4">Brushed Gunmetal Finish</p>
                <p className="text-primary font-headline font-bold text-xl">$1,150.00</p>
              </div>
              <button className="bg-primary text-on-primary px-6 py-3 rounded-lg text-xs font-bold tracking-widest uppercase hover:opacity-80 transition-all duration-300 active:scale-95">
                Add to Bag
              </button>
            </div>
          </article>
          <article className="group">
            <div className="relative overflow-hidden aspect-[3/4] bg-surface-container-low rounded-lg mb-6 shadow-sm">
              <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="Abstract charcoal grey sculpture with organic flowing shapes made from polished resin on a wooden side table" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAef_f2WlrdilczaAWk7oNDrCpehBmr5OrFSZObScIBx6BGuzp-68U11aKMPSLyq-c-ttiqK9E9ESZhw30uYvwmjSmBCHoieE4i-tvd89LD8kWfpMtOEvlK_mOD16alyOtjfeMDXxU9OhaxlkkFqmPqJxPDpbLzM0-dXBr_6ugXUfcAwrsoc7Oks3oD-ONBiBNnRvyQNCMOdj5y7DJv1ot0uuOgC6TQBo3Vqp1wdQ5R8o-4X5lZNWhE2HV2U1xCZNqmSSdf0SxY6go" alt="Sculpture" />
              <button className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full text-primary hover:bg-white transition-colors duration-300">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>close</span>
              </button>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold tracking-tight mb-1 text-on-surface uppercase">Curvature Form 01</h3>
                <p className="text-on-surface-variant font-body text-sm mb-4">Hand-Poured Resin Sculpture</p>
                <p className="text-primary font-headline font-bold text-xl">$890.00</p>
              </div>
              <button className="bg-primary text-on-primary px-6 py-3 rounded-lg text-xs font-bold tracking-widest uppercase hover:opacity-80 transition-all duration-300 active:scale-95">
                Add to Bag
              </button>
            </div>
          </article>
          <article className="group">
            <div className="relative overflow-hidden aspect-[3/4] bg-surface-container-low rounded-lg mb-6 shadow-sm">
              <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="Deep forest green velvet accent chair with minimalist walnut wooden legs in a brightly lit modern living room" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMYRt3v5Tt_0qBviUInFJvhUyqh3NnO0KaVrsD5gUQeL7csFGFMqweg4_lqx0K-shlzffMIYSGlBrkBaAWb27DhwpQtn5qOCqGhgfqKEFaglVLkxT_3jo0qYEQtiKvOFYif0mmxBKyjW-ATVz8BXgsp5D1QeV3zPZkP4uT8WSZfi7JV7RwIop00a_Iwe4eTPRZZ4AlZ5X9PEOrjKju1TpNyWlZicGoQSJ_fnxUW0LFphUv1yOLsWLlN8Iwj8fFxLycqYSIusWHnZ8" alt="Velvet chair" />
              <button className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full text-primary hover:bg-white transition-colors duration-300">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>close</span>
              </button>
              <div className="absolute bottom-4 left-4 bg-secondary-container text-on-secondary-container text-[10px] px-3 py-1 rounded-full tracking-widest uppercase font-bold">Limited Supply</div>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold tracking-tight mb-1 text-on-surface uppercase">The Atrium Chair</h3>
                <p className="text-on-surface-variant font-body text-sm mb-4">Deep Moss Velvet</p>
                <p className="text-primary font-headline font-bold text-xl">$2,400.00</p>
              </div>
              <button className="bg-primary text-on-primary px-6 py-3 rounded-lg text-xs font-bold tracking-widest uppercase hover:opacity-80 transition-all duration-300 active:scale-95">
                Add to Bag
              </button>
            </div>
          </article>
          <article className="group">
            <div className="relative overflow-hidden aspect-[3/4] bg-surface-container-low rounded-lg mb-6 shadow-sm">
              <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="Thick white coffee table book with architectural photography on a sleek glass table with soft morning light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyHMR06pcpHa4A-keHt-U532Ju1b2d0bUGz3oVeROWrySIitjEPYT4ANqkqt4mTmOuR1uGDxlRSu119ARrVCIi5lkeV_q2pRIk8ueA9GRdcAdb1f33RTAcpujTFRLeeFnlAzuwKXKsTlUYr1B3cshhpi2jNYWQJwENC4089i4luQoE3COivLIfnPn0aS-w49WGmSlOkFX6I2Xo8ZIh3FCdSA0js4PiW9mLV4YIzc4-XE0Ea5mFZWWLoPXH5U5x6hi1I4KalJYpZek" alt="Coffee table book" />
              <button className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full text-primary hover:bg-white transition-colors duration-300">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>close</span>
              </button>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold tracking-tight mb-1 text-on-surface uppercase">Architectural Flow</h3>
                <p className="text-on-surface-variant font-body text-sm mb-4">Clothbound Hardcover</p>
                <p className="text-primary font-headline font-bold text-xl">$125.00</p>
              </div>
              <button className="bg-primary text-on-primary px-6 py-3 rounded-lg text-xs font-bold tracking-widest uppercase hover:opacity-80 transition-all duration-300 active:scale-95">
                Add to Bag
              </button>
            </div>
          </article>
          <article className="group">
            <div className="relative overflow-hidden aspect-[3/4] bg-surface-container-low rounded-lg mb-6 shadow-sm">
              <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="Premium soy wax candle in a heavy smoked glass container with a wooden wick on a concrete surface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwUPJwtuo4hOTL96a2m3ZqhDIC4x2tFFHknoVXdT8uLaahlWa4aM4-0cXBmKwJDcVvFgTjZpAPBFibkSm9TTzp2KJoxfci7tPtpHuFNCjlfv0ySm7UaMmcI7fm3PUskyIGup9fMnh08Pc2jeBCCes5HerH6pwqCV5n0cbyVOV9HTW435k38u1O-iF4HSyBgAo495KIox8NSvYY0_aApOEd6R_7_n58ozfJz-NyJIMniDTlUF2w7E73qHA4LKP3ZqXX3uN9FSvuNOE" alt="Soy wax candle" />
              <button className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full text-primary hover:bg-white transition-colors duration-300">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>close</span>
              </button>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold tracking-tight mb-1 text-on-surface uppercase">No. 08 Dusk Candle</h3>
                <p className="text-on-surface-variant font-body text-sm mb-4">Sandalwood & Leather</p>
                <p className="text-primary font-headline font-bold text-xl">$65.00</p>
              </div>
              <button className="bg-primary text-on-primary px-6 py-3 rounded-lg text-xs font-bold tracking-widest uppercase hover:opacity-80 transition-all duration-300 active:scale-95">
                Add to Bag
              </button>
            </div>
          </article>
        </section>
        <section className="mt-24 p-12 bg-surface-container-low rounded-xl flex flex-col md:flex-row items-center justify-between gap-8 border-none">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight mb-4 uppercase">Complete the Space</h2>
            <p className="text-on-surface-variant">Your wishlist items share a common architectural DNA. We've identified these complementary pieces that bridge your selected forms into a cohesive narrative.</p>
          </div>
          <button className="border border-primary text-primary px-10 py-4 rounded-lg text-sm font-bold tracking-widest uppercase hover:bg-primary hover:text-on-primary transition-all duration-500">
            View Recommendations
          </button>
        </section>
      </main>
      <footer className="w-full mt-24 bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 gap-8 max-w-screen-2xl mx-auto">
          <div className="flex flex-col gap-4 text-center md:text-left">
            <span className="font-manrope font-bold text-slate-900 dark:text-slate-100 text-xl tracking-widest uppercase">ARCHITECT</span>
            <p className="font-inter text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500">© 2024 THE ELEVATED MERCHANT. ARCHITECTURAL FLOW.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a className="font-inter text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors" href="#">Sustainability</a>
            <a className="font-inter text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors" href="#">Shipping & Returns</a>
            <a className="font-inter text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors" href="#">Privacy Policy</a>
            <a className="font-inter text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors" href="#">Contact</a>
          </div>
          <div className="flex gap-6">
            <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-slate-950 transition-colors">share</span>
            <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-slate-950 transition-colors">public</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Wishlist;
