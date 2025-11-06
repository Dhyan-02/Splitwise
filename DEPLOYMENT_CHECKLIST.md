# ✅ Deployment Checklist

Use this checklist to ensure you don't miss any steps during deployment.

## Pre-Deployment

- [ ] Code is pushed to GitHub repository
- [ ] All local changes are committed
- [ ] You have accounts for:
  - [ ] Render (https://render.com)
  - [ ] Vercel (https://vercel.com)
  - [ ] Supabase (https://supabase.com)

## Step 1: Supabase Setup

- [ ] Created Supabase project
- [ ] Ran `supabase/schema.sql` in SQL Editor
- [ ] Created storage bucket: `places-photos`
- [ ] Set bucket to **Public**
- [ ] Added storage policies (see DEPLOYMENT.md)
- [ ] Copied **Project URL** from Settings → API
- [ ] Copied **Service Role Key** from Settings → API

## Step 2: Backend Deployment (Render)

- [ ] Created new Web Service in Render
- [ ] Connected GitHub repository
- [ ] Set **Root Directory**: `Splitwise/backend`
- [ ] Set **Build Command**: `npm install`
- [ ] Set **Start Command**: `npm start`
- [ ] Added environment variables:
  - [ ] `PORT=10000`
  - [ ] `SUPABASE_URL` (from Supabase)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (from Supabase)
  - [ ] `JWT_SECRET` (strong random string, 32+ chars)
  - [ ] `NODE_ENV=production`
- [ ] Service deployed and shows "Live" status
- [ ] Tested backend URL: `https://your-backend.onrender.com`
- [ ] Backend responds with: `✅ Splitwise backend running`

## Step 3: Frontend Deployment (Vercel)

- [ ] Imported repository in Vercel
- [ ] Set **Root Directory**: `Splitwise/frontend`
- [ ] Framework preset: `Create React App`
- [ ] Added environment variable:
  - [ ] `REACT_APP_API_URL=https://your-backend.onrender.com/api`
- [ ] Deployment completed successfully
- [ ] Frontend URL is accessible

## Step 4: Testing

- [ ] Frontend loads without errors
- [ ] Can register a new user
- [ ] Can login with credentials
- [ ] Can create a group
- [ ] Can create a trip
- [ ] Can add an expense
- [ ] Can view settlements
- [ ] Can add a place with photo (if applicable)
- [ ] Can view analytics

## Step 5: Security & Final Checks

- [ ] JWT_SECRET is strong and random
- [ ] No `.env` files committed to Git
- [ ] HTTPS is enabled (automatic on Render/Vercel)
- [ ] CORS is configured (if needed)
- [ ] Storage bucket policies are set correctly
- [ ] All environment variables are set correctly

## Troubleshooting

If something doesn't work:

1. **Backend Issues**
   - [ ] Check Render logs: Dashboard → Your Service → Logs
   - [ ] Verify all environment variables are set
   - [ ] Test backend directly: `curl https://your-backend.onrender.com`

2. **Frontend Issues**
   - [ ] Check browser console (F12)
   - [ ] Check Vercel deployment logs
   - [ ] Verify `REACT_APP_API_URL` is correct
   - [ ] Ensure backend URL ends with `/api`

3. **Database Issues**
   - [ ] Check Supabase logs: Dashboard → Logs
   - [ ] Verify schema was run successfully
   - [ ] Check storage bucket exists and is public

## Quick Links

- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://app.supabase.com

---

**Need detailed instructions?** See [DEPLOYMENT.md](./DEPLOYMENT.md)

