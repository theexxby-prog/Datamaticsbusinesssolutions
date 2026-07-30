import { PersonAvatar } from '../components/PersonAvatar';
import { useState } from 'react';
import {
  User, Mail, Phone, Building2, MapPin, Globe, Lock, Bell, Shield,
  Smartphone, Monitor, Users, UserPlus, Trash2, Edit, Check, X,
  Key, Activity, Chrome, Calendar, CreditCard, Eye, EyeOff, Save, LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { toast } from 'sonner';
import { TccWordmark } from '../components/TccWordmark';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { NotificationsTabContent } from '../components/NotificationsTabContent';
import { DASH_METRICS, getDashPrefs, setDashMetric, type DashMetricKey } from '../data/dashboardPrefs';

export default function Account() {
  useDocumentTitle('Account Settings');
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'team' | 'security' | 'notifications' | 'dashboard'>('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [dashPrefs, setDashPrefs] = useState(getDashPrefs);

  const toggleDashMetric = (key: DashMetricKey) => {
    const next = !dashPrefs[key];
    setDashMetric(key, next);
    setDashPrefs((p) => ({ ...p, [key]: next }));
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'company', label: 'Company Info', icon: Building2 },
    { id: 'team', label: 'Team Members', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <>
      <div className="max-w-[1200px] mx-auto page-content animate-fadeIn">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 style={{ color: 'var(--color-text-primary)' }} className="mb-2">Account Settings</h1>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Manage your account preferences and security
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'btn-primary' : 'btn-outline'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="glass-card p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                Personal Information
              </h2>

              <div className="flex items-center gap-4 pb-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)', fontSize: '24px', fontWeight: 700 }}
                  aria-label="Renuka Lawless"
                >
                  JC
                </div>
                <div className="flex-1">
                  <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                    Profile Photo
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }} className="mb-2">
                    Upload a professional headshot
                  </p>
                  <button onClick={() => toast.info('Photo upload coming soon')} className="btn-outline px-3 py-2 text-sm">
                    Upload Photo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">First Name</label>
                  <input type="text" defaultValue="Renuka" className="input-base w-full px-4 py-3" />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">Last Name</label>
                  <input type="text" defaultValue="Lawless" className="input-base w-full px-4 py-3" />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">Job Title</label>
                  <input type="text" defaultValue="Director of Marketing" className="input-base w-full px-4 py-3" />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">Company</label>
                  <input type="text" defaultValue="The Channel Company" className="input-base w-full px-4 py-3" disabled style={{ background: 'var(--color-surface)' }} />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">Email Address</label>
                  <input type="email" defaultValue="rlawless@thechannelcompany.com" className="input-base w-full px-4 py-3" />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">Phone Number</label>
                  <input type="tel" defaultValue="+1 (555) 123-4567" className="input-base w-full px-4 py-3" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button className="btn-outline px-4 py-2">Cancel</button>
                <button onClick={() => toast.success('Profile updated successfully')} className="btn-primary px-4 py-2 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                  Dashboard Metrics
                </h2>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }} className="mt-1">
                  Choose which summary cards appear at the top of your dashboard. Hidden cards are removed and the row reflows automatically.
                </p>
              </div>
              <div className="space-y-3">
                {DASH_METRICS.map((m) => {
                  const on = dashPrefs[m.key];
                  return (
                    <div key={m.key} className="flex items-center justify-between p-4 rounded-xl" style={{ border: '1px solid var(--color-border)' }}>
                      <div>
                        <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>{m.label}</div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{m.description}</div>
                      </div>
                      <button
                        onClick={() => toggleDashMetric(m.key)}
                        role="switch"
                        aria-checked={on}
                        aria-label={`Toggle ${m.label}`}
                        className="relative rounded-full transition-colors flex-shrink-0"
                        style={{ width: 44, height: 24, background: on ? 'var(--color-primary)' : 'var(--color-border)' }}
                      >
                        <span className="absolute rounded-full bg-[var(--color-surface-raised)] shadow transition-transform" style={{ width: 18, height: 18, top: 3, left: 3, transform: on ? 'translateX(20px)' : 'translateX(0)' }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="space-y-6">
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                Company Information
              </h2>
              <div className="flex items-center gap-4">
                <TccWordmark variant="light" />
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  Your company mark, shown on reports and the weekly digest.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">Company Name</label>
                  <input type="text" defaultValue="The Channel Company" className="input-base w-full px-4 py-3" />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">Industry</label>
                  <select className="input-base w-full px-4 py-3">
                    <option>Technology</option>
                    <option>Healthcare</option>
                    <option>Finance</option>
                    <option>Manufacturing</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">Company Size</label>
                  <select className="input-base w-full px-4 py-3">
                    <option>1-50 employees</option>
                    <option>51-200 employees</option>
                    <option>201-500 employees</option>
                    <option>500+ employees</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">Website</label>
                  <input type="url" defaultValue="https://thechannelcompany.com" className="input-base w-full px-4 py-3" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button className="btn-outline px-4 py-2">Cancel</button>
                <button onClick={() => toast.success('Company information updated')} className="btn-primary px-4 py-2 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                Security Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">Current Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} placeholder="Enter current password" className="input-base w-full px-4 py-3 pr-12" />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 btn-ghost p-2">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">New Password</label>
                  <input type="password" placeholder="Enter new password" className="input-base w-full px-4 py-3" />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">Confirm New Password</label>
                  <input type="password" placeholder="Confirm new password" className="input-base w-full px-4 py-3" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button className="btn-outline px-4 py-2">Cancel</button>
                <button onClick={() => toast.success('Password updated successfully')} className="btn-primary px-4 py-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Update Password
                </button>
              </div>
              <div className="pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>Two-Factor Authentication</h3>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }} className="mt-1">Add an extra layer of security to your account</p>
                  </div>
                  <button onClick={() => toast.info('2FA setup coming soon')} className="btn-outline px-4 py-2">Enable</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>Team Members</h2>
                <button onClick={() => toast.info('Invite member modal coming soon')} className="btn-primary px-4 py-2 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Invite Member
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Renuka Lawless', email: 'rlawless@thechannelcompany.com', role: 'Admin' },
                  { name: 'Dana Whitcomb', email: 'dwhitcomb@thechannelcompany.com', role: 'Member' },
                  { name: 'Peter Ashford', email: 'pashford@thechannelcompany.com', role: 'Member' },
                ].map((member, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--color-border-light)' }}>
                    <div className="flex items-center gap-3">
                      <PersonAvatar name={member.name} size={40} />
                      <div>
                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>{member.name}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{member.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-completed">{member.role}</span>
                      <button className="btn-ghost p-2"><Edit className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && <NotificationsTabContent />}
        </div>
      </div>
    </>
  );
}