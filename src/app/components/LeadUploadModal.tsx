import { useState, useMemo } from 'react';
import { X, Upload, FileText, CheckCircle2, ChevronDown, Building2, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mockCsvPreview } from '../mockData';
import { allClients } from '../data/mockClients';

interface LeadUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** If provided, client is pre-selected and locked */
  clientId?: string;
  clientName?: string;
  /** If provided, campaign is pre-selected and locked — skips selection step entirely */
  campaignId?: string;
  campaignName?: string;
}

type ColumnMapping = 'First Name' | 'Last Name' | 'Email' | 'Phone' | 'Company' | 'Job Title' | 'Source' | 'Ignore';

// step 0 = select client/campaign, step 1 = upload file, step 2 = map columns, step 3 = success
type Step = 0 | 1 | 2 | 3;

export function LeadUploadModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  campaignId,
  campaignName,
}: LeadUploadModalProps) {
  // Determine if we need the selection step
  const needsSelection = !campaignId;
  const initialStep: Step = needsSelection ? 0 : 1;

  const [step, setStep] = useState<Step>(initialStep);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [columnMappings, setColumnMappings] = useState<Record<string, ColumnMapping>>({});
  const [uploadedCount, setUploadedCount] = useState(0);

  // Selection step state
  const [internalClientId, setInternalClientId] = useState<string>(clientId || '');
  const [internalCampaignId, setInternalCampaignId] = useState<string>(campaignId || '');

  // Resolved values (prefer prop, fall back to modal selection)
  const resolvedClientId = clientId || internalClientId;
  const resolvedCampaignId = campaignId || internalCampaignId;

  const resolvedClient = useMemo(
    () => allClients.find(c => c.id === resolvedClientId) || null,
    [resolvedClientId]
  );
  const resolvedCampaign = useMemo(
    () => resolvedClient?.campaigns.find(c => c.id === resolvedCampaignId) || null,
    [resolvedClient, resolvedCampaignId]
  );

  // Campaigns available for selected client (in selection step)
  const availableCampaigns = useMemo(
    () => (internalClientId ? allClients.find(c => c.id === internalClientId)?.campaigns ?? [] : []),
    [internalClientId]
  );

  const canProceedFromSelection = resolvedClientId && resolvedCampaignId;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit');
      return;
    }
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      alert('Please upload a .csv or .xlsx file');
      return;
    }
    setSelectedFile(file);
    const headers = Object.keys(mockCsvPreview[0]);
    const mappings: Record<string, ColumnMapping> = {};
    headers.forEach(h => { mappings[h] = h as ColumnMapping; });
    setColumnMappings(mappings);
    setStep(2);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleConfirm = () => {
    setUploadedCount(mockCsvPreview.length * 10);
    setStep(3);
  };

  const handleClose = () => {
    setStep(initialStep);
    setSelectedFile(null);
    setColumnMappings({});
    setUploadedCount(0);
    if (!clientId) setInternalClientId('');
    if (!campaignId) setInternalCampaignId('');
    onClose();
  };

  const handleViewLeads = () => {
    handleClose();
    window.location.href = '/leads';
  };

  const columnOptions: ColumnMapping[] = [
    'First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Job Title', 'Source', 'Ignore',
  ];

  // ── Visual step indicator ─────────────────────────────────────────────────

  // When needsSelection: 4 visual steps (Select → Upload → Map → Done)
  // Otherwise: 3 visual steps (Upload → Map → Done)
  const visualSteps = needsSelection
    ? ['Select', 'Upload', 'Map', 'Done']
    : ['Upload', 'Map', 'Done'];

  // Current visual step index (0-based)
  const visualStepIndex = needsSelection ? step : step - 1;

  if (!isOpen) return null;

  const displayClientName = clientName || resolvedClient?.companyName || '';
  const displayCampaignName = campaignName || resolvedCampaign?.name || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden card-shadow-lg"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Upload Leads</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {step === 0 && 'Select a company and campaign'}
              {step === 1 && (displayClientName && displayCampaignName
                ? `${displayClientName} · ${displayCampaignName}`
                : 'Upload a CSV or Excel file')}
              {step === 2 && 'Map columns and preview data'}
              {step === 3 && 'Upload complete'}
            </p>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-3 bg-background-muted border-b border-border">
          <div className="flex items-center justify-center gap-1">
            {visualSteps.map((label, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      i === visualStepIndex
                        ? 'bg-[var(--color-primary-solid)] text-white'
                        : i < visualStepIndex
                        ? 'bg-[var(--color-success)] text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i < visualStepIndex ? '✓' : i + 1}
                  </div>
                  <span
                    className="text-xs"
                    style={{
                      color: i === visualStepIndex
                        ? 'var(--color-primary)'
                        : i < visualStepIndex
                        ? 'var(--color-success)'
                        : 'var(--color-text-muted)',
                      fontWeight: i === visualStepIndex ? 600 : 400,
                    }}
                  >
                    {label}
                  </span>
                </div>
                {i < visualSteps.length - 1 && (
                  <div
                    className={`w-10 h-0.5 mx-1 mb-4 ${i < visualStepIndex ? 'bg-[var(--color-success)]' : 'bg-muted'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
          <AnimatePresence mode="wait">

            {/* ── STEP 0: Select Client + Campaign ── */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <p className="text-sm text-muted-foreground">
                  Choose the company and campaign you want to upload leads to.
                </p>

                {/* Client selector — locked if clientId was passed in */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    <Building2 className="inline w-4 h-4 mr-1.5 mb-0.5" style={{ color: 'var(--color-primary)' }} />
                    Company
                  </label>
                  {clientId ? (
                    // Locked — client is pre-selected
                    <div
                      className="w-full px-4 py-3 text-sm rounded-lg border border-border bg-muted/30 text-foreground flex items-center gap-2"
                    >
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {clientName || resolvedClient?.companyName}
                      <span className="ml-auto text-xs text-muted-foreground">Pre-selected</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={internalClientId}
                        onChange={e => {
                          setInternalClientId(e.target.value);
                          setInternalCampaignId(''); // reset campaign when client changes
                        }}
                        className="w-full px-4 py-3 text-sm bg-input-background border border-border rounded-lg appearance-none pr-10 focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                      >
                        <option value="">— Select a company —</option>
                        {allClients.map(c => (
                          <option key={c.id} value={c.id}>{c.companyName}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  )}
                </div>

                {/* Campaign selector */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    <Target className="inline w-4 h-4 mr-1.5 mb-0.5" style={{ color: 'var(--color-primary)' }} />
                    Campaign
                  </label>
                  <div className="relative">
                    <select
                      value={internalCampaignId}
                      onChange={e => setInternalCampaignId(e.target.value)}
                      disabled={!resolvedClientId}
                      className="w-full px-4 py-3 text-sm bg-input-background border border-border rounded-lg appearance-none pr-10 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                    >
                      <option value="">
                        {resolvedClientId ? '— Select a campaign —' : '— Select a company first —'}
                      </option>
                      {availableCampaigns.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.status})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                  {resolvedClientId && availableCampaigns.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-2">No campaigns found for this company.</p>
                  )}
                </div>

                {/* Selected summary */}
                {canProceedFromSelection && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg border flex items-center gap-3"
                    style={{ borderColor: 'rgba(186,32,39,0.2)', background: 'rgba(186,32,39,0.04)' }}
                  >
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {resolvedClient?.companyName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {resolvedCampaign?.name}
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setStep(1)}
                    disabled={!canProceedFromSelection}
                    className="btn-primary px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}
                  >
                    Continue to Upload →
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 1: Upload File ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Locked destination banner */}
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border"
                  style={{ borderColor: 'rgba(186,32,39,0.2)', background: 'rgba(186,32,39,0.04)' }}
                >
                  <Target className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground">Uploading to: </span>
                    <span className="text-sm font-semibold text-foreground">
                      {displayClientName}
                    </span>
                    <span className="text-xs text-muted-foreground mx-1">·</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                      {displayCampaignName}
                    </span>
                  </div>
                  {needsSelection && (
                    <button
                      onClick={() => setStep(0)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    >
                      Change
                    </button>
                  )}
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                    isDragOver
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                      : 'border-border hover:border-[var(--color-primary)]/50 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground mb-1">
                        Drag and drop your file here
                      </p>
                      <p className="text-sm text-muted-foreground">or click to browse</p>
                    </div>
                    <label className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary-hover transition-all cursor-pointer">
                      Browse Files
                      <input
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                      />
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Supported formats: .xlsx, .csv • Max file size: 10MB
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Column Mapping & Preview ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Destination banner */}
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border"
                  style={{ borderColor: 'rgba(186,32,39,0.2)', background: 'rgba(186,32,39,0.04)' }}
                >
                  <Target className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                  <span className="text-sm font-semibold text-foreground">{displayClientName}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>{displayCampaignName}</span>
                </div>

                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                  <FileText className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {selectedFile?.name || 'leads_upload.csv'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {((selectedFile?.size || 125000) / 1024).toFixed(0)} KB • {mockCsvPreview.length} rows
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Map Columns</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Match each column from your file to the corresponding field
                  </p>
                  <div className="space-y-3 mb-6">
                    {Object.keys(mockCsvPreview[0]).map((header) => (
                      <div key={header} className="flex items-center gap-3">
                        <div className="w-40 text-sm font-medium text-foreground">{header}</div>
                        <div className="flex-1 relative">
                          <select
                            value={columnMappings[header] || 'Ignore'}
                            onChange={(e) =>
                              setColumnMappings({ ...columnMappings, [header]: e.target.value as ColumnMapping })
                            }
                            className="w-full px-4 py-2 text-sm bg-input-background border border-border rounded-lg appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {columnOptions.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Preview (First 5 rows)</h3>
                    <div className="overflow-x-auto border border-border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30">
                          <tr>
                            {Object.keys(mockCsvPreview[0]).map((header) => (
                              <th
                                key={header}
                                className="px-4 py-2 text-left font-semibold text-foreground border-b border-border whitespace-nowrap"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {mockCsvPreview.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="border-b border-border last:border-0">
                              {Object.values(row).map((val, i) => (
                                <td key={i} className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                                  {val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-border">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-2.5 text-sm font-semibold text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-all"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="px-6 py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg transition-all"
                  >
                    Confirm & Upload
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Success ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="py-8 text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="inline-flex"
                >
                  <div className="w-20 h-20 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-[var(--color-success)]" />
                  </div>
                </motion.div>

                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">Upload Successful!</h3>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{uploadedCount} leads</span> uploaded to{' '}
                    <span className="font-semibold text-foreground">{displayClientName}</span>
                    {displayCampaignName && (
                      <>
                        {' '}·{' '}
                        <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{displayCampaignName}</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex gap-3 justify-center pt-4">
                  <button
                    onClick={handleClose}
                    className="px-6 py-2.5 text-sm font-semibold text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleViewLeads}
                    className="px-6 py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg transition-all"
                  >
                    View Leads
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
