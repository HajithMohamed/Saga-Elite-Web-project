# Saga Elite — Implementation & Verification Report

_Scope: the 7-task hardening pass (theme system, authentication, route protection, redirections, admin accounts, password fields, end-to-end verification), including guest-user flows._

This document contains the four requested deliverables:

1. [Root Cause Report](#1-root-cause-report)
2. [Testing Report](#2-testing-report)
3. [Theme Verification Report](#3-theme-verification-report)
4. [Final Regression Test](#4-final-regression-test)

Convention notes: backend is CommonJS with `catchAsync`/`AppError`; frontend is ESM (React 19 + Vite) using the shared `axiosInstance`. Only changed lines were held to lint standards (the Client-Side ESLint baseline is pre-existing dirty). Local dev shares the production Atlas `sagaelite` database — all test accounts created during verification were deleted afterward.

---

## 1. Root Cause Report

### RC-1 — Admin intermittently sees "User not authenticated" while logged in  _(fixed)_

- **Symptom:** A logged-in admin is unexpectedly treated as unauthenticated after an ordinary action.
- **Root cause:** The `axiosInstance` response interceptor cleared `localStorage.authToken` on **every** `401` response. Several endpoints legitimately return `401` for business-logic reasons unrelated to session validity (e.g. the change-password controller returned `401` for a wrong *current* password). Any such incidental `401` wiped the still-valid token, so the *next* request went out unauthenticated — producing the intermittent "User not authenticated".
- **Fix:**
  - `Client-Side/src/api/axiosInstance.js` — the token is now cleared **only** when the `401` message matches a session-invalid signal (`not authenticated`, `session`, `no longer exists`, `invalid or expired`, `log in`, `login first`). Business-logic 401s no longer log the user out.
  - `Server-side/Controllers/auth-controller.js` — "Current password is incorrect" changed from `401` to `400` (it is input validation, not a session failure), so it can never be mistaken for a session error even by message.

### RC-2 — Newly created / seeded admins could not log in  _(fixed)_

- **Symptom:** An admin created by the seed script authenticates with correct credentials but login fails / the account appears not to exist.
- **Root cause:** `Server-side/scripts/seed-demo-admins.js` connected with a bare `mongoose.connect(uri)`. The Mongo URI carries **no database name**, so Mongoose silently used the default `test` database, while the running server reads from `sagaelite` (appended by `DataBase/db.js`). The admins were written to a database the app never reads.
- **Fix:** the seed script now calls the app's own `connectToDB()` connector, which appends `/sagaelite` consistently. Re-seeding then created the admins in the correct database and login succeeded (`status: success, role: super_admin`).

### RC-3 — Light-mode theme leaked dark styling  _(fixed)_

- **Symptom:** Toggling to light mode left many `dark:` Tailwind variants active, so components rendered with dark backgrounds/text.
- **Root cause:** `App.jsx` had a `prefers-color-scheme` effect that toggled the `dark` class on `<html>` independently of the new `ThemeProvider`. The two fought: `ThemeProvider` set `light`, the OS effect re-asserted `dark`, and `dark:` utilities stayed on.
- **Fix:** removed the OS-preference effect; `ThemeProvider` is now the single owner of both the `light` and `dark` classes (mutually exclusive), backed by `localStorage` and a pre-paint script in `index.html` to prevent flash-of-wrong-theme.

### RC-4 — OAuth admin guard did not cover all admin roles  _(fixed this pass)_

- **Symptom (latent security gap):** Google/Facebook sign-in blocked only `role === "admin"` and `role === "superadmin"`. The platform's real admin roles are `admin`, `super_admin` (underscore) and `sub_admin`. A `super_admin` or `sub_admin` whose email matched an OAuth identity could have signed in through the social path and received an admin-scoped token — **bypassing the email 2FA gate** that password login enforces for admins.
- **Fix:** both `Server-side/Controllers/google-auth-controller.js` and `facebook-auth-controller.js` now use the centralized `isAdminRole()` helper from `Utils/admin-roles.js`, which covers all four role strings. Verified: `isAdminRole` → `customer:false, admin:true, super_admin:true, sub_admin:true`.

### Known findings (documented, not changed — behavior/UX tradeoffs)

- **F-1 — Email enumeration on password reset.** `forgot-password` (and change/verify flows) return `404 "User not found"` for an unknown email. This discloses whether an address is registered. It is **consistent across the whole codebase** and the frontend surfaces it as helpful UX ("no account — register instead"). Left as-is to avoid a UX regression; flagged as a low-severity information-disclosure item to revisit if a security review requires non-committal responses.
- **F-2 — No refresh token (by design).** Auth uses a single `7d` JWT (Bearer header or `token` cookie). There is no refresh-token rotation; expiry forces re-login. `axiosInstance` auto-clears the token and redirects on a session-invalid `401`.
- **F-3 — No account lockout.** Brute-force is mitigated by `authLimiter` rate limiting on login / verify-2fa / resend rather than a per-account lockout counter. Accepted, backed by the limiter.

---

## 2. Testing Report

Legend: **PASS** = verified working · **PASS (design)** = works as intentionally designed · **N/T (creds)** = code-path audited but a live click-through needs real third-party credentials.

### Authentication — Registration

| Workflow | Result | Notes |
|---|---|---|
| Register with valid name/email/password | PASS | Returns `success`, `isVerified:false`, sends OTP |
| Duplicate email (verified account) | PASS | Rejected with duplicate message |
| Re-register an **unverified** email | PASS | Returns `201` and re-issues OTP (no hard duplicate error) |
| Password / confirm-password mismatch | PASS | `400` validation error |
| Duplicate phone number | PASS | "This phone number is already linked to another account." |
| OTP generation / verify / expiry / resend | PASS | Verify flow issues token on success; expired/invalid rejected |

### Authentication — Login

| Workflow | Result | Notes |
|---|---|---|
| Correct credentials (customer) | PASS | Token issued, user state populated |
| Wrong password | PASS | "Incorrect email or password" (no field leak) |
| Wrong / unknown email | PASS | Same generic message (no user-enumeration on login) |
| Unverified account | PASS | Blocked with verify prompt |
| Deactivated account | PASS | `403` deactivated message |
| Admin login with 2FA enabled | PASS | Login returns `two_factor_required`; AuthForms drawer shows OTP step; wrong OTP rejected; correct OTP → dashboard |
| JWT / cookie issuance | PASS | Bearer + `token` cookie; `7d` expiry |
| Auto-logout on session-invalid 401 | PASS | Token cleared + redirect; **business 401s no longer log out (RC-1)** |

### Authentication — Recovery & change password

| Workflow | Result | Notes |
|---|---|---|
| Forgot password (known email) | PASS | `200` "Reset code sent to your email" |
| Forgot password (unknown email) | PASS (design) | `404` — see finding **F-1** |
| Verify reset OTP / expiry / invalid | PASS | Invalid or expired OTP rejected |
| Reset to new password | PASS | Password updated, can log in with new password |
| Change password (correct current) | PASS | Updated; **wrong current now returns `400` not `401` (RC-1)** |

### Authentication — Social (OAuth)

| Workflow | Result | Notes |
|---|---|---|
| Google: token verified via userinfo + `email_verified` check | PASS (audit) | Rejects unverified Google email |
| Google: existing customer → sign-in / new → create + welcome mail | PASS (audit) | `200` / `201` via `createSendToken` |
| Facebook: `debug_token` app-id check (anti token-substitution) | PASS (audit) | Rejects tokens minted for another app |
| Facebook: missing-email rejection | PASS (audit) | Clear guidance to use email signup |
| Admin roles blocked from OAuth | PASS (fixed) | Now covers all admin roles via `isAdminRole` (RC-4) |
| Live end-to-end OAuth click-through | N/T (creds) | Requires real Google/Facebook credentials |

### Route protection (Task 3) & redirections (Task 4)

| Workflow | Result | Notes |
|---|---|---|
| Guest → `/shopping/account` / `orders` / `wishlist` / `rewards` | PASS | Redirected to `/` |
| Guest → `/admin/*` | PASS | Redirected out (`CheckAuth`) |
| Guest → cart / checkout | PASS (design) | **Intentionally allowed** (guest checkout is a product feature) |
| Authenticated user → `/auth/login` or `/register` | PASS | Bounced to `/shopping/home` (customer) or `/admin/dashboard` (admin) |
| Customer → `/admin/*` | PASS | Redirected to `/un-auth-page` (renders, has escape link) |
| Admin → shopping routes | PASS | Redirected to `/admin/dashboard` |
| Admin missing a permission | PASS | `PermissionGuard` renders in-page AccessDenied (not blank) |
| Unknown route | PASS | `*` → NotFound page renders with navigation |
| Registration → verify → login → dashboard | PASS | No dead ends |
| Forgot → OTP → reset → login | PASS | Full loop completes |
| Logout → home | PASS | Cookie + localStorage cleared |

### Admin accounts (Task 5)

| Workflow | Result | Notes |
|---|---|---|
| Seed demo admins (all roles) | PASS | **Now write to `sagaelite` (RC-2)** |
| Newly created admin can log in | PASS | `role: super_admin` confirmed post-fix |
| Password hashing | PASS | bcrypt cost 12 pre-save hook (`User.js`) |
| Role/permission presets | PASS | Centralized in `Utils/admin-roles.js`; super admin bypasses checks |

### Password field UX (Task 6)

| Field | Result | Notes |
|---|---|---|
| Login / Register / Set-new-password | PASS | `LuxuryInput` reveal toggle (Eye/EyeOff) |
| Change password (Security page) | PASS | `PasswordInput` on all 3 fields + `autoComplete` |
| Admin: Create Admin modal | PASS | Reveal toggle wired to `showPassword` |
| Keyboard / accessible | PASS | Focusable button, `aria` label, type flip verified |

### Guest user (explicitly requested)

| Workflow | Result | Notes |
|---|---|---|
| Browse home / products / PDP / offers / drops as guest | PASS | Public routes open |
| Guest add-to-cart / cart persistence | PASS (design) | Guest cart tracked; guest checkout allowed |
| Guest checkout with saved-address & zone delivery | PASS | Guest address API + zone fee resolution |
| Guest blocked from account/orders/wishlist | PASS | Redirected to `/` |

---

## 3. Theme Verification Report

### Architecture

- **Tokens.** `tailwind.config.js` colors are `rgb(var(--th-x) / <alpha-value>)` channel triplets. `darkMode: ["class"]`.
- **Two themes.** `index.css` defines `:root` (dark, default) `--th-*` triplets and `:root.light` overrides. Legacy `--se-*` variables retained for both.
- **Provider.** `ThemeProvider` (`context/theme-context.jsx`) reads/writes `localStorage['saga-theme']` and toggles mutually-exclusive `light`/`dark` classes on `<html>`. Pre-paint script in `index.html` prevents FOUC.
- **Toggles.** Sun/Moon toggle in the public `MainHeader` and the admin `Header`.
- **Migration.** A scripted pass converted ~6,213 color utilities across ~174 files. Cinematic/overlay components (hero/landing pieces) were intentionally excluded to preserve their fixed art direction. **Dark mode is byte-identical to before; light mode was derived for correct contrast.**
- **Named-color safety net.** A `:root.light` override block remaps untokenized named Tailwind utilities (grays + pastel status pills like emerald/rose/amber/sky/indigo `-100/-200/-300`) to `~700`-weight equivalents so status chips stay legible on light backgrounds. `:root.light .utility` (specificity 0,2,0) reliably beats single-class utilities.

### Persistence

| Scenario | Result |
|---|---|
| Choice survives page refresh | PASS |
| Choice survives logout / login | PASS (localStorage, not tied to session) |
| Choice survives browser restart | PASS |
| No flash of wrong theme on load | PASS (pre-paint script) |

### Coverage & contrast

Verification was done by DOM inspection and an automated WCAG contrast scan via `preview_eval` (more reliable than screenshots in this harness, and more accurate for color values). After remediation, the contrast scan reported **0 low-contrast elements** on the pages checked.

| Area | Light | Dark | Notes |
|---|---|---|---|
| Home | PASS | PASS | Excludes cinematic hero (by design) |
| Product listing / PDP / Offers / Drops / Categories | PASS | PASS | Cards, badges, prices, filters |
| Auth drawer / forms | PASS | PASS | Inputs, reveal toggles, buttons |
| Cart / Checkout | PASS | PASS | Summary, zone box, inputs |
| Legal (Privacy/Terms/Refund) / About / Contact | PASS | PASS | Sanitized policy HTML readable |
| User dashboard (account, orders, wishlist, security) | PASS | PASS | Tables, forms |
| Admin: sidebar, header, tables, forms, modals, pagination, notifications | PASS | PASS | Order modal, drawers |
| Admin: charts / rich-text editor | PASS | PASS | Chart surfaces + toolbar legible |

_Method note: `transition-colors` can cause a scanner to read mid-transition colors (produced one false positive that resolved to the correct settled value); final readings taken after transitions settle._

---

## 4. Final Regression Test

### Automated gates

| Gate | Result |
|---|---|
| Frontend production build (`npm run build`) | **PASS** — `✓ built in ~50s`, exit 0 |
| Backend controllers load (`require` google/facebook auth) | **PASS** — exports present, no throw |
| `isAdminRole` guard behavior | **PASS** — customer:false / admin,super_admin,sub_admin:true |
| Backend boot (server wiring) | **PASS** — runs on :5001, health responsive |

> Backend ESLint is not a usable gate (no ESLint 9 flat config present in `Server-side/`); the two changed controllers are trivial (import + swap an inline check for the centralized helper) and were validated by successful `require` + the guard test above. Frontend build is clean.

### Files changed (this hardening pass, across both sessions)

**Backend**
- `Controllers/auth-controller.js` — wrong current-password `401` → `400` (RC-1)
- `Controllers/google-auth-controller.js` — `isAdminRole` guard (RC-4)
- `Controllers/facebook-auth-controller.js` — `isAdminRole` guard (RC-4)
- `scripts/seed-demo-admins.js` — use `connectToDB()` so admins land in `sagaelite` (RC-2)

**Frontend — auth**
- `api/axiosInstance.js` — clear token only on session-invalid 401s (RC-1)
- `components/auth-components/AuthForms.jsx` — 2FA / must-change-password branches in the live drawer
- `components/auth-components/LuxuryInput.jsx` — password reveal toggle
- `components/common-components/PasswordInput.jsx` *(new)* — reveal-capable input
- `pages/shopping-view/account/Security.jsx` — reveal toggles on change-password
- `pages/admin-view/CreateAdminModal.jsx` — reveal toggle

**Frontend — theme**
- `tailwind.config.js`, `src/index.css` — token infrastructure + light overrides
- `context/theme-context.jsx` *(new)*, `components/common-components/ThemeToggle.jsx` *(new)*
- `main.jsx`, `index.html`, `App.jsx` (removed OS-preference effect)
- `components/admin-components/Header.jsx`, `components/common-components/MainHeader.jsx` — toggles
- ~174 component files — scripted color-token migration (dark byte-identical)

### Cleanup performed

- Deleted verification test user `themetest.1783080145@example.com` (id `6a47a4d2cbe9a334583e9814`) and its customer record from the shared production `sagaelite` database. Post-delete count of `themetest*` users: **0**.

### Residual / recommendations

- **F-1** password-reset email enumeration — revisit if a formal security review requires non-committal reset responses.
- Consider adding an ESLint flat config to `Server-side/` so backend changes have a real lint gate.
- Live OAuth end-to-end (Google/Facebook) should be exercised once with real credentials in a staging environment; the code paths are audited and the admin-role bypass is closed.

### Verdict

All in-scope workflows pass or pass-by-design. The four root-cause defects (admin false logout, seeded-admin DB mismatch, light-mode dark leak, OAuth admin-role bypass) are fixed and verified. Build is green; no regressions observed. Deployment remains under user control — no pushes were made.
