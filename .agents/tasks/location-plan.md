# Implementation Plan — Precise Location Features

## Context

**Project:** Mender Rentals Platform — Vite + React 18 + TypeScript + Tailwind CSS  
**Router:** react-router-dom v6 (nested routes under a shared `<Layout>`)  
**State:** `useListings` hook → `localStorage` via `storageService.ts`; outlet context pattern (`useOutletContext`) shared across all Layout children  
**Build:** `npm run build` (Vite + tsc)  
**Existing patterns:**
- Cards live in `src/components/EquipmentCard.tsx`; use `Badge` + `Button` from `src/components/ui/`
- Filtering is pure functions in `src/utils/filters.ts` consumed by `Marketplace.tsx`
- `MarketplacePage.tsx` reads context via `useOutletContext<{ listings, onOpenRequestRentalModal }>`
- Layout outlet provides `{ listings, onOpenRequestRentalModal, onOpenListItemModal }` — all three fields
- Dark theme: `bg-neutral-950` body, `bg-neutral-900 border-neutral-800` cards, `emerald-400/500` accents
- `@/` alias resolves to `src/`

---

## Step 1 — Extend the `EquipmentListing` type

**What:** Add two optional fields to `EquipmentListing` in `src/types/index.ts`:
- `neighborhood?: string` — the sub-city / neighbourhood name (e.g. `'Bole'`)
- `coordinates?: { lat: number; lng: number }` — GPS coordinates for the map placeholder

**File:** `src/types/index.ts`

**Exact change:** Insert after the `location: string;` line:
```ts
  neighborhood?: string;    // Sub-city or neighbourhood (e.g. 'Bole', 'Tabor')
  coordinates?: { lat: number; lng: number }; // For map placeholder
```

**Verify:** `npm run build` — TypeScript compilation passes with zero errors. The two new optional fields add no breaking changes.

---

## Step 2 — Update seed data (all 8 existing + 2 new listings)

**What:** Update every entry in `src/data/seedData.ts` to add `neighborhood` and `coordinates`. Add 2 new listings to reach 10 total. Keep `location` as the city string (unchanged) — `neighborhood` is the sub-city only.

**File:** `src/data/seedData.ts`

**Exact additions per listing:**

| id | neighborhood | coordinates |
|----|-------------|-------------|
| seed-001 | `'Bole'` | `{ lat: 8.9806, lng: 38.7578 }` |
| seed-002 | `'Tabor'` | `{ lat: 7.0621, lng: 38.4768 }` |
| seed-003 | `'Tana Sub-city'` | `{ lat: 11.5742, lng: 37.3614 }` |
| seed-004 | `'Kazanchis'` | `{ lat: 9.0127, lng: 38.7614 }` |
| seed-005 | `'Fasilo'` | `{ lat: 11.5937, lng: 37.3882 }` |
| seed-006 | `'Kezira'` | `{ lat: 9.5933, lng: 41.8615 }` |
| seed-007 | `'CMC'` (location: `'Addis Ababa'`) | `{ lat: 9.0368, lng: 38.7692 }` — **also update location to `'Addis Ababa'`** |
| seed-008 | `'Adama 01'` (location: `'Adama'`) | `{ lat: 8.5400, lng: 39.2700 }` — **also update location to `'Adama'`** |

**New listings to add:**

```ts
{
  id: 'seed-009',
  title: 'Portable Generator (5KVA)',
  category: 'Sound & Lighting',
  pricePerDay: 1500,
  description: 'Reliable 5KVA petrol generator. Ideal for outdoor events with no grid power.',
  ownerName: 'Bereket Tadesse',
  location: 'Addis Ababa',
  neighborhood: 'Megenagna',
  coordinates: { lat: 9.0272, lng: 38.7894 },
  createdAt: '2024-01-09T00:00:00Z',
},
{
  id: 'seed-010',
  title: 'Cocktail Tables (Set of 8)',
  category: 'Seating',
  pricePerDay: 480,
  description: 'High-top cocktail tables with white linen covers. Great for receptions and mixers.',
  ownerName: 'Feven Hailu',
  location: 'Hawassa',
  neighborhood: 'Addis Ketema',
  coordinates: { lat: 7.0503, lng: 38.4803 },
  createdAt: '2024-01-10T00:00:00Z',
},
```

