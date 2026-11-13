import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/endpoints';
import { SetupStatusResponse } from '../types';
import { OnboardAiLogo } from '../components/common/OnboardAiLogo';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import {
  Building2,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Key,
} from 'lucide-react';

export const SetupWorkspacePage: React.FC = () => {
  const navigate = useNavigate();

  const [setupStatus, setSetupStatus] = useState<SetupStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form
  const [orgName, setOrgName] = useState('');
  const [domain, setDomain] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        const res = await authApi.getSetupStatus();
        setSetupStatus(res);
      } catch (err: any) {
        setError('Failed to query workspace setup status.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await authApi.setupWorkspace({
        organizationName: orgName,
        domain: domain || undefined,
        adminFullName: adminName,
        adminEmail,
        adminPassword,
        setupKey: setupKey || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initialize workspace. Please verify your credentials or setup key.');
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
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
              <p className="text-sm font-medium text-slate-500">Checking workspace status...</p>
            </div>
          ) : success ? (
            <div className="py-8 text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-bold text-navy-900">Company Workspace Initialized!</h2>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Organization <strong>{orgName}</strong> and primary HR Administrator <strong>{adminEmail}</strong> have been created.
              </p>
              <div className="pt-4">
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
          ) : !setupStatus?.initialSetupAllowed && !showKeyInput ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 mx-auto flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-navy-900">Workspace Already Initialized</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                An active organization and administrator account already exist. Direct public HR Admin registration is disabled for security.
              </p>
              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 max-w-sm mx-auto text-left space-y-1">
                <p className="font-semibold text-slate-700">Protected Workspace</p>
                <p>New employees and managers must be invited by an existing HR Administrator.</p>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/login">
                  <Button variant="violet">Return to Login</Button>
                </Link>
                <Button
                  variant="secondary"
                  leftIcon={<Key className="w-3.5 h-3.5" />}
                  onClick={() => setShowKeyInput(true)}
                >
                  Provision with Setup Key
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center pb-2 border-b border-slate-100">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Initial Administrator Setup
                </span>
                <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
                  Establish Company Workspace
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Create your company organization profile and the first authorized HR Administrator account.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Company / Organization Name *"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    required
                  />
                  <Input
                    label="Company Domain (Optional)"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. acme.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="HR Admin Full Name *"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    required
                  />
                  <Input
                    label="HR Admin Work Email *"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@company.com"
                    required
                  />
                </div>

                <Input
                  label="HR Admin Password *"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                />

                {(showKeyInput || !setupStatus?.initialSetupAllowed) && (
                  <Input
                    label="System Setup Secret Key *"
                    type="password"
                    value={setupKey}
                    onChange={(e) => setSetupKey(e.target.value)}
                    placeholder="Enter setup authorization key"
                    required
                  />
                )}

                <div className="pt-4 flex items-center justify-between">
                  <Link to="/login" className="text-xs text-slate-500 hover:text-navy-900 font-medium">
                    &larr; Back to Login
                  </Link>
                  <Button
                    type="submit"
                    variant="violet"
                    isLoading={isSubmitting}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Initialize Workspace
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
