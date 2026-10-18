import type { Category, EquipmentListing } from '@/types';

/**
 * Filters an array of equipment listings by search query and category.
 * Both filters are applied as a conjunction (AND).
 *
 * @param listings - Full array of equipment listings
 * @param searchQuery - Case-insensitive substring match against title and location
 * @param selectedCategory - Category to filter by; 'All' returns all listings
 * @returns Filtered array of listings satisfying both criteria
 */
export function filterListings(
  listings: EquipmentListing[],
  searchQuery: string,
  selectedCategory: Category,
): EquipmentListing[] {
  const q = searchQuery.trim().toLowerCase();

  return listings.filter(listing => {
    const matchesCategory =
      selectedCategory === 'All' || listing.category === selectedCategory;

    const matchesSearch =
      q === '' ||
      listing.title.toLowerCase().includes(q) ||
      listing.location.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });
}

/**
 * Filters listings by neighbourhood/sub-city display label.
 * The label format is 'Neighbourhood, City' (e.g. 'Bole, Addis Ababa').
 * For listings without a neighbourhood the label is just the city.
 * An empty or falsy neighborhoodLabel returns all listings unchanged.
 *
 * @param items - Array of listings to filter
 * @param neighborhoodLabel - Full display label to match; '' returns all
 * @returns Filtered array
 */
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
