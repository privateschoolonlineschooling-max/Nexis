import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  ShoppingBag, 
  AlertTriangle, 
  CheckCircle2, 
  Scale, 
  HelpCircle, 
  Flag 
} from 'lucide-react';
import { VerifiedBadge } from '../common/VerifiedBadge';

export const PoliciesView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'guidelines' | 'verification' | 'marketplace' | 'privacy'>('guidelines');

  return (
    <div id="policies-view-container" className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl relative overflow-hidden shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Platform Policies & Trust Standards</h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400">Our commitments to safety, authenticity, privacy, and transparent commerce</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-neutral-800 gap-4 overflow-x-auto pb-1">
        {[
          { id: 'guidelines', label: 'Community Guidelines', icon: FileText },
          { id: 'verification', label: 'Verification Standards', icon: ShieldCheck },
          { id: 'marketplace', label: 'Marketplace & Payments', icon: ShoppingBag },
          { id: 'privacy', label: 'Privacy & Data Rights', icon: Lock }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeSection === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setActiveSection(t.id as any)}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider shrink-0 transition flex items-center gap-2 ${
                isActive ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500' : 'text-gray-400 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6 text-xs text-gray-700 dark:text-neutral-300 leading-relaxed">
        {activeSection === 'guidelines' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Community Code of Conduct</h2>
            <p>
              Nexis is dedicated to fostering an empowering, intellectually stimulating, and safe social environment for creators, researchers, designers, and artisans worldwide.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800">
                <strong className="text-gray-900 dark:text-white block mb-1">1. Respectful & Constructive Discourse</strong>
                Targeted harassment, hate speech, bullying, defamation, and intimidation will result in immediate content removal and account suspension.
              </div>

              <div className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800">
                <strong className="text-gray-900 dark:text-white block mb-1">2. Anti-Spam & Honest Content</strong>
                Automated bot posting, mass DM solicitation, deceptive engagement manipulation, and affiliate scam spam are strictly prohibited.
              </div>

              <div className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800">
                <strong className="text-gray-900 dark:text-white block mb-1">3. Content Moderation & Appeals</strong>
                Users can report policy violations at any time. Our Trust & Safety team audits reports with human moderation workflows.
              </div>
            </div>
          </div>
        )}

        {activeSection === 'verification' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Verification & Authenticity Protocol</h2>
              <VerifiedBadge size="md" />
            </div>

            <p>
              The verified badge on Nexis exists exclusively to authenticate true identities and organizations, helping users know that public figures, maintainers, and artisan brands are authentic.
            </p>

            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-amber-800 dark:text-amber-200">
              <strong className="text-amber-900 dark:text-white block mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Anti-Pay-to-Play Guarantee
              </strong>
              Verification badges are never sold or granted through subscription fees. Badges are granted only upon thorough verification of government ID, public credentials, or domain ownership.
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl text-blue-900 dark:text-neutral-200">
              <strong className="text-blue-900 dark:text-white block mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Scope of Verification
              </strong>
              A verified badge authenticates who the account owner is; it does not serve as a financial warranty or endorsement of independent merchandise or transactions conducted on third-party websites.
            </div>
          </div>
        )}

        {activeSection === 'marketplace' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Marketplace & External Payments Notice</h2>
            <p>
              Nexis connects buyers with talented creators and artisans. To maximize security and minimize intermediary fees, listings direct buyers to sellers' verified external checkouts (e.g. Stripe storefronts, Shopify, Gumroad, Etsy).
            </p>

            <div className="space-y-3">
              <div className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800">
                <strong className="text-gray-900 dark:text-white block mb-1">External Checkout Safety Interstitial</strong>
                Every purchase attempt displays a clear interstitial notice reminding buyers that they are leaving Nexis and providing safety tips before external redirection.
              </div>

              <div className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800">
                <strong className="text-gray-900 dark:text-white block mb-1">Independent Fund Processing</strong>
                Nexis does not directly process, store, or hold buyer payment cards or funds. Transaction policies, returns, and shipping agreements are governed by the merchant and their payment processor.
              </div>

              <div className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800">
                <strong className="text-gray-900 dark:text-white block mb-1">Prohibited Items & Reporting</strong>
                Illicit substances, weapons, pirated media, and deceptive offers are banned. Flagged listings are audited and delisted immediately.
              </div>
            </div>
          </div>
        )}

        {activeSection === 'privacy' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Privacy Architecture & Data Rights</h2>
            <p>
              Your personal data belongs to you. We believe in granular audience controls, transparent tracking, and straightforward data management.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800">
                <strong className="text-gray-900 dark:text-white block mb-1">Granular Privacy Switches</strong>
                Control your profile visibility, who can message you, whether your online status is visible, and manage blocked users at any time in Account Settings.
              </div>

              <div className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800">
                <strong className="text-gray-900 dark:text-white block mb-1">Direct Message Privacy</strong>
                Direct messages are restricted to participating members in the conversation thread.
              </div>

              <div className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800">
                <strong className="text-gray-900 dark:text-white block mb-1">Full Account Deletion Right</strong>
                You may purge your account and associated data completely and permanently through the Settings Danger Zone.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
