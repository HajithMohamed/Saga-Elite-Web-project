import React from "react";
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
}) => {
  const renderInputByComponentType = (getControlItem) => {
    let element = null;
    const value = formData[getControlItem.name]

    switch (getControlItem.componentType) {
      case "INPUT":
        element = (
          <Input
            className={inputClass}
            name={getControlItem.name}
            placeholder={getControlItem.placeholder}
            type={getControlItem.type}
            id={getControlItem.id}
            onChange = {(event)=>{
              setFormData({
                ...formData,
                [getControlItem.name]:event.target.value
              })
            }}
            value = {value}
          />
        );
        break;
      case "SELECT":
        element = (
          <Select value={value} onValueChange={(value)=>{
            setFormData({
              ...formData,
              [getControlItem.name] : value
            })
          }}>
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
             onChange = {(event)=>{
              setFormData({
                ...formData,
                [getControlItem.name]:event.target.value
              })
            }}
            value = {value}
          />
        );
        break;
      default:
        element = (
          <Input
            name={getControlItem.name}
            placeholder={getControlItem.placeholder}
            type={getControlItem.type}
            id={getControlItem.id}
            onChange = {(event)=>{
              setFormData({
                ...formData,
                [getControlItem.name]:event.target.value
              })
            }}
            value = {value}
          />
        );
        break;
    }
    return element;
  };
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  }

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
        className={`w-full ${buttonClass}`}
        type="submit"
        disabled={buttonDisabled}
      >
        {buttonText || 'Submit'}
      </motion.button>
    </motion.form>
  );
};

export default CommonForm;
