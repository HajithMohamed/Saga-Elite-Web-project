import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createAdmin, clearCreateStatus } from "../../store/admin/super-admin-slice";
import {
  modalBackdropVariants,
  modalCardVariants,
  toastFlashVariants,
} from "@/components/admin-components/_shared/animations";
import { PrimaryButton, SecondaryButton } from "@/components/admin-components/_shared/Buttons";

const INITIAL = { name: "", email: "", password: "" };

const CreateAdminModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { createLoading, createError, createSuccess } = useSelector(
    (s) => s.superAdmin
  );
  const [form, setForm] = useState(INITIAL);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (createSuccess) {
      const t = setTimeout(() => {
        dispatch(clearCreateStatus());
        onClose();
        setForm(INITIAL);
        setTouched({});
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [createSuccess, dispatch, onClose]);

  useEffect(() => {
    if (!isOpen) {
      dispatch(clearCreateStatus());
    }
  }, [isOpen, dispatch]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      errs.email = "Valid email required";
    if (form.password.length < 8) errs.password = "Minimum 8 characters";
    return errs;
  };

  const errors = validate();
  const isValid = Object.keys(errors).length === 0;

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleBlur = (e) =>
    setTouched((p) => ({ ...p, [e.target.name]: true }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if (!isValid) return;
    dispatch(createAdmin(form));
  };

  const inputClass = (name) =>
    `w-full rounded-2xl border bg-black px-3 py-2.5 text-sm text-white outline-none transition-colors ${
      touched[name] && errors[name]
        ? "border-red-500/50 focus:border-red-500"
        : "border-white/10 focus:border-[#D4AF37]"
    }`;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="create-admin-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div
            key="create-admin-card"
            className="mx-4 w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] shadow-2xl"
            variants={modalCardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Create New Admin
                </h2>
                <p className="mt-0.5 text-sm text-gray-400">
                  New admin can manage drops, orders, and products.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                ✕
              </button>
            </div>

            <AnimatePresence>
              {createSuccess ? (
                <motion.div
                  key="success"
                  variants={toastFlashVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="mx-6 mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-200"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 14 }}
                    className="inline-flex"
                  >
                    ✓
                  </motion.span>
                  Admin account created successfully!
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {createError ? (
                <motion.div
                  key="err"
                  variants={toastFlashVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="mx-6 mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"
                >
                  {createError}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Admin full name"
                  className={inputClass("name")}
                />
                {touched.name && errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="admin@sagaelite.lk"
                  className={inputClass("email")}
                />
                {touched.email && errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Temporary Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Min. 8 characters"
                  className={inputClass("password")}
                />
                {touched.password && errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <SecondaryButton
                  type="button"
                  onClick={onClose}
                  className="flex-1 justify-center rounded-2xl py-2.5"
                >
                  Cancel
                </SecondaryButton>
                <PrimaryButton
                  type="submit"
                  disabled={createLoading || createSuccess}
                  className="flex-1 justify-center rounded-2xl py-2.5"
                >
                  {createLoading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating…
                    </span>
                  ) : (
                    "Create Admin"
                  )}
                </PrimaryButton>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default CreateAdminModal;
