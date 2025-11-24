# 🚀 Deployment Guide - TripSync App

This guide will walk you through deploying the TripSync application:
- **Backend**: Deploy to Render (Node.js/Express)
- **Frontend**: Deploy to Vercel (React)

---

## 📋 Prerequisites

Before starting, make sure you have:
1. ✅ A GitHub account
2. ✅ A Render account (sign up at [https://render.com](https://render.com))
3. ✅ A Vercel account (sign up at [https://vercel.com](https://vercel.com))
4. ✅ A Supabase account (sign up at [https://supabase.com](https://supabase.com))
5. ✅ Your code pushed to a GitHub repository
6. ✅ **All dependencies installed locally** (see [PRE_DEPLOYMENT_SETUP.md](./PRE_DEPLOYMENT_SETUP.md))

⚠️ **IMPORTANT**: Complete the [Pre-Deployment Setup](./PRE_DEPLOYMENT_SETUP.md) first to ensure all dependencies are correctly installed and configured!

---

## 🗄️ Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Project Name**: `tripsync` (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"** (takes 1-2 minutes)

### 1.2 Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from your project
4. Copy the entire contents and paste into the SQL Editor
5. Click **"Run"** (or press `Ctrl+Enter`)
6. Verify success message: "Success. No rows returned"

### 1.3 Create Storage Bucket for Photos

1. In Supabase dashboard, go to **Storage** (left sidebar)
2. Click **"Create a new bucket"**
3. Set:
   - **Name**: `places-photos`
   - **Public bucket**: ✅ **Enable** (check this box)
4. Click **"Create bucket"**
5. Go to **Policies** tab for the bucket
6. Click **"New Policy"** → **"For full customization"**
7. Use this policy (allows authenticated users to upload):

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'places-photos');

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'places-photos');

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'places-photos');

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'places-photos');
```

8. Click **"Review"** → **"Save policy"**

### 1.4 Get Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API** (left sidebar)
2. Copy these values (you'll need them later):
   - **Project URL** (under "Project URL")
   - **Service Role Key** (under "Project API keys" → "service_role" key) ⚠️ **Keep this secret!**

---

## 🔧 Step 2: Deploy Backend to Render

### 2.1 Prepare Your Repository

1. Make sure your code is pushed to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

### 2.2 Create Render Web Service

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your repository: `splitwiser` (or your repo name)
5. Configure the service:
   - **Name**: `splitwise-backend` (or your choice)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `Splitwise/backend` ⚠️ **Important!**
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free tier is fine to start

### 2.3 Set Environment Variables in Render

In the Render dashboard, scroll down to **"Environment Variables"** section and add:

```
PORT=10000
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
JWT_SECRET=your_very_secure_random_string_here_min_32_chars
NODE_ENV=production
```

**How to get values:**
- `SUPABASE_URL`: From Supabase Settings → API → Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: From Supabase Settings → API → service_role key
- `JWT_SECRET`: Generate a secure random string (you can use: `openssl rand -base64 32` or any online generator)

**Example:**
```
PORT=10000
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_SECRET=my_super_secret_jwt_key_that_is_at_least_32_characters_long
NODE_ENV=production
```

### 2.4 Deploy

1. Click **"Create Web Service"**
2. Render will start building and deploying (takes 2-5 minutes)
3. Wait for status to show **"Live"** ✅
4. Copy your backend URL (e.g., `https://tripsync-backend.onrender.com`)

### 2.5 Test Backend

1. Open your backend URL in browser
2. You should see: `✅ TripSync backend running`
3. If you see an error, check the **"Logs"** tab in Render dashboard

---

## 🎨 Step 3: Deploy Frontend to Vercel

### 3.1 Install Vercel CLI (Optional - or use Web UI)

You can deploy via Vercel's web interface or CLI. We'll use the web interface:

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New..."** → **"Project"**

### 3.2 Import Your Repository

1. Find your repository: `splitwiser` (or your repo name)
2. Click **"Import"**

### 3.3 Configure Frontend Project

1. **Framework Preset**: `Create React App` (auto-detected)
2. **Root Directory**: Click **"Edit"** and set to: `Splitwise/frontend` ⚠️ **Important!**
3. **Build Command**: `npm run build` (should be auto-filled)
4. **Output Directory**: `build` (should be auto-filled)
5. **Install Command**: `npm install` (should be auto-filled)

### 3.4 Set Environment Variables in Vercel

Click **"Environment Variables"** and add:

**Option 1 (Recommended - with /api):**
```
REACT_APP_API_URL=https://track-trips.onrender.com/api
```

**Option 2 (Without /api - code will auto-append it):**
```
REACT_APP_API_URL=https://track-trips.onrender.com
```

⚠️ **Important**: 
- The code automatically ensures `/api` is appended, so either format works
- Make sure to use `https://` (not `http://`)
- The backend URL is: `https://track-trips.onrender.com`
- If you don't set this variable, it defaults to `https://track-trips.onrender.com/api`

### 3.5 Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy (takes 2-3 minutes)
3. Wait for deployment to complete
4. You'll get a URL like: `https://tripsync-frontend.vercel.app`

### 3.6 Test Frontend

1. Open your Vercel URL
2. You should see the TripSync login page
3. Try registering a new user
4. If you see errors, check the browser console (F12) and Vercel deployment logs

---

## 🔄 Step 4: Update CORS Settings (If Needed)

If you get CORS errors, update your backend:

1. In Render dashboard, go to your backend service
2. Check the logs - if you see CORS errors, the backend should already handle it
3. The backend uses `app.use(cors())` which allows all origins
4. For production, you might want to restrict CORS to your Vercel domain

**CORS is already configured in the backend** to allow:
- `https://track-trips.vercel.app` (production frontend)
- `http://localhost:3000` (local development)
- `http://localhost:3001` (alternative local port)

The backend CORS configuration is already set up in `Splitwise/backend/src/app.js`. No changes needed!

---

## ✅ Step 5: Verify Everything Works

### 5.1 Test Complete Flow

1. **Frontend**: Open your Vercel URL
2. **Register**: Create a new account
3. **Login**: Sign in with your credentials
4. **Create Group**: Create a new group
5. **Create Trip**: Add a trip to the group
6. **Add Expense**: Add an expense to the trip
7. **Check Settlements**: View who owes whom

### 5.2 Common Issues & Fixes

**Issue**: Frontend shows "Network Error" or can't connect to backend
- ✅ Check `REACT_APP_API_URL` in Vercel environment variables
- ✅ Make sure backend URL ends with `/api`
- ✅ Verify backend is "Live" in Render dashboard

**Issue**: "Authentication failed" or "Invalid token"
- ✅ Check `JWT_SECRET` is set correctly in Render
- ✅ Make sure it's the same value (if you redeploy, keep it consistent)

**Issue**: "Supabase connection error"
- ✅ Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Render
- ✅ Check Supabase project is active

**Issue**: Photo uploads not working
- ✅ Verify storage bucket `places-photos` exists in Supabase
- ✅ Check bucket is set to public
- ✅ Verify storage policies are set correctly

---

## 🔗 Quick Reference Links

### Your Deployed URLs
- **Backend**: `https://track-trips.onrender.com`
- **Frontend**: `https://track-trips.vercel.app`

### Dashboard Links
- **Render Dashboard**: [https://dashboard.render.com](https://dashboard.render.com)
- **Vercel Dashboard**: [https://vercel.com/dashboard](https://vercel.com/dashboard)
- **Supabase Dashboard**: [https://app.supabase.com](https://app.supabase.com)

### Documentation
- **Render Docs**: [https://render.com/docs](https://render.com/docs)
- **Vercel Docs**: [https://vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)

---

## 🔐 Security Checklist

Before going to production:

- [ ] Use strong `JWT_SECRET` (at least 32 characters, random)
- [ ] Never commit `.env` files to Git
- [ ] Use HTTPS only (Render and Vercel provide this automatically)
- [ ] Review Supabase Row Level Security (RLS) policies if needed
- [ ] Consider restricting CORS to your frontend domain only
- [ ] Regularly update dependencies for security patches

---

## 📝 Environment Variables Summary

### Backend (Render)
```
PORT=10000
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your_secure_random_string_32_chars_min
NODE_ENV=production
```

### Frontend (Vercel)
```
REACT_APP_API_URL=https://track-trips.onrender.com/api
```

**Note**: The frontend code defaults to `https://track-trips.onrender.com/api` if the environment variable is not set, so this is optional but recommended for clarity.

---

## 🆘 Need Help?

1. **Backend Issues**: Check Render logs → Your Service → Logs tab
2. **Frontend Issues**: Check Vercel logs → Your Deployment → View Function Logs
3. **Database Issues**: Check Supabase logs → Logs → Postgres Logs
4. **API Issues**: Test backend directly: `https://your-backend.onrender.com/api/users/register`

---

## 🎉 You're Done!

Your TripSync app should now be live and accessible to users worldwide!

**Next Steps:**
- Share your frontend URL with users
- Monitor usage in Render and Vercel dashboards
- Set up custom domain (optional) in Vercel settings
- Enable analytics (optional) in Vercel

---

**Last Updated**: 2024
**Project**: TripSync - Group Trip Expense Splitter

