# Implementation Plan — Post-Auth Routing & Dashboard

## Summary of Decisions

- **Option A for Router placement**: Move `<BrowserRouter>` from `App.tsx` to `main.tsx` so `AuthProvider` (which uses `useNavigate` for logout) can sit inside the Router but outside `App`. This is the simplest pattern and avoids any inner-wrapper gymnastics.
- **Auth state in context, not URL**: Auth state lives in React context + localStorage (`mender_auth_user`). No extra libraries needed.
- **Mock login only**: `login()` delays 500 ms with `setTimeout` wrapped in a Promise; no network call. Hardcoded user `{ id:'1', name:'Amina Kebede', email: <provided>, avatarInitials: 'AK' }`.
- **Dashboard tabs via `useSearchParams`**: `?tab=bookings` (default) / `?tab=equipment`. This keeps deep links working across refreshes.
- **Status badge colours**: reuse the inline Tailwind pattern already used by Badge.tsx; no new component needed.
- **No new npm packages**: everything uses lucide-react (already installed), react-router-dom v7, and Tailwind.

---

## Implementation Order

- [ ] 1. **Extend `src/types/index.ts`** — add `Booking`, `EquipmentItem`, `IncomingRequest` interfaces and `AuthUser` interface.
  
  Add to the end of the file:
  ```ts
  export interface AuthUser {
    id: string;
    name: string;
    email: string;
    avatarInitials: string;
  }

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
  ```
  
  Files: `src/types/index.ts`  
  Verify: `npx tsc -b --noEmit` passes (no new type errors).

---

- [ ] 2. **Create `src/context/AuthContext.tsx`** — React context + provider + `useAuth` hook.

  Key implementation notes:
  - `AuthContextValue` type: `{ user: AuthUser | null; isAuthenticated: boolean; login: (email: string, password: string) => Promise<void>; logout: () => void; intendedPath: string | null; setIntendedPath: (path: string | null) => void; }`
  - On mount, hydrate from `localStorage.getItem('mender_auth_user')` — parse safely inside `try/catch`, cast to `AuthUser`.
  - `login()` returns `new Promise<void>(resolve => setTimeout(() => { setUser({...}); resolve(); }, 500))` — set user in state AND save to `localStorage.setItem('mender_auth_user', JSON.stringify(user))`.
  - `logout()` clears user state, removes `localStorage.getItem('mender_auth_user')`, then calls `navigate('/')`. Because `AuthProvider` is inside `<BrowserRouter>` (step 4), `useNavigate()` is safe here.
  - `useAuth()` throws a descriptive error if called outside `AuthProvider` (guards against accidental misuse in TypeScript strict mode).
  - Export: `AuthProvider` (default export not needed — named export is fine), `useAuth`.

  **TypeScript pitfalls**:
  - `createContext` needs a non-undefined default or you must use `createContext<AuthContextValue | null>(null)` and narrow in `useAuth`.
  - `noUnusedLocals` is on — don't import anything you don't use.
  - localStorage `JSON.parse` may return `unknown` — cast via `as AuthUser` after validating shape, or use a simple type guard.

  Files: `src/context/AuthContext.tsx` (new)  
  Verify: `npx tsc -b --noEmit` passes.

---

- [ ] 3. **Create `src/components/ProtectedRoute.tsx`** — redirect unauthenticated users to `/signin`.

  ```tsx
  import { Navigate, Outlet, useLocation } from 'react-router-dom';
  import { useAuth } from '@/context/AuthContext';

  export function ProtectedRoute() {
    const auth = useAuth();
    const location = useLocation();

    if (!auth.isAuthenticated) {
      auth.setIntendedPath(location.pathname);
      return <Navigate to="/signin" replace />;
    }

    return <Outlet />;
  }
  ```

  Files: `src/components/ProtectedRoute.tsx` (new)  
  Verify: `npx tsc -b --noEmit` passes.

---

- [ ] 4. **Update `src/main.tsx`** — move `BrowserRouter` here and add `AuthProvider`.

  Replace the current render call with:
  ```tsx
  import { StrictMode } from 'react'
  import { createRoot } from 'react-dom/client'
  import { BrowserRouter } from 'react-router-dom'
  import { AuthProvider } from '@/context/AuthContext'
  import './index.css'
  import App from './App.tsx'

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  )
  ```

  Files: `src/main.tsx`  
  Verify: `npx tsc -b --noEmit` passes.

