import { Package, Search } from 'lucide-react';
import { useState } from 'react';
import { EquipmentCard } from '@/components/EquipmentCard';
import type { Category, EquipmentListing } from '@/types';
import { ALL_CATEGORIES } from '@/types';
import { filterByNeighborhood, filterListings } from '@/utils/filters';

interface MarketplaceProps {
  listings: EquipmentListing[];
  onOpenRequestRentalModal: (listing: EquipmentListing) => void;
}

export function Marketplace({ listings, onOpenRequestRentalModal }: MarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('');

  // Derive unique location option labels sorted alphabetically
  const locationOptions = Array.from(
    new Set(
      listings.map(l =>
        l.neighborhood ? `${l.neighborhood}, ${l.location}` : l.location
      )
    )
  ).sort();

  const filteredListings = filterByNeighborhood(
    filterListings(listings, searchQuery, selectedCategory),
    neighborhoodFilter,
  );

  return (
    <section id="marketplace" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center space-y-3 mb-12">
          <span className="inline-block text-sm font-semibold text-emerald-400 tracking-wider uppercase">
            Available Now
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Browse Equipment</h2>
          <p className="text-neutral-400 max-w-xl mx-auto">
            Discover tents, chairs, sound systems, catering gear, and traditional attire listed by
            your neighbors.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="mb-8 space-y-4">
          {/* Search bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by item name or location…"
              aria-label="Search equipment by name or location"
              className="w-full rounded-xl bg-neutral-900 border border-neutral-700 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Location filter */}
          <div className="flex justify-center">
            <select
              value={neighborhoodFilter}
              onChange={e => setNeighborhoodFilter(e.target.value)}
              aria-label="Filter by location"
              className="bg-neutral-900 border border-neutral-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 min-w-[220px] max-w-xl"
            >
              <option value="">All Locations</option>
              {locationOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 justify-center">
            {ALL_CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                aria-pressed={selectedCategory === category}
                className={`
                  rounded-full px-4 py-1.5 text-xs font-medium
                  border transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  ${
                    selectedCategory === category
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 ring-1 ring-emerald-500/30 shadow-glow-emerald-sm'
                      : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-emerald-500/30 hover:text-white'
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-neutral-500">
            {filteredListings.length} item{filteredListings.length !== 1 ? 's' : ''} found
          </p>
          {(searchQuery || selectedCategory !== 'All' || neighborhoodFilter) && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setNeighborhoodFilter(''); }}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Equipment Grid */}
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map(listing => (
              <EquipmentCard
                key={listing.id}
                listing={listing}
                onRequestRental={onOpenRequestRentalModal}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800">
              <Package className="h-8 w-8 text-neutral-600" />
            </div>
            <div>
              <p className="text-base font-medium text-white">No items found</p>
              <p className="text-sm text-neutral-400 mt-1">
                Try adjusting your search or selecting a different category.
              </p>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
