import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createAdmin, clearCreateStatus } from "../../store/admin/super-admin-slice";

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
      setTimeout(() => {
        dispatch(clearCreateStatus());
        onClose();
        setForm(INITIAL);
        setTouched({});
      }, 1200);
    }
  }, [createSuccess, dispatch, onClose]);

  useEffect(() => {
    if (!isOpen) {
      dispatch(clearCreateStatus());
    }
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      errs.email = "Valid email required";
    if (form.password.length < 8)
      errs.password = "Minimum 8 characters";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0b] shadow-2xl">
        {/* Header */}
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
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Success state */}
        {createSuccess && (
          <div className="mx-6 mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-200">
            <span>✓</span> Admin account created successfully!
          </div>
        )}

        {/* API error */}
        {createError && (
          <div className="mx-6 mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {createError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
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
              className={`w-full rounded-lg border bg-black px-3 py-2 text-sm text-white outline-none transition-colors
                ${
                  touched.name && errors.name
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-white/10 focus:border-[#D4AF37]"
                }`}
            />
            {touched.name && errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
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
              className={`w-full rounded-lg border bg-black px-3 py-2 text-sm text-white outline-none transition-colors
                ${
                  touched.email && errors.email
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-white/10 focus:border-[#D4AF37]"
                }`}
            />
            {touched.email && errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
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
              className={`w-full rounded-lg border bg-black px-3 py-2 text-sm text-white outline-none transition-colors
                ${
                  touched.password && errors.password
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-white/10 focus:border-[#D4AF37]"
                }`}
            />
            {touched.password && errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading || createSuccess}
              className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#c99d2f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createLoading ? "Creating…" : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAdminModal;
