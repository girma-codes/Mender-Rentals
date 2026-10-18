# Auth guard and rental request flow

The change wires authentication state into the rental request flow so that unauthenticated users are redirected to sign-up before they can open the request modal. `AuthContext` gains `pendingItemId` and `intendedPath` — in-memory state that tracks where to send the user after sign-up. `ItemDetailPage` grows a `useEffect` that auto-opens the modal once auth lands and the pending item is present. `SignUpPage` now accepts a phone field, validates it, and navigates to `intendedPath` after success. `RequestRentalModal` pre-fills name and phone from the authenticated user.

Watch for: **(confirmed)** the `useEffect` in `ItemDetailPage` omits `onOpenRequestRentalModal` and `listing` from its dependency array, making the effect's behavior unpredictable after ESLint exhaustive-deps is enforced; **(confirmed)** `Layout.handleOpenRequestRentalModal` sets `intendedPath` to `/marketplace` instead of the item's own path, so the redirect-back after sign-up lands on the listing grid rather than the item page, breaking the seamless re-entry flow; **(confirmed)** `pendingItemId` is pure in-memory state — a page refresh between the redirect and sign-up completion silently loses it, leaving the modal unable to auto-open.

**Verdict**: NEEDS_CHANGES

---

## High-level view

The auth guard is applied at two entry points: the `Request Rental` button inside `ItemDetailPage` and `handleOpenRequestRentalModal` in `Layout`, which is passed down to marketplace cards via outlet context. The two entry points are not consistent — `ItemDetailPage` correctly sets `intendedPath` to `` `/item/${listing.id}` ``, but `Layout` hardcodes it to `'/marketplace'`. After sign-up, marketplace-card users land on the listing grid rather than the item page, so the auto-open effect in `ItemDetailPage` never fires for that path.

`pendingItemId` and `intendedPath` live only in React context state and are lost on a page refresh. A user who clicks "Request Rental" on a slow connection, gets redirected to `/signup`, and refreshes will be sent to `/dashboard` after completing the form with no explanation and no modal.

The `useEffect` that auto-opens the modal lists only `auth.isAuthenticated` and `auth.pendingItemId` in its dependency array, omitting `listing` and `onOpenRequestRentalModal`. This works in the happy path because those values happen to be stable, but it produces React exhaustive-deps warnings and will silently misbehave if the component re-renders with a different outlet context.

`AuthContext.login` builds an `AuthUser` without a `phone` field, so users who arrived via `/signin` get an empty `renterPhone` pre-fill in the modal. The modal's `validateForm` only checks non-empty (not minimum length), so it lets a whitespace-only phone through. `SignUpPage` enforces `>= 9 chars`; these two validators are inconsistent.

<details>
<summary>Issues (5)</summary>

1. **Layout sets wrong intendedPath** — `handleOpenRequestRentalModal` in `Layout.tsx` hardcodes `auth.setIntendedPath('/marketplace')` instead of `'/item/${listing.id}'`. After sign-up, the user is returned to the marketplace grid rather than the item page, so the auto-open effect in `ItemDetailPage` never triggers. Fix: set `intendedPath` to `` `/item/${listing.id}` `` in the guard branch.

2. **pendingItemId not persisted across page reload** — `pendingItemId` lives in React context only. A browser refresh between the redirect and completing sign-up clears it silently. Fix: write `pendingItemId` to `sessionStorage` on set and hydrate it on `AuthContext` init, matching the pattern already used for the auth user in `localStorage`.

3. **useEffect missing dependencies** — `ItemDetailPage`'s `useEffect` array is `[auth.isAuthenticated, auth.pendingItemId]` but the effect body references `listing` and `onOpenRequestRentalModal`. Both are captured as stale closures. Fix: include all referenced identifiers in the dependency array, or refactor to read `pendingItemId` outside the effect and use a ref guard.

4. **renterPhone minimum-length not enforced in modal** — `validateForm` in `RequestRentalModal` only checks `!fields.renterPhone.trim()`. A user who signed in (not signed up) has no phone on their `AuthUser`, so the pre-fill is empty and a single space passes validation. Fix: add the same `>= 9 chars` check used in `SignUpPage`, and surface a specific error when the pre-filled phone is absent.

5. **Login flow has no phone, yet phone is expected at modal** — `AuthContext.login` builds an `AuthUser` without a `phone` field. Users who arrive via `/signin` get an empty `renterPhone` pre-fill. They are not blocked from submitting an empty phone by the current modal validation. Fix: either block direct sign-in when a pending item is active (guiding users to sign-up) or add phone collection to the sign-in post-auth step.

