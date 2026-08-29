import React, { useState, useEffect } from 'react';
import { MarketplaceListing, Review } from '../../types/index';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { ReportModal } from '../common/ReportModal';
import { 
  X, 
  Star, 
  ExternalLink, 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  CheckCircle2, 
  Flag, 
  Send 
} from 'lucide-react';

interface ListingDetailsModalProps {
  listing: MarketplaceListing | null;
  isOpen: boolean;
  onClose: () => void;
  onInitiatePurchase: (listing: MarketplaceListing) => void;
  onSelectSeller: (username: string) => void;
}

export const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({
  listing,
  isOpen,
  onClose,
  onInitiatePurchase,
  onSelectSeller
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // New Review state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Report modal
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (listing && isOpen) {
      setActiveImageIndex(0);
      loadReviews(listing.id);
    }
  }, [listing, isOpen]);

  const loadReviews = async (listingId: string) => {
    try {
      setLoadingReviews(true);
      const res = await api.getReviews(listingId);
      setReviews(res.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing || !currentUser) return;
    try {
      setSubmittingReview(true);
      const res = await api.addReview(listing.id, rating, comment);
      setReviews(prev => [res.review, ...prev]);
      setComment('');
      showToast('Review submitted successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!isOpen || !listing) return null;

  return (
    <div
      id="listing-details-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="listing-details-modal-card"
        className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          id="close-listing-details-modal"
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="h-64 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800">
                <img
                  src={listing.images[activeImageIndex] || listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {listing.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {listing.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                        activeImageIndex === idx ? 'border-blue-500' : 'border-neutral-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details & Purchase Box */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-neutral-800 text-neutral-200">
                    {listing.condition}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {listing.category}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white mb-2 leading-snug">
                  {listing.title}
                </h2>

                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-2xl font-black text-emerald-400">
                    ${listing.price} {listing.currency}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{listing.rating.toFixed(1)}</span>
                    <span className="text-neutral-500 font-normal">({listing.reviewsCount} reviews)</span>
                  </div>
                </div>

                {/* Seller Box */}
                <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 mb-4 flex items-center justify-between">
                  <button
                    onClick={() => {
                      onClose();
                      onSelectSeller(listing.sellerUsername);
                    }}
                    className="flex items-center gap-2.5 text-left group"
                  >
                    <img
                      src={listing.sellerAvatar}
                      alt={listing.sellerDisplayName}
                      className="w-9 h-9 rounded-full object-cover border border-neutral-700 group-hover:border-blue-500 transition"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white group-hover:text-blue-400 transition">
                          {listing.sellerDisplayName}
                        </span>
                        {listing.sellerVerified && <VerifiedBadge size="sm" />}
                      </div>
                      <span className="text-[11px] text-neutral-400">@{listing.sellerUsername}</span>
                    </div>
                  </button>

                  <div className="text-[11px] text-neutral-400 text-right">
                    <span className="block font-semibold text-white">Direct Seller</span>
                    <span>Ships Worldwide</span>
                  </div>
                </div>
              </div>

              {/* Purchase Actions & Safety Notice */}
              <div className="space-y-2.5">
                <button
                  onClick={() => onInitiatePurchase(listing)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition"
                >
                  <span>Buy via {listing.externalPaymentProvider || 'External Store'}</span>
                  <ExternalLink className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
                  <div className="flex items-center gap-1 text-neutral-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>External Checkout Interstitial Protected</span>
                  </div>
                  <button
                    onClick={() => setShowReport(true)}
                    className="hover:text-red-400 flex items-center gap-1 transition"
                  >
                    <Flag className="w-3 h-3" />
                    <span>Report Listing</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="border-t border-neutral-800 pt-5 mb-6">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Item Overview & Technical Specifications
            </h4>
            <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Reviews & Ratings Section */}
          <div className="border-t border-neutral-800 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Buyer Reviews ({reviews.length})
              </h4>
              <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{listing.rating.toFixed(1)} / 5.0 Average Rating</span>
              </div>
            </div>

            {/* Leave a review */}
            {currentUser && (
              <form onSubmit={handleAddReview} className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Rate your purchase experience:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition"
                      >
                        <Star className={`w-4 h-4 ${star <= rating ? 'fill-amber-400' : 'text-neutral-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share feedback on packaging, delivery, or product quality..."
                    className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview || !comment.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit</span>
                  </button>
                </div>
              </form>
            )}

            {/* Reviews list */}
            {loadingReviews ? (
              <div className="py-4 text-center text-xs text-neutral-500">Loading feedback...</div>
            ) : reviews.length === 0 ? (
              <div className="py-4 text-center text-xs text-neutral-500">No buyer feedback yet for this item.</div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={rev.authorAvatar}
                          alt={rev.authorDisplayName}
                          className="w-5 h-5 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-xs font-semibold text-white">{rev.authorDisplayName}</span>
                        {rev.authorVerified && <VerifiedBadge size="sm" />}
                      </div>
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-neutral-300">{rev.comment}</p>
                    <span className="text-[10px] text-neutral-500 block">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Report Modal */}
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          category="listing"
          targetId={listing.id}
          targetTitleOrSnippet={listing.title}
        />
      </div>
    </div>
  );
};
