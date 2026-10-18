import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Handshake, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const auth = useAuth();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!email.includes('@')) newErrors.email = 'Enter a valid email address';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    else if (phone.trim().length < 9) newErrors.phone = 'Phone number must be at least 9 characters';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (confirmPassword !== password) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      await auth.signup(name, email, phone, password);
      // Navigate after signup: use intendedPath if set, otherwise go to dashboard
      const destination = auth.intendedPath ?? '/dashboard';
      auth.setIntendedPath(null);
      navigate(destination);
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden md:flex md:w-[45%] bg-gradient-to-br from-neutral-950 via-neutral-900 to-[#0B2822] flex-col justify-between p-10 lg:p-14">
        {/* Logo */}
        <div>
          <Link to="/" className="flex items-center gap-2 group w-fit">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 group-hover:bg-emerald-500/25 transition-colors duration-200">
              <Handshake className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              MENDER <span className="text-emerald-400">RENTALS</span>
            </span>
          </Link>

          {/* Headline */}
          <h2 className="text-4xl lg:text-5xl font-bold text-white mt-12 leading-tight">
            Join Mender.
          </h2>
          <div className="w-10 h-1 bg-emerald-400 rounded-full mt-4 mb-5" />
          <p className="text-neutral-400 text-base leading-relaxed max-w-xs">
            Connect with local lenders and renters across Ethiopia.
          </p>
        </div>

        {/* Bottom tagline */}
        <p className="text-neutral-500 text-sm italic">
          "Your next event starts here."
        </p>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-[55%] bg-white flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12 relative">
        {/* Back button */}
        <Link
          to="/"
          className="absolute top-6 left-6 text-neutral-500 hover:text-neutral-800 transition-colors flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="w-full max-w-sm mx-auto">
          {/* Label */}
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-1">
            CREATE ACCOUNT
          </p>
          <div className="w-8 h-0.5 bg-emerald-500 rounded-full mb-6" />

          {/* Heading */}
          <h1 className="text-2xl lg:text-3xl">
            <span className="font-bold text-neutral-900">Sign up</span>
            <span className="text-neutral-600 font-normal"> to get started</span>
          </h1>

          {/* General error */}
          {errors.general && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {errors.general}
            </p>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="text-xs font-semibold text-neutral-600 uppercase tracking-wider"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Girma Mengistu"
                className={`w-full mt-1.5 px-4 py-3 rounded-xl border text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                  errors.name ? 'border-red-400' : 'border-neutral-300'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="text-xs font-semibold text-neutral-600 uppercase tracking-wider"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`w-full mt-1.5 px-4 py-3 rounded-xl border text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                  errors.email ? 'border-red-400' : 'border-neutral-300'
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label
                htmlFor="phone"
                className="text-xs font-semibold text-neutral-600 uppercase tracking-wider"
              >
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +251 91 234 5678"
                className={`w-full mt-1.5 px-4 py-3 rounded-xl border text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                  errors.phone ? 'border-red-400' : 'border-neutral-300'
                }`}
              />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="text-xs font-semibold text-neutral-600 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full mt-1.5 px-4 py-3 pr-12 rounded-xl border text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    errors.password ? 'border-red-400' : 'border-neutral-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="text-xs font-semibold text-neutral-600 uppercase tracking-wider"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full mt-1.5 px-4 py-3 pr-12 rounded-xl border text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    errors.confirmPassword ? 'border-red-400' : 'border-neutral-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(p => !p)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-xl transition-colors duration-200 shadow-sm text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account…' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mt-6">
              <div className="flex-1 h-px bg-neutral-200" />
              <span className="text-xs text-neutral-400">or</span>
              <div className="flex-1 h-px bg-neutral-200" />
            </div>

            {/* Sign in link */}
            <p className="text-center text-sm text-neutral-500 mt-5">
              Already have an account?{' '}
              <Link
                to="/signin"
                className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
