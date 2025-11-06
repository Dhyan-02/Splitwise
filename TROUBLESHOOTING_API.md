# 🔧 API 404 Error Troubleshooting

If you're getting a 404 error like:
```
Route not found Request URL: https://track-trips.onrender.com/users/register
```

This means the request is missing the `/api` prefix.

## ✅ Solution

The code has been updated to automatically append `/api` to the base URL. Follow these steps:

### Step 1: Check Vercel Environment Variable

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `track-trips`
3. Go to **Settings** → **Environment Variables**
4. Check `REACT_APP_API_URL`:

**Correct values (either one works):**
- `https://track-trips.onrender.com/api` ✅
- `https://track-trips.onrender.com` ✅ (code will auto-append `/api`)

**Wrong values:**
- `https://track-trips.onrender.com/` ❌ (trailing slash)
- `http://track-trips.onrender.com` ❌ (should be `https://`)

### Step 2: Update Environment Variable (if needed)

1. If the variable is wrong, click **Edit**
2. Set it to: `https://track-trips.onrender.com/api`
3. Or set it to: `https://track-trips.onrender.com` (code will add `/api`)
4. Click **Save**

### Step 3: Redeploy Frontend

1. Go to **Deployments** tab in Vercel
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger auto-deploy

### Step 4: Clear Browser Cache

1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select **"Empty Cache and Hard Reload"**
4. Or use **Ctrl+Shift+R** (Windows) / **Cmd+Shift+R** (Mac)

## 🔍 Verify the Fix

### Check in Browser Console

1. Open your app: https://track-trips.vercel.app
2. Open DevTools (F12) → **Console** tab
3. In development, you should see: `API Base URL: https://track-trips.onrender.com/api`

### Check Network Requests

1. Open DevTools (F12) → **Network** tab
2. Try to register/login
3. Check the request URL - it should be:
   - ✅ `https://track-trips.onrender.com/api/users/register`
   - ❌ NOT `https://track-trips.onrender.com/users/register`

### Test Backend Directly

```bash
# Test backend root
curl https://track-trips.onrender.com
# Should return: ✅ Splitwise backend running

# Test API endpoint
curl https://track-trips.onrender.com/api/users/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test1234"}'
```

## 🐛 Common Issues

### Issue: Still getting 404 after fix

**Solution:**
1. Make sure you've committed and pushed the latest code
2. Wait for Vercel to finish building (check deployment logs)
3. Clear browser cache completely
4. Try in incognito/private window

### Issue: CORS errors

**Solution:**
1. Verify backend CORS includes `https://track-trips.vercel.app`
2. Check backend is running: https://track-trips.onrender.com
3. Check backend logs in Render dashboard

### Issue: Environment variable not updating

**Solution:**
1. In Vercel, go to Environment Variables
2. Make sure variable is set for **Production** environment
3. Delete and recreate the variable if needed
4. Redeploy after updating

## 📝 Code Changes Made

The `api.js` file now includes:

```javascript
// Automatically ensures /api is appended
const getApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL || 'https://track-trips.onrender.com';
  const cleanUrl = envUrl.replace(/\/$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};
```

This means:
- If env var is `https://track-trips.onrender.com` → becomes `https://track-trips.onrender.com/api` ✅
- If env var is `https://track-trips.onrender.com/api` → stays `https://track-trips.onrender.com/api` ✅
- If env var is not set → defaults to `https://track-trips.onrender.com/api` ✅

## ✅ Expected Behavior

After the fix:
- ✅ All API requests go to: `https://track-trips.onrender.com/api/*`
- ✅ Registration: `POST /api/users/register`
- ✅ Login: `POST /api/users/login`
- ✅ All other endpoints work correctly

---

**Still having issues?** Check:
1. Vercel deployment logs
2. Browser console for errors
3. Network tab for actual request URLs
4. Backend logs in Render dashboard