---

- [ ] 5. **Update `src/App.tsx`** — remove `BrowserRouter`, add `DashboardPage` route wrapped in `ProtectedRoute`.

  - Remove `BrowserRouter` import and wrapper (Router is now in main.tsx).
  - Import `ProtectedRoute` from `@/components/ProtectedRoute`.
  - Import `DashboardPage` from `@/pages/DashboardPage`.
  - Final route tree:
    ```tsx
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="item/:id" element={<ItemDetailPage />} />
        <Route path="how-it-works" element={<HowItWorksPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="list-item" element={<ListItemPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
        </Route>
      </Route>
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPlaceholder />} />
    </Routes>
    ```
  - Keep `SignUpPlaceholder` inline component exactly as-is.

  **TypeScript pitfall**: `noUnusedLocals` — remove the `Link` import if it's only used by `SignUpPlaceholder` (it still is, so keep it). Remove `BrowserRouter` import.

  Files: `src/App.tsx`  
  Verify: `npx tsc -b --noEmit` passes.

---

- [ ] 6. **Update `src/pages/SignInPage.tsx`** — wire up `useAuth` for smart redirect + loading state.

  Changes:
  - Import `useAuth` from `@/context/AuthContext`.
  - Add `const [isLoading, setIsLoading] = useState(false)` local state.
  - In `handleSubmit`, after validation passes:
    ```ts
    setIsLoading(true);
    try {
      await auth.login(email, password);
      const destination = auth.intendedPath ?? '/dashboard';
      auth.setIntendedPath(null);
      navigate(destination);
    } finally {
      setIsLoading(false);
    }
    ```
  - Mark `handleSubmit` as `async`.
  - Disable the submit button and show spinner text while `isLoading`:
    ```tsx
    <button
      type="submit"
      disabled={isLoading}
      className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-xl transition-colors duration-200 shadow-sm text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Signing in…' : 'Sign In'}
    </button>
    ```
  - Remove the old `navigate('/marketplace')` call.

  Files: `src/pages/SignInPage.tsx`  
  Verify: `npx tsc -b --noEmit` passes.

---

- [ ] 7. **Update `src/components/Navbar.tsx`** — add authenticated profile dropdown.

  Changes:
  - Import `useAuth` from `@/context/AuthContext`.
  - Import `useRef`, `useEffect` from react (already imports `useState`).
  - Add `const [dropdownOpen, setDropdownOpen] = useState(false)` and a `const dropdownRef = useRef<HTMLDivElement>(null)`.
  - `useEffect` to close dropdown on outside click:
    ```ts
    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setDropdownOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    ```
  - In desktop actions section: conditionally render Sign In link OR the dropdown:
    ```tsx
    {auth.isAuthenticated && auth.user ? (
      <div className="relative" ref={dropdownRef}>
        {/* Trigger */}
        <button
          onClick={() => setDropdownOpen(o => !o)}
          className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-neutral-800 transition-colors"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs">
            {auth.user.avatarInitials}
          </span>
          <span className="text-sm text-white">{auth.user.name.split(' ')[0]}</span>
          {/* chevron-down SVG inline */}
          <svg className="h-3.5 w-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {/* Dropdown menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl z-50">
            <div className="p-3">
              <p className="text-sm text-white font-medium">{auth.user.name}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{auth.user.email}</p>
            </div>
            <div className="border-t border-neutral-800" />
            <div className="p-1">
              <Link to="/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">Dashboard</Link>
              <Link to="/dashboard?tab=bookings" onClick={() => setDropdownOpen(false)} className="flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">My Rentals</Link>
              <Link to="/dashboard?tab=equipment" onClick={() => setDropdownOpen(false)} className="flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">My Listings</Link>
            </div>
            <div className="border-t border-neutral-800" />
            <div className="p-1">
              <button onClick={() => { auth.logout(); setDropdownOpen(false); }} className="w-full text-left flex items-center px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-neutral-800 rounded-lg transition-colors">Logout</button>
            </div>
          </div>
        )}
      </div>
    ) : (
      <Link to="/signin" className="text-sm text-neutral-400 hover:text-white transition-colors duration-200">Sign In</Link>
    )}
    ```
  - In mobile menu section: apply the same conditional logic — show avatar + name + dropdown links inline (no nested dropdown; just list the menu items directly when authenticated, or show the Sign In link when not).
  - **TypeScript pitfall**: `noUnusedParameters` — the `onOpenListItemModal` prop is still used (by the "List Your Item" button). Don't remove it.

  Files: `src/components/Navbar.tsx`  
  Verify: `npx tsc -b --noEmit` passes.

