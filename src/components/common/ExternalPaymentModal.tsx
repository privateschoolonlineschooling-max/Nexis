import React, { useState } from 'react';
import { ExternalLink, ShieldAlert, AlertTriangle, CheckCircle2, Lock, X } from 'lucide-react';
import { MarketplaceListing } from '../../types/index';
import { VerifiedBadge } from './VerifiedBadge';

interface ExternalPaymentModalProps {
  listing: MarketplaceListing;
  isOpen: boolean;
  onClose: () => void;
}

export const ExternalPaymentModal: React.FC<ExternalPaymentModalProps> = ({
  listing,
  isOpen,
  onClose
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  const externalUrl = listing.externalPaymentLink || '#';
  let hostname = 'External Provider';
  try {
    hostname = new URL(externalUrl).hostname;
  } catch (e) {
    hostname = listing.externalPaymentProvider || 'External Website';
  }

  const handleProceed = () => {
    if (!acknowledged) return;
    // Open in new tab securely
    window.open(externalUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div
      id="external-payment-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="external-payment-modal-card"
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl text-gray-900 dark:text-neutral-100 overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          id="close-external-payment-modal"
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              External Checkout Notice
            </h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              You are about to leave Nexis to complete your transaction.
            </p>
          </div>
        </div>

        {/* Item Summary Pill */}
        <div className="p-3 bg-gray-50 dark:bg-neutral-800/60 rounded-xl border border-gray-200 dark:border-neutral-700/60 mb-4 flex items-center gap-3">
          <img
            src={listing.images[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100'}
            alt={listing.title}
            className="w-12 h-12 object-cover rounded-lg shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{listing.title}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">${listing.price} {listing.currency}</span>
              <span>•</span>
              <span className="truncate">Seller: {listing.sellerDisplayName}</span>
              {listing.sellerVerified && <VerifiedBadge size="sm" />}
            </div>
          </div>
        </div>

        {/* Destination Information */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-neutral-950/80 rounded-xl border border-gray-200 dark:border-neutral-800">
          <span className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-neutral-400 font-semibold block mb-1">
            External Destination Link
          </span>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400 break-all bg-white dark:bg-neutral-900 p-2 rounded-lg border border-gray-200 dark:border-neutral-800">
            <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-400 shrink-0" />
            <span className="truncate">{externalUrl}</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-400 shrink-0 ml-auto" />
          </div>
        </div>

        {/* Safety Guidelines List */}
        <div className="space-y-2.5 mb-5 text-xs text-gray-600 dark:text-neutral-300">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Independent Platform Processing:</strong> Payments are processed entirely through the third-party provider ({listing.externalPaymentProvider || hostname}). Nexis does not hold or escrow funds.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Credential Protection:</strong> Never enter your Nexis login credentials or personal passwords on external checkout portals.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              <strong>Seller Verification:</strong> Verify the seller's reputation and refund terms on the external destination before authorizing payment.
            </span>
          </div>
        </div>

        {/* Acknowledgment Checkbox */}
        <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800/40 hover:bg-gray-100 dark:hover:bg-neutral-800/60 rounded-xl border border-gray-200 dark:border-neutral-800 cursor-pointer transition mb-5">
          <input
            type="checkbox"
            id="acknowledge-external-payment"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
          />
          <span className="text-xs text-gray-700 dark:text-neutral-200">
            I understand that I am completing this purchase off-platform and that external provider policies apply.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            id="cancel-external-payment-button"
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!acknowledged}
            onClick={handleProceed}
            id="proceed-external-payment-button"
            className={`px-5 py-2 text-sm font-medium rounded-xl flex items-center gap-2 transition ${
              acknowledged
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-gray-200 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 cursor-not-allowed'
            }`}
          >
            <span>Continue to External Store</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
