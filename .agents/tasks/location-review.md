# Location features: neighborhood badges, sub-city filter, and item detail page

This change adds precise location data to every equipment listing and surfaces it at three points: the card location badge, a new Location dropdown on the Marketplace, and a dedicated item detail page at `/item/:id`. Two optional fields — `neighborhood` and `coordinates` — were added to `EquipmentListing`, all 10 seed listings were updated with realistic Ethiopian sub-city data, and a `filterByNeighborhood` utility was added. The build report confirms zero TypeScript and zero Vite errors.

Watch for: (**confirmed**) `filterByNeighborhood` matches on the full `'Neighbourhood, City'` display label — consistent with how `locationOptions` is derived in Marketplace. (**confirmed**) The `EquipmentCard` Link wraps only the image and title/price block; the Request Rental button is outside the anchor, avoiding nested-interactive-element invalidity.

**Verdict**: APPROVED

---

## High-level view

Both new fields are optional, so existing localStorage entries without them degrade gracefully to city-only display rather than crashing. All 10 seed entries carry the new data across six Ethiopian cities.

The location dropdown is derived dynamically from the current `listings` prop using the same `'Neighbourhood, City'` format that `filterByNeighborhood` expects, so the filter and dropdown always speak the same language with no hardcoded list to maintain.

`ItemDetailPage` receives `listings` and the rental modal opener via `useOutletContext`, keeping the new route integrated with existing state management. The map placeholder uses a pure CSS repeating gradient — no new npm packages.

The `EquipmentCard` Link boundary scopes correctly to image + title/price, with the card body and CTA button in a sibling div. This avoids the HTML invalidity of a button nested inside an anchor.

---

<details>
<summary>Issues (0)</summary>

No blocking concerns identified.

</details>

---

<details>
<summary>Details</summary>

### localStorage degradation

Existing stored listings (without `neighborhood`/`coordinates`) will persist in localStorage until the user clears it or opens an incognito session. The conditional fallback `listing.neighborhood ? \`${listing.neighborhood}, ${listing.location}\` : listing.location` used consistently across card, dropdown derivation, detail page, and filter function means those entries silently display city-only — no runtime error, no broken filter behavior. This is the only behavioral asymmetry between a fresh session and an existing one.

### filterByNeighborhood and dropdown coupling

The `locationOptions` derivation in Marketplace and the `filterByNeighborhood` comparison both use the same format string and `.toLowerCase()` comparison. A city-only listing (no `neighborhood`) produces the same label in both places (`listing.location`), so filtering by a city-only option works without a special case.

</details>

---

<details>
<summary>File map</summary>

| File | Change |
|------|--------|
| `src/types/index.ts` | Added `neighborhood?: string` and `coordinates?: { lat: number; lng: number }` to `EquipmentListing` |
| `src/data/seedData.ts` | All 10 listings updated with `neighborhood` and `coordinates` |
| `src/utils/filters.ts` | Added `filterByNeighborhood` function |
| `src/components/Marketplace.tsx` | Added `neighborhoodFilter` state, `locationOptions` derivation, Location `<select>`, updated Clear filters |
| `src/components/EquipmentCard.tsx` | Wrapped image + title in `<Link to="/item/:id">`, updated location badge to `Neighbourhood, City` format |
| `src/pages/ItemDetailPage.tsx` | New page: detail view with Location & Pickup Info card and CSS map placeholder |
| `src/App.tsx` | Added `<Route path="item/:id" element={<ItemDetailPage />} />` inside Layout route |

Full diff: `git diff main -- src/` from the project root.

</details>
