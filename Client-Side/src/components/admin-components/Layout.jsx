import React from 'react'
import { Outlet } from 'react-router-dom'
import SideBar from './SideBar'
import Header from './Header'

const Layout = () => {
  return (
    <div>
      {/* {admin side bar} */}
      <SideBar/>
      <div>
        {/* admin header */}
        <Header/>
        <main>
            <Outlet/>
        </main>
      </div>
    </div>
  )
}

export default Layout
