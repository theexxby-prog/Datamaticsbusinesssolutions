import { useState } from 'react';
import { X, Upload, Copy, Check, Mail, FileText, Sparkles, Eye, EyeOff, Info, Wifi, ChevronDown } from 'lucide-react';
import { DELIVERY_METHODS } from '../config/deliveryMethods';

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (campaign: CampaignFormData) => void;
  prefill?: Partial<CampaignFormData>;
}

export interface CampaignFormData {
  name: string;
  type: string;
  cpl: string;
  geography: 'US' | 'APAC' | 'EMEA';
  locations: string[];
  employeeSizeMin: string;
  employeeSizeMax: string;
  revenueSizeMin: string;
  revenueSizeMax: string;
  titles: string[];
  suppressionList?: File | null;
  additionalInfo: string;
  deliveryMethod?: string;
  deliveryConfig?: Record<string, string>;
}


const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const APAC_COUNTRIES = [
  'Australia', 'China', 'Hong Kong', 'India', 'Indonesia', 'Japan', 'Malaysia', 'New Zealand',
  'Philippines', 'Singapore', 'South Korea', 'Taiwan', 'Thailand', 'Vietnam'
];

const EMEA_COUNTRIES = [
  'Austria', 'Belgium', 'Czech Republic', 'Denmark', 'Finland', 'France', 'Germany', 'Greece',
  'Ireland', 'Italy', 'Netherlands', 'Norway', 'Poland', 'Portugal', 'South Africa', 'Spain',
  'Sweden', 'Switzerland', 'United Arab Emirates', 'United Kingdom'
];

const EMPLOYEE_SIZES = [
  '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'
];

const CAMPAIGN_TYPES = [
  'Single Touch', 'Double Touch', 'BANT', 'Content Syndication', 'Appointment Setting', 'Custom'
];

const JOB_TITLE_SUGGESTIONS = [
  'CEO', 'CTO', 'CIO', 'CFO', 'VP Sales', 'VP Marketing', 'VP Engineering', 'Director IT',
  'Director Sales', 'Director Marketing', 'Manager IT', 'Manager Sales', 'CISO'
];

