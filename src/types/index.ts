// ── Category ───────────────────────────────────────────────────────────────

export type Category =
  | 'All'
  | 'Tents & Canopies'
  | 'Seating'
  | 'Sound & Lighting'
  | 'Catering'
  | 'Traditional Attire';

export const ALL_CATEGORIES: Category[] = [
  'All',
  'Tents & Canopies',
  'Seating',
  'Sound & Lighting',
  'Catering',
  'Traditional Attire',
];

// ── Equipment Listing ──────────────────────────────────────────────────────

export interface EquipmentListing {
  id: string;               // Unique ID — generated via Date.now() + Math.random()
  title: string;            // Display name of the equipment
  category: Exclude<Category, 'All'>; // Category cannot be "All"
  pricePerDay: number;      // Price in ETB (positive integer)
  description?: string;     // Optional longer description
  ownerName: string;        // Name of the listing owner
  location: string;         // City or area (used for search)
  neighborhood?: string;    // Sub-city or neighbourhood (e.g. 'Bole', 'Tabor')
  coordinates?: { lat: number; lng: number }; // For map placeholder
  imageDataUrl?: string;    // Optional base64 data-URL from FileReader
  createdAt: string;        // ISO 8601 timestamp
}

// ── Rental Request ─────────────────────────────────────────────────────────

export interface RentalRequest {
  id: string;               // Unique ID — generated via Date.now() + Math.random()
  listingId: string;        // References EquipmentListing.id
  listingTitle: string;     // Denormalized title (snapshot at request time)
  renterName: string;       // Renter's full name
  renterPhone: string;      // Renter's phone number
  startDate: string;        // ISO date string (YYYY-MM-DD)
  endDate: string;          // ISO date string (YYYY-MM-DD); >= startDate
  createdAt: string;        // ISO 8601 timestamp
}

// ── Utilities ─────────────────────────────────────────────────────────────

/** Generates a unique ID without a library */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Auth ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  phone?: string;
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  itemName: string;
  lenderName: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  neighborhood: string;
  city: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  pricePerDay: number;
  status: 'Active' | 'Inactive';
  views: number;
}

export interface IncomingRequest {
  id: string;
  renterName: string;
  itemName: string;
  startDate: string;
  endDate: string;
  requestStatus: 'Pending' | 'Approved' | 'Rejected';
}