**Note on seed-007 / seed-008:** Mekelle and Jimma are not in the required city list. Change their `location` to `'Addis Ababa'` and `'Adama'` respectively so they fit the Ethiopian neighbourhood mapping scheme.

**Important — localStorage re-seed:** `initializeListings` only seeds when storage is empty. During development the old 8-item data may already be stored. The plan's verification step (`npm run build`) only checks compilation; the runtime re-seed will work automatically in a fresh browser session. No code change needed in `storageService.ts`.

**Verify:** `npm run build` — no TypeScript errors.

---

## Step 3 — Add `filterByNeighborhood` to filters utility

**What:** Add a new exported function to `src/utils/filters.ts` that filters listings by neighbourhood string, case-insensitively. Empty/falsy input returns all items unchanged.

**File:** `src/utils/filters.ts`

**Exact code to append** (after the existing `filterListings` function):

```ts
/**
 * Filters listings by neighbourhood/sub-city.
 * Matches against listing.neighborhood (case-insensitive).
 * An empty or falsy neighborhood value returns all listings unchanged.
 *
 * @param items - Array of listings to filter
 * @param neighborhood - Neighbourhood string to match; '' returns all
 * @returns Filtered array
 */
export function filterByNeighborhood(
  items: EquipmentListing[],
  neighborhood: string,
): EquipmentListing[] {
  if (!neighborhood) return items;
  const n = neighborhood.toLowerCase();
  return items.filter(item =>
    item.neighborhood?.toLowerCase() === n,
  );
}
```

**Verify:** `npm run build` — no TypeScript errors. The function is pure and has no side effects.

---

## Step 4 — Update `Marketplace.tsx` — add Location dropdown filter

**What:** Add `neighborhoodFilter` state, derive unique location option strings from the `listings` prop, render a Location `<select>` below the search bar but above the category pills, apply `filterByNeighborhood` as a second filter after `filterListings`, and reset `neighborhoodFilter` in the "Clear filters" button.

**File:** `src/components/Marketplace.tsx`

**Exact changes:**

1. **Import** `filterByNeighborhood` alongside the existing `filterListings` import:
   ```ts
   import { filterByNeighborhood, filterListings } from '@/utils/filters';
   ```

2. **Add state** inside the component (after the existing `useState` calls):
   ```ts
   const [neighborhoodFilter, setNeighborhoodFilter] = useState('');
   ```

3. **Derive unique location options** (after the state declarations):
   ```ts
   const locationOptions = Array.from(
     new Set(
       listings.map(l =>
         l.neighborhood ? `${l.neighborhood}, ${l.location}` : l.location
       )
     )
   ).sort();
   ```

4. **Update the filter pipeline** — replace the existing `filteredListings` line:
   ```ts
   const filteredListings = filterByNeighborhood(
     filterListings(listings, searchQuery, selectedCategory),
     neighborhoodFilter,
   );
   ```

