import { PersonAvatar } from '../components/PersonAvatar';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
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
import { useUnionLens } from '../hooks/useUnionLens';
import { showFutureModules } from '../config/demo';
import { useUnionPrefs, setUnionWidget, setDerivedIntel, setLeadsSignalsColumn, UNION_WIDGET_LABELS, UNION_WIDGET_DESCRIPTIONS, type UnionWidgetKey } from '../config/unionPrefs';

export default function Account() {
  useDocumentTitle('Account settings');
  const { currentUser } = useAuth();
  const lens = useUnionLens();
  const unionPrefs = useUnionPrefs();

  // Deep links (e.g. the dashboard's empty-state) can open a specific tab.
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'team' | 'security' | 'notifications' | 'dashboard'>(() => {
    const t = searchParams.get('tab');
    return t === 'dashboard' || t === 'notifications' ? t : 'profile';
  });
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
      <div className="max-w-[1440px] mx-auto page-content animate-fadeIn">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 style={{ color: 'var(--color-text-primary)' }} className="mb-2">Account settings</h1>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Manage your account preferences and security
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
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
        <div className="glass-card p-5">
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                Personal information
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
                    Profile photo
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
                  <input type="text" defaultValue={currentUser?.company ?? ''} className="input-base w-full px-4 py-3" disabled style={{ background: 'var(--color-surface)' }} />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">Email Address</label>
                  <input type="email" defaultValue={lens('rlawless@thechannelcompany.com')} className="input-base w-full px-4 py-3" />
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
                  Save changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (showFutureModules(currentUser) ? (
            <div className="space-y-5">
              <div>
                <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                  Dashboard Sections
                </h2>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }} className="mt-1">
                  Turn dashboard sections on or off — the layout reflows automatically. Defaults follow the
                  product spec; anything can be switched back on in seconds for a walkthrough.
                </p>
              </div>
              <div className="space-y-3">
                {(Object.keys(UNION_WIDGET_LABELS) as UnionWidgetKey[]).map((key) => {
                  const on = unionPrefs.widgets[key];
                  return (
                    <div key={key} className="flex items-center justify-between gap-4 p-4 rounded-xl" style={{ border: '1px solid var(--color-border)' }}>
                      <div>
                        <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                          {UNION_WIDGET_LABELS[key]}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                          {UNION_WIDGET_DESCRIPTIONS[key]}
                        </div>
                      </div>
                      <button
                        onClick={() => setUnionWidget(key, !on)}
                        role="switch"
                        aria-checked={on}
                        aria-label={`Toggle ${UNION_WIDGET_LABELS[key]}`}
                        className="relative rounded-full transition-colors flex-shrink-0"
                        style={{ width: 44, height: 24, background: on ? 'var(--color-primary)' : 'var(--color-border)' }}
                      >
                        <span className="absolute rounded-full bg-[var(--color-surface-raised)] shadow transition-transform" style={{ width: 18, height: 18, top: 3, left: 3, transform: on ? 'translateX(20px)' : 'translateX(0)' }} />
                      </button>
                    </div>
                  );
                })}
                <h3 className="pt-2" style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                  Data display
                </h3>
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl" style={{ border: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                      Signals column (Accounts list)
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                      Show the per-account signal count on the Leads → Accounts list.
                    </div>
                  </div>
                  <button
                    onClick={() => setLeadsSignalsColumn(!unionPrefs.leadsSignalsColumn)}
                    role="switch"
                    aria-checked={unionPrefs.leadsSignalsColumn}
                    aria-label="Toggle Signals column"
                    className="relative rounded-full transition-colors flex-shrink-0"
                    style={{ width: 44, height: 24, background: unionPrefs.leadsSignalsColumn ? 'var(--color-primary)' : 'var(--color-border)' }}
                  >
                    <span className="absolute rounded-full bg-[var(--color-surface-raised)] shadow transition-transform" style={{ width: 18, height: 18, top: 3, left: 3, transform: unionPrefs.leadsSignalsColumn ? 'translateX(20px)' : 'translateX(0)' }} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ border: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                      Derived scores &amp; synthesis
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                      AI-derived signal scores, readiness and synthesis narratives — off until real scoring lands.
                    </div>
                  </div>
                  <button
                    onClick={() => setDerivedIntel(!unionPrefs.derivedIntel)}
                    role="switch"
                    aria-checked={unionPrefs.derivedIntel}
                    aria-label="Toggle derived scores and synthesis"
                    className="relative rounded-full transition-colors flex-shrink-0"
                    style={{ width: 44, height: 24, background: unionPrefs.derivedIntel ? 'var(--color-primary)' : 'var(--color-border)' }}
                  >
                    <span className="absolute rounded-full bg-[var(--color-surface-raised)] shadow transition-transform" style={{ width: 18, height: 18, top: 3, left: 3, transform: unionPrefs.derivedIntel ? 'translateX(20px)' : 'translateX(0)' }} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
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
          ))}

          {activeTab === 'company' && (
            <div className="space-y-5">
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
                  <input type="text" defaultValue={currentUser?.company ?? ''} className="input-base w-full px-4 py-3" />
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
                  <input type="url" defaultValue={lens('https://thechannelcompany.com')} className="input-base w-full px-4 py-3" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button className="btn-outline px-4 py-2">Cancel</button>
                <button onClick={() => toast.success('Company information updated')} className="btn-primary px-4 py-2 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
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
                    <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>Two-Factor authentication</h3>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }} className="mt-1">Add an extra layer of security to your account</p>
                  </div>
                  <button onClick={() => toast.info('2FA setup coming soon')} className="btn-outline px-4 py-2">Enable</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>Team members</h2>
                <button onClick={() => toast.info('Invite member modal coming soon')} className="btn-primary px-4 py-2 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Invite Member
                </button>
              </div>
              <div className="space-y-3">
                {lens([
                  { name: 'Renuka Lawless', email: 'rlawless@thechannelcompany.com', role: 'Admin' },
                  { name: 'Dana Whitcomb', email: 'dwhitcomb@thechannelcompany.com', role: 'Member' },
                  { name: 'Peter Ashford', email: 'pashford@thechannelcompany.com', role: 'Member' },
                ]).map((member, i) => (
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