import React, { useState, useRef, useEffect } from "react";
import { motion } from 'framer-motion'
import { Label } from '../ui/label'
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@radix-ui/react-select";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const OtpInputComponent = ({ value, onChange, length = 4 }) => {
  const [otp, setOtp] = useState(() => {
    const valArr = value ? value.split("").slice(0, length) : [];
    return [...valArr, ...Array(length - valArr.length).fill("")];
  });
  const inputRefs = useRef([]);

  useEffect(() => {
    // Sync external value changes down if necessary,
    // though typically the OTP input acts as source of truth.
    if (!value && otp.some((d) => d !== "")) {
      setOtp(Array(length).fill(""));
    }
  }, [value, length, otp]);

  const updateOtpAndNotify = (newOtp) => {
    setOtp(newOtp);
    onChange(newOtp.join(""));
  };

  const handleChange = (index, e) => {
    const val = e.target.value;
    if (isNaN(val)) return;

    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    updateOtpAndNotify(newOtp);

    // Auto-focus next input if a digit was entered
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, length).split("");
    if (pasteData.some(isNaN)) return;

    const newOtp = Array(length).fill("");
    pasteData.forEach((char, i) => {
      newOtp[i] = char;
    });
    updateOtpAndNotify(newOtp);

    const focusIndex = pasteData.length < length ? pasteData.length : length - 1;
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex justify-center gap-4 mb-4">
      {otp.map((digit, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          maxLength={1}
          ref={(el) => (inputRefs.current[index] = el)}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-14 h-14 text-center text-3xl font-bold bg-transparent border border-gray-700 rounded text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none transition-all placeholder-gray-600"
          placeholder="-"
        />
      ))}
    </div>
  );
};

const CommonForm = ({
  formControls,
  formData,
  setFormData,
  onSubmit,
  buttonText,
  inputClass = '',
  labelClass = '',
  buttonClass = '',
  formErrors = {},
  buttonDisabled = false,
  isLoading = false,
}) => {
  const [showPassword, setShowPassword] = useState({});

  const togglePasswordVisibility = (name) => {
    setShowPassword((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const renderInputByComponentType = (getControlItem) => {
    let element = null;
    const value = formData[getControlItem.name];
    const isPassword = getControlItem.type === "password";
    const currentType = isPassword
      ? showPassword[getControlItem.name]
        ? "text"
        : "password"
      : getControlItem.type;

    switch (getControlItem.componentType) {
      case "INPUT":
        element = (
          <div className="relative w-full">
            <Input
              className={inputClass}
              name={getControlItem.name}
              placeholder={getControlItem.placeholder}
              type={currentType}
              id={getControlItem.id}
              onChange={(event) => {
                setFormData({
                  ...formData,
                  [getControlItem.name]: event.target.value,
                });
              }}
              value={value || ""}
            />
            {isPassword && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none bg-transparent border-none p-0 cursor-pointer"
                onClick={() => togglePasswordVisibility(getControlItem.name)}
              >
                {showPassword[getControlItem.name] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        );
        break;
      case "SELECT":
        element = (
          <Select
            value={value || ""}
            onValueChange={(val) => {
              setFormData({
                ...formData,
                [getControlItem.name]: val,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={getControlItem.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {getControlItem.options && getControlItem.options.length > 0
                ? getControlItem.options.map((optionItem) => (
                    <SelectItem key={optionItem.id} value={optionItem.value}>
                      {optionItem.label}
                    </SelectItem>
                  ))
                : null}
            </SelectContent>
          </Select>
        );
        break;
      case "TEXTAREA":
        element = (
          <Textarea
            className={inputClass}
            name={getControlItem.name}
            placeholder={getControlItem.placeholder}
            type={getControlItem.type}
            id={getControlItem.id}
            onChange={(event) => {
              setFormData({
                ...formData,
                [getControlItem.name]: event.target.value,
              });
            }}
            value={value || ""}
          />
        );
        break;
      case "OTP_INPUT":
        element = (
          <OtpInputComponent
            length={4} // Or dynamically from getControlItem if needed
            value={value || ""}
            onChange={(otpValue) => {
              setFormData({
                ...formData,
                [getControlItem.name]: otpValue,
              });
            }}
          />
        );
        break;
      case "CHECKBOX":
        element = (
          <div className="flex items-center space-x-2">
            <Input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              name={getControlItem.name}
              id={getControlItem.id}
              checked={value || false}
              onChange={(event) => {
                setFormData({
                  ...formData,
                  [getControlItem.name]: event.target.checked,
                });
              }}
            />
          </div>
        );
        break;
      default:
        element = (
          <div className="relative w-full">
            <Input
              name={getControlItem.name}
              placeholder={getControlItem.placeholder}
              type={currentType}
              id={getControlItem.id}
              onChange={(event) => {
                setFormData({
                  ...formData,
                  [getControlItem.name]: event.target.value,
                });
              }}
              value={value || ""}
            />
            {isPassword && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none bg-transparent border-none p-0 cursor-pointer"
                onClick={() => togglePasswordVisibility(getControlItem.name)}
              >
                {showPassword[getControlItem.name] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        );
        break;
    }
    return element;
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.form
      onSubmit={onSubmit}
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="space-y-4">
        {formControls.map((controlItem) => (
          <motion.div
            key={controlItem.name}
            variants={item}
            className="flex flex-col space-y-1"
          >
            <Label className={`text-sm font-medium ${labelClass}`}>
              {controlItem.label}
            </Label>
            {renderInputByComponentType(controlItem)}
            {formErrors[controlItem.name] && (
              <p className="text-xs text-red-500 mt-1">
                {formErrors[controlItem.name]}
              </p>
            )}
          </motion.div>
        ))}
      </div>
      <motion.button
        variants={item}
        whileHover={{ scale: 1.02 }}
        className={`w-full flex items-center justify-center gap-2 ${buttonClass}`}
        type="submit"
        disabled={buttonDisabled || isLoading}
      >
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {buttonText || "Submit"}
      </motion.button>
    </motion.form>
  );
};

export default CommonForm;