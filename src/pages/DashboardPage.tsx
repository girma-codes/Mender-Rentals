import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiGet, apiPatch } from '@/services/apiService';

// ── API Interfaces ───────────────────────────────────────────────────────────

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

interface ApiEquipmentItem {
  id: string;
  title: string;
  price_per_day: string;
  available: boolean;
  // views is not stored server-side; omit it
}

// ── Mock Data ───────────────────────────────────────────────────────────────

/* Legacy mock data — replaced by live API. Keep for reference.
const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    itemName: 'Large Wedding Tent',
    lenderName: 'Abebe Girma',
    startDate: '2025-08-10',
    endDate: '2025-08-12',
    totalCost: 5000,
    status: 'Pending',
    neighborhood: 'Bole',
    city: 'Addis Ababa',
  },
  {
    id: 'b2',
    itemName: 'PA Sound System',
    lenderName: 'Solomon Bekele',
    startDate: '2025-08-15',
    endDate: '2025-08-15',
    totalCost: 1800,
    status: 'Confirmed',
    neighborhood: 'Tana Sub-city',
    city: 'Bahir Dar',
  },
  {
    id: 'b3',
    itemName: 'LED Lighting Kit',
    lenderName: 'Dawit Alemu',
    startDate: '2025-07-20',
    endDate: '2025-07-21',
    totalCost: 2400,
    status: 'Completed',
    neighborhood: 'Kezira',
    city: 'Dire Dawa',
  },
  {
    id: 'b4',
    itemName: 'Catering Buffet Set',
    lenderName: 'Meron Tadesse',
    startDate: '2025-07-01',
    endDate: '2025-07-02',
    totalCost: 1800,
    status: 'Cancelled',
    neighborhood: 'Kazanchis',
    city: 'Addis Ababa',
  },
  {
    id: 'b5',
    itemName: 'Folding Chairs (50)',
    lenderName: 'Tigist Haile',
    startDate: '2025-09-01',
    endDate: '2025-09-03',
    totalCost: 900,
    status: 'Pending',
    neighborhood: 'Tabor',
    city: 'Hawassa',
  },
];

const INITIAL_REQUESTS: IncomingRequest[] = [
  {
    id: 'r1',
    renterName: 'Yonas Tesfaye',
    itemName: 'Canopy Gazebo 3×3',
    startDate: '2025-08-20',
    endDate: '2025-08-22',
    requestStatus: 'Pending',
  },
  {
    id: 'r2',
    renterName: 'Hiwot Mulat',
    itemName: 'Portable Generator 5KVA',
    startDate: '2025-08-25',
    endDate: '2025-08-25',
    requestStatus: 'Pending',
  },
  {
    id: 'r3',
    renterName: 'Kaleab Desta',
    itemName: 'Canopy Gazebo 3×3',
    startDate: '2025-09-05',
    endDate: '2025-09-07',
    requestStatus: 'Pending',
  },
  {
    id: 'r4',
    renterName: 'Selam Girma',
    itemName: 'Portable Generator 5KVA',
    startDate: '2025-09-10',
    endDate: '2025-09-10',
    requestStatus: 'Pending',
  },
];
*/

/* Legacy mock equipment — replaced by live API. Keep for reference.
const MOCK_EQUIPMENT: EquipmentItem[] = [
  { id: 'e1', name: 'Canopy Gazebo 3×3', pricePerDay: 800, status: 'Active', views: 42 },
  { id: 'e2', name: 'Cocktail Tables (8)', pricePerDay: 480, status: 'Inactive', views: 18 },
  { id: 'e3', name: 'Portable Generator 5KVA', pricePerDay: 1500, status: 'Active', views: 67 },
];
*/

// ── Helpers ─────────────────────────────────────────────────────────────────

function apiBookingStatusClasses(status: ApiBooking['status']): string {
  const map: Record<ApiBooking['status'], string> = {
    pending: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    confirmed: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border border-red-500/30',
  };
  return map[status];
}

