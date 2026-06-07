# TODO - Subscription + Razorpay + Limits + Dark Mode

## Step 1: Razorpay upgrade failure fix
- [x] Update `backend/src/routes/billing.js` `/create-order` to return Razorpay `rzpKey` (RAZORPAY_KEY_ID).
- [x] Remove TEST MODE mock branch from `web-admin/src/pages/Billing.js` and always use real checkout.
- [x] Add clearer error handling around order creation + verification.


## Step 2: Trial (30 days) and expiry blocking
- [x] Verify initial `companies.subscription_status` for new registration is `TRIAL` and uses `trial_ends_at` correctly.
- [x] Adjust if any mismatch between registration/init and `subscriptionCheck`.

## Step 3: Employee limits by plan
- [x] Implement monthly plan employee cap = 50 in `backend/src/routes/employees.js` when adding employees.
- [x] Ensure yearly plan allows unlimited.
- [x] Update `web-admin/src/pages/Billing.js` plan feature list accordingly.

## Step 4: Dark mode color bug fix
- [x] Inspect `web-admin/src/components/ThemeToggle.js` and CSS variables in `web-admin/src/styles.css` / `styles-pro.css`.
- [x] Fix theme toggle so dark mode applies to all pages (including Billing).

## Step 5: Build + test + Vercel deploy readiness
- [x] Run backend + web-admin builds/tests.
- [x] Fix any build/runtime errors found.
- [x] Ensure Vercel env vars for Razorpay exist and app uses them.
- [x] Deploy to Vercel.