</details>

<details>
<summary>Details</summary>

### Layout guard sets the wrong return path

The guard in `Layout.handleOpenRequestRentalModal` (Layout.tsx line 22–23):

```typescript
auth.setPendingItemId(listing.id);
auth.setIntendedPath('/marketplace');
navigate('/signup');
```

Setting `intendedPath` to `/marketplace` means the post-sign-up redirect returns the user to the listing grid. The `useEffect` in `ItemDetailPage` that opens the modal only fires when the user is on the matching item's own route (`/item/<id>`) and `pendingItemId` equals `listing.id`. Since the user never lands on `/item/<id>`, the effect never fires and the modal never opens. The `ItemDetailPage` button gets this right — it sets `intendedPath` to `` `/item/${listing.id}` ``. The Layout guard is inconsistent with it.

### pendingItemId survives only until the next page refresh

`pendingItemId` is initialised with `useState<string | null>(null)` and is never written to `localStorage` or `sessionStorage`. `AuthProvider` wraps the router, so navigating to `/signup` preserves the context instance — normal navigation is safe. A full browser refresh resets both `pendingItemId` and `intendedPath` to `null`. On sign-up success, `auth.intendedPath ?? '/dashboard'` resolves to `/dashboard`, the user ends up on the wrong page, and the modal never opens with no indication to the user of what went wrong.

### useEffect dependency gap in ItemDetailPage

The effect:

```typescript
useEffect(() => {
  if (auth.isAuthenticated && listing && auth.pendingItemId === listing.id) {
    auth.setPendingItemId(null);
    onOpenRequestRentalModal(listing);
  }
}, [auth.isAuthenticated, auth.pendingItemId]);
```

`listing` and `onOpenRequestRentalModal` are referenced inside but excluded from the array. `listing` is derived from `useOutletContext` and changes if the URL param changes. `onOpenRequestRentalModal` is a `useCallback` from `Layout`, but its closure depends on `auth` and `rentalModal`. Under React Strict Mode's double-invocation, or if a parent re-renders with new outlet context, these stale captures can cause the effect to call `onOpenRequestRentalModal` with the wrong `listing` or miss the call entirely. Including them in the deps array is the correct fix; the effect will only fire when both conditions are freshly true.

### Phone validation asymmetry between signup and modal

`SignUpPage` enforces `phone.trim().length >= 9`. `validateForm` in `RequestRentalModal` only checks `!fields.renterPhone.trim()`, which passes a single non-whitespace character. `AuthContext.login` never sets `phone` on the constructed `AuthUser`, so `auth.user?.phone` evaluates to `undefined` for sign-in users, leaving the field empty. The pre-fill is correct only for the signup-then-redirect path.

### SignIn and pendingItemId cross-path interaction

If a user clicks "Request Rental" from a marketplace card, gets redirected to `/signup`, abandons it, and navigates to `/signin` instead, `pendingItemId` is still set in context. `SignInPage` reads `auth.intendedPath` after `auth.login` and navigates there. With the Layout guard bug fixed, that path becomes `/item/<id>`, and the auto-open effect fires on arrival — which is the intended behaviour. Without the fix, the user lands on `/marketplace` with a stale `pendingItemId` that will never be consumed. Nothing clears `pendingItemId` on a normal marketplace page view.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `src/context/AuthContext.tsx` | Added `pendingItemId`, `setPendingItemId`, `intendedPath`, `setIntendedPath` to context; updated `signup` signature to include `phone` |
| `src/pages/ItemDetailPage.tsx` | Added auth guard on "Request Rental" button; added auto-open `useEffect` for pending item on return from sign-up |
| `src/pages/SignUpPage.tsx` | Added phone field with validation; navigates to `intendedPath` or `/dashboard` after signup |
| `src/pages/SignInPage.tsx` | Navigates to `intendedPath` or `/dashboard` after login |
| `src/components/Layout.tsx` | Added auth guard to `handleOpenRequestRentalModal`; sets `pendingItemId` and `intendedPath` before redirecting to `/signup` |
| `src/components/modals/RequestRentalModal.tsx` | Pre-fills `renterName` and `renterPhone` from `auth.user`; added render guard returning `null` when unauthenticated |
| `src/types/index.ts` | Added optional `phone` field to `AuthUser` |
| `src/components/ProtectedRoute.tsx` | Sets `intendedPath` before redirecting unauthenticated users to `/signin` |

Full source: `d:\kiro project\po\mender-rentals-platform\src`

</details>
