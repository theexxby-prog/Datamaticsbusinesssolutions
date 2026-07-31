// ─── Relish Demand mock enrichments ──────────────────────────────────────────
// Shaped after the Relish Demand API sales-intelligence attribute set: 15
// company-tagged and 9 contact-tagged enrichment attributes (identity fields
// are structural keys, not enrichments — mirroring the production epic).
// Company records are keyed by company name, contact records by lead id, so
// several leads at one company would share the company card.

import type { Lead } from '../mockData';

export type SellerFitScore = 'Strong' | 'Good' | 'Moderate';
export type DecisionInfluence = 'High' | 'Medium' | 'Low';
export type EngagementPriority = 'P1' | 'P2' | 'P3';

/** The 15 company-tagged enrichment attributes. */
export interface RelishCompanyIntel {
  summary: string;
  industry: string;
  employeeCount: string;
  revenue: string;
  headquarters: string;
  painPoints: string[];
  buyingSignals: string[];
  securityPosture: string;
  recentNews: Array<{ date: string; headline: string }>;
  triggerEvents: string[];
  sellerFit: { score: SellerFitScore; rationale: string };
  competitorOpportunities: string[];
  likelyVendors: string[];
  decisionMakerRoles: string[];
  techStack: string[];
}

/** The 9 contact-tagged enrichment attributes. */
export interface RelishContactIntel {
  roleAnalysis: string;
  communicationStyle: string;
  decisionInfluence: DecisionInfluence;
  painPoints: string[];
  talkingPoints: string[];
  motivations: string[];
  recommendedApproach: string;
  objectionHandling: Array<{ q: string; a: string }>;
  engagementPriority: EngagementPriority;
}