---

- [ ] 8. **Create `src/pages/DashboardPage.tsx`** — full dark-themed dashboard.

  Structure:
  ```
  DashboardPage
  ├── Page header (welcome message + avatar)
  ├── Stats row (3 cards)
  ├── Tab switcher (pill tabs, synced with useSearchParams)
  └── Tab content
      ├── My Bookings tab: responsive card list (mobile) / table (md+)
      └── My Equipment tab
          ├── Listed items (cards)
          └── Incoming requests (table with Approve/Reject)
  ```

  Mock data (inline at top of file, typed):
  ```ts
  const MOCK_BOOKINGS: Booking[] = [
    { id: 'b1', itemName: 'Large Wedding Tent', lenderName: 'Abebe Girma', startDate: '2025-08-10', endDate: '2025-08-12', totalCost: 5000, status: 'Pending', neighborhood: 'Bole', city: 'Addis Ababa' },
    { id: 'b2', itemName: 'PA Sound System', lenderName: 'Solomon Bekele', startDate: '2025-08-15', endDate: '2025-08-15', totalCost: 1800, status: 'Confirmed', neighborhood: 'Tana Sub-city', city: 'Bahir Dar' },
    { id: 'b3', itemName: 'LED Lighting Kit', lenderName: 'Dawit Alemu', startDate: '2025-07-20', endDate: '2025-07-21', totalCost: 2400, status: 'Completed', neighborhood: 'Kezira', city: 'Dire Dawa' },
    { id: 'b4', itemName: 'Catering Buffet Set', lenderName: 'Meron Tadesse', startDate: '2025-07-01', endDate: '2025-07-02', totalCost: 1800, status: 'Cancelled', neighborhood: 'Kazanchis', city: 'Addis Ababa' },
    { id: 'b5', itemName: 'Folding Chairs (50)', lenderName: 'Tigist Haile', startDate: '2025-09-01', endDate: '2025-09-03', totalCost: 900, status: 'Pending', neighborhood: 'Tabor', city: 'Hawassa' },
  ];

  const MOCK_EQUIPMENT: EquipmentItem[] = [
    { id: 'e1', name: 'Canopy Gazebo 3×3', pricePerDay: 800, status: 'Active', views: 42 },
    { id: 'e2', name: 'Cocktail Tables (8)', pricePerDay: 480, status: 'Inactive', views: 18 },
    { id: 'e3', name: 'Portable Generator 5KVA', pricePerDay: 1500, status: 'Active', views: 67 },
  ];

  const INITIAL_REQUESTS: IncomingRequest[] = [
    { id: 'r1', renterName: 'Yonas Tesfaye', itemName: 'Canopy Gazebo 3×3', startDate: '2025-08-20', endDate: '2025-08-22', requestStatus: 'Pending' },
    { id: 'r2', renterName: 'Hiwot Mulat', itemName: 'Portable Generator 5KVA', startDate: '2025-08-25', endDate: '2025-08-25', requestStatus: 'Pending' },
    { id: 'r3', renterName: 'Kaleab Desta', itemName: 'Canopy Gazebo 3×3', startDate: '2025-09-05', endDate: '2025-09-07', requestStatus: 'Pending' },
    { id: 'r4', renterName: 'Selam Girma', itemName: 'Portable Generator 5KVA', startDate: '2025-09-10', endDate: '2025-09-10', requestStatus: 'Pending' },
  ];
  ```

  State:
  ```ts
  const [requests, setRequests] = useState<IncomingRequest[]>(INITIAL_REQUESTS);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'bookings';
  ```

  Tab switch handler:
  ```ts
  function switchTab(tab: string) {
    setSearchParams({ tab });
  }
  ```

  Approve/Reject handler:
  ```ts
  function handleRequestAction(id: string, action: 'Approved' | 'Rejected') {
    setRequests(prev =>
      prev.map(r => r.id === id ? { ...r, requestStatus: action } : r)
    );
  }
  ```

  Status badge helper (returns Tailwind classes string based on status):
  ```ts
  function bookingStatusClasses(status: Booking['status']): string {
    const map: Record<Booking['status'], string> = {
      Pending: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
      Confirmed: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
      Completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      Cancelled: 'bg-red-500/15 text-red-400 border border-red-500/30',
    };
    return map[status];
  }
  ```

  Stats derived from mock data:
  - Total Bookings: `MOCK_BOOKINGS.length`
  - Active Listings: `MOCK_EQUIPMENT.filter(e => e.status === 'Active').length`
  - Pending Requests: `requests.filter(r => r.requestStatus === 'Pending').length`

  Layout classes:
  - Page bg: `bg-neutral-950 min-h-screen`
  - Stat cards: `bg-neutral-900 border border-neutral-800 rounded-xl p-5`
  - Tab active pill: `bg-emerald-500/15 text-emerald-400 border border-emerald-500/30`
  - Tab inactive pill: `text-neutral-400 hover:text-white`
  - Table: `w-full text-left text-sm`, `overflow-x-auto` wrapper on mobile
  - Mobile booking card: `bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2`

  **TypeScript pitfalls**:
  - Import `useAuth` and destructure `user` — guard with `if (!user) return null` or render fallback, to satisfy strict null checks.
  - `useSearchParams` returns `[URLSearchParams, SetURLSearchParams]` — type correctly.
  - `MOCK_BOOKINGS` must be typed as `Booking[]` (not inferred) or TS will widen the string literals for `status`.

  Files: `src/pages/DashboardPage.tsx` (new)  
  Verify: `npx tsc -b --noEmit` passes; `npm run build` succeeds with no type errors.

