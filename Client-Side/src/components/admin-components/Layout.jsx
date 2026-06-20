import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import SideBar from './SideBar'
import Header from './Header'
import AdminBottomNav from './AdminBottomNav'

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen w-full bg-[#050505]">
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
        <main className="flex-1 flex-col flex overflow-y-auto pb-16 lg:pb-0" data-lenis-prevent="true">
          <Outlet />
        </main>
      </div>

      <AdminBottomNav onMenuToggle={() => setIsSidebarOpen((state) => !state)} />
    </div>
  )
}

export default Layout
