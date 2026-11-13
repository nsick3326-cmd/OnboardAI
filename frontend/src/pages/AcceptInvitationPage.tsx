import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { invitationsApi } from '../services/endpoints';
import { InvitationValidationResponse } from '../types';
import { OnboardAiLogo } from '../components/common/OnboardAiLogo';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import {
  CheckCircle2,
  Check,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  User,
  Mail,
  Briefcase,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [validation, setValidation] = useState<InvitationValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setError('No invitation token provided in the link. Please check the URL or contact your HR administrator.');
      return;
    }

    const validate = async () => {
      try {
        setIsLoading(true);
        const res = await invitationsApi.validateToken(token);
        setValidation(res);
        if (!res.valid) {
          setError(res.message || 'Invitation token is invalid or has expired.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to validate invitation token. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    validate();
  }, [token]);

  // Password Strength Calculation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumberOrSpecial = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);

  const strengthScore = [hasMinLength, hasUpper, hasLower, hasNumberOrSpecial].filter(Boolean).length;
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const getStrengthLabel = () => {
    if (!password) return { text: '', color: 'bg-slate-200' };
    if (strengthScore <= 1) return { text: 'Weak', color: 'bg-rose-500' };
    if (strengthScore === 2) return { text: 'Fair', color: 'bg-amber-500' };
    if (strengthScore === 3) return { text: 'Good', color: 'bg-blue-500' };
    return { text: 'Strong', color: 'bg-emerald-500' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasMinLength) {
      alert('Password must be at least 8 characters long.');
      return;
    }
    if (!passwordsMatch) {
      alert('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    try {
      setIsSubmitting(true);
      await invitationsApi.accept({
        token,
        password,
      });
      setIsActivated(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to activate account. The invitation may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center gap-3">
          <OnboardAiLogo size="md" />
          <span className="text-2xl font-bold tracking-tight text-navy-900">
            Onboard<span className="text-violet-600">AI</span>
          </span>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <Card className="p-8 shadow-xl border border-slate-200/80 rounded-2xl bg-white">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
              <p className="text-sm font-semibold text-navy-900">Validating invitation credentials...</p>
              <p className="text-xs text-slate-400">Verifying security token with your company workspace</p>
            </div>
          ) : error || !validation?.valid ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-navy-900">Invitation Link Inactive</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                {error || 'This invitation is either invalid, revoked, or has already been accepted.'}
              </p>
              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 max-w-sm mx-auto text-left">
                <p className="font-semibold text-slate-700 mb-1">What to do next:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>If your invitation expired, ask your HR administrator to resend it.</li>
                  <li>If you already activated your account, proceed directly to login.</li>
                </ul>
              </div>
              <div className="pt-4 flex justify-center gap-3">
                <Link to="/login">
                  <Button variant="violet" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Proceed to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : isActivated ? (
            <div className="py-8 text-center space-y-5 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-900">Account Successfully Activated!</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Welcome to <strong>{validation.organizationName}</strong>, {validation.fullName}.
                </p>
              </div>
              <div className="p-4 bg-violet-50/70 border border-violet-100 rounded-xl text-xs text-violet-900 max-w-md mx-auto space-y-1 text-left">
                <div className="flex items-center gap-2 font-bold text-violet-950">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span>Onboarding Workspace Ready</span>
                </div>
                <p>Your password has been securely registered. Your role: <strong>{validation.role?.replace('_', ' ')}</strong>.</p>
                <p>You can now sign in with your email: <strong>{validation.email}</strong>.</p>
              </div>
              <div className="pt-2">
                <Button
                  variant="violet"
                  size="lg"
                  className="w-full sm:w-auto px-8"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => navigate('/login')}
                >
                  Proceed to Login
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="text-center pb-2 border-b border-slate-100">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 mb-2">
                  <Building2 className="w-3.5 h-3.5" />
                  {validation.organizationName || 'Acme Corp'}
                </span>
                <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
                  Welcome to OnboardAI
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Activate your workspace account and set your password to begin onboarding.
                </p>
              </div>

              {/* Employee Summary (Immutable / Read-only) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Candidate Details</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Role Locked: <strong className="text-navy-900 font-bold">{validation.role?.replace('_', ' ')}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <span className="text-slate-400">Full Name</span>
                    <p className="font-semibold text-navy-900 text-sm">{validation.fullName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Work Email</span>
                    <p className="font-semibold text-navy-900 text-sm">{validation.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Department & Title</span>
                    <p className="font-medium text-slate-700">{validation.department} &bull; {validation.jobTitle}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Company Workspace</span>
                    <p className="font-medium text-slate-700">{validation.organizationName}</p>
                  </div>
                </div>
              </div>

              {/* Password Creation Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Password Input */}
                <div className="relative">
                  <Input
                    label="Create Password *"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter at least 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">Password Strength:</span>
                      <span className="font-bold text-xs">{getStrengthLabel().text}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 1 ? getStrengthLabel().color : 'bg-slate-200'}`} />
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 2 ? getStrengthLabel().color : 'bg-slate-200'}`} />
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 3 ? getStrengthLabel().color : 'bg-slate-200'}`} />
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 4 ? getStrengthLabel().color : 'bg-slate-200'}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-500 pt-1">
                      <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-medium' : ''}`}>
                        <Check className="w-3 h-3" /> Min 8 characters
                      </span>
                      <span className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-600 font-medium' : ''}`}>
                        <Check className="w-3 h-3" /> Uppercase letter
                      </span>
                      <span className={`flex items-center gap-1 ${hasLower ? 'text-emerald-600 font-medium' : ''}`}>
                        <Check className="w-3 h-3" /> Lowercase letter
                      </span>
                      <span className={`flex items-center gap-1 ${hasNumberOrSpecial ? 'text-emerald-600 font-medium' : ''}`}>
                        <Check className="w-3 h-3" /> Number or symbol
                      </span>
                    </div>
                  </div>
                )}

                {/* Confirm Password Input */}
                <div className="relative">
                  <Input
                    label="Confirm Password *"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {confirmPassword && (
                  <p className={`text-[11px] font-medium flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" /> Passwords do not match
                      </>
                    )}
                  </p>
                )}

                <div className="pt-4">
                  <Button
                    type="submit"
                    variant="violet"
                    size="lg"
                    className="w-full font-semibold"
                    isLoading={isSubmitting}
                    disabled={!hasMinLength || !passwordsMatch}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Activate Account & Access Workspace
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
