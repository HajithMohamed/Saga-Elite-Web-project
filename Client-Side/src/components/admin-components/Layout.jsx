import React from 'react'
import { Outlet } from 'react-router-dom'
import SideBar from './SideBar'
import MainHeader from '@/components/common-components/MainHeader'

const Layout = () => {
  return (
    <div className="flex min-h-screen w-full bg-[#080808]">
      {/* admin side bar */}
      <SideBar />
      <div className="flex flex-1 flex-col pl-64">
        {/* admin header */}
        <MainHeader />
        <main className="flex-1 flex-col flex overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