export function NewCampaignModal({ isOpen, onClose, onSubmit, prefill }: NewCampaignModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'email' | 'parse'>('manual');
  const [emailCopied, setEmailCopied] = useState(false);
  const [pastedEmail, setPastedEmail] = useState('');
  const [parsedData, setParsedData] = useState<CampaignFormData | null>(null);
  const [titleInput, setTitleInput] = useState('');
  
  const [formData, setFormData] = useState<CampaignFormData>({
    name: prefill?.name ?? '',
    type: prefill?.type ?? 'Single Touch',
    cpl: prefill?.cpl ?? '',
    geography: prefill?.geography ?? 'US',
    locations: prefill?.locations ?? [],
    employeeSizeMin: prefill?.employeeSizeMin ?? '1-10',
    employeeSizeMax: prefill?.employeeSizeMax ?? '5000+',
    revenueSizeMin: prefill?.revenueSizeMin ?? '',
    revenueSizeMax: prefill?.revenueSizeMax ?? '',
    titles: prefill?.titles ?? [],
    suppressionList: null,
    additionalInfo: prefill?.additionalInfo ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Delivery preferences state
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [deliveryConfig, setDeliveryConfig] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [deliveryError, setDeliveryError] = useState('');

  if (!isOpen) return null;

  const clientName = 'johnsmith'; // This would come from auth context in real app
  const personalizedEmail = `newcampaign_${clientName}@datamaticsbpm.com`;

  const getLocationOptions = () => {
    switch (formData.geography) {
      case 'US': return US_STATES;
      case 'APAC': return APAC_COUNTRIES;
      case 'EMEA': return EMEA_COUNTRIES;
      default: return [];
    }
  };

  const handleLocationToggle = (location: string) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location]
    }));
  };

  const handleAddTitle = () => {
    if (titleInput.trim() && !formData.titles.includes(titleInput.trim())) {
      setFormData(prev => ({
        ...prev,
        titles: [...prev.titles, titleInput.trim()]
      }));
      setTitleInput('');
    }
  };

  const handleRemoveTitle = (title: string) => {
    setFormData(prev => ({
      ...prev,
      titles: prev.titles.filter(t => t !== title)
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      setFormData(prev => ({ ...prev, suppressionList: file }));
    } else {
      alert('Please upload a CSV or Excel file');
    }
  };

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText(personalizedEmail);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const parseEmailContent = () => {
    // Simple parsing logic for demo purposes
    const lowerText = pastedEmail.toLowerCase();
    
    const parsed: CampaignFormData = {
      name: '',
      type: 'Single Touch',
      cpl: '',
      geography: 'US',
      locations: [],
      employeeSizeMin: '1-10',
      employeeSizeMax: '5000+',
      revenueSizeMin: '',
      revenueSizeMax: '',
      titles: [],
      suppressionList: null,
      additionalInfo: ''
    };

    // Extract campaign name
    const nameMatch = pastedEmail.match(/(?:campaign name|name of campaign)[:\s]+([^\n]+)/i);
    if (nameMatch) parsed.name = nameMatch[1].trim();

    // Extract CPL
    const cplMatch = pastedEmail.match(/(?:cpl|cost per lead)[:\s]+\$?(\d+)/i);
    if (cplMatch) parsed.cpl = cplMatch[1];

    // Detect geography
    if (lowerText.includes('emea') || lowerText.includes('europe')) {
      parsed.geography = 'EMEA';
    } else if (lowerText.includes('apac') || lowerText.includes('asia')) {
      parsed.geography = 'APAC';
    } else {
      parsed.geography = 'US';
    }

    // Extract states/countries
    const locations: string[] = [];
    const allLocations = [...US_STATES, ...APAC_COUNTRIES, ...EMEA_COUNTRIES];
    allLocations.forEach(loc => {
      if (lowerText.includes(loc.toLowerCase())) {
        locations.push(loc);
      }
    });
    parsed.locations = locations;

    // Extract employee size
    const empMatch = pastedEmail.match(/(?:employee|employees)[:\s]+(\d+)[\s-]+to[\s-]+(\d+)/i);
    if (empMatch) {
      const min = parseInt(empMatch[1]);
      const max = parseInt(empMatch[2]);
      parsed.employeeSizeMin = EMPLOYEE_SIZES.find(s => s.includes(min.toString())) || '1-10';
      parsed.employeeSizeMax = EMPLOYEE_SIZES.find(s => s.includes(max.toString())) || '5000+';
    }

    // Extract revenue
    const revMatch = pastedEmail.match(/(?:revenue)[:\s]+\$?(\d+)M?[\s-]+to[\s-]+\$?(\d+)M?/i);
    if (revMatch) {
      parsed.revenueSizeMin = `$${revMatch[1]}M`;
      parsed.revenueSizeMax = `$${revMatch[2]}M`;
    }

    // Extract job titles
    const titles: string[] = [];
    JOB_TITLE_SUGGESTIONS.forEach(title => {
      if (lowerText.includes(title.toLowerCase())) {
        titles.push(title);
      }
    });
    parsed.titles = titles;

    // Detect campaign type
    if (lowerText.includes('bant')) parsed.type = 'BANT';
    else if (lowerText.includes('double touch')) parsed.type = 'Double Touch';
    else if (lowerText.includes('appointment')) parsed.type = 'Appointment Setting';
    else if (lowerText.includes('content syndication')) parsed.type = 'Content Syndication';

    // Extract additional info
    const additionalMatch = pastedEmail.match(/(?:additional info|additional requirements|notes)[:\s]+([^\n]+)/i);
    if (additionalMatch) parsed.additionalInfo = additionalMatch[1].trim();

    setParsedData(parsed);
  };

  const validateForm = (data: CampaignFormData): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.name.trim()) newErrors.name = 'Campaign name is required';
    if (!data.cpl || parseFloat(data.cpl) <= 0) newErrors.cpl = 'Valid CPL is required';
    if (data.locations.length === 0) newErrors.locations = 'At least one location is required';
    if (data.titles.length === 0) newErrors.titles = 'At least one job title is required';

    if (!deliveryMethod) {
      setDeliveryError('Please select a lead delivery method to continue');
      newErrors.delivery = 'delivery required';
    } else {
      setDeliveryError('');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    const dataToSubmit = parsedData || formData;
    
    if (validateForm(dataToSubmit)) {
      onSubmit({ ...dataToSubmit, deliveryMethod, deliveryConfig });
      onClose();
      // Reset form
      setFormData({
        name: '',
        type: 'Single Touch',
        cpl: '',
        geography: 'US',
        locations: [],
        employeeSizeMin: '1-10',
        employeeSizeMax: '5000+',
        revenueSizeMin: '',
        revenueSizeMax: '',
        titles: [],
        suppressionList: null,
        additionalInfo: ''
      });
      setDeliveryMethod('');
      setDeliveryConfig({});
      setShowSecrets({});
      setDeliveryError('');
      setParsedData(null);
      setPastedEmail('');
    }
  };

  const handleUseParsedData = () => {
    if (parsedData) {
      setFormData(parsedData);
      setActiveTab('manual');
      setParsedData(null);
    }
  };

  // ── Delivery helpers ────────────────────────────────────────────────────────

  const isDeliveryConfigured = (): boolean => {
    if (!deliveryMethod) return false;
    const c = deliveryConfig;
    switch (deliveryMethod) {
      case 'email':      return !!(c.email && c.frequency && c.format);
      case 'sheets':     return !!(c.sheetUrl);
      case 'webhook':    return !!(c.endpointUrl && c.method);
      case 'salesforce': return !!(c.instanceUrl && c.clientId && c.clientSecret);
      case 'hubspot':    return !!(c.hubspotConnected);
      case 'pipedrive':  return !!(c.apiKey);
      case 'convertr':   return !!(c.endpointUrl);
      case 'leadbyte':   return !!(c.postbackUrl);
      case 'ftp':        return !!(c.host && c.username && c.password && c.frequency);
      default:           return false;
    }
  };

  const setDC = (key: string, val: string) =>
    setDeliveryConfig(prev => ({ ...prev, [key]: val }));

  const toggleSecret = (key: string) =>
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));

  const infoBanner = (text: string) => (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[var(--color-info-bg)] border border-[var(--color-info)]/20">
      <Info className="w-4 h-4 text-[var(--color-info)] flex-shrink-0 mt-0.5" />
      <p className="text-[var(--color-info)]" style={{ fontSize: '13px' }}>{text}</p>
    </div>
  );

  const inputCls = "w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all";
  const selectCls = "w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all appearance-none cursor-pointer bg-[var(--color-surface-raised)]";
  const btnPrimary = "px-5 py-2.5 bg-[var(--color-primary-solid)] text-white rounded-xl hover:bg-[var(--color-primary-dark)] active:bg-[var(--color-primary-dark)] transition-all font-semibold";
  const btnOutline = "px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all font-semibold";

  const maskedInput = (fieldKey: string, placeholder: string, label: string, required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-[var(--color-error)]">*</span>}
      </label>
      <div className="relative">
        <input
          type={showSecrets[fieldKey] ? 'text' : 'password'}
          value={deliveryConfig[fieldKey] || ''}
          onChange={e => setDC(fieldKey, e.target.value)}
          placeholder={placeholder}
          className={inputCls + ' pr-10'}
        />
        <button
          type="button"
          onClick={() => toggleSecret(fieldKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showSecrets[fieldKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  const renderDeliveryConfig = () => {
    switch (deliveryMethod) {
      case 'email':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipient email address(es) <span className="text-[var(--color-error)]">*</span></label>
              <input type="text" value={deliveryConfig.email || ''} onChange={e => setDC('email', e.target.value)} placeholder="e.g., leads@yourcompany.com" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery frequency <span className="text-[var(--color-error)]">*</span></label>
                <select value={deliveryConfig.frequency || ''} onChange={e => setDC('frequency', e.target.value)} className={selectCls}>
                  <option value="">Select frequency...</option>
                  <option value="realtime">Real-time</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly summary</option>
                </select>
                <ChevronDown className="absolute right-3 top-[38px] w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">File format <span className="text-[var(--color-error)]">*</span></label>
                <select value={deliveryConfig.format || ''} onChange={e => setDC('format', e.target.value)} className={selectCls}>
                  <option value="">Select format...</option>
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel (.xlsx)</option>
                </select>
                <ChevronDown className="absolute right-3 top-[38px] w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        );

      case 'sheets':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Sheet URL <span className="text-[var(--color-error)]">*</span></label>
              <input type="url" value={deliveryConfig.sheetUrl || ''} onChange={e => setDC('sheetUrl', e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." className={inputCls} />
            </div>
            {infoBanner('Click Connect to authorise access via Google. You will be redirected to complete the OAuth flow.')}
            <button type="button" className={btnPrimary}>Connect Google Account</button>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Webhook endpoint URL <span className="text-[var(--color-error)]">*</span></label>
              <input type="url" value={deliveryConfig.endpointUrl || ''} onChange={e => setDC('endpointUrl', e.target.value)} placeholder="https://your-endpoint.com/leads" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Method <span className="text-[var(--color-error)]">*</span></label>
                <select value={deliveryConfig.method || 'POST'} onChange={e => setDC('method', e.target.value)} className={selectCls}>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                </select>
                <ChevronDown className="absolute right-3 top-[38px] w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Auth header <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" value={deliveryConfig.authHeader || ''} onChange={e => setDC('authHeader', e.target.value)} placeholder="Bearer token or API key" className={inputCls} />
              </div>
            </div>
            <button type="button" className={btnOutline}>Send Test Ping</button>
          </div>
        );

      case 'salesforce':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Salesforce Instance URL <span className="text-[var(--color-error)]">*</span></label>
              <input type="url" value={deliveryConfig.instanceUrl || ''} onChange={e => setDC('instanceUrl', e.target.value)} placeholder="https://yourorg.salesforce.com" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Client ID <span className="text-[var(--color-error)]">*</span></label>
                <input type="text" value={deliveryConfig.clientId || ''} onChange={e => setDC('clientId', e.target.value)} placeholder="Connected App Client ID" className={inputCls} />
              </div>
              {maskedInput('clientSecret', 'Connected App Client Secret', 'Client Secret', true)}
            </div>
            <button type="button" className={btnPrimary}>Connect Salesforce</button>
          </div>
        );

      case 'hubspot':
        return (
          <div className="space-y-4">
            {infoBanner('You will be redirected to HubSpot to authorise the connection via OAuth. No credentials are stored on our servers.')}
            <button type="button" className={btnPrimary} onClick={() => setDC('hubspotConnected', 'true')}>
              Connect HubSpot via OAuth
            </button>
            {deliveryConfig.hubspotConnected && (
              <div className="flex items-center gap-2" style={{ color: 'var(--color-success)', fontSize: '13px', fontWeight: 600 }}>
                <Wifi className="w-4 h-4" /> HubSpot connected successfully
              </div>
            )}
          </div>
        );

      case 'pipedrive':
        return (
          <div className="space-y-4">
            {maskedInput('apiKey', 'Your Pipedrive API key', 'Pipedrive API Key', true)}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pipeline ID <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" value={deliveryConfig.pipelineId || ''} onChange={e => setDC('pipelineId', e.target.value)} placeholder="e.g., 1" className={inputCls} />
            </div>
            <button type="button" className={btnPrimary}>Save & Connect</button>
          </div>
        );

      case 'convertr':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery endpoint URL <span className="text-[var(--color-error)]">*</span></label>
              <input type="url" value={deliveryConfig.endpointUrl || ''} onChange={e => setDC('endpointUrl', e.target.value)} placeholder="https://your-endpoint.com/post/..." className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Auth token <span className="text-gray-400 font-normal">(optional)</span></label>
              <div className="relative">
                <input type={showSecrets.convertrToken ? 'text' : 'password'} value={deliveryConfig.convertrToken || ''} onChange={e => setDC('convertrToken', e.target.value)} placeholder="Auth token" className={inputCls + ' pr-10'} />
                <button type="button" onClick={() => toggleSecret('convertrToken')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showSecrets.convertrToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="button" className={btnOutline}>Send Test Lead</button>
          </div>
        );

      case 'leadbyte':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">LeadByte Postback URL <span className="text-[var(--color-error)]">*</span></label>
              <input type="url" value={deliveryConfig.postbackUrl || ''} onChange={e => setDC('postbackUrl', e.target.value)} placeholder="https://app.leadbyte.co.uk/api/..." className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign token <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" value={deliveryConfig.campaignToken || ''} onChange={e => setDC('campaignToken', e.target.value)} placeholder="e.g., lbc_abc123" className={inputCls} />
            </div>
            <button type="button" className={btnOutline}>Send Test Lead</button>
          </div>
        );

      case 'ftp':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Host / Server address <span className="text-[var(--color-error)]">*</span></label>
                <input type="text" value={deliveryConfig.host || ''} onChange={e => setDC('host', e.target.value)} placeholder="ftp.yourserver.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username <span className="text-[var(--color-error)]">*</span></label>
                <input type="text" value={deliveryConfig.username || ''} onChange={e => setDC('username', e.target.value)} placeholder="ftp_username" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {maskedInput('password', 'FTP password', 'Password', true)}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination folder path</label>
                <input type="text" value={deliveryConfig.folderPath || ''} onChange={e => setDC('folderPath', e.target.value)} placeholder="/leads/incoming" className={inputCls} />
              </div>
            </div>
            <div className="relative w-full md:w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery frequency <span className="text-[var(--color-error)]">*</span></label>
              <select value={deliveryConfig.frequency || ''} onChange={e => setDC('frequency', e.target.value)} className={selectCls}>
                <option value="">Select frequency...</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <ChevronDown className="absolute right-3 top-[38px] w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface-raised)] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary)]/80 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Submit New Campaign</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-[var(--color-surface-raised)] rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'manual'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline-block mr-2" />
              Manual Entry
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'email'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Mail className="w-4 h-4 inline-block mr-2" />
              Email Instructions
            </button>
            <button
              onClick={() => setActiveTab('parse')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'parse'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Sparkles className="w-4 h-4 inline-block mr-2" />
              Paste & Parse
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'manual' && (
            <div className="space-y-4">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name <span className="text-[var(--color-error)]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                    errors.name ? 'border-[var(--color-error)]' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Channel Partner Demand Gen Q4 2026"
                />
                {errors.name && <p className="text-[var(--color-error)] text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Campaign Type & CPL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Type <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  >
                    {CAMPAIGN_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Per Lead (CPL) <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.cpl}
                      onChange={(e) => setFormData(prev => ({ ...prev, cpl: e.target.value }))}
                      className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                        errors.cpl ? 'border-[var(--color-error)]' : 'border-gray-300'
                      }`}
                      placeholder="45"
                    />
                  </div>
                  {errors.cpl && <p className="text-[var(--color-error)] text-sm mt-1">{errors.cpl}</p>}
                </div>
              </div>

              {/* Geography */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Geography <span className="text-[var(--color-error)]">*</span>
                </label>
                <div className="flex gap-4 mb-2">
                  {(['US', 'APAC', 'EMEA'] as const).map(geo => (
                    <label key={geo} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="geography"
                        value={geo}
                        checked={formData.geography === geo}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          geography: e.target.value as 'US' | 'APAC' | 'EMEA',
                          locations: [] // Reset locations when changing geography
                        }))}
                        className="w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      <span className="ml-2 text-gray-700">{geo}</span>
                    </label>
                  ))}
                </div>

                {/* Location Multi-select */}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select {formData.geography === 'US' ? 'States' : 'Countries'} <span className="text-[var(--color-error)]">*</span>
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-44 overflow-y-auto bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                    {getLocationOptions().map(location => (
                      <label key={location} className="flex items-center cursor-pointer hover:bg-[var(--color-surface-raised)] px-2 py-1 rounded">
                        <input
                          type="checkbox"
                          checked={formData.locations.includes(location)}
                          onChange={() => handleLocationToggle(location)}
                          className={`w-4 h-4 rounded cursor-pointer transition-all appearance-none bg-[var(--color-surface-raised)] border-2 border-gray-300 hover:border-gray-400 checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)] focus:ring-2 focus:ring-offset-0 focus:ring-[var(--color-primary)]/50 relative`}
                          style={{
                            backgroundImage: formData.locations.includes(location)
                              ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E\")`
                              : 'none',
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                        />
                        <span className="ml-2 text-sm text-gray-700">{location}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {formData.locations.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">{formData.locations.length} location(s) selected</p>
                )}
                {errors.locations && <p className="text-[var(--color-error)] text-sm mt-1">{errors.locations}</p>}
              </div>

              {/* Employee Size Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Size Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                    <select
                      value={formData.employeeSizeMin}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeSizeMin: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    >
                      {EMPLOYEE_SIZES.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                    <select
                      value={formData.employeeSizeMax}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeSizeMax: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    >
                      {EMPLOYEE_SIZES.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Revenue Size Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Revenue Size Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Minimum (e.g., $1M, $50M)</label>
                    <input
                      type="text"
                      value={formData.revenueSizeMin}
                      onChange={(e) => setFormData(prev => ({ ...prev, revenueSizeMin: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                      placeholder="$10M"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Maximum (e.g., $100M, $1B)</label>
                    <input
                      type="text"
                      value={formData.revenueSizeMax}
                      onChange={(e) => setFormData(prev => ({ ...prev, revenueSizeMax: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                      placeholder="$500M"
                    />
                  </div>
                </div>
              </div>

              {/* Job Titles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Titles <span className="text-[var(--color-error)]">*</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTitle())}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                      errors.titles ? 'border-[var(--color-error)]' : 'border-gray-300'
                    }`}
                    placeholder="Type title and press Enter"
                  />
                  <button
                    type="button"
                    onClick={handleAddTitle}
                    className="px-4 py-2 bg-[var(--color-primary-solid)] text-white rounded-lg hover:bg-[var(--color-primary-solid)]/90 transition-colors"
                  >
                    Add
                  </button>
                </div>
                
                {/* Suggestions */}
                <div className="mb-2">
                  <p className="text-xs text-gray-600 mb-1.5">Quick add:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {JOB_TITLE_SUGGESTIONS.map(title => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => {
                          if (!formData.titles.includes(title)) {
                            setFormData(prev => ({ ...prev, titles: [...prev.titles, title] }));
                          }
                        }}
                        disabled={formData.titles.includes(title)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                          formData.titles.includes(title)
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-[var(--color-surface-raised)] text-gray-700 border-gray-300 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                        }`}
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Titles */}
                {formData.titles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.titles.map(title => (
                      <span
                        key={title}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-primary-solid)] text-white rounded-full text-xs"
                      >
                        {title}
                        <button
                          type="button"
                          onClick={() => handleRemoveTitle(title)}
                          className="hover:bg-[var(--color-surface-raised)] rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {errors.titles && <p className="text-[var(--color-error)] text-sm mt-1">{errors.titles}</p>}
              </div>

              {/* Suppression List */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Suppression List <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[var(--color-primary)] transition-colors">
                  <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
                  <p className="text-xs text-gray-500 mb-2">Drag and drop your file here, or click to browse</p>
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="suppression-upload"
                  />
                  <label
                    htmlFor="suppression-upload"
                    className="inline-block px-3 py-1.5 bg-[var(--color-surface-raised)] border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Choose File
                  </label>
                  <p className="text-xs text-gray-400 mt-1.5">Accepts CSV or Excel files</p>
                  {formData.suppressionList && (
                    <p className="text-xs text-[var(--color-success)] mt-1.5 font-medium">
                      ✓ {formData.suppressionList.name}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Lead Delivery Preferences — placed above Additional Requirements ── */}
              <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                {/* Section header */}
                <div className="px-5 py-3" style={{ background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface) 100%)', borderBottom: '1px solid var(--color-border)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900" style={{ fontSize: '14px' }}>
                        How would you like to receive your leads?
                      </h3>
                      <p className="text-gray-500 mt-0.5" style={{ fontSize: '12px' }}>
                        Choose your preferred delivery method. You can update this at any time.
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isDeliveryConfigured() ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(5,150,105,0.10)', color: 'var(--color-success)', fontSize: '12px', fontWeight: 600 }}>
                          <span className="w-2 h-2 rounded-full bg-[var(--color-success)] inline-block" />
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(186,32,39,0.08)', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600 }}>
                          <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] inline-block" />
                          Not configured
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section body */}
                <div className="px-5 py-4 space-y-4 bg-[var(--color-surface-raised)]">
                  {/* Delivery method dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lead Delivery Method <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={deliveryMethod}
                        onChange={e => {
                          setDeliveryMethod(e.target.value);
                          setDeliveryConfig({});
                          setShowSecrets({});
                          if (e.target.value) setDeliveryError('');
                        }}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all appearance-none cursor-pointer bg-[var(--color-surface-raised)] ${deliveryError ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]/30' : 'border-gray-300'}`}
                      >
                        <option value="">Select a delivery method...</option>
                        {DELIVERY_METHODS.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {deliveryError && (
                      <p className="text-[var(--color-error)] mt-1.5" style={{ fontSize: '13px' }}>{deliveryError}</p>
                    )}
                  </div>

                  {/* Dynamic config panel */}
                  {deliveryMethod && (
                    <div
                      key={deliveryMethod}
                      style={{
                        animation: 'fadeInDelivery 0.22s ease-out',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '14px',
                        padding: '16px',
                      }}
                    >
                      {renderDeliveryConfig()}
                    </div>
                  )}
                </div>
              </div>
              {/* ── End Lead Delivery Preferences ─────────────────────────────── */}

              {/* Additional Requirements — now at the bottom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Requirements
                </label>
                <textarea
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  placeholder="Any other specifications or requirements for this campaign..."
                />
              </div>

            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <Mail className="w-16 h-16 text-[var(--color-primary)] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Submit via Email
                </h3>
                <p className="text-gray-600 mb-6">
                  Send your campaign requirements to your personalized email address
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Personalized Campaign Email:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={personalizedEmail}
                    readOnly
                    className="flex-1 px-4 py-3 bg-[var(--color-surface-raised)] border border-gray-300 rounded-lg font-mono text-sm"
                  />
                  <button
                    onClick={copyEmailToClipboard}
                    className="px-4 py-3 bg-[var(--color-primary-solid)] text-white rounded-lg hover:bg-[var(--color-primary-solid)]/90 transition-colors flex items-center gap-2"
                  >
                    {emailCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-[var(--color-info-bg)] border border-[var(--color-info)]/20 rounded-lg p-6">
                <h4 className="font-semibold text-[var(--color-info)] mb-3">Email Template Example:</h4>
                <div className="bg-[var(--color-surface-raised)] rounded p-4 text-sm text-gray-700 space-y-2 border border-[var(--color-info)]/10">
                  <p><strong>Subject:</strong> New Campaign Request - [Your Campaign Name]</p>
                  <p><strong>Campaign Name:</strong> Channel Partner Demand Gen Q4 2026</p>
                  <p><strong>Geography:</strong> US (California, Texas, New York)</p>
                  <p><strong>Employee Size:</strong> 500 to 2000</p>
                  <p><strong>Revenue:</strong> $50M to $500M</p>
                  <p><strong>Job Titles:</strong> CIO, CISO, IT Director</p>
                  <p><strong>CPL:</strong> $45</p>
                  <p><strong>Campaign Type:</strong> Double Touch</p>
                  <p><strong>Additional Info:</strong> Need leads validated within 48 hours</p>
                </div>
              </div>

              <div className="text-center text-gray-600">
                <p className="text-sm">
                  We'll process your email and set up your campaign within 24 hours
                </p>
              </div>
            </div>
          )}

          {activeTab === 'parse' && (
            <div className="space-y-6">
              {!parsedData ? (
                <>
                  {/* Sample Email Template for Demo */}
                  <div className="bg-[var(--color-info-bg)] border border-[var(--color-info)]/20 rounded-lg p-4">
                    <h4 className="font-semibold text-[var(--color-info)] mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Try the Demo!
                    </h4>
                    <p className="text-sm text-[var(--color-info)] mb-3">
                      Copy this sample email and paste it below to see how the parser works:
                    </p>
                    <div className="bg-[var(--color-surface-raised)] rounded p-3 text-xs font-mono text-gray-700 space-y-1 border border-[var(--color-info)]/10 max-h-40 overflow-y-auto">
                      <p>Campaign Name: Enterprise Cloud Security Initiative 2026</p>
                      <p>Geography: EMEA</p>
                      <p>Countries: United Kingdom, Germany, France, Netherlands</p>
                      <p>Employee Size: 501 to 2000</p>
                      <p>Revenue: $100M to $500M</p>
                      <p>Job Titles: CIO, CISO, IT Director, Security Manager</p>
                      <p>CPL: $65</p>
                      <p>Campaign Type: BANT</p>
                      <p>Additional Info: Need leads qualified through phone verification. Weekly delivery preferred.</p>
                    </div>
                    <button
                      onClick={() => {
                        const sampleEmail = `Campaign Name: Enterprise Cloud Security Initiative 2026
Geography: EMEA
Countries: United Kingdom, Germany, France, Netherlands
Employee Size: 501 to 2000
Revenue: $100M to $500M
Job Titles: CIO, CISO, IT Director, Security Manager
CPL: $65
Campaign Type: BANT
Additional Info: Need leads qualified through phone verification. Weekly delivery preferred.`;
                        setPastedEmail(sampleEmail);
                      }}
                      className="mt-2 text-sm text-[var(--color-info)] hover:text-[var(--color-info)]/80 font-medium"
                    >
                      Copy to textarea ↓
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paste Your Campaign Request Email
                    </label>
                    <textarea
                      value={pastedEmail}
                      onChange={(e) => setPastedEmail(e.target.value)}
                      rows={12}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent font-mono text-sm"
                      placeholder="Paste your email content here. Include details like campaign name, geography, employee size, revenue, titles, CPL, campaign type, etc."
                    />
                  </div>

                  <button
                    onClick={parseEmailContent}
                    disabled={!pastedEmail.trim()}
                    className="w-full px-6 py-3 bg-[var(--color-primary-solid)] text-white rounded-lg hover:bg-[var(--color-primary-solid)]/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Parse Email & Extract Campaign Details
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[var(--color-success-bg)] border border-[var(--color-success)]/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-[var(--color-success)] mb-2">
                      <Check className="w-5 h-5" />
                      <h3 className="font-semibold">Email Parsed Successfully!</h3>
                    </div>
                    <p className="text-sm text-[var(--color-success)]">
                      We've extracted the following details from your email. Review and edit if needed.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Campaign Name</p>
                      <p className="font-medium text-gray-900">{parsedData.name || 'Not detected'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Campaign Type</p>
                      <p className="font-medium text-gray-900">{parsedData.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">CPL</p>
                      <p className="font-medium text-gray-900">${parsedData.cpl || 'Not detected'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Geography</p>
                      <p className="font-medium text-gray-900">{parsedData.geography}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Locations ({parsedData.locations.length})</p>
                      <p className="font-medium text-gray-900">
                        {parsedData.locations.length > 0 ? parsedData.locations.join(', ') : 'None detected'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Employee Size</p>
                      <p className="font-medium text-gray-900">
                        {parsedData.employeeSizeMin} to {parsedData.employeeSizeMax}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Revenue Range</p>
                      <p className="font-medium text-gray-900">
                        {parsedData.revenueSizeMin || 'N/A'} to {parsedData.revenueSizeMax || 'N/A'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Job Titles ({parsedData.titles.length})</p>
                      <p className="font-medium text-gray-900">
                        {parsedData.titles.length > 0 ? parsedData.titles.join(', ') : 'None detected'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleUseParsedData}
                      className="flex-1 px-6 py-3 bg-[var(--color-primary-solid)] text-white rounded-lg hover:bg-[var(--color-primary-solid)]/90 transition-colors"
                    >
                      Edit in Form
                    </button>
                    <button
                      onClick={() => setParsedData(null)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Parse Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(activeTab === 'manual' || parsedData) && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
            {!isDeliveryConfigured() && (
              <p className="text-gray-400" style={{ fontSize: '12px' }}>
                Complete the Lead Delivery Preferences section to submit
              </p>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isDeliveryConfigured()}
                title={!isDeliveryConfigured() ? 'Please configure a lead delivery method first' : ''}
                className={`px-6 py-2 rounded-lg transition-colors font-semibold ${
                  isDeliveryConfigured()
                    ? 'bg-[var(--color-primary-solid)] text-white hover:bg-[var(--color-primary-dark)] active:bg-[var(--color-primary-dark)] cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Submit Campaign
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}