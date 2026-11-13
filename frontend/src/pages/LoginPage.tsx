import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/endpoints';
import { Role } from '../types';
import { useToast } from '../components/common/Toast';
import { OnboardAiLogo } from '../components/common/OnboardAiLogo';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  FileCheck2,
  Sparkles,
  HelpCircle,
  X,
  Users,
  UserCheck,
  Check,
  KeyRound,
  FileText,
} from 'lucide-react';

interface RoleOption {
  key: Role;
  title: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    key: 'EMPLOYEE',
    title: 'Employee',
    badge: 'Self-Service',
    description: 'Access your onboarding journey, assigned tasks and company documents.',
    icon: <UserCheck className="w-5 h-5 text-violet-600" />,
  },
  {
    key: 'HR_ADMIN',
    title: 'HR Admin',
    badge: 'Full Operations',
    description: 'Manage employees, onboarding workflows, company settings and HR operations.',
    icon: <ShieldCheck className="w-5 h-5 text-indigo-600" />,
  },
  {
    key: 'HR_MANAGER',
    title: 'HR Manager',
    badge: 'Talent & Review',
    description: 'Manage new hires, onboarding progress, documents and approvals.',
    icon: <FileCheck2 className="w-5 h-5 text-purple-600" />,
  },
  {
    key: 'MANAGER',
    title: 'Team Manager',
    badge: 'Department Lead',
    description: 'Manage your team, assign tasks and track employee onboarding progress.',
    icon: <Users className="w-5 h-5 text-blue-600" />,
  },
];

