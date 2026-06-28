import { SOCKET_URL as SERVER_URL } from "@/lib/api";

/* ================== CONTACT INFO ================== */
export const CONTACT_INFO = {
  email: "sagaaelite@gmail.com",
  phone: "+94 77 070 4274",
  whatsapp: "+94770704274",
  addressLine1: "Hatton",
  addressLine2: "Sri Lanka",
  hours:
    "Mon–Fri, 9:00 AM – 6:00 PM | Sat, 10:00 AM – 4:00 PM (LKT)",
  socials: {
    instagram:
      "https://www.instagram.com/sagaaelite?igsh=YmRuc3V6dGloZWZ2",
    facebook: "https://www.facebook.com/share/1aXufbN6EX/",
    tiktok:
      "https://www.tiktok.com/@sagaa_elite?_r=1&_t=ZS-95kNEJkUjS6",
  },
};

export { SERVER_URL };

/* ================== AUTH FORMS ================== */
export const loginFormControl = [
  {
    name: "email",
    type: "email",
    placeholder: "exampl@gmail.com",
    id: "email",
    label: "Email",
    componentType: "INPUT"
  },
  {
    name: "password",
    type: "password",
    placeholder: "ABcd@12",
    id: "password",
    label: "Password",
    componentType: "INPUT"
  }
];

export const registerFormControl = [
  {
    name: "email",
    type: "email",
    placeholder: "exampl@gmail.com",
    id: "email",
    label: "Email",
    componentType: "INPUT"
  },
  {
    name: "password",
    type: "password",
    placeholder: "ABcd@12",
    id: "password",
    label: "Password",
    componentType: "INPUT"
  },
  {
    name: "confirmPassword",
    type: "password",
    placeholder: "ABcd@12",
    id: "confirmPassword",
    label: "Confirm Password",
    componentType: "INPUT"
  }
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
    componentType: "INPUT"
  }
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
    componentType: "INPUT"
  },
  {
    name: "confirmPassword",
    type: "password",
    placeholder: "Confirm new password",
    id: "confirmPassword",
    label: "Confirm Password",
    componentType: "INPUT"
  }
];

export const setPasswordFormControls = [
  {
    name: "newPassword",
    type: "password",
    placeholder: "Enter new password",
    id: "newPassword",
    label: "New Password",
    componentType: "INPUT"
  },
  {
    name: "confirmPassword",
    type: "password",
    placeholder: "Confirm new password",
    id: "confirmPassword",
    label: "Confirm Password",
    componentType: "INPUT"
  }
];

export const changePasswordFormControls = [
  {
    name: "oldPassword",
    type: "password",
    placeholder: "Current password",
    id: "oldPassword",
    label: "Current Password",
    componentType: "INPUT"
  },
  {
    name: "newPassword",
    type: "password",
    placeholder: "New password",
    id: "newPassword",
    label: "New Password",
    componentType: "INPUT"
  },
  {
    name: "passwordConfirm",
    type: "password",
    placeholder: "Confirm new password",
    id: "passwordConfirm",
    label: "Confirm New Password",
    componentType: "INPUT"
  }
];

/* ================== DROP FORM ================== */
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
  }
];