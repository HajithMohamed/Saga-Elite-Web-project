import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Key, LogOut } from 'lucide-react';
import { logoutUserAction, changePasswordAction } from '@/store/auth-slice';
import { changePasswordFormControls } from '@/config';
import CommonForm from '@/components/common-components/CommonForm';
import { toast } from '@/hooks/use-toast';

const Account = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    passwordConfirm: '',
  });
  const [errors, setErrors] = useState({});

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

  useEffect(() => {
    const newErrors = {};
    if (formData.newPassword && !passwordRegex.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must be at least 8 characters and include uppercase, lowercase, and a symbol.';
    }
    if (formData.passwordConfirm && formData.newPassword !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match.';
    }
    setErrors(newErrors);
  }, [formData]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      toast({ title: 'Invalid form', description: 'Fix the errors above before submitting.', variant: 'destructive' });
      return;
    }
    if (!formData.oldPassword || !formData.newPassword || !formData.passwordConfirm) {
      toast({ title: 'All fields required', description: 'Please fill in all password fields.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await dispatch(changePasswordAction(formData)).unwrap();
      toast({ title: 'Password updated', description: response.message || 'Your password has been changed.', variant: 'success' });
      setFormData({ oldPassword: '', newPassword: '', passwordConfirm: '' });
      setShowChangePassword(false);
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Password change failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUserAction()).unwrap();
      toast({ title: 'Signed out', description: 'See you next time.', variant: 'success' });
      navigate('/auth/login');
    } catch (err) {
      toast({ title: 'Logout failed', description: err?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const inputClasses = 'bg-transparent border-b border-gray-700 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:ring-0 font-sans';
  const labelClasses = 'text-white';
  const buttonClasses = 'bg-[#D4AF37] text-black font-bold uppercase tracking-wide py-2 rounded shadow';

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-3xl">

        {/* Page heading */}
        <div className="mb-10">
          <p className="text-xs text-[#D4AF37] tracking-widest uppercase mb-1">My Profile</p>
          <h1 className="text-3xl font-bold tracking-wide">Account</h1>
          <div className="mt-2 h-px w-16 bg-[#D4AF37]" />
        </div>

        {/* Avatar + basic info */}
        <div className="flex items-center gap-6 mb-10">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt="avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-[#D4AF37]/40"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
              <User className="w-8 h-8 text-[#D4AF37]" />
            </div>
          )}
          <div>
            <p className="text-xl font-semibold">{user?.email?.split('@')[0] || 'User'}</p>
            <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
            <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full border tracking-wide uppercase ${
              user?.role === 'admin' || user?.role === 'superadmin'
                ? 'border-[#D4AF37]/60 text-[#D4AF37]'
                : 'border-gray-700 text-gray-400'
            }`}>
              {user?.role || 'user'}
            </span>
          </div>
        </div>

        {/* Details card */}
        <div className="bg-[#0a0a0a] border border-[#D4AF37]/15 rounded-lg divide-y divide-[#D4AF37]/10 mb-6">

          <div className="flex items-center gap-4 px-6 py-4">
            <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Email</p>
              <p className="text-sm text-white mt-0.5">{user?.email || '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-6 py-4">
            <Shield className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Sign-in Method</p>
              <p className="text-sm text-white mt-0.5 capitalize">{user?.provider || 'local'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-6 py-4">
            <Shield className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Account Status</p>
              <p className={`text-sm mt-0.5 ${user?.isVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                {user?.isVerified ? 'Verified' : 'Not Verified'}
              </p>
            </div>
          </div>

        </div>

        {/* Change password — only for local accounts */}
        {user?.provider === 'local' && (
          <div className="bg-[#0a0a0a] border border-[#D4AF37]/15 rounded-lg mb-6">
            <button
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Key className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm font-medium tracking-wide">Change Password</span>
              </div>
              <span className="text-[#D4AF37] text-lg leading-none">{showChangePassword ? '−' : '+'}</span>
            </button>

            {showChangePassword && (
              <div className="px-6 pb-6 border-t border-[#D4AF37]/10 pt-4">
                <CommonForm
                  formControls={changePasswordFormControls}
                  formData={formData}
                  setFormData={setFormData}
                  formErrors={errors}
                  onSubmit={handleChangePassword}
                  buttonText={isLoading ? 'Updating…' : 'Update Password'}
                  buttonDisabled={isLoading}
                  inputClass={inputClasses}
                  labelClass={labelClasses}
                  buttonClass={buttonClasses}
                />
              </div>
            )}
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-sm text-gray-400 hover:text-red-400 transition-colors mt-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>

      </div>
    </div>
  );
};

export default Account;