export const LoginPage: React.FC = () => {
  // Step 1: Role Selection, Step 2: Credentials Form
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const DEMO_CREDENTIALS: Record<Role, { email: string; name: string }> = {
    HR_ADMIN: { email: 'admin@acme.com', name: 'Elena Vance (HR Admin)' },
    HR_MANAGER: { email: 'hrmanager@acme.com', name: 'Marcus Bell (HR Manager)' },
    MANAGER: { email: 'manager@acme.com', name: 'David Kim (People Manager)' },
    EMPLOYEE: { email: 'john.doe@acme.com', name: 'John Doe (Software Engineer)' },
  };

  const handleSelectRole = (roleKey: Role) => {
    setSelectedRole(roleKey);
    setEmail(DEMO_CREDENTIALS[roleKey].email);
    setPassword('OnboardAI@123');
    setError(null);
    toast.info(
      'Demo Credentials Auto-Filled',
      `Loaded ${DEMO_CREDENTIALS[roleKey].name} (${DEMO_CREDENTIALS[roleKey].email})`
    );
  };

  // Load remembered email on mount if previously saved
  useEffect(() => {
    const savedEmail = localStorage.getItem('onboardai_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const validateForm = (): boolean => {
    let valid = true;
    setEmailError(null);
    setPasswordError(null);

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setEmailError('Work email is required');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setEmailError('Please enter a valid work email address');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedRole) {
      setError('Please select your portal role first.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Backend validates selectedRole vs account role in the database
      const authenticatedUser = await login(email.trim(), password, selectedRole);

      // Defense-in-depth: check role match
      if (authenticatedUser.role !== selectedRole) {
        throw new Error(
          `Role Mismatch: Your account is registered as ${authenticatedUser.role}, not ${selectedRole}. Please select the appropriate portal.`
        );
      }

      // Handle remember me preference
      if (rememberMe) {
        localStorage.setItem('onboardai_remember_email', email.trim());
      } else {
        localStorage.removeItem('onboardai_remember_email');
      }

      // Redirect based on actual verified role
      if (authenticatedUser.role === 'EMPLOYEE') {
        navigate('/dashboard/tasks');
      } else {
        navigate('/dashboard/overview');
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError('Invalid email or password. Please verify your credentials or reset your password.');
      } else if (err.message && err.message.includes('Role Mismatch')) {
        setError(err.message);
      } else if (!navigator.onLine || err.message === 'Network Error') {
        setError('Unable to connect to the OnboardAI authentication service. Please check your network connection.');
      } else {
        setError('An unexpected error occurred during sign-in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetEmail.trim()) {
      setResetError('Work email is required.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setResetError('New password must be at least 8 characters in length.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await authApi.resetPassword(resetEmail.trim(), newPassword);
      setResetSuccess(res.message || 'Password reset successfully. You may now sign in with your new credentials.');
      setPassword('');
    } catch (err: any) {
      setResetError(err.response?.data?.message || 'Unable to reset password. Please verify your registered email.');
    } finally {
      setIsResetting(false);
    }
  };

  const currentRoleConfig = selectedRole ? ROLE_OPTIONS.find((r) => r.key === selectedRole) : null;

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white selection:bg-violet-100 selection:text-violet-900 font-sans">
      {/* ======================================================== */}
      {/* LEFT COLUMN: Clean White Enterprise Authentication       */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col justify-between px-6 py-8 sm:px-12 md:px-16 lg:px-14 xl:px-18 max-w-2xl mx-auto w-full lg:max-w-none">
        {/* Top Branding Bar */}
        <header className="flex items-center justify-between w-full">
          <OnboardAiLogo size="md" showLabel={true} theme="light" />

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">SOC 2 Type II • 256-bit TLS</span>
          </div>
        </header>

        {/* Main Authentication Card */}
        <main className="my-auto py-8 w-full max-w-[460px] mx-auto">
          {/* STEP 1: ROLE SELECTION */}
          {!selectedRole ? (
            <div className="animate-in fade-in duration-200">
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200/60 text-[11px] font-semibold tracking-wide uppercase mb-2">
                  <Sparkles className="w-3 h-3 text-violet-600" />
                  <span>Role Verification</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  How would you like to sign in?
                </h1>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                  Select your workspace portal to continue. Your permissions will be authenticated by the backend.
                </p>
              </div>

              {/* Role Cards Grid */}
              <div className="space-y-3">
                {ROLE_OPTIONS.map((roleOpt) => (
                  <button
                    key={roleOpt.key}
                    type="button"
                    onClick={() => handleSelectRole(roleOpt.key)}
                    className="w-full text-left p-4 rounded-xl border border-slate-200/90 hover:border-violet-400 bg-white hover:bg-violet-50/40 transition-all duration-200 shadow-xs hover:shadow-card group focus:outline-none focus:ring-2 focus:ring-violet-500 card-interactive cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-violet-100/70 border border-slate-200/60 group-hover:border-violet-300 flex items-center justify-center shrink-0 transition-colors">
                          {roleOpt.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-slate-900 group-hover:text-violet-950">
                              {roleOpt.title}
                            </h2>
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {roleOpt.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-normal">
                            {roleOpt.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Enterprise Multi-Tenant Authentication</span>
                <span>Portals strictly enforced by role</span>
              </div>
            </div>
          ) : (
            /* STEP 2: CREDENTIALS FORM WITH ROLE INDICATOR */
            <div className="animate-in fade-in duration-200">
              {/* Back to Role Selection Button & Portal Indicator */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole(null);
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-700 transition-colors mb-3 focus:outline-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Role / Back</span>
                </button>

                <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50/80 border border-violet-200/80 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center shrink-0">
                      {currentRoleConfig?.icon}
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-violet-700 uppercase tracking-wider">
                        Signing in as
                      </div>
                      <div className="text-sm font-bold text-navy-900">
                        {currentRoleConfig?.title} Portal
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole(null);
                      setError(null);
                    }}
                    className="text-xs font-semibold text-violet-700 hover:underline"
                  >
                    Switch
                  </button>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Enter your credentials
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Please sign in with your corporate work account.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div
                  role="alert"
                  className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-2.5 shadow-sm animate-in fade-in duration-200"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-rose-950">Authentication Notice</p>
                    <p className="mt-0.5 text-rose-800 text-xs leading-normal">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-rose-400 hover:text-rose-600 p-0.5 -mr-1 -mt-1 rounded"
                    aria-label="Dismiss error message"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Work Email */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-navy-800 mb-1.5">
                    Work Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="username"
                      autoFocus
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                        if (error) setError(null);
                      }}
                      className={`w-full pl-10 pr-3.5 py-2.5 text-sm text-navy-900 bg-white border rounded-xl transition-standard focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                        emailError ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    />
                  </div>
                  {emailError && (
                    <p className="mt-1.5 text-xs text-rose-600 font-medium">
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-xs font-semibold text-navy-800">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotModalOpen(true);
                        setResetEmail(email);
                        setResetError(null);
                        setResetSuccess(null);
                      }}
                      className="text-xs font-medium text-violet-600 hover:text-violet-700 hover:underline transition-colors focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                        if (error) setError(null);
                      }}
                      className={`w-full pl-10 pr-11 py-2.5 text-sm text-navy-900 bg-white border rounded-xl transition-standard focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                        passwordError ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="mt-1.5 text-xs text-rose-600 font-medium">
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer accent-violet-600"
                    />
                    <span className="text-xs text-slate-600 font-medium">Remember this device</span>
                  </label>

                  <span className="text-[11px] text-slate-400">Encrypted JWT Session</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 active:scale-[0.99] rounded-xl transition-standard shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-navy-900 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed select-none"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating with Backend...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to {currentRoleConfig?.title} Portal</span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>

                {/* 1-Click Instant Demo Login shortcut */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRole) {
                        setEmail(DEMO_CREDENTIALS[selectedRole].email);
                        setPassword('OnboardAI@123');
                        setTimeout(() => {
                          const form = document.querySelector('form');
                          if (form) form.requestSubmit();
                        }, 50);
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-[#7655F7] border border-violet-200/80 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-xs active:scale-98"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#7655F7] animate-pulse-glow" />
                    <span>Instant 1-Click Demo Sign In</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>

        {/* Small Footer */}
        <footer className="w-full pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© 2026 OnboardAI, Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a
              href="#privacy"
              onClick={(e) => {
                e.preventDefault();
                alert('OnboardAI Privacy Policy: All employee personal records and company policies are encrypted at rest with AES-256 and isolated strictly per organization tenant.');
              }}
              className="hover:text-navy-900 transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="#terms"
              onClick={(e) => {
                e.preventDefault();
                alert('OnboardAI Terms of Service: Enterprise SaaS terms govern platform usage, data retention, and tenant access controls.');
              }}
              className="hover:text-navy-900 transition-colors"
            >
              Terms of Service
            </a>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Systems Operational
            </span>
          </div>
        </footer>
      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: Dark Royal Indigo & Purple Theme           */}
      {/* ======================================================== */}
      <div className="hidden lg:flex flex-1 flex-col justify-between relative bg-gradient-to-br from-[#241B55] via-[#2A1E63] to-[#342477] text-white p-10 xl:p-14 overflow-hidden border-l border-white/10 shadow-2xl">
        {/* Ambient atmospheric highlights */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#8B7CFF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#342477]/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#8B7CFF_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.06] pointer-events-none" />

        {/* Right-Side Header Content */}
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[#C9C2FF] text-xs font-semibold tracking-wider uppercase mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#8B7CFF]" />
            <span>ENTERPRISE WORKFORCE ONBOARDING</span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-bold tracking-tight text-white mb-3">
            Great beginnings start here.
          </h2>
          <p className="text-sm xl:text-base text-[#C9C2FF] leading-relaxed font-normal">
            Bring people, processes and possibilities together with a smarter employee onboarding experience.
          </p>
        </div>

        {/* Central Composition: Translucent Platform Preview */}
        <div className="relative z-10 my-auto py-4 space-y-4">
          {/* Subtle Team Connection Vector Illustration */}
          <div className="w-full flex justify-center">
            <svg
              viewBox="0 0 360 85"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full max-w-[340px] h-auto"
              aria-label="Illustration representing team collaboration and welcoming new employees"
            >
              {/* Soft purple/indigo backdrop blobs */}
              <ellipse cx="90" cy="42" rx="42" ry="28" fill="#342477" fillOpacity="0.6" />
              <circle cx="270" cy="40" r="32" fill="#241B55" fillOpacity="0.8" />
              <ellipse cx="180" cy="50" rx="55" ry="22" fill="#8B7CFF" fillOpacity="0.12" />

              {/* Welcoming Colleague 1 */}
              <circle cx="105" cy="24" r="9" fill="#8B7CFF" fillOpacity="0.3" stroke="#8B7CFF" strokeWidth="1.5" />
              <path
                d="M87 60 C87 45, 96 41, 105 41 C114 41, 123 45, 123 60"
                fill="none"
                stroke="#C9C2FF"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path d="M115 48 Q135 42 152 50" stroke="#8B7CFF" strokeWidth="1.5" strokeLinecap="round" />

              {/* Welcoming Colleague 2 */}
              <circle cx="255" cy="24" r="9" fill="#C9C2FF" fillOpacity="0.25" stroke="#C9C2FF" strokeWidth="1.5" />
              <path
                d="M237 60 C237 45, 246 41, 255 41 C264 41, 273 45, 273 60"
                fill="none"
                stroke="#C9C2FF"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path d="M245 48 Q225 42 208 50" stroke="#C9C2FF" strokeWidth="1.5" strokeLinecap="round" />

              {/* Central Connection Synergy Star */}
              <g transform="translate(168, 38)">
                <circle cx="12" cy="12" r="13" fill="#342477" stroke="#8B7CFF" strokeWidth="1.5" />
                <path
                  d="M12 6 L13.5 10.5 L18 12 L13.5 13.5 L12 18 L10.5 13.5 L6 12 L10.5 10.5 Z"
                  fill="#FFFFFF"
                />
              </g>

              {/* Ambient dots */}
              <circle cx="50" cy="30" r="2" fill="#8B7CFF" />
              <circle cx="310" cy="34" r="2.5" fill="#C9C2FF" />
              <circle cx="180" cy="18" r="1.5" fill="#FFFFFF" />
            </svg>
          </div>

          {/* Genuine Clean Product Preview (Light Translucent against Dark) */}
          <div className="w-full max-w-md mx-auto bg-white/[0.08] backdrop-blur-xl rounded-2xl border border-white/15 p-5 space-y-4 shadow-2xl">
            {/* Employee Profile Preview Card */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#342477] to-[#8B7CFF] text-white font-bold text-sm flex items-center justify-center ring-1 ring-white/30 shadow-sm">
                  AR
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Alex Rivera</h3>
                  <p className="text-xs text-[#C9C2FF]">Senior Product Designer • Design Systems</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#8B7CFF]/20 text-[#C9C2FF] border border-[#8B7CFF]/30 text-[11px] font-medium">
                Week 1 Cohort
              </span>
            </div>

            {/* Small Onboarding Progress Indicator */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Onboarding Velocity</span>
                <span className="font-bold text-[#8B7CFF]">67% Complete</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#8B7CFF] to-[#C9C2FF] w-[67%] transition-all duration-500" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#C9C2FF]">
                <span>2 of 3 initial milestones completed</span>
                <span className="text-emerald-300 font-medium">On Track</span>
              </div>
            </div>

            {/* Three Minimal Task Rows */}
            <div className="space-y-2 pt-1">
              {/* Task 1 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium text-slate-100">Complete employee profile</span>
                </div>
                <span className="text-[11px] text-[#C9C2FF] font-medium">Verified</span>
              </div>

              {/* Task 2 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium text-slate-100">Review company policies</span>
                </div>
                <span className="text-[11px] text-[#C9C2FF] font-medium">Verified</span>
              </div>

              {/* Task 3 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#8B7CFF]/15 border border-[#8B7CFF]/40 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#8B7CFF]/30 text-white flex items-center justify-center shrink-0 border border-[#8B7CFF]/40">
                    <Users className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium text-white">Meet your team</span>
                </div>
                <span className="text-[11px] font-semibold text-[#8B7CFF] bg-white/10 px-2 py-0.5 rounded-md border border-white/15">
                  Next step
                </span>
              </div>
            </div>

            {/* Document Verification Indicator */}
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#8B7CFF]" />
                <span className="text-slate-200 text-xs">I-9 & Tax Withholding (W-4)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                HR VERIFIED
              </span>
            </div>
          </div>
        </div>

        {/* Right-Side Subtle Footer */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#C9C2FF]/70">
          <span>Enterprise Role-Based Access Control</span>
          <span>Acme Corporation Domain</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ENTERPRISE FORGOT / RESET PASSWORD MODAL                 */}
      {/* ======================================================== */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsForgotModalOpen(false)}
            />

            {/* Modal Dialog */}
            <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-modal transition-all z-10 border border-slate-200/80">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-navy-900">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Reset Account Password</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {resetSuccess ? (
                <div className="my-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Credentials Updated</span>
                  </div>
                  <p>{resetSuccess}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      setResetSuccess(null);
                    }}
                    className="w-full mt-2 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-sm"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="mt-4 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Set a new password for your registered corporate account. All credentials will be securely hashed with BCrypt.
                  </p>

                  {resetError && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      New Password (min. 8 characters)
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(false)}
                      className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isResetting}
                      className="px-4 py-2 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg transition-colors shadow-sm disabled:opacity-60"
                    >
                      {isResetting ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
