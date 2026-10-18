import type { EquipmentListing, RentalRequest } from '@/types';

const LISTINGS_KEY = 'mender_listings';
const REQUESTS_KEY = 'mender_requests';

// ── Listings ──────────────────────────────────────────────────────────────

export function getListings(): EquipmentListing[] {
  try {
    const raw = localStorage.getItem(LISTINGS_KEY);
    return raw ? (JSON.parse(raw) as EquipmentListing[]) : [];
  } catch {
    return [];
  }
}

export function saveListings(listings: EquipmentListing[]): void {
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
}

export function addListing(listing: EquipmentListing): void {
  const current = getListings();
  saveListings([...current, listing]);
}

export function initializeListings(seedData: EquipmentListing[]): void {
  // Only seed when no data exists — never overwrites
  const existing = getListings();
  if (existing.length === 0) {
    saveListings(seedData);
  }
}

// ── Rental Requests ───────────────────────────────────────────────────────

export function getRentalRequests(): RentalRequest[] {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    return raw ? (JSON.parse(raw) as RentalRequest[]) : [];
  } catch {
    return [];
  }
}

export function addRentalRequest(request: RentalRequest): void {
  const current = getRentalRequests();
  localStorage.setItem(REQUESTS_KEY, JSON.stringify([...current, request]));
}
