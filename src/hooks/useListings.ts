import { useCallback, useEffect, useState } from 'react';
import { SEED_LISTINGS } from '@/data/seedData';
import { addListing } from '@/services/storageService';
import type { Category, EquipmentListing } from '@/types';

const API_BASE = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3001';

// Shape returned by GET /api/equipment
interface ApiEquipment {
  id: string;
  title: string;
  category: string;
  description: string | null;
  price_per_day: string;        // pg returns NUMERIC as string
  city: string;
  neighborhood: string | null;
  latitude: string | null;
  longitude: string | null;
  available: boolean;
  owner_name: string;
  created_at: string;
}

/** Maps a DB equipment row to the frontend EquipmentListing shape. */
function mapApiEquipment(item: ApiEquipment): EquipmentListing {
  return {
    id: item.id,                              // real UUID — used for rental requests
    title: item.title,
    category: item.category as Exclude<Category, 'All'>,
    pricePerDay: Number(item.price_per_day),
    description: item.description ?? undefined,
    ownerName: item.owner_name,
    location: item.city,
    neighborhood: item.neighborhood ?? undefined,
    coordinates:
      item.latitude && item.longitude
        ? { lat: Number(item.latitude), lng: Number(item.longitude) }
        : undefined,
    createdAt: item.created_at,
  };
}

export type ListingsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; listings: EquipmentListing[] };

export function useListings() {
  const [state, setState] = useState<ListingsState>({ status: 'loading' });

  const fetchListings = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const res = await fetch(`${API_BASE}/api/equipment`);
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = (await res.json()) as ApiEquipment[];
      const mapped = data.map(mapApiEquipment);
      setState({ status: 'ready', listings: mapped });
    } catch (err) {
      console.warn('[useListings] API unreachable, falling back to seed data:', err);
      // Graceful fallback: show seed data so the UI is never broken without a backend
      setState({ status: 'ready', listings: SEED_LISTINGS });
    }
  }, []);

  useEffect(() => {
    void fetchListings();
  }, [fetchListings]);

  /** Adds a newly submitted listing to local state (optimistic, no API call yet). */
  const addNewListing = useCallback((listing: EquipmentListing) => {
    addListing(listing);  // keep localStorage write for offline resilience
    setState(prev =>
      prev.status === 'ready'
        ? { status: 'ready', listings: [...prev.listings, listing] }
        : prev
    );
  }, []);

  // Flatten to a plain listings array for backwards-compat with all consumers
  const listings: EquipmentListing[] =
    state.status === 'ready' ? state.listings : [];

  return {
    listings,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    errorMessage: state.status === 'error' ? state.message : null,
    refetch: fetchListings,
    addNewListing,
  };
}
