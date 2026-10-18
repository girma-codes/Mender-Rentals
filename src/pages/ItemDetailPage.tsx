import { useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, User } from 'lucide-react';
import { Armchair, Music, Shirt, Tent, UtensilsCrossed } from 'lucide-react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import type { Category, EquipmentListing } from '@/types';

const CATEGORY_ICONS: Record<Exclude<Category, 'All'>, LucideIcon> = {
  'Tents & Canopies': Tent,
  'Seating': Armchair,
  'Sound & Lighting': Music,
  'Catering': UtensilsCrossed,
  'Traditional Attire': Shirt,
};

interface OutletContext {
  listings: EquipmentListing[];
  onOpenRequestRentalModal: (listing: EquipmentListing) => void;
}

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { listings, onOpenRequestRentalModal } = useOutletContext<OutletContext>();
  const auth = useAuth();
  const navigate = useNavigate();

  const listing = listings.find(l => l.id === id);

  const autoOpenFiredRef = useRef(false);

  // Auto-open modal after redirect-back from signup when this item was pending
  useEffect(() => {
    if (
      !autoOpenFiredRef.current &&
      auth.isAuthenticated &&
      listing &&
      auth.pendingItemId === listing.id
    ) {
      autoOpenFiredRef.current = true;
      auth.setPendingItemId(null);
      onOpenRequestRentalModal(listing);
    }
  }, [auth.isAuthenticated, auth.pendingItemId, listing, onOpenRequestRentalModal, auth]);

  if (!listing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg font-semibold text-white">Listing not found</p>
        <Link
          to="/marketplace"
          className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          ← Back to Marketplace
        </Link>
      </div>
    );
  }

  const CategoryIcon = CATEGORY_ICONS[listing.category];
  const locationDisplay = listing.neighborhood
    ? `${listing.neighborhood}, ${listing.location}`
    : listing.location;
  const initials = listing.ownerName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-neutral-950 py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Back button */}
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>

        {/* Image / Placeholder */}
        <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-neutral-800 flex items-center justify-center">
          {listing.imageDataUrl ? (
            <img
              src={listing.imageDataUrl}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <CategoryIcon className="h-20 w-20 text-emerald-500/30" />
          )}
          {/* Category badge overlay */}
          <div className="absolute top-4 left-4">
            <Badge>{listing.category}</Badge>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{listing.title}</h1>

        {/* Badges */}
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            ETB {listing.pricePerDay.toLocaleString()}/day
          </span>
          <Badge>{listing.category}</Badge>
          <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/30">
            ● Available
          </span>
        </div>

        {/* Description */}
        {listing.description && (
          <p className="text-neutral-400 leading-relaxed">{listing.description}</p>
        )}

        {/* Location & Pickup Info */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📍</span> Location &amp; Pickup Info
          </h2>

          <div className="space-y-1">
            <p className="text-base font-semibold text-white">{locationDisplay}</p>
            <p className="text-sm text-neutral-400 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Listed by {listing.ownerName}
            </p>
          </div>

          {/* Map placeholder */}
          <div
            className="relative w-full h-52 rounded-2xl bg-slate-800 overflow-hidden flex flex-col items-center justify-center gap-2"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(148,163,184,0.08) 39px, rgba(148,163,184,0.08) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(148,163,184,0.08) 39px, rgba(148,163,184,0.08) 40px)',
            }}
          >
            <span className="text-4xl">📍</span>
            <p className="text-sm font-medium text-white">{locationDisplay}</p>
            <p className="text-xs text-neutral-400">Interactive map coming soon</p>
            {listing.coordinates && (
              <p className="text-xs text-neutral-500 mt-1">
                Lat: {listing.coordinates.lat.toFixed(4)}, Lng: {listing.coordinates.lng.toFixed(4)}
              </p>
            )}
          </div>

          <p className="text-sm text-neutral-400">
            Plan your pickup — this location is in {listing.neighborhood ?? listing.location}.
            Contact the lender to arrange delivery or pickup.
          </p>
        </div>

        {/* Request Rental CTA */}
        <Button
          variant="primary"
          className="w-full py-3 text-base"
          onClick={() => {
            if (!auth.isAuthenticated) {
              auth.setPendingItemId(listing.id);
              auth.setIntendedPath(`/item/${listing.id}`);
              navigate('/signup');
              return;
            }
            onOpenRequestRentalModal(listing);
          }}
        >
          <MapPin className="h-5 w-5" />
          Request Rental
        </Button>

        {/* Lender info card */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-lg font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white">{listing.ownerName}</p>
            <p className="text-xs text-neutral-500">Member since 2024</p>
          </div>
          <Button variant="secondary" className="flex-shrink-0 text-sm py-2 px-4">
            Contact Lender
          </Button>
        </div>

      </div>
    </div>
  );
}
