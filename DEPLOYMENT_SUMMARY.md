# 📋 Deployment Summary - Quick Reference

This is a quick reference guide for deploying the Splitwise app. For detailed instructions, see the full guides.

## 🚀 Quick Start

### Step 1: Pre-Deployment Setup
```bash
# Install backend dependencies
cd Splitwise/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Set up environment files
# Backend: Copy .env.example to .env and fill in values
# Frontend: Copy .env.example to .env and fill in values
```

**Full Guide**: [PRE_DEPLOYMENT_SETUP.md](./PRE_DEPLOYMENT_SETUP.md)

### Step 2: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - **Root Directory**: `Splitwise/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   ```
   PORT=10000
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_secure_random_string
   NODE_ENV=production
   ```
6. Deploy!

**Full Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md#step-2-deploy-backend-to-render)

### Step 3: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Add New → Project
3. Import GitHub repo
4. Settings:
   - **Root Directory**: `Splitwise/frontend`
   - **Framework**: Create React App
5. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://track-trips.onrender.com/api
   ```
   
   **Note**: The frontend defaults to this URL if not set, but it's recommended to set it explicitly.
6. Deploy!

**Full Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md#step-3-deploy-frontend-to-vercel)

## 📁 Important Files

### Configuration Files
- `Splitwise/.gitignore` - Root gitignore
- `Splitwise/backend/.gitignore` - Backend gitignore
- `Splitwise/frontend/.gitignore` - Frontend gitignore
- `Splitwise/backend/.env.example` - Backend env template
- `Splitwise/frontend/.env.example` - Frontend env template

### Documentation Files
- `PRE_DEPLOYMENT_SETUP.md` - Setup dependencies and environment
- `DEPLOYMENT.md` - Complete deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Deployment checklist
- `README.md` - Project overview

### Package Files
- `Splitwise/backend/package.json` - Backend dependencies
- `Splitwise/frontend/package.json` - Frontend dependencies
- `package-lock.json` files - Locked dependency versions (commit these!)

## 🔑 Environment Variables

### Backend (Render)
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `10000` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | `eyJhbGci...` |
| `JWT_SECRET` | JWT signing secret | `random_32_char_string` |
| `NODE_ENV` | Environment | `production` |

### Frontend (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `https://track-trips.onrender.com/api` |

## ✅ Pre-Deployment Checklist

- [ ] Node.js 18+ installed
- [ ] All dependencies installed (`npm install` in both directories)
- [ ] `package-lock.json` files exist and are committed
- [ ] `.env.example` files exist (template files)
- [ ] `.env` files created locally (not committed)
- [ ] `.gitignore` files configured correctly
- [ ] Backend starts locally: `npm start` in backend/
- [ ] Frontend builds: `npm run build` in frontend/
- [ ] Code pushed to GitHub

## 🔗 Important Links

- **Render**: https://dashboard.render.com
- **Vercel**: https://vercel.com/dashboard
- **Supabase**: https://app.supabase.com
- **GitHub**: Your repository URL

## 🆘 Quick Troubleshooting

**Backend won't start?**
- Check environment variables in Render
- Check Render logs
- Verify Supabase credentials

**Frontend can't connect to backend?**
- Verify `REACT_APP_API_URL` in Vercel
- Check backend URL ends with `/api`
- Verify backend is "Live" in Render

**Dependencies not installing?**
- Clear cache: `npm cache clean --force`
- Delete `node_modules` and reinstall
- Check Node.js version: `node --version` (should be 18+)

---

**Need more help?** See the full guides:
- [PRE_DEPLOYMENT_SETUP.md](./PRE_DEPLOYMENT_SETUP.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