5. **Add Location dropdown** — insert this block BETWEEN the search bar `</div>` and the category tabs `<div>`:
   ```tsx
   {/* Location filter */}
   <div className="flex justify-center">
     <select
       value={neighborhoodFilter}
       onChange={e => setNeighborhoodFilter(e.target.value)}
       aria-label="Filter by location"
       className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 min-w-[220px]"
     >
       <option value="">All Locations</option>
       {locationOptions.map(opt => (
         <option key={opt} value={opt.split(', ')[0]}>
           {opt}
         </option>
       ))}
     </select>
   </div>
   ```

   **Note on option value:** The `<option value>` is set to just the neighbourhood portion (`opt.split(', ')[0]`) because `filterByNeighborhood` matches on `listing.neighborhood`. For listings without a neighbourhood, `opt` equals `listing.location` (no comma), so `opt.split(', ')[0]` equals the full location string — but those listings have `neighborhood === undefined`, so `filterByNeighborhood` won't match them when that option is selected. To handle this edge case cleanly, use the full string as value and update `filterByNeighborhood` to also match against `listing.location` when `listing.neighborhood` is absent:

   **Revised `filterByNeighborhood`** (update step 3 accordingly):
   ```ts
   export function filterByNeighborhood(
     items: EquipmentListing[],
     neighborhood: string,
   ): EquipmentListing[] {
     if (!neighborhood) return items;
     const n = neighborhood.toLowerCase();
     return items.filter(item => {
       if (item.neighborhood) return item.neighborhood.toLowerCase() === n;
       return item.location.toLowerCase() === n;
     });
   }
   ```
   And set option value to the full `opt` string, stripping the city suffix to get the neighbourhood key:
   ```tsx
   <option key={opt} value={opt}>
     {opt}
   </option>
   ```
   Then in `filterByNeighborhood`, match on the full label string:
   ```ts
   const label = item.neighborhood
     ? `${item.neighborhood}, ${item.location}`
     : item.location;
   return label.toLowerCase() === n;
   ```
   This is the cleanest approach — the filter value is the full display label, same as the option text.

   **Final revised `filterByNeighborhood`** (use this version, supersedes step 3):
   ```ts
   export function filterByNeighborhood(
     items: EquipmentListing[],
     neighborhoodLabel: string,
   ): EquipmentListing[] {
     if (!neighborhoodLabel) return items;
     const target = neighborhoodLabel.toLowerCase();
     return items.filter(item => {
       const label = item.neighborhood
         ? `${item.neighborhood}, ${item.location}`
         : item.location;
       return label.toLowerCase() === target;
     });
   }
   ```
   Option values are the full `opt` string (e.g. `'Bole, Addis Ababa'`).

6. **Update Clear filters button** — add `setNeighborhoodFilter('')` to the onClick handler:
   ```tsx
   onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setNeighborhoodFilter(''); }}
   ```

7. **Update the "has active filters" condition** for showing the Clear button:
   ```tsx
   {(searchQuery || selectedCategory !== 'All' || neighborhoodFilter) && (
   ```

**Verify:** `npm run build` — no TypeScript errors.

---

## Step 5 — Update `EquipmentCard.tsx` — neighbourhood badge + clickable image/title

**What:** Two changes:
1. Update the location row to show `'Neighbourhood, City'` when `listing.neighborhood` exists, falling back to `listing.location`.
2. Wrap the image area and title in a `<Link to={/item/${listing.id}}>` so clicking navigates to the detail page. The "Request Rental" button must remain fully independent (not wrapped by the Link).

**File:** `src/components/EquipmentCard.tsx`

**Exact changes:**

1. **Add Link import** at the top:
   ```ts
   import { Link } from 'react-router-dom';
   ```

2. **Update location display** — replace the location `<span>`:
   ```tsx
   <span>
     {listing.neighborhood
       ? `${listing.neighborhood}, ${listing.location}`
       : listing.location}
   </span>
   ```

3. **Wrap image + title in `<Link>`** — the outer `<div>` stays; wrap only the image block and the title/price row. The card body `<div className="flex flex-1 flex-col p-4 gap-3">` contains both the title block and the metadata + CTA. To avoid wrapping the whole card body (which would capture the button), wrap only the image div and the title+price inside a `<Link>`:

   Restructure the card body so the image and title/price row are inside the Link, but owner/location/description/CTA are outside it:

   ```tsx
   <div className="group relative flex flex-col rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden hover:border-emerald-500/40 hover:ring-1 hover:ring-emerald-500/30 hover:shadow-glow-emerald-sm transition-all duration-200">

     <Link to={`/item/${listing.id}`} className="block focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset">
       {/* Image / Placeholder */}
       <div className="relative h-48 w-full flex-shrink-0 overflow-hidden bg-neutral-800">
         {/* ... existing image/placeholder content ... */}
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
         {/* ... existing owner + updated location rows ... */}
       </div>
       {/* Description */}
       {/* ... existing description ... */}
       {/* CTA */}
       <div className="mt-auto pt-1">
         <Button ... />
       </div>
     </div>
   </div>
   ```

   **Important:** The outer `<div>` keeps the `group` class so hover effects still work. The `<Link>` wraps image + title/price only. Padding is split: `px-4 pt-4` on the Link's title row, `px-4 pb-4 pt-2` on the remaining body div.

