import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import SideBar from './SideBar'
import Header from './Header'

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen w-full bg-[#080808]">
      <SideBar
        mobileOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      ) : null}

      <div className="flex flex-1 flex-col lg:pl-64">
        <Header onMenuToggle={() => setIsSidebarOpen((state) => !state)} />
        <main className="flex-1 flex-col flex overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
