# Rental request form and dashboard wired to live backend API

The frontend's rental submission flow and dashboard data have been migrated from localStorage mock data to live HTTP calls against the Node.js/Neon backend. A new `apiService.ts` centralises all authenticated fetch calls. `RequestRentalModal` now POSTs to `/api/rentals`, while `DashboardPage` fetches bookings, equipment, and incoming requests from three separate endpoints, replacing all static fixtures. The `Layout` passes the correct `equipmentId` prop down to the modal.

Watch for: **confirmed** — `apiPatch` approval/rejection reverts optimistically on failure, but the `actionError` message is only shown inside the "My Equipment" tab; if the user switches tabs between the optimistic update and the revert, the error banner is invisible. **confirmed** — the build log path did not exist; TypeScript spot-check ran clean (`tsc --noEmit` exit 0) as a substitute.

**Verdict**: APPROVED

---

## High-level view

`apiService.ts` is a thin, well-typed wrapper around `fetch`. All three verbs (`apiGet`, `apiPost`, `apiPatch`) read `VITE_API_URL` from the environment, attach `Authorization: Bearer <token>` from `mender_auth_token` only when a token is present, and reject with a structured `Error` carrying the server's `error` string when the response is not OK. TypeScript passes clean.

`RequestRentalModal` gains `equipmentId: string` as an explicit prop, uses it in the POST body, gates the submit button with `isSubmitting`, displays `apiError` inline below the action row, and keeps the old `addRentalRequest` import commented out rather than deleted. `Layout` passes `rentalModal.data.id` as `equipmentId`, typed `string` from `EquipmentListing.id`, so the prop contract is satisfied end-to-end.

`DashboardPage` replaces all three mock data blocks (bookings, equipment, incoming requests) with independent `useEffect` fetches, each with its own loading skeleton, error card with retry, empty state, and live data view. The optimistic approve/reject on incoming requests calls `apiPatch` and reverts on failure. One gap: `actionError` is driven by top-level state but rendered only inside the "My Equipment" tab, so a revert that fires while the user is on another tab surfaces a stale, contextless error banner on return.

The API response shapes (`ApiBooking`, `ApiIncomingRequest`, `ApiEquipmentItem`) are local interfaces with snake_case field names matching the backend. The `status` union is narrow and the badge-colour maps are keyed on it — an unexpected status value silently falls back to `undefined` styling rather than a visible error.

---

<details>
<summary>Issues (2)</summary>

1. **actionError visibility gap** — `actionError` state lives at the component top level but is rendered only inside the "My Equipment" tab. An optimistic revert that completes while the user is on a different tab will set the error silently; when the user returns to "My Equipment" the stale error is displayed with no context. Clear `actionError` on tab switch, or move the banner to a toast/global notification layer.

2. **No build log provided** — the build log path (`.agents/tasks/api-wiring/build-log.txt`) did not exist. A TypeScript spot-check (`tsc --noEmit`, exit 0) was run as a substitute and passed clean, but this is not a full Vite build. If the build pipeline generates the log, it should be present before the review step runs.

</details>

---

<details>
<summary>Details</summary>

### Optimistic approve/reject with stale `actionError`

`handleRequestAction` applies the new status to `incomingRequests` immediately, then fires `apiPatch`. On a caught error it reverts the entry back to `'pending'` and sets `actionError`. The revert logic itself is correct. The gap is that `actionError` is rendered above the incoming-requests sub-section inside the "My Equipment" tab panel but is not cleared when the user navigates away via `switchTab`. A stale error from a previous failed action will reappear the next time the user enters "My Equipment". Clearing `actionError` inside `switchTab` or on any re-fetch would close this.

### Silent badge fallback on unexpected `status`

`apiBookingStatusClasses` and `apiRequestStatusClasses` are `Record<status-union, string>` lookups. TypeScript enforces that callers pass only the declared union members, so at compile time this is exhaustive. At runtime, if the backend ever returns an undeclared status string, the map lookup returns `undefined` and the badge renders with no colour classes — invisible text on a dark background rather than a visible fallback. Adding a `default` branch or a `?? ''` guard would make the degradation visible.

</details>

---

<details>
<summary>File map</summary>

| File | Change |
|---|---|
| `src/services/apiService.ts` | New file — `apiGet`, `apiPost`, `apiPatch` with auth headers and typed error parsing |
| `src/components/modals/RequestRentalModal.tsx` | Added `equipmentId` prop, wired `apiPost`, added `isSubmitting`/`apiError` states |
| `src/components/Layout.tsx` | Passes `equipmentId={rentalModal.data.id}` to `RequestRentalModal` |
| `src/pages/DashboardPage.tsx` | Replaced all three mock data blocks with live `apiGet` fetches; full loading/error/empty/data state per domain; optimistic approve/reject via `apiPatch` |

Full diff: `git diff main -- src/services/apiService.ts src/components/modals/RequestRentalModal.tsx src/components/Layout.tsx src/pages/DashboardPage.tsx`

</details>