**Verify:** `npm run build` — no TypeScript errors.

---

## Step 6 — Create `src/pages/ItemDetailPage.tsx`

**What:** Create the full item detail page. It reads `id` from `useParams`, looks up the listing from `useOutletContext`, and renders the full detail layout with image placeholder, badges, description, location section with map placeholder, Request Rental button, and lender info card.

**File:** `src/pages/ItemDetailPage.tsx` (new file)

**Full implementation:**

```tsx
import { ArrowLeft, MapPin, User } from 'lucide-react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { Armchair, Music, Shirt, Tent, UtensilsCrossed } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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

  const listing = listings.find(l => l.id === id);

  if (!listing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg font-semibold text-white">Listing not found</p>
        <Link to="/marketplace" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
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

        {/* Image placeholder */}
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

        {/* Three badges */}
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
          onClick={() => onOpenRequestRentalModal(listing)}
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
```

**Note on `Button` variant:** Check `src/components/ui/Button.tsx` for the exact `variant` prop values. If `'secondary'` is not defined, use whatever outlined/ghost variant exists or fall back to a plain styled `<button>` with `className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-white hover:border-emerald-500/40 transition-colors"`.

**Verify:** `npm run build` — no TypeScript errors.

---

## Step 7 — Register the `/item/:id` route in `App.tsx`

**What:** Import `ItemDetailPage` and add `<Route path="item/:id" element={<ItemDetailPage />} />` nested inside the existing Layout route.

**File:** `src/App.tsx`

**Exact changes:**

1. Add import (alongside existing page imports):
   ```ts
   import { ItemDetailPage } from '@/pages/ItemDetailPage';
   ```

2. Add route inside the `<Route path="/" element={<Layout />}>` block, after the `list-item` route:
   ```tsx
   <Route path="item/:id" element={<ItemDetailPage />} />
   ```

The Layout route block becomes:
```tsx
<Route path="/" element={<Layout />}>
  <Route index element={<HomePage />} />
  <Route path="marketplace" element={<MarketplacePage />} />
  <Route path="how-it-works" element={<HowItWorksPage />} />
  <Route path="contact" element={<ContactPage />} />
  <Route path="list-item" element={<ListItemPage />} />
  <Route path="item/:id" element={<ItemDetailPage />} />
</Route>
```

**Verify:** `npm run build` — full clean build with zero TypeScript errors. This is the final verification gate.

---

## Dependency Order Summary

```
Step 1  src/types/index.ts             ← Must be first; all other files import this type
Step 2  src/data/seedData.ts           ← Depends on new type fields from Step 1
Step 3  src/utils/filters.ts           ← Depends on EquipmentListing type from Step 1
Step 4  src/components/Marketplace.tsx ← Depends on filterByNeighborhood from Step 3
Step 5  src/components/EquipmentCard.tsx ← Depends on new type fields (Step 1); adds Link
Step 6  src/pages/ItemDetailPage.tsx   ← Depends on type (Step 1), Badge/Button components
Step 7  src/App.tsx                    ← Depends on ItemDetailPage existing (Step 6)
```

No circular dependencies. Steps 3–5 are independent of each other and can be verified individually, but Step 4 requires Step 3.

---

## Potential Issues to Watch For

1. **`Button` variants** — confirmed values from `src/components/ui/Button.tsx`: `'primary'` (emerald filled), `'secondary'` (emerald outlined), `'ghost'` (text only). Use `variant="secondary"` for the "Contact Lender" button as specified.
2. **localStorage stale seed data** — `initializeListings` only seeds when storage is empty. Existing stored data lacks `neighborhood`/`coordinates`. For testing, clear `localStorage` in DevTools or open an incognito window to trigger a fresh seed.
3. **`filterByNeighborhood` label matching** — the option `value` must be the full display label (e.g. `'Bole, Addis Ababa'`) and the function must match against the same computed label. Use the revised version defined in Step 4, not the earlier draft in Step 3.
4. **`EquipmentCard` Link nesting** — the outer card `<div>` must NOT become an `<a>`. The `<Link>` wraps only the image + title/price sub-elements. Nesting `<a>` inside `<a>` is invalid HTML and will cause React warnings.
