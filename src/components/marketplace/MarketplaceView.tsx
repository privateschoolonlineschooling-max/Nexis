import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { MarketplaceListing, MarketplaceCategory } from '../../types/index';
import { ListingCard } from './ListingCard';
import { ListingDetailsModal } from './ListingDetailsModal';
import { ExternalPaymentModal } from '../common/ExternalPaymentModal';
import { CreateListingModal } from './CreateListingModal';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  ShieldCheck, 
  SlidersHorizontal, 
  CheckCircle2, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

const CATEGORIES: ('All' | MarketplaceCategory)[] = [
  'All',
  'Hardware & Electronics',
  'Software & UI Kits',
  'Artisan Crafts',
  'Photography & Art',
  'Books & Education',
  'Services & Consulting'
];

interface MarketplaceViewProps {
  onSelectSeller: (username: string) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({ onSelectSeller }) => {
  const { currentUser } = useAuth();

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'All' | MarketplaceCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyVerifiedSellers, setOnlyVerifiedSellers] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'rating'>('newest');

  // Modals
  const [selectedListingForDetails, setSelectedListingForDetails] = useState<MarketplaceListing | null>(null);
  const [selectedListingForPurchase, setSelectedListingForPurchase] = useState<MarketplaceListing | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadListings = async () => {
    try {
      setLoading(true);
      const res = await api.getListings({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        query: searchQuery || undefined,
        onlyVerified: onlyVerifiedSellers || undefined,
        sortBy
      });
      setListings(res.listings || []);
    } catch (err) {
      console.error('Failed to load marketplace listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [selectedCategory, onlyVerifiedSellers, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadListings();
  };

  return (
    <div id="marketplace-view-container" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="max-w-2xl relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Community Marketplace & Creator Goods</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
            Discover Artisan Tools, Hardware & Digital Assets
          </h1>
          <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed mb-4">
            Curated marketplace powered by creators and verified builders. Every purchase directs to independent, verified external storefronts with secure interstitial checkout protection.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {currentUser && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                id="create-listing-banner-btn"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>List an Item for Sale</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-700 dark:text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Independent External Checkout Interstitial</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Secondary Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="w-full sm:max-w-md relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search listings by title, keyword, or tag..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-neutral-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyVerifiedSellers}
                onChange={(e) => setOnlyVerifiedSellers(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-neutral-950 border-gray-300 dark:border-neutral-700"
              />
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Verified Sellers Only
              </span>
            </label>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="rating">Highest Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-gray-500 dark:text-neutral-500">
          <ShoppingBag className="w-8 h-8 animate-bounce mx-auto text-blue-600 mb-2" />
          <p>Loading marketplace offerings...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="py-16 text-center p-8 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-3">
          <ShoppingBag className="w-12 h-12 text-gray-400 dark:text-neutral-600 mx-auto" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No listings found</h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-md mx-auto">
            Try adjusting your category or search keywords, or list your own items for the community.
          </p>
          {currentUser && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              List an Item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onOpenDetails={(item) => setSelectedListingForDetails(item)}
              onInitiatePurchase={(item) => setSelectedListingForPurchase(item)}
              onSelectSeller={onSelectSeller}
            />
          ))}
        </div>
      )}

      {/* Listing Details Modal */}
      <ListingDetailsModal
        listing={selectedListingForDetails}
        isOpen={!!selectedListingForDetails}
        onClose={() => setSelectedListingForDetails(null)}
        onInitiatePurchase={(item) => {
          setSelectedListingForDetails(null);
          setSelectedListingForPurchase(item);
        }}
        onSelectSeller={onSelectSeller}
      />

      {/* External Checkout Safety Notice Modal */}
      {selectedListingForPurchase && (
        <ExternalPaymentModal
          listing={selectedListingForPurchase}
          isOpen={!!selectedListingForPurchase}
          onClose={() => setSelectedListingForPurchase(null)}
        />
      )}

      {/* Create Listing Modal */}
      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onListingCreated={loadListings}
      />
    </div>
  );
};