const COMPANY_INTEL: Record<string, RelishCompanyIntel> = {
  'Summit Managed Services': {
    summary:
      'Regional MSP serving ~340 mid-market clients across the Pacific Northwest, expanding from break-fix into managed AI infrastructure services. Growing 18% YoY with a new co-managed IT practice.',
    industry: 'Managed IT Services',
    employeeCount: '280',
    revenue: '$46M',
    headquarters: 'Portland, OR',
    painPoints: [
      'Client demand for AI-ready infrastructure outpacing bench expertise',
      'Margin compression on commodity managed services',
      'Aging server fleet across their hosted-services clients',
    ],
    buyingSignals: [
      'Posted two AI infrastructure architect roles in the last 60 days',
      'Downloaded three AI-readiness assets across the campaign',
      'Attended the Lenovo AI infrastructure webinar (2 attendees)',
    ],
    securityPosture: 'SOC 2 Type II attested; standardizing clients on EDR + managed SIEM. Security practice led out of the CTO office.',
    recentNews: [
      { date: '2026-07-14', headline: 'Acquired Tualatin Valley IT, adding 40 SMB contracts' },
      { date: '2026-06-02', headline: 'Launched "Summit AI Foundations" consulting offer' },
    ],
    triggerEvents: [
      'Acquisition closing — infrastructure consolidation ahead',
      'FY27 hardware refresh budget opens in September',
    ],
    sellerFit: {
      score: 'Strong',
      rationale:
        'Their new AI services practice needs exactly the validated infrastructure designs and channel pricing you carry; incumbent relationships are thin at the AI workload tier.',
    },
    competitorOpportunities: [
      'Incumbent distributor has no AI reference architectures',
      'Current server vendor quoted 14-week lead times',
    ],
    likelyVendors: ['Dell (servers)', 'ConnectWise (PSA/RMM)', 'Veeam (backup)', 'Fortinet (network security)'],
    decisionMakerRoles: ['IT Director (champion)', 'CFO (budget)', 'CEO (strategic sign-off)'],
    techStack: ['VMware', 'Azure Stack HCI', 'ConnectWise', 'Veeam', 'FortiGate'],
  },
  'Northgate IT Partners': {
    summary:
      'IT consulting firm focused on financial-services clients in the Midwest; strong compliance practice, building out a data & AI advisory arm to defend accounts against Big-4 encroachment.',
    industry: 'IT Consulting',
    employeeCount: '120',
    revenue: '$22M',
    headquarters: 'Chicago, IL',
    painPoints: [
      'Losing AI advisory deals to larger firms with reference customers',
      'Client audit findings on data-governance gaps',
      'Utilization dip between compliance seasons',
    ],
    buyingSignals: [
      'VP IT engaged with 4 campaign assets in 3 weeks',
      'Searched partner portal for AI PoC bundles',
    ],
    securityPosture: 'Heavy compliance orientation (FFIEC, SOC 1); internal security modest — relies on client-side controls.',
    recentNews: [{ date: '2026-06-20', headline: 'Named a top-50 Midwest fintech consultancy by CrainsTech' }],
    triggerEvents: ['New data & AI practice lead hired from Accenture in May'],
    sellerFit: {
      score: 'Good',
      rationale: 'Needs white-labelable AI infrastructure and a fast PoC story; deal sizes moderate but repeatable across their client base.',
    },
    competitorOpportunities: ['Big-4 competitors quote 6-month discovery phases — speed wins here'],
    likelyVendors: ['Microsoft (Azure)', 'Snowflake', 'ServiceNow'],
    decisionMakerRoles: ['VP IT (champion)', 'Managing Partner (economic buyer)'],
    techStack: ['Azure', 'Microsoft 365', 'Snowflake', 'Power BI'],
  },
  'ClearPath Solutions Group': {
    summary:
      'National systems integrator specializing in healthcare provider networks; 400+ hospital integrations delivered. Modernizing its own delivery platform while clients push for AI triage pilots.',
    industry: 'Systems Integration',
    employeeCount: '450',
    revenue: '$88M',
    headquarters: 'Nashville, TN',
    painPoints: [
      'Hospital clients demanding AI pilots ClearPath cannot yet staff',
      'Integration margins squeezed by EHR vendor certification costs',
      'Legacy on-prem integration engines nearing end of support',
    ],
    buyingSignals: [
      'CIO personally clicked through two ROI-focused ads',
      'Engineering team spent 40+ minutes on the AI benchmark microsite',
    ],
    securityPosture: 'HIPAA-centric program, HITRUST certification in progress; strict vendor risk reviews (expect a 4-6 week security questionnaire).',
    recentNews: [
      { date: '2026-07-08', headline: 'Won a 3-year integration contract with a 12-hospital system' },
      { date: '2026-05-27', headline: 'Opened a Denver delivery center (60 hires planned)' },
    ],
    triggerEvents: ['New hospital contract requires AI-assisted patient-flow reporting by Q1 2027'],
    sellerFit: {
      score: 'Strong',
      rationale: 'Time-boxed need (Q1 2027 deliverable), healthcare-validated infrastructure requirement, and a CIO already engaging with the campaign.',
    },
    competitorOpportunities: ['Incumbent hardware partner has no healthcare AI validation', 'EHR vendor pushing expensive proprietary stack'],
    likelyVendors: ['Epic-adjacent tooling', 'HPE (servers)', 'Rhapsody (integration engine)', 'CrowdStrike'],
    decisionMakerRoles: ['CIO (decision maker)', 'VP Delivery (influencer)', 'CISO (veto on vendor risk)'],
    techStack: ['Rhapsody', 'HL7/FHIR tooling', 'HPE ProLiant', 'VMware', 'CrowdStrike'],
  },
  'Ironwood Systems Integration': {
    summary:
      'Industrial-focused integrator (manufacturing, logistics) with deep OT/IT convergence expertise; 600 staff across 5 states. Edge-AI quality inspection is their fastest-growing line.',
    industry: 'Systems Integration',
    employeeCount: '620',
    revenue: '$115M',
    headquarters: 'Cleveland, OH',
    painPoints: [
      'Edge-AI deployments blocked by GPU supply and power constraints',
      'OT security requirements slowing rollout velocity',
      'Clients demanding fixed-price AI inspection bundles',
    ],
    buyingSignals: [
      'Three engineers downloaded the edge-AI sizing guide',
      'Repeat visits to the ruggedized-hardware comparison page',
    ],
    securityPosture: 'IEC 62443-aligned OT practice; corporate IT runs zero-trust rollout, mid-maturity.',
    recentNews: [{ date: '2026-06-11', headline: 'Partnered with a national 3PL on warehouse-vision rollout (200 sites)' }],
    triggerEvents: ['200-site vision rollout needs standardized edge hardware by November'],
    sellerFit: {
      score: 'Strong',
      rationale: '200-site rollout with a November hardware deadline is a volume play; they want a partner who can commit supply, not just quote it.',
    },
    competitorOpportunities: ['Current supplier missed two delivery windows in Q2'],
    likelyVendors: ['Rockwell Automation', 'Cisco (industrial networking)', 'NVIDIA (edge GPU)', 'Claroty (OT security)'],
    decisionMakerRoles: ['IT Director (champion)', 'VP Engineering (technical authority)', 'COO (rollout owner)'],
    techStack: ['NVIDIA Jetson', 'Rockwell FactoryTalk', 'Cisco IE switching', 'Azure IoT', 'Claroty'],
  },
  'Halcyon Cloud Partners': {
    summary:
      'Cloud-native MSP born in AWS consulting, now multi-cloud; strong DevOps culture, 95% recurring revenue. Exploring GPU-as-a-service reselling for AI startups in their client base.',
    industry: 'Cloud Services',
    employeeCount: '210',
    revenue: '$38M',
    headquarters: 'Austin, TX',
    painPoints: [
      'Cloud GPU costs eroding client AI budgets — clients asking for hybrid options',
      'No hardware practice or logistics muscle in-house',
      'Talent retention against hyperscaler hiring',
    ],
    buyingSignals: ['DevOps team compared hybrid GPU TCO calculators twice in July'],
    securityPosture: 'Cloud-first security stack (CSPM, CIEM); minimal on-prem controls today — would need turnkey physical-stack security.',
    recentNews: [{ date: '2026-07-01', headline: 'Crossed 150 managed-cloud customers' }],
    triggerEvents: ['Two anchor clients requested hybrid GPU quotes in the same month'],
    sellerFit: {
      score: 'Good',
      rationale: 'They need a hardware-capable partner to land hybrid deals they are currently declining; strong services attach potential.',
    },
    competitorOpportunities: ['No incumbent hardware relationship at all — greenfield'],
    likelyVendors: ['AWS', 'HashiCorp', 'Datadog', 'Wiz'],
    decisionMakerRoles: ['DevOps Manager (evaluator)', 'CTO (decision maker)', 'CFO (capex skeptic)'],
    techStack: ['AWS', 'Terraform', 'Kubernetes', 'Datadog', 'Wiz'],
  },
  'Kestrel Security Resellers': {
    summary:
      'Security-focused VAR with an MDR practice; resells and manages EDR/SIEM for ~180 mid-market accounts. Evaluating AI-assisted SOC tooling to cut analyst load.',
    industry: 'Security',
    employeeCount: '95',
    revenue: '$19M',
    headquarters: 'Raleigh, NC',
    painPoints: [
      'SOC analyst burnout and 24/7 coverage costs',
      'Alert volumes up 3x with current tooling',
      'Clients pressing for AI-triage without new licence fees',
    ],
    buyingSignals: ['IT Manager engaged with the AI-SOC efficiency asset series (all 3 parts)'],
    securityPosture: 'Practitioner-grade internally: MDR stack dogfooded, ISO 27001 certified, quarterly purple-team exercises.',
    recentNews: [{ date: '2026-06-25', headline: 'Extended MDR coverage to OT environments' }],
    triggerEvents: ['Renewal window for their SIEM licencing lands in October'],
    sellerFit: {
      score: 'Moderate',
      rationale: 'Real pain and a clear renewal window, but budget is licence-locked; lead with efficiency economics rather than net-new platform.',
    },
    competitorOpportunities: ['SIEM incumbent raising renewal pricing 22%'],
    likelyVendors: ['SentinelOne', 'Splunk', 'KnowBe4'],
    decisionMakerRoles: ['IT Manager (champion)', 'SOC Director (user authority)', 'Owner-CEO (signs)'],
    techStack: ['SentinelOne', 'Splunk', 'Tines', 'Proofpoint'],
  },
  'Arbor Industrial Systems': {
    summary:
      'Industrial automation OEM and integrator for food & beverage plants; 1,100 employees, family-held. Digitizing plant-floor analytics for 300+ installed lines.',
    industry: 'Industrial Automation',
    employeeCount: '1,100',
    revenue: '$240M',
    headquarters: 'Grand Rapids, MI',
    painPoints: [
      'Plant-floor data stranded in proprietary historians',
      'Customers demanding predictive-maintenance SLAs',
      'IT/OT ownership split slows every infrastructure decision',
    ],
    buyingSignals: ['VP Operations viewed the predictive-maintenance ROI webinar on demand'],
    securityPosture: 'OT-conservative: air-gapped lines, slow patch cycles; corporate pushing IEC 62443 program this year.',
    recentNews: [{ date: '2026-05-19', headline: 'Announced smart-plant retrofit program with a national bakery group' }],
    triggerEvents: ['Retrofit program creates a standard compute spec decision this quarter'],
    sellerFit: {
      score: 'Good',
      rationale: 'A standard-spec decision this quarter is the wedge; win the spec, win 300 lines of follow-on volume.',
    },
    competitorOpportunities: ['Historian vendor locks analytics to its own appliances'],
    likelyVendors: ['Siemens', 'AVEVA', 'Stratus (edge)', 'Claroty'],
    decisionMakerRoles: ['VP Operations (economic buyer)', 'Plant IT Lead (evaluator)', 'CISO (new veto this year)'],
    techStack: ['Siemens TIA', 'AVEVA PI', 'Stratus ztC', 'VMware', 'Claroty'],
  },
};

