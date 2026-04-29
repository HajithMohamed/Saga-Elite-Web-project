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
      setForm(INITIAL);
      setTouched({});
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Create New Admin
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              New admin can manage drops, orders, and products.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Success state */}
        {createSuccess && (
          <div className="mx-6 mt-5 p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2 text-green-700 text-sm font-medium">
            <span>✓</span> Admin account created successfully!
          </div>
        )}

        {/* API error */}
        {createError && (
          <div className="mx-6 mt-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {createError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Admin full name"
              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors
                ${
                  touched.name && errors.name
                    ? "border-red-400 focus:border-red-500 bg-red-50"
                    : "border-gray-200 focus:border-gray-900"
                }`}
            />
            {touched.name && errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="admin@sagaelite.lk"
              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors
                ${
                  touched.email && errors.email
                    ? "border-red-400 focus:border-red-500 bg-red-50"
                    : "border-gray-200 focus:border-gray-900"
                }`}
            />
            {touched.email && errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temporary Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Min. 8 characters"
              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors
                ${
                  touched.password && errors.password
                    ? "border-red-400 focus:border-red-500 bg-red-50"
                    : "border-gray-200 focus:border-gray-900"
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
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading || createSuccess}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
