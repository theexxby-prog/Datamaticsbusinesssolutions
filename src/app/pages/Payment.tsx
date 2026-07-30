import { useState } from 'react';
import {
  CreditCard, Plus, Trash2, Check, Calendar, Lock, Building2, MapPin, Star, Shield
} from 'lucide-react';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  accountType?: string;
  isDefault: boolean;
}

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'card',
    last4: '4242',
    brand: 'Visa',
    expiryMonth: 12,
    expiryYear: 2026,
    isDefault: true
  },
  {
    id: '2',
    type: 'bank',
    last4: '6789',
    bankName: 'Chase Bank',
    accountType: 'Checking',
    isDefault: false
  }
];

export default function Payment() {
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState(mockPaymentMethods);

  const handleSetDefault = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(m => ({ ...m, isDefault: m.id === id }))
    );
    toast.success('Default payment method updated');
  };

  const handleDelete = (id: string) => {
    setPaymentMethods(methods => methods.filter(m => m.id !== id));
    toast.success('Payment method removed');
  };

  const getBrandColor = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '#1A1F71';
      case 'mastercard':
        return '#EB001B';
      case 'amex':
        return '#006FCF';
      default:
        return 'var(--color-primary)';
    }
  };

  return (
    <>
      <div className={`max-w-[1200px] mx-auto page-content animate-fadeIn`}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <div>
            <h1 style={{ color: 'var(--color-text-primary)' }} className="mb-2">Payment Methods</h1>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Manage your payment methods and billing information
            </p>
          </div>
          <button
            onClick={() => setShowAddMethodModal(true)}
            className="btn-primary px-4 py-2 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Payment Method
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 stagger-children">
          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-info-bg)' }}>
                <CreditCard className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
              </div>
            </div>
            <div className="kpi-card__number"><AnimatedCounter value={paymentMethods.length} /></div>
            <div className="kpi-card__label">Payment Methods</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-success-bg)' }}>
                <Check className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
              </div>
            </div>
            <div className="kpi-card__number"><AnimatedCounter value={paymentMethods.filter(m => m.isDefault).length} /></div>
            <div className="kpi-card__label">Default</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-tint)' }}>
                <Shield className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              </div>
            </div>
            <div className="kpi-card__number">100%</div>
            <div className="kpi-card__label">Secure</div>
          </div>
        </div>

        {/* Payment Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {paymentMethods.map((method, index) => (
            <div
              key={method.id}
              className="glass-card p-6 relative animate-slideInUp"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {method.isDefault && (
                <div className="absolute top-4 right-4">
                  <span className="badge badge-active">
                    <Star className="w-3 h-3" />
                    Default
                  </span>
                </div>
              )}

              {method.type === 'card' && (
                <>
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: getBrandColor(method.brand) }}
                    >
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                        {method.brand} •••• {method.last4}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        Expires {method.expiryMonth}/{method.expiryYear}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {method.type === 'bank' && (
                <>
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: 'var(--color-info-bg)' }}
                    >
                      <Building2 className="w-6 h-6" style={{ color: 'var(--color-info)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                        {method.bankName}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        {method.accountType} •••• {method.last4}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    className="btn-outline flex-1 px-3 py-2 text-sm"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(method.id)}
                  className="btn-ghost p-2"
                >
                  <Trash2 className="w-4 h-4" style={{ color: 'var(--color-error)' }} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Billing Address */}
        <div className="glass-card p-6">
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }} className="mb-4">
            Billing Address
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">
                Street Address
              </label>
              <input
                type="text"
                defaultValue="123 Business St"
                className="input-base w-full px-4 py-3"
              />
            </div>

            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">
                City
              </label>
              <input
                type="text"
                defaultValue="San Francisco"
                className="input-base w-full px-4 py-3"
              />
            </div>

            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">
                State
              </label>
              <select className="input-base w-full px-4 py-3">
                <option>California</option>
                <option>New York</option>
                <option>Texas</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                defaultValue="94102"
                className="input-base w-full px-4 py-3"
              />
            </div>

            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }} className="block mb-2">
                Country
              </label>
              <select className="input-base w-full px-4 py-3">
                <option>United States</option>
                <option>Canada</option>
                <option>United Kingdom</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button className="btn-outline px-4 py-2">Cancel</button>
            <button
              onClick={() => toast.success('Billing address updated')}
              className="btn-primary px-4 py-2"
            >
              Save Address
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="glass-card p-4 mt-6 flex items-start gap-3">
          <Lock className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
              Your payment information is secure
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }} className="mt-1">
              All transactions are encrypted and secured with industry-standard protocols.
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--color-surface)' }}>
          <div className="glass-card-strong p-6 max-w-md w-full">
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }} className="mb-4">
              Add Payment Method
            </h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }} className="mb-4">
              Payment method setup coming soon
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddMethodModal(false)}
                className="btn-outline px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}