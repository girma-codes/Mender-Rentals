import { useOutletContext } from 'react-router-dom';
import { Marketplace } from '@/components/Marketplace';
import type { EquipmentListing } from '@/types';

interface MarketplacePageContext {
  listings: EquipmentListing[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  refetch: () => void;
  onOpenRequestRentalModal: (listing: EquipmentListing) => void;
}

export function MarketplacePage() {
  const { listings, isLoading, isError, errorMessage, refetch, onOpenRequestRentalModal } =
    useOutletContext<MarketplacePageContext>();

  if (isLoading) {
    return (
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <div className="h-4 w-24 bg-neutral-800 rounded animate-pulse mx-auto" />
            <div className="h-8 w-56 bg-neutral-800 rounded animate-pulse mx-auto" />
            <div className="h-4 w-80 bg-neutral-800 rounded animate-pulse mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-neutral-900 border border-neutral-800 animate-pulse h-72"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-red-400 font-medium">
            {errorMessage ?? 'Failed to load equipment. Please try again.'}
          </p>
          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <Marketplace
      listings={listings}
      onOpenRequestRentalModal={onOpenRequestRentalModal}
    />
  );
}
