# Deploy Firebase Functions for Custom Email URLs

## Quick Deploy Commands

### Deploy All Functions
```bash
cd app
firebase deploy --only functions
```

### Deploy Specific Function (Faster)
```bash
cd app
firebase deploy --only functions:generatePasswordResetLink
```

## Before Deploying

Make sure you have:
1. ✅ Firebase CLI installed: `npm install -g firebase-tools`
2. ✅ Logged in: `firebase login`
3. ✅ Correct project selected: `firebase use taskzy-9c2e5`

## Verify Deployment

After deploying, check the logs:
```bash
firebase functions:log --only generatePasswordResetLink
```

List all deployed functions:
```bash
firebase functions:list
```

## Test the Changes

1. Go to your app: https://www.taskszy.com/app
2. Click "Forgot Password"
3. Enter an email and request reset
4. Check the email - button should link to: `https://www.taskszy.com/app?mode=resetPassword&oobCode=xxx`

## Updated Functions

- `generatePasswordResetLink`: Sends custom branded password reset emails
  - Now uses URL: `https://www.taskszy.com/app`
  - CORS enabled for: `https://www.taskszy.com` and `https://taskszy.com`

## Important Notes

⚠️ Functions must be deployed for code changes to take effect
⚠️ Also configure Firebase Console → Authentication → Templates (see FIREBASE_EMAIL_ACTION_SETUP.md)
⚠️ Old emails sent before deployment will still have old URLs

## Deployment Time

- Initial deployment: ~2-3 minutes
- Subsequent deployments: ~30-60 seconds
