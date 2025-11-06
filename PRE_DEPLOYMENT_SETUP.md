# 🔧 Pre-Deployment Setup Guide

This guide ensures all dependencies are correctly installed and configured before deploying to Render and Vercel.

## ✅ Prerequisites Check

Before starting, verify you have:

- [ ] **Node.js** installed (version 18.0.0 or higher)
  - Check: `node --version`
  - Download: [https://nodejs.org](https://nodejs.org)
- [ ] **npm** installed (version 9.0.0 or higher)
  - Check: `npm --version`
- [ ] **Git** installed and configured
  - Check: `git --version`
- [ ] Code pushed to GitHub repository

## 📦 Step 1: Install Backend Dependencies

1. Navigate to backend directory:
   ```bash
   cd Splitwise/backend
   ```

2. Install all dependencies:
   ```bash
   npm install
   ```

3. Verify installation:
   ```bash
   npm run verify
   ```
   This should show your Node.js and npm versions.

4. Check that `node_modules` folder exists and contains packages.

5. **Important**: Ensure `package-lock.json` is present (it should be committed to Git).

## 📦 Step 2: Install Frontend Dependencies

1. Navigate to frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install all dependencies:
   ```bash
   npm install
   ```

3. Verify installation:
   ```bash
   npm run verify
   ```

4. Check that `node_modules` folder exists and contains packages.

5. **Important**: Ensure `package-lock.json` is present (it should be committed to Git).

## 🔐 Step 3: Set Up Environment Files

### Backend Environment

1. In `Splitwise/backend/` directory, copy the example file:
   ```bash
   # Windows (PowerShell)
   Copy-Item .env.example .env
   
   # Windows (CMD)
   copy .env.example .env
   
   # Mac/Linux
   cp .env.example .env
   ```

2. Edit `.env` file and fill in your values:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `JWT_SECRET`: Generate a strong random string (32+ characters)
   - `PORT`: 5000 for local development
   - `NODE_ENV`: development

3. **Verify `.env` is in `.gitignore`** (should not be committed to Git)

### Frontend Environment

1. In `Splitwise/frontend/` directory, copy the example file:
   ```bash
   # Windows (PowerShell)
   Copy-Item .env.example .env
   
   # Windows (CMD)
   copy .env.example .env
   
   # Mac/Linux
   cp .env.example .env
   ```

2. Edit `.env` file:
   - `REACT_APP_API_URL`: `http://localhost:5000/api` for local development

3. **Verify `.env` is in `.gitignore`** (should not be committed to Git)

## ✅ Step 4: Verify Git Configuration

1. Check `.gitignore` files exist:
   - `Splitwise/.gitignore` (root)
   - `Splitwise/backend/.gitignore`
   - `Splitwise/frontend/.gitignore`

2. Verify `.env` files are ignored:
   ```bash
   git status
   ```
   You should NOT see `.env` files in the output.

3. Verify `node_modules` are ignored:
   ```bash
   git status
   ```
   You should NOT see `node_modules` folders.

4. Verify `package-lock.json` files ARE tracked:
   ```bash
   git ls-files | grep package-lock.json
   ```
   Should show both backend and frontend package-lock.json files.

## 🧪 Step 5: Test Local Builds

### Test Backend Build

1. In `Splitwise/backend/`:
   ```bash
   npm start
   ```
   Should start server on port 5000 (or your configured port).

2. Test in browser: `http://localhost:5000`
   Should see: `✅ Splitwise backend running`

3. Stop server (Ctrl+C)

### Test Frontend Build

1. In `Splitwise/frontend/`:
   ```bash
   npm run build
   ```
   Should create a `build/` folder with production files.

2. Verify build folder exists and contains:
   - `index.html`
   - `static/` folder with JS and CSS files

3. **Important**: The `build/` folder should be in `.gitignore` (not committed).

## 📋 Step 6: Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All dependencies installed (`npm install` in both directories)
- [ ] `package-lock.json` files exist and are committed
- [ ] `.env` files exist locally but are NOT committed
- [ ] `.gitignore` files are properly configured
- [ ] Backend starts locally without errors
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Code is committed and pushed to GitHub
- [ ] Environment variables documented in `env.example` files

## 🚀 Ready for Deployment

Once all checks pass, you're ready to deploy:

1. **Backend to Render**: Follow [DEPLOYMENT.md](./DEPLOYMENT.md#step-2-deploy-backend-to-render)
2. **Frontend to Vercel**: Follow [DEPLOYMENT.md](./DEPLOYMENT.md#step-3-deploy-frontend-to-vercel)

## 🔍 Troubleshooting

### Issue: `npm install` fails

**Solution:**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version: `node --version` (should be 18+)

### Issue: Dependencies not installing correctly

**Solution:**
- Ensure you're in the correct directory (`backend/` or `frontend/`)
- Check `package.json` exists
- Try: `npm install --legacy-peer-deps` (if peer dependency issues)

### Issue: `.env` file is being tracked by Git

**Solution:**
- Remove from Git: `git rm --cached Splitwise/backend/.env`
- Remove from Git: `git rm --cached Splitwise/frontend/.env`
- Verify `.env` is in `.gitignore`
- Commit the removal

### Issue: `package-lock.json` is missing

**Solution:**
- Run `npm install` to regenerate it
- Commit it to Git: `git add package-lock.json`

### Issue: Build fails

**Backend:**
- Check all environment variables are set
- Verify Node.js version: `node --version`
- Check for syntax errors in code

**Frontend:**
- Clear build folder: `rm -rf build/` (Mac/Linux) or `rmdir /s build` (Windows)
- Run `npm run build` again
- Check for TypeScript/ESLint errors

## 📝 Notes

- **Render** will automatically run `npm install` during deployment
- **Vercel** will automatically run `npm install` and `npm run build` during deployment
- Both platforms use the `package-lock.json` for consistent dependency versions
- Environment variables must be set in Render and Vercel dashboards (not from `.env` files)

---

**Next Step**: Read [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