const CONTACT_INTEL: Record<string, RelishContactIntel> = {
  L001: {
    roleAnalysis:
      'Owns infrastructure strategy and the new AI services practice; hands-on enough to judge architectures himself, senior enough to sponsor a partner switch.',
    communicationStyle: 'Direct and technical — leads with specifics, allergic to marketing language.',
    decisionInfluence: 'High',
    painPoints: [
      'Bench cannot staff the AI projects sales keeps closing',
      'Hardware lead times breaking client commitments',
      'Needs reference designs he can hand juniors',
    ],
    talkingPoints: [
      'Validated AI reference architectures his team can resell as-is',
      'Committed supply windows vs the 14-week quotes he is getting',
      'Co-delivery support while his bench skills up',
    ],
    motivations: ['Being the person who built Summit’s AI practice', 'Predictable delivery over lowest price', 'Tools his team can run without him'],
    recommendedApproach:
      'Open with the acquisition — consolidating Tualatin Valley’s contracts onto a standard AI-ready stack. Bring a reference design to the first call, not a deck.',
    objectionHandling: [
      { q: '“We already have a distributor.”', a: 'Keep them for commodity — this is the AI workload tier where they have no validated designs and you carry committed supply.' },
      { q: '“My team hasn’t run this stack.”', a: 'Co-delivery on the first two engagements is included; his juniors run the third from the runbooks.' },
      { q: '“Budget is tied up post-acquisition.”', a: 'FY27 refresh budget opens in September — spec now, land the order the week it opens.' },
    ],
    engagementPriority: 'P1',
  },
  L002: {
    roleAnalysis:
      'Runs IT and doubles as the delivery sponsor for the new data & AI advisory arm; evaluated vendors at her previous firm, so expects crisp proof points.',
    communicationStyle: 'Structured and evidence-driven — send the one-pager before the call, she will have read it.',
    decisionInfluence: 'High',
    painPoints: ['Losing AI deals to firms with references', 'Needs a PoC story that fits financial-services compliance', 'Partner responsiveness'],
    talkingPoints: [
      'White-label AI PoC bundle with compliance artifacts included',
      'Two-week PoC turnaround, fixed price',
      'FFIEC-friendly data-handling posture out of the box',
    ],
    motivations: ['Winning the first three AI advisory logos', 'Looking decisive to the managing partner', 'Repeatable margin, not one-offs'],
    recommendedApproach:
      'Position as her unfair advantage against Big-4 discovery timelines: their 6 months vs her 2 weeks. Offer a named-client pilot with the new practice lead.',
    objectionHandling: [
      { q: '“Our clients will ask who else runs this.”', a: 'Bring the healthcare and MSP references — different verticals, same regulated-data pattern.' },
      { q: '“We can’t carry hardware risk.”', a: 'Consumption-style structure: she sells the outcome, the stack shows up as opex.' },
      { q: '“Why not just build on Azure?”', a: 'She keeps Azure for burst; the hybrid floor is what makes her fixed-price PoCs profitable.' },
    ],
    engagementPriority: 'P1',
  },
  L003: {
    roleAnalysis:
      'CIO with board visibility; delegates evaluation but personally owns the Q1 2027 hospital deliverable, which makes him unusually reachable right now.',
    communicationStyle: 'Outcome-first — wants dates, risks and owner names; keep architecture in the appendix.',
    decisionInfluence: 'High',
    painPoints: ['A contractual AI deliverable with no staffed plan', 'Vendor risk reviews adding 6 weeks to everything', 'EHR vendor lock-in pressure'],
    talkingPoints: [
      'A dated plan that lands the patient-flow reporting pilot before Q1 2027',
      'Pre-completed HITRUST/HIPAA vendor-risk pack to short-circuit review',
      'Escape hatch from the EHR vendor’s proprietary stack',
    ],
    motivations: ['Hitting the hospital contract date', 'Not being locked to the EHR vendor', 'Clean audit trail'],
    recommendedApproach:
      'Anchor on the 12-hospital contract milestone. Offer to start the security questionnaire in parallel with commercial talks — that alone saves him a month.',
    objectionHandling: [
      { q: '“Our CISO will take weeks to clear you.”', a: 'The vendor-risk pack answers their standard questionnaire day one; CISO review runs in parallel, not in series.' },
      { q: '“The EHR vendor says only their stack is supported.”', a: 'The integration layer is certified either way — bring the compatibility matrix.' },
      { q: '“Q1 is too tight.”', a: 'The reference deployment is 9 weeks; the date works if hardware is ordered by October.' },
    ],
    engagementPriority: 'P1',
  },
  L005: {
    roleAnalysis:
      'IT Director who effectively runs vendor selection for the 200-site vision rollout; engineering-credible and deadline-driven.',
    communicationStyle: 'Pragmatic — cares about lead times, spares strategy and who answers the phone at 2am.',
    decisionInfluence: 'High',
    painPoints: ['November hardware deadline', 'A supplier that missed two Q2 windows', 'Power/thermal limits at older warehouse sites'],
    talkingPoints: [
      'Committed delivery schedule with penalties — the opposite of his Q2 experience',
      'Edge hardware validated for high-temp warehouse racks',
      'Spares depot model for 200-site coverage',
    ],
    motivations: ['Never explaining another slipped site to the COO', 'Standardization he can defend for 3 years', 'A partner who owns logistics'],
    recommendedApproach:
      'Lead with supply commitment and the missed-window story. A site-survey template for the first 10 warehouses makes it concrete in week one.',
    objectionHandling: [
      { q: '“We’re mid-rollout — switching is risky.”', a: 'The spec is compatible at the rack level; pilot 5 sites in parallel and compare delivery performance.' },
      { q: '“Your unit price is higher.”', a: 'Two missed windows cost more than the delta; the committed schedule carries penalties.' },
      { q: '“OT security will object.”', a: 'IEC 62443-aligned hardening guide ships with the design — their framework, pre-mapped.' },
    ],
    engagementPriority: 'P1',
  },
  L011: {
    roleAnalysis:
      'DevOps Manager doing the technical legwork on hybrid GPU options; influences up to a capex-skeptical CFO through the CTO.',
    communicationStyle: 'Casual but sharp — happiest in a shared doc or Slack thread; hates formal decks.',
    decisionInfluence: 'Medium',
    painPoints: ['Client AI bills exploding on cloud GPUs', 'No in-house hardware muscle', 'Fear of owning racks'],
    talkingPoints: [
      'Hybrid GPU floor cuts their two anchor clients’ costs ~40%',
      'Hardware operated as a service — his team never touches a rack',
      'TCO model he can hand the CFO unedited',
    ],
    motivations: ['Keeping the two anchor clients', 'Staying cloud-native in spirit', 'Not becoming a hardware admin'],
    recommendedApproach:
      'Share the TCO calculator pre-filled with their workload profile and offer a 30-day proof on one client workload. Keep it engineer-to-engineer.',
    objectionHandling: [
      { q: '“We’re a cloud company — owning hardware is off-brand.”', a: 'They own outcomes, not racks: managed hybrid keeps their ops model intact.' },
      { q: '“The CFO will never approve capex.”', a: 'Consumption pricing — it lands in the same opex line as AWS, just 40% smaller.' },
      { q: '“What about burst capacity?”', a: 'Burst stays in cloud by design; the floor handles the steady 70%.' },
    ],
    engagementPriority: 'P2',
  },
  L015: {
    roleAnalysis:
      'IT Manager who runs tooling evaluations for the MDR practice; trusted filter for the SOC Director and owner-CEO.',
    communicationStyle: 'Skeptical evaluator — expects proof in their own environment, discounts vendor benchmarks.',
    decisionInfluence: 'Medium',
    painPoints: ['Analyst burnout', '3x alert volume', 'SIEM renewal pricing up 22%'],
    talkingPoints: [
      'AI triage cutting tier-1 alert handling ~60% in comparable MDR shops',
      'Runs beside the existing SIEM through the October renewal decision',
      'Per-analyst economics, not per-event licencing',
    ],
    motivations: ['Keeping his analysts', 'Leverage against the SIEM renewal', 'Credibility with the SOC Director'],
    recommendedApproach:
      'Offer a two-week shadow-mode trial on their own alert stream before the October renewal window — let their numbers make the case.',
    objectionHandling: [
      { q: '“AI triage will miss things.”', a: 'Shadow mode proves recall on their own data before anything is suppressed.' },
      { q: '“No budget outside the SIEM line.”', a: 'The renewal delta alone (+22%) funds it; bring both quotes to the CEO together.' },
      { q: '“We’ve been burned by SOC tools.”', a: 'That is what the trial is for — two weeks, their data, their metrics, no commitment.' },
    ],
    engagementPriority: 'P2',
  },
  L017: {
    roleAnalysis:
      'VP Operations and economic buyer for the smart-plant retrofit; non-technical but owns the standard-spec decision and its budget.',
    communicationStyle: 'Business-case driven — talk uptime, scrap rates and payback periods, not architectures.',
    decisionInfluence: 'High',
    painPoints: ['Predictive-maintenance SLAs he cannot yet honour', 'IT/OT turf slowing decisions', 'Retrofit economics across 300 lines'],
    talkingPoints: [
      'One compute spec that both IT and OT have signed off elsewhere',
      'Payback under 14 months per retrofitted line',
      'Reference: the national bakery group pattern he is already committed to',
    ],
    motivations: ['Hitting the retrofit program dates', 'A decision both IT and OT accept', 'Defensible per-line economics'],
    recommendedApproach:
      'Frame as de-risking the spec decision: a joint IT/OT workshop that produces the standard, with security pre-briefed to neutralize the new CISO veto.',
    objectionHandling: [
      { q: '“Our historian vendor says use their appliance.”', a: 'Their appliance locks analytics to their licence; the open spec keeps his data portable across 300 lines.' },
      { q: '“IT and OT won’t agree.”', a: 'The workshop format has landed this agreement at comparable OEMs — both sides sign the same one-pager.' },
      { q: '“Capex per line is high.”', a: 'Under-14-month payback per line at their scrap-rate numbers; he can stage lines by ROI.' },
    ],
    engagementPriority: 'P1',
  },
};

const RELISH_LAST_UPDATED = 'Jul 29, 2026';

export interface RelishIntel {
  company: RelishCompanyIntel | null;
  contact: RelishContactIntel | null;
  lastUpdated: string;
}

const COVERED_LEAD_IDS = new Set(Object.keys(CONTACT_INTEL));
const COVERED_COMPANIES = new Set(Object.keys(COMPANY_INTEL));

/** O(1) — safe to call per table row. */
export function hasRelishIntel(lead: Pick<Lead, 'id' | 'company'>): boolean {
  return COVERED_LEAD_IDS.has(lead.id) || COVERED_COMPANIES.has(lead.company);
}

export function getRelishIntel(lead: Pick<Lead, 'id' | 'company'>): RelishIntel | null {
  const company = COMPANY_INTEL[lead.company] ?? null;
  const contact = CONTACT_INTEL[lead.id] ?? null;
  if (!company && !contact) return null;
  return { company, contact, lastUpdated: RELISH_LAST_UPDATED };
}
