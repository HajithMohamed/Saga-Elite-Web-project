const SERVER_URL = "http://localhost:5001";

export { SERVER_URL };

export const loginFormControl = [
  {
    name: "email",
    type: "email",
    placeholder: "exampl@gmail.com",
    id: "email",
    label: "Email",
    componentType : "INPUT"
  },
  {
    name: "password",
    type: "password",
    placeholder: "ABcd@12",
    id: "password",
    label: "Password",
    componentType : "INPUT"
  },
];
export const registerFormControl = [
  
  {
    name: "email",
    type: "email",
    placeholder: "exampl@gmail.com",
    id: "email",
    label: "Email",
    componentType : "INPUT"
  },
  {
    name: "password",
    type: "password",
    placeholder: "ABcd@12",
    id: "password",
    label: "Password",
    componentType : "INPUT"
  },
  {
    name: "confirmPassword",
    type: "password",
    placeholder: "ABcd@12",
    id: "confirmPassword",
    label: "Confirm Password",
    componentType : "INPUT"
  },
];

export const verifyOtpFormControls = [
  {
    name: "otp",
    id: "otp",
    label: "",
    componentType: "OTP_INPUT"
  }
];

export const forgotPasswordControls = [
  {
    name: "email",
    type: "email",
    placeholder: "exampl@gmail.com",
    id: "email",
    label: "Email",
    componentType : "INPUT"
  },
];

export const resetPasswordOtpFormControls = [
  {
    name: "otp",
    id: "otp",
    label: "",
    componentType: "OTP_INPUT"
  },
  {
    name: "newPassword",
    type: "password",
    placeholder: "Enter new password",
    id: "newPassword",
    label: "New Password",
    componentType : "INPUT"
  },
  {
    name: "confirmPassword",
    type: "password",
    placeholder: "Confirm new password",
    id: "confirmPassword",
    label: "Confirm Password",
    componentType : "INPUT"
  },
];

export const setPasswordFormControls = [
  {
    name: "newPassword",
    type: "password",
    placeholder: "Enter new password",
    id: "newPassword",
    label: "New Password",
    componentType : "INPUT"
  },
  {
    name: "confirmPassword",
    type: "password",
    placeholder: "Confirm new password",
    id: "confirmPassword",
    label: "Confirm Password",
    componentType : "INPUT"
  },
];

export const changePasswordFormControls = [
  {
    name: "oldPassword",
    type: "password",
    placeholder: "Current password",
    id: "oldPassword",
    label: "Current Password",
    componentType: "INPUT",
  },
  {
    name: "newPassword",
    type: "password",
    placeholder: "New password",
    id: "newPassword",
    label: "New Password",
    componentType: "INPUT",
  },
  {
    name: "passwordConfirm",
    type: "password",
    placeholder: "Confirm new password",
    id: "passwordConfirm",
    label: "Confirm New Password",
    componentType: "INPUT",
  },
];


export const dropFormControls = [
  {
    name: "name",
    label: "Drop Name",
    type: "text",
    placeholder: "Enter drop name",
    required: true,
    componentType: "INPUT"
  },
  {
    name: "description",
    label: "Description",
    type: "text",
    placeholder: "Enter drop description",
    componentType: "TEXTAREA"
  },
  {
    name: "releaseDate",
    label: "Release Date",
    type: "datetime-local",
    required: true,
    componentType: "INPUT"
  },
  {
    name: "endDate",
    label: "End Date",
    type: "datetime-local",
    componentType: "INPUT"
  },
  {
    name: "isPublished",
    label: "Published",
    type: "checkbox",
    componentType: "CHECKBOX"
  },
  {
    name: "isArchived",
    label: "Archived",
    type: "checkbox",
    componentType: "CHECKBOX"
  },
];