---

## File Change Summary

| File | Action |
|---|---|
| `src/types/index.ts` | Modify — add 4 interfaces |
| `src/context/AuthContext.tsx` | Create — context, provider, hook |
| `src/components/ProtectedRoute.tsx` | Create — redirect guard |
| `src/main.tsx` | Modify — add BrowserRouter + AuthProvider |
| `src/App.tsx` | Modify — remove BrowserRouter, add /dashboard route |
| `src/pages/SignInPage.tsx` | Modify — useAuth + smart redirect + loading state |
| `src/components/Navbar.tsx` | Modify — authenticated dropdown |
| `src/pages/DashboardPage.tsx` | Create — full dashboard UI |

## Build & Verify Commands

```bash
# Type-check only (fast, after each step)
npx tsc -b --noEmit

# Full production build (final verification)
npm run build
```

No test framework exists in this project — verification is type-check + build.

## TypeScript Pitfall Summary

1. **`useNavigate` inside context**: Safe only because `AuthProvider` sits inside `<BrowserRouter>` (in main.tsx). Do NOT call `useNavigate` at module level or before the component mounts.
2. **`createContext` default**: Use `createContext<AuthContextValue | null>(null)` and narrow in `useAuth` with `if (!ctx) throw new Error(...)`.
3. **localStorage hydration**: Wrap `JSON.parse` in try/catch; the parsed value is `unknown` — cast carefully or validate shape before setting state.
4. **`noUnusedLocals`**: Every import must be used. Double-check after removing `BrowserRouter` from App.tsx.
5. **`noUnusedParameters`**: `onOpenListItemModal` prop in Navbar must remain (still used by "List Your Item" button).
6. **Status literal widening**: Type `MOCK_BOOKINGS` as `Booking[]` explicitly so status strings are narrow (`'Pending'` not `string`).
7. **`useSearchParams` setter**: The setter is `Dispatch<SetStateAction<...>>` — don't type it as plain function; use the destructured type or `ReturnType<typeof useSearchParams>[1]`.
