# Implementation Plan — Wire Rental Request Form and Dashboard to Live Backend API

## Context

- **Frontend**: Vite + React 19 + TypeScript, Tailwind CSS dark theme, React Router v7.
- **Build**: `npm run build` → `tsc -b && vite build`. No dedicated test runner in the frontend `package.json`; verification uses the TypeScript compiler (`tsc --noEmit`) and the dev server.
- **Auth token**: Stored in `localStorage` under key `mender_auth_token`. Auth context lives in `src/context/AuthContext.tsx`.
- **API base**: `(import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3001'`.
- **Relevant source files touched**: `src/services/apiService.ts` (new), `src/components/modals/RequestRentalModal.tsx`, `src/components/Layout.tsx`, `src/pages/DashboardPage.tsx`.
- **No new npm packages** — native `fetch` throughout.

---

- [ ] 1. **Create `src/services/apiService.ts`** — shared fetch wrapper used by both the modal and the dashboard.

  Create the file with the following exports, using native `fetch` only (no new packages):

  ```ts
  const API_BASE = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3001';

  function getAuthHeaders(): HeadersInit
  export async function apiPost<T>(path: string, body: unknown): Promise<T>
  export async function apiGet<T>(path: string): Promise<T>
  export async function apiPatch<T>(path: string, body: unknown): Promise<T>
  ```

  - `getAuthHeaders`: reads `localStorage.getItem('mender_auth_token')`; if present, returns `{ 'Content-Type': 'application/json', 'Authorization': 'Bearer <token>' }`; otherwise returns `{ 'Content-Type': 'application/json' }`.
  - Each helper: calls `fetch`, checks `res.ok`, on failure parses the JSON body and throws `new Error(data.error ?? 'Request failed')`, on success returns the parsed JSON typed as `T`.
  - `apiGet` does not send a body but still includes the auth headers (needed for protected GET endpoints).

  **Files**: `src/services/apiService.ts` (create)

  **Verify**: `npx tsc --noEmit` in the workspace root. Expect zero TypeScript errors.

---

- [ ] 2. **Update `src/components/modals/RequestRentalModal.tsx`** — replace localStorage submit with live API call.

  Make these changes, in order:

  1. **Add `equipmentId: string` to `RequestRentalModalProps`**. The interface becomes:
     ```ts
     interface RequestRentalModalProps {
       listing: EquipmentListing;
       equipmentId: string;
       onClose: () => void;
     }
     ```
     Destructure `equipmentId` alongside `listing` and `onClose` in the component signature.

  2. **Add two new state variables** after the existing `submitted` state:
     ```ts
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [apiError, setApiError] = useState<string | null>(null);
     ```

  3. **Comment out (do not delete) the `addRentalRequest` import** and the `generateId` import from `@/types`, and the `RentalRequest` type import (they are no longer used in the live path but serve as a fallback reference). Add a comment: `// Legacy localStorage fallback — kept for reference`.

  4. **Add the `apiPost` import** at the top:
     ```ts
     import { apiPost } from '@/services/apiService';
     ```

  5. **Replace the `handleSubmit` body** (keep the `e.preventDefault()` and validation block unchanged, replace only the code after the validation guard):
     ```ts
     setApiError(null);
     setIsSubmitting(true);
     try {
       const result = await apiPost<{ id: string; total_price: string }>(
         '/api/rentals',
         {
           equipment_id: equipmentId,
           start_date: fields.startDate,
           end_date: fields.endDate,
           message: undefined,
         }
       );
       setSubmitted(true);
       // Store total_price for success panel
       setTotalPrice(result.total_price);
     } catch (err) {
       setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
     } finally {
       setIsSubmitting(false);
     }
     ```
     Also add `const [totalPrice, setTotalPrice] = useState<string | null>(null);` with the other state declarations.
     Change `handleSubmit` signature to `async (e: React.FormEvent)`.

  6. **Disable submit button and show loading text** while `isSubmitting`:
     ```tsx
     <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
       {isSubmitting ? 'Submitting…' : 'Submit Request'}
     </Button>
     ```

  7. **Show `apiError` as red inline text** below the actions row (after the `<div className="flex gap-3 pt-2">` block):
     ```tsx
     {apiError && (
       <p className="text-xs text-red-400 text-center mt-2" role="alert">{apiError}</p>
     )}
     ```

  8. **Update the success panel** to show total price when available. Replace the existing success `<p className="text-sm text-neutral-400 ...">` copy with:
     ```tsx
     <p className="text-sm text-neutral-400 mt-1 max-w-xs">
       Your rental request for <span className="text-emerald-400">{listing.title}</span> has
       been submitted.{totalPrice ? ` Total: ETB ${Number(totalPrice).toLocaleString()}.` : ''}{' '}
       The owner will contact you at {fields.renterPhone}.
     </p>
     ```

  **Files**: `src/components/modals/RequestRentalModal.tsx` (modify)

  **Verify**: `npx tsc --noEmit` — zero errors.

---

