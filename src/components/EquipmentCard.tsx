import { Armchair, MapPin, Music, Phone, Shirt, Tent, UtensilsCrossed, User } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Category, EquipmentListing } from '@/types';

// Map each category to a Lucide icon for the image placeholder
const CATEGORY_ICONS: Record<Exclude<Category, 'All'>, LucideIcon> = {
  'Tents & Canopies': Tent,
  'Seating': Armchair,
  'Sound & Lighting': Music,
  'Catering': UtensilsCrossed,
  'Traditional Attire': Shirt,
};

function formatPrice(amount: number): string {
  return `ETB ${amount.toLocaleString()}/day`;
}

interface EquipmentCardProps {
  listing: EquipmentListing;
  onRequestRental: (listing: EquipmentListing) => void;
}

export function EquipmentCard({ listing, onRequestRental }: EquipmentCardProps) {
  const [imgError, setImgError] = useState(false);
  const CategoryIcon = CATEGORY_ICONS[listing.category];
  const showImage = !!listing.imageDataUrl && !imgError;

  return (
    <div className="group relative flex flex-col rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden hover:border-emerald-500/40 hover:ring-1 hover:ring-emerald-500/30 hover:shadow-glow-emerald-sm transition-all duration-200">

      {/* Clickable area: image + title/price */}
      <Link
        to={`/item/${listing.id}`}
        className="block focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
      >
        {/* Image / Placeholder */}
        <div className="relative h-48 w-full flex-shrink-0 overflow-hidden bg-neutral-800">
          {showImage ? (
            <img
              src={listing.imageDataUrl}
              alt={listing.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              aria-label={`${listing.category} category icon`}
            >
              <CategoryIcon className="h-12 w-12 text-emerald-500/40" />
            </div>
          )}

          {/* Category badge overlay */}
          <div className="absolute top-3 left-3">
            <Badge>{listing.category}</Badge>
          </div>
        </div>

        {/* Title + Price */}
        <div className="flex items-start justify-between gap-2 px-4 pt-4">
          <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-emerald-300 transition-colors duration-200">
            {listing.title}
          </h3>
          <span className="flex-shrink-0 text-sm font-bold text-emerald-400 whitespace-nowrap">
            {formatPrice(listing.pricePerDay)}
          </span>
        </div>
      </Link>

      {/* Non-clickable card body — owner, location, description, CTA */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-2 gap-3">
        {/* Owner + Location */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <User className="h-3 w-3 flex-shrink-0" />
            <span>{listing.ownerName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span>
              {listing.neighborhood
                ? `${listing.neighborhood}, ${listing.location}`
                : listing.location}
            </span>
          </div>
        </div>

        {/* Description (if present) */}
        {listing.description && (
          <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">
            {listing.description}
          </p>
        )}

        {/* CTA */}
        <div className="mt-auto pt-1">
          <Button
            variant="primary"
            className="w-full text-sm py-2"
            onClick={() => onRequestRental(listing)}
          >
            <Phone className="h-4 w-4" />
            Request Rental
          </Button>
        </div>
      </div>
    </div>
  );
}
