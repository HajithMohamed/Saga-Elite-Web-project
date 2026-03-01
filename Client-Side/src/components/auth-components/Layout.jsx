import React from 'react'
import { Outlet } from 'react-router-dom'

const Layout = () => {
  return (
    <div className="min-h-screen flex bg-black text-white">
      {/* left branding panel */}
      <div className="hidden md:flex md:w-1/2 relative bg-[#080808]">
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/Logo.png" alt="Saga Elite" className="max-w-full h-auto" />
        </div>
        <div className="absolute bottom-8 w-full text-center">
          <span className="font-serif text-xs tracking-widest text-[#D4AF37]">
            RARE FIT FOREVER
          </span>
        </div>
      </div>
      
      {/* right dynamic panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <Outlet />
      </div>
    </div>
  )
}

export default Layout