function apiRequestStatusClasses(status: ApiIncomingRequest['status']): string {
  const map: Record<ApiIncomingRequest['status'], string> = {
    pending: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    confirmed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    completed: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border border-red-500/30',
  };
  return map[status];
}

function capitalizeStatus(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Component ────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Live bookings state ---
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  // --- Live incoming requests state ---
  const [incomingRequests, setIncomingRequests] = useState<ApiIncomingRequest[]>([]);
  const [incomingLoading, setIncomingLoading] = useState(true);
  const [incomingError, setIncomingError] = useState<string | null>(null);

  // --- Live equipment state ---
  const [equipment, setEquipment] = useState<ApiEquipmentItem[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [equipmentError, setEquipmentError] = useState<string | null>(null);

  // --- Action error state ---
  const [actionError, setActionError] = useState<string | null>(null);

  function fetchBookings() {
    setBookingsLoading(true);
    setBookingsError(null);
    apiGet<ApiBooking[]>('/api/rentals/my')
      .then(data => { setBookings(data); setBookingsLoading(false); })
      .catch((err: unknown) => {
        setBookingsError(err instanceof Error ? err.message : 'Failed to load bookings.');
        setBookingsLoading(false);
      });
  }

  function fetchIncoming() {
    setIncomingLoading(true);
    setIncomingError(null);
    apiGet<ApiIncomingRequest[]>('/api/rentals/incoming')
      .then(data => { setIncomingRequests(data); setIncomingLoading(false); })
      .catch((err: unknown) => {
        setIncomingError(err instanceof Error ? err.message : 'Failed to load incoming requests.');
        setIncomingLoading(false);
      });
  }

  function fetchEquipment() {
    setEquipmentLoading(true);
    setEquipmentError(null);
    apiGet<ApiEquipmentItem[]>('/api/equipment/my')
      .then(data => { setEquipment(data); setEquipmentLoading(false); })
      .catch((err: unknown) => {
        setEquipmentError(err instanceof Error ? err.message : 'Failed to load equipment.');
        setEquipmentLoading(false);
      });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchBookings(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchIncoming(); }, []);
  // Re-fetch equipment whenever the equipment tab is activated so newly listed
  // items show up immediately after redirect from ListItemPage / ListItemModal.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchEquipment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('tab')]);

  if (!user) return null;

  const activeTab = searchParams.get('tab') ?? 'bookings';

  // Stats
  const totalBookings = bookings.length;
  const activeListings = equipment.filter(e => e.available).length;
  const pendingRequests = incomingRequests.filter(r => r.status === 'pending').length;

  function switchTab(tab: string) {
    setSearchParams({ tab });
  }

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

  return (
    <div className="bg-neutral-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Page Header ── */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-sm flex-shrink-0">
            {user.avatarInitials}
          </div>
          <div>
            <p className="text-neutral-400 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="flex gap-4 flex-wrap sm:flex-nowrap">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex-1 min-w-[140px]">
            <p className="text-neutral-400 text-xs font-medium uppercase tracking-wide">Total Bookings</p>
            <p className="text-3xl font-bold text-white mt-1">{totalBookings}</p>
            <p className="text-emerald-400 text-xs mt-1">All time</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex-1 min-w-[140px]">
            <p className="text-neutral-400 text-xs font-medium uppercase tracking-wide">Active Listings</p>
            <p className="text-3xl font-bold text-white mt-1">{activeListings}</p>
            <p className="text-emerald-400 text-xs mt-1">Live now</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex-1 min-w-[140px]">
            <p className="text-neutral-400 text-xs font-medium uppercase tracking-wide">Pending Requests</p>
            <p className="text-3xl font-bold text-white mt-1">{pendingRequests}</p>
            <p className="text-yellow-400 text-xs mt-1">Awaiting action</p>
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="flex gap-2">
          <button
            onClick={() => switchTab('bookings')}
            className={
              activeTab === 'bookings'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full px-5 py-2 text-sm font-medium transition-colors'
                : 'text-neutral-400 hover:text-white rounded-full px-5 py-2 text-sm transition-colors'
            }
          >
            My Bookings
          </button>
          <button
            onClick={() => switchTab('equipment')}
            className={
              activeTab === 'equipment'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full px-5 py-2 text-sm font-medium transition-colors'
                : 'text-neutral-400 hover:text-white rounded-full px-5 py-2 text-sm transition-colors'
            }
          >
            My Equipment
          </button>
        </div>

        {/* ── Tab Content ── */}

        {activeTab === 'bookings' && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">My Bookings</h2>

            {/* Loading state */}
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

            {/* Error state */}
            {bookingsError && !bookingsLoading && (
              <div className="bg-neutral-900 border border-red-500/30 rounded-xl p-6 text-center">
                <p className="text-red-400 text-sm mb-3">{bookingsError}</p>
                <button
                  onClick={fetchBookings}
                  className="text-sm text-emerald-400 hover:text-emerald-300 underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty state */}
            {!bookingsLoading && !bookingsError && bookings.length === 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
                <p className="text-neutral-400 text-sm">No bookings yet.</p>
                <p className="text-neutral-500 text-xs mt-1">
                  <Link to="/marketplace" className="text-emerald-400 hover:underline">Browse equipment</Link>{' '}
                  to make your first rental request.
                </p>
              </div>
            )}

            {/* Data state */}
            {!bookingsLoading && !bookingsError && bookings.length > 0 && (
              <>
                {/* Mobile: stacked cards */}
                <div className="space-y-3 md:hidden">
                  {bookings.map(booking => (
                    <div key={booking.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white font-medium text-sm">{booking.equipment_title}</p>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${apiBookingStatusClasses(booking.status)}`}>
                          {capitalizeStatus(booking.status)}
                        </span>
                      </div>
                      <p className="text-neutral-400 text-xs">Lender: {booking.owner_name}</p>
                      <p className="text-neutral-400 text-xs">{booking.start_date} → {booking.end_date}</p>
                      <p className="text-neutral-400 text-xs">
                        {booking.neighborhood ? `${booking.neighborhood}, ${booking.city}` : booking.city}
                      </p>
                      <p className="text-emerald-400 text-xs font-medium">ETB {Number(booking.total_price).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-neutral-800">
                        <th className="pb-3 text-neutral-400 font-medium pr-4">Item</th>
                        <th className="pb-3 text-neutral-400 font-medium pr-4">Dates</th>
                        <th className="pb-3 text-neutral-400 font-medium pr-4">Cost (ETB)</th>
                        <th className="pb-3 text-neutral-400 font-medium pr-4">Lender</th>
                        <th className="pb-3 text-neutral-400 font-medium pr-4">Location</th>
                        <th className="pb-3 text-neutral-400 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/50">
                      {bookings.map(booking => (
                        <tr key={booking.id} className="hover:bg-neutral-900/50 transition-colors">
                          <td className="py-3.5 pr-4 text-white font-medium">{booking.equipment_title}</td>
                          <td className="py-3.5 pr-4 text-neutral-300">{booking.start_date} – {booking.end_date}</td>
                          <td className="py-3.5 pr-4 text-neutral-300">{Number(booking.total_price).toLocaleString()}</td>
                          <td className="py-3.5 pr-4 text-neutral-300">{booking.owner_name}</td>
                          <td className="py-3.5 pr-4 text-neutral-300">
                            {booking.neighborhood ? `${booking.neighborhood}, ${booking.city}` : booking.city}
                          </td>
                          <td className="py-3.5">
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${apiBookingStatusClasses(booking.status)}`}>
                              {capitalizeStatus(booking.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === 'equipment' && (
          <section className="space-y-8">

            {/* Listed items */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">My Listed Equipment</h2>

              {/* Loading state */}
              {equipmentLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 animate-pulse">
                      <div className="h-4 bg-slate-700 rounded w-2/3 mb-2" />
                      <div className="h-3 bg-slate-700 rounded w-1/3 mb-1" />
                      <div className="h-3 bg-slate-700 rounded w-1/4" />
                    </div>
                  ))}
                </div>
              )}

              {/* Error state */}
              {equipmentError && !equipmentLoading && (
                <div className="bg-neutral-900 border border-red-500/30 rounded-xl p-6 text-center">
                  <p className="text-red-400 text-sm mb-3">{equipmentError}</p>
                  <button
                    onClick={fetchEquipment}
                    className="text-sm text-emerald-400 hover:text-emerald-300 underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!equipmentLoading && !equipmentError && equipment.length === 0 && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
                  <p className="text-neutral-400 text-sm">No equipment listed yet.</p>
                </div>
              )}

              {/* Data state */}
              {!equipmentLoading && !equipmentError && equipment.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {equipment.map(item => (
                    <div key={item.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white font-medium text-sm">{item.title}</p>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                          item.available
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-neutral-700/40 text-neutral-400 border border-neutral-700'
                        }`}>
                          {item.available ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-emerald-400 text-sm font-medium">ETB {Number(item.price_per_day).toLocaleString()} / day</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Incoming requests */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Incoming Requests</h2>

              {/* Action error */}
              {actionError && (
                <p className="text-xs text-red-400 mb-3">{actionError}</p>
              )}

              {/* Loading state */}
              {incomingLoading && (
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

              {/* Error state */}
              {incomingError && !incomingLoading && (
                <div className="bg-neutral-900 border border-red-500/30 rounded-xl p-6 text-center">
                  <p className="text-red-400 text-sm mb-3">{incomingError}</p>
                  <button
                    onClick={fetchIncoming}
                    className="text-sm text-emerald-400 hover:text-emerald-300 underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!incomingLoading && !incomingError && incomingRequests.length === 0 && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
                  <p className="text-neutral-400 text-sm">No incoming requests yet.</p>
                </div>
              )}

              {/* Data state */}
              {!incomingLoading && !incomingError && incomingRequests.length > 0 && (
                <>
                  {/* Mobile: stacked cards */}
                  <div className="space-y-3 md:hidden">
                    {incomingRequests.map(r => (
                      <div key={r.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-1.5">
                        <p className="text-white font-medium text-sm">{r.equipment_title}</p>
                        <p className="text-neutral-400 text-xs">Renter: {r.renter_name}</p>
                        <p className="text-neutral-400 text-xs">Phone: {r.renter_phone ?? '—'}</p>
                        <p className="text-neutral-400 text-xs">{r.start_date} → {r.end_date}</p>
                        <div className="flex items-center gap-2 pt-1">
                          {r.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleRequestAction(r.id, 'confirmed')}
                                className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRequestAction(r.id, 'cancelled')}
                                className="bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${apiRequestStatusClasses(r.status)}`}>
                              {capitalizeStatus(r.status)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop: table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-neutral-800">
                          <th className="pb-3 text-neutral-400 font-medium pr-4">Renter</th>
                          <th className="pb-3 text-neutral-400 font-medium pr-4">Item</th>
                          <th className="pb-3 text-neutral-400 font-medium pr-4">Dates</th>
                          <th className="pb-3 text-neutral-400 font-medium pr-4">Status</th>
                          <th className="pb-3 text-neutral-400 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/50">
                        {incomingRequests.map(r => (
                          <tr key={r.id} className="hover:bg-neutral-900/50 transition-colors">
                            <td className="py-3.5 pr-4 text-neutral-300">{r.renter_name}</td>
                            <td className="py-3.5 pr-4 text-neutral-300">{r.equipment_title}</td>
                            <td className="py-3.5 pr-4 text-neutral-300">{r.start_date} – {r.end_date}</td>
                            <td className="py-3.5 pr-4">
                              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${apiRequestStatusClasses(r.status)}`}>
                                {capitalizeStatus(r.status)}
                              </span>
                            </td>
                            <td className="py-3.5">
                              {r.status === 'pending' ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleRequestAction(r.id, 'confirmed')}
                                    className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRequestAction(r.id, 'cancelled')}
                                    className="bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-neutral-500 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

          </section>
        )}

      </div>
    </div>
  );
}
