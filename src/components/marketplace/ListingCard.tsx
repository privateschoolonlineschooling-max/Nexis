import React from 'react';
import { MarketplaceListing } from '../../types/index';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { Star, ExternalLink, ShieldCheck, Tag } from 'lucide-react';

interface ListingCardProps {
  listing: MarketplaceListing;
  onOpenDetails: (listing: MarketplaceListing) => void;
  onInitiatePurchase: (listing: MarketplaceListing) => void;
  onSelectSeller: (username: string) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onOpenDetails,
  onInitiatePurchase,
  onSelectSeller
}) => {
  const mainImage = listing.images[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600';

  return (
    <div
      id={`listing-card-${listing.id}`}
      className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 rounded-2xl overflow-hidden shadow-sm flex flex-col group transition duration-200"
    >
      {/* Thumbnail */}
      <div
        onClick={() => onOpenDetails(listing)}
        className="relative h-48 w-full bg-gray-100 dark:bg-neutral-950 overflow-hidden cursor-pointer"
      >
        <img
          src={mainImage}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          referrerPolicy="no-referrer"
        />

        {/* Condition & Category Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/10">
            {listing.condition}
          </span>
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-blue-600/90 backdrop-blur-md text-white">
            {listing.category}
          </span>
        </div>

        {/* Provider badge */}
        {listing.externalPaymentProvider && (
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/90 dark:bg-neutral-900/90 text-gray-800 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 flex items-center gap-1 shadow-sm">
            <span>{listing.externalPaymentProvider}</span>
            <ExternalLink className="w-2.5 h-2.5 text-gray-400" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Price & Rating */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              ${listing.price} <span className="text-xs font-normal text-gray-500 dark:text-neutral-400">{listing.currency}</span>
            </span>

            <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{listing.rating > 0 ? listing.rating.toFixed(1) : 'New'}</span>
              <span className="text-gray-400 dark:text-neutral-500 font-normal">({listing.reviewsCount})</span>
            </div>
          </div>

          {/* Title */}
          <h4
            onClick={() => onOpenDetails(listing)}
            className="text-xs font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer line-clamp-2 leading-snug mb-2"
          >
            {listing.title}
          </h4>

          {/* Description snippet */}
          <p className="text-[11px] text-gray-600 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-3">
            {listing.description}
          </p>
        </div>

        {/* Seller & Action Footer */}
        <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between gap-2">
          {/* Seller */}
          <button
            onClick={() => onSelectSeller(listing.sellerUsername)}
            className="flex items-center gap-2 min-w-0 text-left group/seller"
          >
            <img
              src={listing.sellerAvatar}
              alt={listing.sellerDisplayName}
              className="w-6 h-6 rounded-full object-cover shrink-0 border border-gray-200 dark:border-neutral-700"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-gray-700 dark:text-neutral-300 group-hover/seller:text-blue-600 truncate">
                  {listing.sellerDisplayName}
                </span>
                {listing.sellerVerified && <VerifiedBadge size="sm" />}
              </div>
            </div>
          </button>

          {/* Purchase Button */}
          <button
            onClick={() => onInitiatePurchase(listing)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition shrink-0"
          >
            <span>Buy Item</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
