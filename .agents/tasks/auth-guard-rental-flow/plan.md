# Implementation Plan: Auth Guard & Rental Flow

## Overview

Seven targeted changes across six files. Each item is independently verifiable and leaves the codebase in a buildable state.

---

- [ ] 1. Fix `ProtectedRoute.tsx` — redirect to `/signup` instead of `/signin`.

  The brief requires "Enforce Sign Up First": unauthenticated users must sign up before they can authenticate, so the guard should send them to `/signup`.

  **Files:** `src/components/ProtectedRoute.tsx`

  **Change:** Replace `navigate('/signin')` (or `<Navigate to="/signin" />`) with `<Navigate to="/signup" />`.

  **Verify:** `npm run build` completes without errors. Manually confirm that visiting `/dashboard` while logged out lands on `/signup`.

---

- [ ] 2. Protect `/list-item` route in `App.tsx`.

  The route is currently unprotected. Wrap it inside the same `<ProtectedRoute>` that wraps `/dashboard` so unauthenticated direct URL access is blocked.

  **Files:** `src/App.tsx`

  **Change:** Move the `/list-item` `<Route>` element inside the existing `<ProtectedRoute>` wrapper (alongside `/dashboard`).

  **Verify:** `npm run build` passes. Visiting `/list-item` while logged out redirects to `/signup`.

---

- [ ] 3. Add `handleOpenListItemModal` auth guard in `Layout.tsx` and pass it to `Navbar`.

  `Layout.tsx` already has a parallel `handleOpenRequestRentalModal` guard. Add the same pattern for the list-item action.

  **Files:** `src/components/Layout.tsx`

  **Changes:**
  - Add `handleOpenListItemModal`:
    ```ts
    const handleOpenListItemModal = () => {
      if (!auth.isAuthenticated) {
        auth.setIntendedPath('/list-item');
        navigate('/signup');
      } else {
        listItemModal.open(); // existing modal open call
      }
    };
    ```
  - Pass `handleOpenListItemModal` as `onOpenListItemModal` prop to `<Navbar>` instead of `listItemModal.open` directly.

  **Verify:** `npm run build` passes. Clicking "List Your Item" in the nav while logged out navigates to `/signup`. While logged in it opens the modal as before.

---

- [ ] 4. Guard the "List Your Item" buttons in `Navbar.tsx`.

  Both the desktop and mobile menu buttons currently call `onOpenListItemModal` (a prop). Since `Layout.tsx` will now supply the guarded handler (step 3), no logic changes are needed in the Navbar itself — only confirm the prop is wired correctly and no inline `navigate('/list-item')` calls exist. If any inline navigation exists, replace with the prop call.

  **Files:** `src/components/Navbar.tsx`

  **Change:** Verify (and fix if needed) that both desktop and mobile "List Your Item" buttons call `onOpenListItemModal()` — no direct `navigate` or `window.location` calls.

  **Verify:** `npm run build` passes. Same manual check as step 3.

---

- [ ] 5. Add auth guard to `CTABanner.tsx`.

  The CTA "List Your Item" button currently calls `navigate('/list-item')` directly, bypassing the auth check.

  **Files:** `src/components/CTABanner.tsx`

  **Changes:**
  - Import `useAuth` and `useNavigate` (if not already imported).
  - Replace the bare `navigate('/list-item')` with:
    ```ts
    if (!auth.isAuthenticated) {
      auth.setIntendedPath('/list-item');
      navigate('/signup');
    } else {
      navigate('/list-item');
    }
    ```

  **Verify:** `npm run build` passes. Clicking the CTA banner button while logged out redirects to `/signup`. While logged in it navigates to `/list-item`.

---

- [ ] 6. Replace `ListItemPage.tsx` placeholder with a full listing form.

  The page is currently a stub. It must provide the same fields as `ListItemModal` plus `neighborhood` and `condition`, pre-fill `ownerName` from `auth.user.name`, and persist via `addNewListing`.

  **Files:** `src/pages/ListItemPage.tsx`

  **Full replacement — form fields:**
  | Field | Type | Notes |
  |---|---|---|
  | `title` | text input | required |
  | `category` | select | `ALL_CATEGORIES` minus `'All'`, required |
  | `pricePerDay` | number input | required, min 1 |
  | `description` | textarea | optional |
  | `ownerName` | text input | pre-filled with `auth.user.name`, required |
  | `location` | text input | required |
  | `neighborhood` | text input | optional (page-only addition) |
  | `condition` | select (`New` / `Like New` / `Good` / `Fair`) | optional (page-only addition) |

  **On submit:**
  1. Build an `EquipmentListing` object (`id: Date.now().toString()`, `createdAt: new Date().toISOString()`).
  2. Call `addNewListing(listing)` from `useListings`.
  3. Show an inline success message.
  4. After 1 500 ms, navigate to `/dashboard?tab=equipment`.

  **Verify:** `npm run build` passes. Log in, visit `/list-item`, submit a valid form — item appears under My Equipment tab on `/dashboard`.

---

- [ ] 7. Harden `SignInPage.tsx` with form-level error display.

  `auth.login()` is a mock but may be extended to reject for unregistered emails. Wrap the call in try/catch and display a form-level error message if it throws.

  **Files:** `src/pages/SignInPage.tsx`

  **Changes:**
  - Add a `formError` state (`useState<string>('')`).
  - Wrap the `auth.login()` call:
    ```ts
    try {
      await auth.login(email, password);
    } catch (err) {
      setFormError('No account found with that email. Please sign up first.');
    }
    ```
  - Render `{formError && <p className="text-red-400 text-sm mt-2">{formError}</p>}` below the submit button.

  **Verify:** `npm run build` passes. Attempting to sign in with an unregistered email shows the error message without crashing.

---

## Dependency order

Items 1–5 are independent of each other and can be done in any order. Item 6 (ListItemPage form) depends on item 2 (route protection) being in place so the page is only reachable when authenticated. Item 7 is fully independent.
