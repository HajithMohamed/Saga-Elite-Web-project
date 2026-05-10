import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

const LuxuryInput = React.forwardRef(({ 
  label, 
  id, 
  type = "text", 
  error, 
  icon: Icon,
  className = "",
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputType = type === "password" ? (showPassword ? "text" : "password") : type;
  const isPassword = type === "password";

  return (
    <div className={`relative mb-6 ${className}`}>
      <div 
        className={`relative flex items-center bg-[#111111] border-b transition-all duration-300 ease-in-out ${
          error ? 'border-[#ffb4ab]' : isFocused ? 'border-[#f2ca50] shadow-[0_4px_20px_-4px_rgba(242,202,80,0.15)]' : 'border-[#333333]'
        }`}
      >
        {Icon && (
          <div className="pl-4 text-[#99907c]">
            <Icon size={18} />
          </div>
        )}
        
        <div className="relative flex-1">
          <motion.label
            htmlFor={id}
            initial={false}
            animate={{
              y: isFocused || props.value ? -24 : 0,
              scale: isFocused || props.value ? 0.85 : 1,
              opacity: isFocused || props.value ? 1 : 0.6
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none origin-left ${
              error ? 'text-[#ffb4ab]' : isFocused ? 'text-[#f2ca50]' : 'text-[#99907c]'
            }`}
          >
            {label}
          </motion.label>
          
          <input
            id={id}
            ref={ref}
            type={inputType}
            className={`w-full px-4 pt-6 pb-2 bg-transparent text-[#e5e2e1] outline-none transition-all ${
              error ? 'caret-[#ffb4ab]' : 'caret-[#f2ca50]'
            }`}
            onFocus={(e) => {
              setIsFocused(true);
              if (props.onFocus) props.onFocus(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              if (props.onBlur) props.onBlur(e);
            }}
            {...props}
          />
        </div>

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="pr-4 text-[#99907c] hover:text-[#f2ca50] transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-5 left-0 text-xs text-[#ffb4ab]"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

LuxuryInput.displayName = 'LuxuryInput';

export default LuxuryInput;
