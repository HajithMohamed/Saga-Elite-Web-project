import React from 'react'
import { Outlet } from 'react-router-dom'

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Saga Elite Youth Fashion
          </h1>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="bg-white py-4 shadow-inner">
        <div className="text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Saga Elite Fashion. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

export default Layout