- [ ] 3. **Thread `equipmentId` through `src/components/Layout.tsx`** — pass `rentalModal.data.id` to the updated modal.

  The `rentalModal.data` is of type `EquipmentListing` and already has an `.id` field. Change the single `<RequestRentalModal … />` JSX element from:
  ```tsx
  <RequestRentalModal
    listing={rentalModal.data}
    onClose={rentalModal.close}
  />
  ```
  to:
  ```tsx
  <RequestRentalModal
    listing={rentalModal.data}
    equipmentId={rentalModal.data.id}
    onClose={rentalModal.close}
  />
  ```

  No other changes to this file.

  **Files**: `src/components/Layout.tsx` (modify)

  **Verify**: `npx tsc --noEmit` — zero errors (the new required prop is now satisfied).

---

- [ ] 4. **Update `src/pages/DashboardPage.tsx` — My Bookings tab** — replace `MOCK_BOOKINGS` with live API data.

  ### 4a. Add interfaces and imports at the top of the file

  Add after the existing imports:
  ```ts
  import { useEffect } from 'react';
  import { Link } from 'react-router-dom';
  import { apiGet, apiPatch } from '@/services/apiService';
  ```

  Add the two API shape interfaces (place them just above the mock data constants):
  ```ts
  interface ApiBooking {
    id: string;
    equipment_id: string;
    equipment_title: string;
    city: string;
    neighborhood: string | null;
    owner_name: string;
    start_date: string;
    end_date: string;
    total_price: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    created_at: string;
  }

  interface ApiIncomingRequest {
    id: string;
    equipment_title: string;
    renter_name: string;
    renter_phone: string | null;
    start_date: string;
    end_date: string;
    total_price: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  }
  ```

  ### 4b. Comment out mock data constants (keep for reference)

  Wrap `MOCK_BOOKINGS` and `INITIAL_REQUESTS` in block comments:
  ```ts
  /* Legacy mock data — replaced by live API. Keep for reference.
  const MOCK_BOOKINGS: Booking[] = [ ... ];
  const INITIAL_REQUESTS: IncomingRequest[] = [ ... ];
  */
  ```
  `MOCK_EQUIPMENT` and the `EquipmentItem` usage remain unchanged (active listings still use mock data).

  ### 4c. Add a new status badge helper for API (lowercase) statuses

  Add below the existing `bookingStatusClasses` and `requestStatusClasses` helpers:
  ```ts
  function apiBookingStatusClasses(status: ApiBooking['status']): string {
    const map: Record<ApiBooking['status'], string> = {
      pending:   'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
      confirmed: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
      completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      cancelled: 'bg-red-500/15 text-red-400 border border-red-500/30',
    };
    return map[status];
  }

  function apiRequestStatusClasses(status: ApiIncomingRequest['status']): string {
    const map: Record<ApiIncomingRequest['status'], string> = {
      pending:   'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
      confirmed: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
      completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      cancelled: 'bg-red-500/15 text-red-400 border border-red-500/30',
    };
    return map[status];
  }

  /** Capitalises first letter for display labels (pending → Pending) */
  function capitalise(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  ```

  ### 4d. Replace state declarations inside `DashboardPage`

  Remove:
  ```ts
  const [requests, setRequests] = useState<IncomingRequest[]>(INITIAL_REQUESTS);
  ```

  Add the six new state variables:
  ```ts
  // My Bookings
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  // Incoming Requests
  const [incomingRequests, setIncomingRequests] = useState<ApiIncomingRequest[]>([]);
  const [incomingLoading, setIncomingLoading] = useState(true);
  const [incomingError, setIncomingError] = useState<string | null>(null);
  ```

  Also add per-request action error state for optimistic updates:
  ```ts
  const [actionError, setActionError] = useState<string | null>(null);
  ```

  ### 4e. Add `useEffect` hooks for data fetching

  Add after the state declarations (before the `if (!user) return null;` guard):
  ```ts
  useEffect(() => {
    apiGet<ApiBooking[]>('/api/rentals/my')
      .then(data => { setBookings(data); setBookingsLoading(false); })
      .catch(err => {
        setBookingsError(err instanceof Error ? err.message : 'Failed to load bookings.');
        setBookingsLoading(false);
      });
  }, []);

  useEffect(() => {
    apiGet<ApiIncomingRequest[]>('/api/rentals/incoming')
      .then(data => { setIncomingRequests(data); setIncomingLoading(false); })
      .catch(err => {
        setIncomingError(err instanceof Error ? err.message : 'Failed to load requests.');
        setIncomingLoading(false);
      });
  }, []);
  ```

  ### 4f. Update the stats row derivations

  Replace:
  ```ts
  const totalBookings = MOCK_BOOKINGS.length;
  const pendingRequests = requests.filter(r => r.requestStatus === 'Pending').length;
  ```
  with:
  ```ts
  const totalBookings = bookings.length;
  const pendingRequests = incomingRequests.filter(r => r.status === 'pending').length;
  ```
  `activeListings` stays as `MOCK_EQUIPMENT.filter(e => e.status === 'Active').length` — unchanged.

  ### 4g. Replace `handleRequestAction` with async API call

  Remove the old `handleRequestAction` function. Add:
  ```ts
  async function handleRequestAction(id: string, action: 'confirmed' | 'cancelled') {
    setActionError(null);
    // Optimistic update
    setIncomingRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status: action } : r)
    );
    try {
      await apiPatch<ApiIncomingRequest>(`/api/rentals/${id}/status`, { status: action });
    } catch (err) {
      // Revert optimistic update
      setIncomingRequests(prev =>
        prev.map(r => r.id === id ? { ...r, status: 'pending' as const } : r)
      );
      setActionError(err instanceof Error ? err.message : 'Action failed. Please try again.');
    }
  }
  ```

  ### 4h. Replace the My Bookings tab render content

  Replace everything inside `{activeTab === 'bookings' && ( <section> ... </section> )}` with the following structure:

  **Loading state** (shown when `bookingsLoading`):
  ```tsx
  {bookingsLoading && (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-1/2 mb-2" />
          <div className="h-3 bg-slate-700 rounded w-1/3 mb-1" />
          <div className="h-3 bg-slate-700 rounded w-1/4" />
        </div>
      ))}
    </div>
  )}
  ```

  **Error state** (shown when `bookingsError && !bookingsLoading`):
  ```tsx
  {bookingsError && !bookingsLoading && (
    <div className="bg-neutral-900 border border-red-500/30 rounded-xl p-6 text-center">
      <p className="text-red-400 text-sm mb-3">{bookingsError}</p>
      <button
        onClick={() => {
          setBookingsError(null);
          setBookingsLoading(true);
          apiGet<ApiBooking[]>('/api/rentals/my')
            .then(data => { setBookings(data); setBookingsLoading(false); })
            .catch(err => {
              setBookingsError(err instanceof Error ? err.message : 'Failed to load bookings.');
              setBookingsLoading(false);
            });
        }}
        className="text-sm text-emerald-400 hover:text-emerald-300 underline"
      >
        Retry
      </button>
    </div>
  )}
  ```

  **Empty state** (shown when `!bookingsLoading && !bookingsError && bookings.length === 0`):
  ```tsx
  {!bookingsLoading && !bookingsError && bookings.length === 0 && (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
      <p className="text-neutral-400 text-sm">No bookings yet.</p>
      <p className="text-neutral-500 text-xs mt-1">
        <Link to="/marketplace" className="text-emerald-400 hover:underline">Browse equipment</Link>{' '}
        to make your first rental request.
      </p>
    </div>
  )}
  ```

  **Data state** (shown when `!bookingsLoading && !bookingsError && bookings.length > 0`):
  Render the same mobile-card + desktop-table layout as before, but map over `bookings` (the `ApiBooking[]`) instead of `MOCK_BOOKINGS`:
  - Item name: `booking.equipment_title`
  - Lender: `booking.owner_name`
  - Location: `booking.neighborhood ? booking.neighborhood + ', ' + booking.city : booking.city`
  - Cost: `Number(booking.total_price).toLocaleString()`
  - Status badge: `apiBookingStatusClasses(booking.status)`, label: `capitalise(booking.status)`
  - Dates: `booking.start_date` → `booking.end_date`

  ### 4i. Replace the Incoming Requests render content

  Replace everything inside the `{/* Incoming requests */}` div with equivalent loading / error / empty / data states, following the same pattern as 4h above, but for `incomingRequests`:

  **Loading** (3 animate-pulse skeleton cards, same pattern as bookings).

  **Error** (red error box with retry that re-calls `apiGet<ApiIncomingRequest[]>('/api/rentals/incoming')`).

  **Empty**: "No incoming requests yet."

  **Data**: Map over `incomingRequests` in both the mobile card list and the desktop table:
  - Item name: `r.equipment_title`
  - Renter name: `r.renter_name`
  - Phone (mobile cards only, add a line): `r.renter_phone ?? '—'`
  - Dates: `r.start_date` → `r.end_date`
  - Status badge: `apiRequestStatusClasses(r.status)`, label: `capitalise(r.status)`
  - Action buttons: call `handleRequestAction(r.id, 'confirmed')` for Approve and `handleRequestAction(r.id, 'cancelled')` for Reject; show buttons only when `r.status === 'pending'`.
  - Show the action error (if `actionError` is set, display it as `<p className="text-xs text-red-400 mt-2">{actionError}</p>` below the incoming requests section heading).

  **Files**: `src/pages/DashboardPage.tsx` (modify)

  **Verify**: `npx tsc --noEmit` — zero errors. Then `npm run build` — build succeeds with no errors. Start both backend (`npm run dev` in `/server`) and frontend (`npm run dev` in root), log in, submit a rental request from an equipment page, and confirm the request appears under My Bookings in the Dashboard. As an equipment owner, confirm the Approve / Reject buttons update status via the API.
