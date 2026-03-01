import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch } from "react-redux";
import { loginUserAction } from "@/store/auth-slice";
import CommonForm from '@/components/common-components/CommonForm'
import { loginFormControl } from '@/config'
import { Mail, Facebook, Twitter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FcGoogle } from 'react-icons/fc'
import { toast } from '@/hooks/use-toast'

const Login = () => {
  const [formData,setFormData] = useState({
    email : "",
    password : ""
  })
  const [errors,setErrors] = useState({})
  const [isLoading,setIsLoading] = useState(false)
  const location = useLocation()
  const dispatch = useDispatch();

  useEffect(()=>{
    const newErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if(formData.email && !emailRegex.test(formData.email)){
      newErrors.email = "Please enter a valid email address."
    }
    if(formData.password && formData.password.length < 8){
      newErrors.password = "Password must be at least 8 characters."
    }
    setErrors(newErrors)
  },[formData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if(Object.keys(errors).length > 0){
      toast({title:'Invalid form',description:'Fix the errors above before logging in.',variant:'destructive'})
      return
    }
    setIsLoading(true)
    try {
      const response = await dispatch(loginUserAction(formData)).unwrap();
      toast({
        title: "Login successful",
        description: response.message || "Welcome back!",
        variant: "success",
      });
      // Navigation handled by CheckAuth
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.response?.data?.message || err.message || "Login failed";
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  // style helpers
  const inputClasses = "bg-transparent border-b border-gray-700 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:ring-0 font-sans"
  const labelClasses = "text-white"
  const buttonClasses = "bg-[#D4AF37] text-black font-bold uppercase tracking-wide py-2 rounded shadow"

  return (
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
        formErrors={errors}
        onSubmit={handleSubmit}
        buttonText={isLoading ? 'Logging in…' : 'Log In'}
        buttonDisabled={isLoading}
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
  )
}

export default Login
