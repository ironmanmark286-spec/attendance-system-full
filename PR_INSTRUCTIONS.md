# PR_INSTRUCTIONS (Razorpay Fix)

## Current commit pushed
- Branch: `main`
- Commit: `30a93b4`

## Note about `gh`
GitHub CLI (`gh`) is not installed in this environment, so PR creation must be done via GitHub web UI.

## Create PR (web UI)
1. Open: https://github.com/ironmanmark286-spec/attendance-system-full
2. Go to **Pull requests** → **New pull request**
3. Base branch: `main`
4. Compare branch: `main` (or create a new branch from `30a93b4` if you must follow compare rules)
5. Title: `Fix Razorpay upgrade flow and subscription key handling`
6. Description: Razorpay Billing UI/backend fixes so upgrade no longer fails.
7. Create PR.

## Files changed in commit
- backend/src/routes/billing.js
- web-admin/src/pages/Billing.js
- TODO.md

