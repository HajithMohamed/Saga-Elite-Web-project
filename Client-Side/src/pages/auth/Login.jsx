import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import CommonForm from '@/components/common-components/CommonForm'
import { loginFormControl } from '@/config'
import { Mail, Facebook, Twitter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FcGoogle } from 'react-icons/fc'

const Login = () => {
  const [formData,setFormData] = useState({
    email : "",
    password : ""
  })
  const location = useLocation()

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: perform login action
    console.log('login data', formData)
  }

  // style helpers
  const inputClasses = "bg-transparent border-b border-gray-700 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:ring-0 font-sans"
  const labelClasses = "text-white"
  const buttonClasses = "bg-[#D4AF37] text-black font-bold uppercase tracking-wide py-2 rounded shadow"

  return (
    <div className="min-h-screen flex bg-black text-white">
      {/* left branding panel */}
      <div className="hidden md:flex md:w-1/2 relative bg-[#080808]">
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/Logo.png" alt="Saga Elite" className="max-w-full h-auto" />
        </div>
        <div className="absolute bottom-8 w-full text-center">
          <span className="font-serif text-xs tracking-widest text-[#D4AF37]">RARE FIT FOREVER</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* toggle links */}
          <div className="flex justify-center mb-8 space-x-8">
            <Link
              to="/auth/login"
              className={`pb-2 ${location.pathname.endsWith('/login') ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}
            >
              Log In
            </Link>
            <Link
              to="/auth/register"
              className={`pb-2 ${location.pathname.endsWith('/register') ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}
            >
              Create Account
            </Link>
          </div>

          <CommonForm
            formControls={loginFormControl}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            buttonText="Log In"
            inputClass={inputClasses}
            labelClass={labelClasses}
            buttonClass={buttonClasses}
          />

          <p className="text-sm text-right mt-2">
            <Link to="/auth/forgot-password" className="text-[#D4AF37] hover:underline">
              Forgot password?
            </Link>
          </p>

          <div className="flex items-center my-6">
            <hr className="flex-grow border-gray-600" />
            <span className="px-2 text-gray-500">or</span>
            <hr className="flex-grow border-gray-600" />
          </div>

          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-gray-500 text-gray-200"
          >
            <FcGoogle className="h-5 w-5" />
            Continue with Google
          </Button>

          <p className="text-sm text-center mt-4">
            Don&apos;t have an account?{' '}
            <Link to="/auth/register" className="text-[#D4AF37] hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
