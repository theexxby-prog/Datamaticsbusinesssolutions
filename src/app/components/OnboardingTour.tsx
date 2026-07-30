import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, BarChart2, Users, Receipt, CheckCircle } from 'lucide-react';

// const STORAGE_KEY = 'onboarding_v1_done'; // disabled — always show for demos

const steps = [
  {
    icon: LayoutDashboard,
    title: 'Welcome to your portal',
    description:
      'Everything you need to manage your campaigns, leads, invoices and documents — all in one place.',
  },
  {
    icon: BarChart2,
    title: 'Track your campaigns',
    description:
      'Monitor live campaign status, delivery progress, and performance metrics in real time.',
  },
  {
    icon: Users,
    title: 'Manage your leads',
    description:
      'Review, accept, or reject leads delivered by Datamatics Business Solutions. Filter by score, status, and campaign.',
  },
  {
    icon: Receipt,
    title: 'Invoices & billing',
    description:
      'View all invoices, track payment status, and download PDFs instantly.',
  },
  {
    icon: CheckCircle,
    title: "You're all set!",
    description:
      'Your account manager is always available via the Support tab. Let\'s get started!',
  },
];

export function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setVisible(true);
  }, []);

  const close = () => {
    setVisible(false);
  };

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-2xl bg-[var(--color-surface-raised)] shadow-2xl overflow-hidden z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Step content */}
            <div className="p-8 pb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Icon circle */}
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                    style={{ background: 'rgba(186,32,39,0.1)' }}
                  >
                    <Icon className="w-9 h-9" style={{ color: 'var(--color-primary)' }} />
                  </div>

                  <h2
                    className="font-bold text-gray-900 mb-3"
                    style={{ fontSize: '20px', letterSpacing: '-0.02em' }}
                  >
                    {current.title}
                  </h2>
                  <p className="text-gray-500 leading-relaxed" style={{ fontSize: '15px' }}>
                    {current.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2 mt-8">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className="rounded-full transition-all"
                    style={{
                      width: i === step ? '20px' : '8px',
                      height: '8px',
                      background: i === step ? 'var(--color-primary)' : 'var(--color-border)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Bottom bar */}
            <div
              className="flex items-center justify-between px-8 py-4 border-t border-gray-100"
              style={{ background: 'var(--color-surface)' }}
            >
              <button
                onClick={close}
                className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip tour
              </button>
              <span className="text-sm text-gray-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {step + 1} of {steps.length}
              </span>
              <button
                onClick={() => {
                  if (isLast) {
                    close();
                  } else {
                    setStep(s => s + 1);
                  }
                }}
                className="px-5 py-2 rounded-xl text-white font-semibold text-sm transition-colors"
                style={{ background: 'var(--color-primary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary-dark)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-primary)')}
              >
                {isLast ? 'Get started!' : 'Next →'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
