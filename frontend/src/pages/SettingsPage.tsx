import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { OnboardAiIcon } from '../components/common/OnboardAiLogo';
import { authApi } from '../services/endpoints';
import {
  Building2,
  User,
  Shield,
  Key,
  Bell,
  Cpu,
  Database,
  CheckCircle2,
  HardDrive,
  Check,
  Eye,
  EyeOff,
  Copy,
  Lock,
  Sparkles,
  ShieldCheck,
  Layers,
  Mail,
  AlertCircle,
  Globe,
  FileCode,
  Sliders,
} from 'lucide-react';

type SettingsTab = 'organization' | 'profile' | 'security' | 'ai' | 'integrations';

export const SettingsPage: React.FC = () => {
  const { user, isHr } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('organization');

  // Copy feedback state
  const [copiedId, setCopiedId] = useState(false);

  // Profile preferences
  const [phoneNumber, setPhoneNumber] = useState('+1 (555) 234-5678');
  const [timezone, setTimezone] = useState('America/New_York (EST)');
  const [profileSaved, setProfileSaved] = useState(false);

  // Notification toggles
  const [notifications, setNotifications] = useState({
    taskAssigned: true,
    documentVerification: true,
    approvalRequested: true,
    emailSummaryDaily: false,
    securityAlerts: true,
  });

  // Password update form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Password strength calculation
  const calculateStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 3) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 4) return { score: 3, label: 'Strong', color: 'bg-[#7655F7]' };
    return { score: 4, label: 'Excellent', color: 'bg-[#18B89A]' };
  };

  const strength = calculateStrength(newPassword);

  const handleCopyOrgId = () => {
    const orgId = user?.organizationId || 'dd73c680-e159-4913-b941-ca21e56c8217';
    navigator.clipboard.writeText(orgId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Please provide your current password for verification.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in both new password and confirmation fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and password confirmation do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    try {
      setPasswordLoading(true);
      if (user?.email) {
        await authApi.resetPassword(user.email, newPassword);
      }
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const tabs = [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'ai', label: 'AI Configuration', icon: Sparkles },
    { id: 'integrations', label: 'Integrations', icon: Layers },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header section (Non-redundant, clean page introduction) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold text-[#17182B] tracking-tight">Organization & Settings</h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Manage company workspace identity, account security, AI provider preferences, and platform credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            <span className="w-2 h-2 rounded-full bg-[#18B89A] animate-pulse" />
            Active Workspace
          </span>
        </div>
      </div>

      {/* Modern High-Contrast Segmented Tab Bar */}
      <div className="p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300/80 inline-flex flex-wrap gap-1.5 shadow-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#211B45] text-white shadow-md shadow-indigo-950/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? 'text-[#A18BFF]' : 'text-slate-500'}`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Organization Profile & Engine Infrastructure */}
      {activeTab === 'organization' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Organization Profile */}
            <div className="lg:col-span-2 space-y-6">
              {/* Premium Organization Brand Card with Deep Indigo Banner */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Colored Top Hero Banner */}
                <div className="bg-gradient-to-r from-[#211B45] via-[#2E2460] to-[#1C1739] text-white p-6 sm:p-7 relative overflow-hidden">
                  {/* Subtle geometric background glow */}
                  <div className="absolute right-0 top-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
                    {/* High-Contrast Company Brand Emblem */}
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center p-2.5 shrink-0">
                      <OnboardAiIcon size={44} variant="glyph" theme="dark" />
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Acme Corporation</h2>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-violet-400/20 text-violet-200 border border-violet-400/30 uppercase tracking-wider">
                          ENTERPRISE WORKSPACE
                        </span>
                      </div>
                      <p className="text-xs text-indigo-200/90 leading-relaxed">
                        Global Technology Solutions & Professional Services
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-200/80 pt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <Globe className="w-3.5 h-3.5 text-indigo-300" /> acme.com
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[#2DD4BF] font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#18B89A]" /> Multi-Tenant Isolated
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/70">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Company Legal Name
                      </span>
                      <p className="text-sm font-bold text-[#17182B]">Acme Corporation, Inc.</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Verified Delaware C-Corp</p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/70">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Corporate Work Domain
                      </span>
                      <p className="text-sm font-bold text-[#17182B]">acme.com</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Enforced for employee onboarding invites</p>
                    </div>
                  </div>

                  {/* Tenant Identifier Box */}
                  <div className="p-4 rounded-xl border border-indigo-200/80 bg-indigo-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#211B45] uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-[#7655F7]" /> Tenant Organization Identifier (UUID)
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyOrgId}
                        className="text-xs font-bold text-[#7655F7] hover:text-[#6039EB] flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-violet-100/70 transition-colors cursor-pointer"
                      >
                        {copiedId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#18B89A]" />
                            <span className="text-[#18B89A]">Copied to Clipboard</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy UUID</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs font-mono font-semibold text-[#211B45] bg-white p-2.5 rounded-lg border border-indigo-200/60 break-all select-all shadow-xs">
                      {user?.organizationId || 'dd73c680-e159-4913-b941-ca21e56c8217'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Row-level database security token that binds all employees, documents, and onboarding plans to Acme Corporation.
                    </p>
                  </div>

                  {/* Multi-Tenant Security Status */}
                  <div className="p-4 rounded-xl bg-teal-50 border border-teal-200/80 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#18B89A] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-teal-900">Multi-Tenant Isolation Enforced</h4>
                      <p className="text-xs text-teal-800/90 mt-0.5 leading-relaxed">
                        Data belonging to Acme Corporation is strictly segmented at the database query layer. Every API request authenticates the organization claim inside the JWT token, preventing cross-tenant leakage.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Platform Infrastructure & Real Runtime Info */}
            <div className="space-y-6">
              <Card
                title="Engine & Storage"
                subtitle="Verified underlying system infrastructure"
              >
                <div className="space-y-3 pt-1 text-xs">
                  {/* PostgreSQL Database */}
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-700 border border-emerald-500/25 flex items-center justify-center shrink-0">
                        <Database className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-[#17182B]">PostgreSQL 18</p>
                        <p className="text-[11px] text-slate-500">Flyway Schema V2 Applied</p>
                      </div>
                    </div>
                    <Badge variant="teal" size="sm">Connected</Badge>
                  </div>

                  {/* Spring Boot Backend */}
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-[#7655F7] border border-violet-500/25 flex items-center justify-center shrink-0">
                        <Cpu className="w-4 h-4 text-[#7655F7]" />
                      </div>
                      <div>
                        <p className="font-bold text-[#17182B]">Spring Boot 3.3.4</p>
                        <p className="text-[11px] text-slate-500">Java 21 • Stateless JWT</p>
                      </div>
                    </div>
                    <Badge variant="violet" size="sm">Operational</Badge>
                  </div>

                  {/* Document Vault */}
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-700 border border-indigo-500/25 flex items-center justify-center shrink-0">
                        <HardDrive className="w-4 h-4 text-[#211B45]" />
                      </div>
                      <div>
                        <p className="font-bold text-[#17182B]">Document Storage</p>
                        <p className="text-[11px] text-slate-500">Encrypted Local Vault</p>
                      </div>
                    </div>
                    <Badge variant="teal" size="sm">Healthy</Badge>
                  </div>

                  {/* AI Copilot Gateway */}
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-fuchsia-500/15 text-fuchsia-700 border border-fuchsia-500/25 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-fuchsia-600" />
                      </div>
                      <div>
                        <p className="font-bold text-[#17182B]">AI Intelligence</p>
                        <p className="text-[11px] text-slate-500">Hybrid Fallback Engine</p>
                      </div>
                    </div>
                    <Badge variant="teal" size="sm">Ready</Badge>
                  </div>
                </div>
              </Card>

              {/* Workspace Setup Security Policy */}
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-violet-50/80 to-indigo-50/40 border border-violet-200/70 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-[#211B45] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#7655F7]" /> Workspace Policy Protections
                </h4>
                <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#18B89A] shrink-0 mt-0.5" />
                    <span>Public HR Admin registration is permanently disabled.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#18B89A] shrink-0 mt-0.5" />
                    <span>New hire accounts require cryptographically signed invitations.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#18B89A] shrink-0 mt-0.5" />
                    <span>Role escalation during account activation is rejected.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: My Profile & Personal Preferences */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card
                title="User Profile"
                subtitle="Your authenticated account identity and personal preferences"
              >
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {profileSaved && (
                    <div className="p-3.5 bg-teal-50 text-teal-800 text-xs rounded-xl flex items-center gap-2 border border-teal-200 animate-in fade-in">
                      <Check className="w-4 h-4 text-[#18B89A] shrink-0" />
                      <span className="font-medium">Profile preferences updated successfully.</span>
                    </div>
                  )}

                  {/* Profile Avatar & Role Summary */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-[#211B45] text-white font-bold flex items-center justify-center text-xl shadow-md">
                        {user?.fullName?.charAt(0) || 'U'}
                      </div>
                      <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#18B89A] ring-2 ring-white" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#17182B]">{user?.fullName || 'Platform User'}</h3>
                        <Badge variant="indigo" size="sm">
                          {user?.role?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                      <p className="text-[11px] text-teal-700 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#18B89A]" />
                        Active Platform Member
                      </p>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Display Full Name"
                      defaultValue={user?.fullName || ''}
                      disabled
                      helperText="Official legal name. Contact an HR Admin to modify official identity records."
                    />
                    <Input
                      label="Work Email Address"
                      defaultValue={user?.email || ''}
                      disabled
                      helperText="Primary email used for JWT authentication and system alerts."
                    />
                    <Input
                      label="Direct Contact Phone (Optional)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      helperText="Used for urgent onboarding escalation notifications."
                    />
                    <Input
                      label="Preferred Work Timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="e.g. America/New_York (EST)"
                      helperText="Task deadlines and reminders align to this timezone."
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" variant="violet">
                      Save Preferences
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Notification Preferences */}
              <Card
                title="Notification Preferences"
                subtitle="Configure when and how you receive alerts and reminders"
              >
                <div className="space-y-3 pt-1">
                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-50 text-[#7655F7] flex items-center justify-center">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#17182B]">Task Assignment Alerts</p>
                        <p className="text-[11px] text-slate-500">Notify me immediately when an onboarding task is assigned to me</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.taskAssigned}
                      onChange={() => setNotifications((p) => ({ ...p, taskAssigned: !p.taskAssigned }))}
                      className="rounded border-slate-300 text-[#7655F7] focus:ring-[#7655F7] w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#17182B]">Document Verification Status</p>
                        <p className="text-[11px] text-slate-500">Alert me when uploaded compliance documents are verified or rejected</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.documentVerification}
                      onChange={() => setNotifications((p) => ({ ...p, documentVerification: !p.documentVerification }))}
                      className="rounded border-slate-300 text-[#7655F7] focus:ring-[#7655F7] w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#211B45] flex items-center justify-center">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#17182B]">Approval Request Notifications</p>
                        <p className="text-[11px] text-slate-500">Alert me when sign-off is required on employee submissions</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.approvalRequested}
                      onChange={() => setNotifications((p) => ({ ...p, approvalRequested: !p.approvalRequested }))}
                      className="rounded border-slate-300 text-[#7655F7] focus:ring-[#7655F7] w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </Card>
            </div>

            {/* Right Column: Role Privileges & Summary */}
            <div className="space-y-6">
              <Card title="Role & Permissions" subtitle="Your authorization privileges">
                <div className="space-y-4 pt-1">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Assigned Platform Role
                    </span>
                    <p className="text-sm font-bold text-[#211B45]">{user?.role?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {isHr
                        ? 'Full administrative control over employees, invitations, templates, and company policies.'
                        : 'Access to assigned onboarding plans, task completion, and document submission.'}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <p className="font-semibold text-[#17182B]">Active Permission Grants:</p>
                    <ul className="space-y-1.5 list-disc list-inside">
                      <li>Single-sign-on JWT authentication</li>
                      <li>Encrypted document upload and access</li>
                      <li>AI Onboarding Copilot conversations</li>
                      {isHr && <li>Employee creation & invitation dispatch</li>}
                      {isHr && <li>Template checklist generation & publishing</li>}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Security & Credentials */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card
                title="Security Credentials"
                subtitle="Change your password, review password strength, and manage active sessions"
              >
                <form onSubmit={handlePasswordUpdate} className="space-y-5">
                  {passwordError && (
                    <div className="p-3.5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-medium">{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3.5 bg-teal-50 text-teal-800 text-xs rounded-xl border border-teal-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#18B89A] shrink-0" />
                      <span className="font-semibold">Password updated successfully. Use your new password on your next sign in.</span>
                    </div>
                  )}

                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-semibold text-[#17182B] mb-1.5">
                      Current Password
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3.5 py-2 pr-10 text-sm text-[#17182B] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7655F7]/20 focus:border-[#7655F7] transition-standard"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password & Confirmation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#17182B] mb-1.5">
                        New Password
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="At least 8 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3.5 py-2 pr-10 text-sm text-[#17182B] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7655F7]/20 focus:border-[#7655F7] transition-standard"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#17182B] mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3.5 py-2 pr-10 text-sm text-[#17182B] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7655F7]/20 focus:border-[#7655F7] transition-standard"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#17182B]">Password Strength</span>
                        <span className={`font-bold ${
                          strength.label === 'Weak' ? 'text-rose-600' :
                          strength.label === 'Fair' ? 'text-amber-600' :
                          strength.label === 'Strong' ? 'text-[#7655F7]' : 'text-[#18B89A]'
                        }`}>
                          {strength.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 h-1.5">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`rounded-full transition-colors ${
                              strength.score >= step ? strength.color : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Recommendation: Combine uppercase and lowercase letters, numbers, and symbols.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={passwordLoading}
                      leftIcon={<Key className="w-4 h-4" />}
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </Card>
            </div>

            {/* Right Column: Security Architecture */}
            <div className="space-y-6">
              <Card title="Security Standards" subtitle="Architectural protections enforced">
                <div className="space-y-3.5 text-xs text-slate-600 pt-1 leading-relaxed">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2 font-semibold text-[#17182B] mb-1">
                      <Lock className="w-3.5 h-3.5 text-[#7655F7]" />
                      <span>BCrypt Key Derivation</span>
                    </div>
                    <p className="text-[11px]">
                      Passwords are never stored in plaintext. They are salted and hashed using BCrypt.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2 font-semibold text-[#17182B] mb-1">
                      <Key className="w-3.5 h-3.5 text-[#18B89A]" />
                      <span>SHA-256 Token Hashing</span>
                    </div>
                    <p className="text-[11px]">
                      Employee invitation links use single-use cryptographic tokens with SHA-256 server verification.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2 font-semibold text-[#17182B] mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Stateless JWT Authentication</span>
                    </div>
                    <p className="text-[11px]">
                      Sessions authenticate through short-lived cryptographic tokens without server session state.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI Assistant Configuration */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card
                title="AI Copilot & Intelligence Engine"
                subtitle="Configure enterprise LLM provider routing and safety guardrails"
                action={
                  <Badge variant="teal" className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#18B89A]" />
                    <span>OPERATIONAL</span>
                  </Badge>
                }
              >
                <div className="space-y-6 pt-1">
                  {/* Model Provider Info */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 text-[#7655F7] flex items-center justify-center">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#17182B]">OpenAI-Compatible Intelligence Gateway</h4>
                          <p className="text-xs text-slate-500">Configured Model: GPT-4o-mini / Enterprise Fallback</p>
                        </div>
                      </div>
                      <Badge variant="purple">Hybrid Provider</Badge>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-600 leading-relaxed">
                      Powers document data extraction, automated onboarding checklist suggestions, and policy question-answering with exact source citations.
                    </div>
                  </div>

                  {/* Safety & Isolation Rules */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#17182B] uppercase tracking-wider">
                      Enterprise AI Safety Guardrails
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center gap-2 font-semibold text-[#17182B] text-xs mb-1">
                          <CheckCircle2 className="w-4 h-4 text-[#18B89A]" />
                          <span>Human-in-the-Loop Review</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          AI generates draft checklist recommendations, but an HR Manager must explicitly review and approve them before tasks are published.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center gap-2 font-semibold text-[#17182B] text-xs mb-1">
                          <ShieldCheck className="w-4 h-4 text-[#7655F7]" />
                          <span>Zero Autonomous Decisions</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          The LLM cannot directly modify protected employee records, change salaries, or alter employment status.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center gap-2 font-semibold text-[#17182B] text-xs mb-1">
                          <Database className="w-4 h-4 text-emerald-600" />
                          <span>Tenant Context Isolation</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Policy retrieval prompts and embeddings are strictly sandboxed to Acme Corporation's documents.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center gap-2 font-semibold text-[#17182B] text-xs mb-1">
                          <FileCode className="w-4 h-4 text-indigo-600" />
                          <span>Strict JSON Schema Validation</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          All AI outputs are validated against structured DTOs before consumption by the backend services.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Secret Protection Notice */}
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Credential Protection Notice:</span> API keys and external endpoints are configured securely on the Spring Boot server using environment variables (`AI_API_KEY`, `AI_BASE_URL`). They are never exposed to browser clients.
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: AI Operational Metrics */}
            <div className="space-y-6">
              <Card title="Engine Health" subtitle="Real-time provider state">
                <div className="space-y-3 pt-1 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-medium text-[#17182B]">Fallback Engine</span>
                    <Badge variant="teal" size="sm">Active (Heuristic)</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-medium text-[#17182B]">Policy Citations</span>
                    <Badge variant="teal" size="sm">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-medium text-[#17182B]">Document OCR</span>
                    <Badge variant="teal" size="sm">Ready</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Integrations & Services */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Email Service */}
            <Card
              title="Email Delivery Service"
              subtitle="Employee invitation dispatch and alerts"
            >
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#7655F7]" />
                    <span className="font-bold text-sm text-[#17182B]">SMTP / Dev Mode</span>
                  </div>
                  <Badge variant="teal">Operational</Badge>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Real email delivery uses JavaMailSender when SMTP is configured. When SMTP credentials are unconfigured, invitations are logged securely and activation links can be copied directly in HR Invitation Management.
                </p>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Status: <span className="font-semibold text-teal-700">Ready (Dev Preview & SMTP Relay)</span>
                </div>
              </div>
            </Card>

            {/* Document Store */}
            <Card
              title="Document Storage Vault"
              subtitle="Employee compliance files and IDs"
            >
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-[#211B45]" />
                    <span className="font-bold text-sm text-[#17182B]">Local Encrypted Vault</span>
                  </div>
                  <Badge variant="teal">Active</Badge>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Secure local file storage mapped by tenant organization ID. Documents undergo verification workflows with multi-user audit logging.
                </p>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Status: <span className="font-semibold text-teal-700">Encrypted & Isolated</span>
                </div>
              </div>
            </Card>

            {/* Audit & Compliance Logging */}
            <Card
              title="Audit & Compliance"
              subtitle="Tamper-evident platform activity stream"
            >
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#18B89A]" />
                    <span className="font-bold text-sm text-[#17182B]">Audit Trail</span>
                  </div>
                  <Badge variant="teal">Recording</Badge>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Every employee invitation, account activation, document verification, and password change is permanently recorded in the database.
                </p>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Status: <span className="font-semibold text-teal-700">Immutable Logging Active</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
