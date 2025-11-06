# 🌐 Production URLs Configuration

This document contains the production URLs and configuration for the deployed Splitwise application.

## 🔗 Production URLs

- **Frontend (Vercel)**: https://track-trips.vercel.app
- **Backend (Render)**: https://track-trips.onrender.com
- **Backend API Base**: https://track-trips.onrender.com/api

## ✅ Configuration Status

### Backend CORS Configuration
✅ **Configured** in `Splitwise/backend/src/app.js`

The backend allows requests from:
- `https://track-trips.vercel.app` (production frontend)
- `http://localhost:3000` (local development)
- `http://localhost:3001` (alternative local port)

### Frontend API Configuration
✅ **Configured** in `Splitwise/frontend/src/services/api.js`

The frontend defaults to:
- Production: `https://track-trips.onrender.com/api`
- Falls back to `http://localhost:5000/api` only if `REACT_APP_API_URL` is not set

## 🔧 Environment Variables

### Vercel (Frontend)
Set this environment variable (optional, as code defaults to production URL):
```
REACT_APP_API_URL=https://track-trips.onrender.com/api
```

### Render (Backend)
Required environment variables:
```
PORT=10000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_secure_random_string
NODE_ENV=production
```

## 🧪 Testing

### Test Backend
```bash
curl https://track-trips.onrender.com
# Should return: ✅ Splitwise backend running
```

### Test Frontend
1. Visit: https://track-trips.vercel.app
2. Should see the landing page
3. Try registering/logging in
4. Check browser console (F12) for any API errors

### Test API Connection
```bash
# Test from browser console on frontend:
fetch('https://track-trips.onrender.com/api/users/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'test', email: 'test@test.com', password: 'test1234' })
})
```

## 🔍 Troubleshooting

### CORS Errors
If you see CORS errors:
1. Verify backend CORS includes `https://track-trips.vercel.app`
2. Check backend is running: https://track-trips.onrender.com
3. Verify frontend is using correct API URL

### API Connection Issues
1. Check browser console for errors
2. Verify backend is "Live" in Render dashboard
3. Test backend directly: https://track-trips.onrender.com
4. Check network tab in browser DevTools

### Environment Variable Issues
1. **Vercel**: Go to Project Settings → Environment Variables
2. **Render**: Go to Service → Environment
3. Verify URLs are correct (no trailing slashes except `/api`)

## 📝 Notes

- The frontend code now defaults to the production backend URL
- CORS is properly configured for production
- Both local development and production URLs are supported
- All API calls should go to: `https://track-trips.onrender.com/api`

---

**Last Updated**: 2024
**Status**: ✅ Production Ready

