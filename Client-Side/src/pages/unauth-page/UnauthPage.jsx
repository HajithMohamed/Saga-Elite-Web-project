import React from 'react'
import { Link } from 'react-router-dom'

const UnauthPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized</h1>
        <p className="text-gray-700 mb-6">
          You don\'t have permission to access this page. Please contact the
          administrator if you believe this is an error.
        </p>
        <div className="space-x-4">
          <Link
            to="/"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Go to Home
          </Link>
          <Link
            to="/auth/login"
            className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default UnauthPage
