# Migration from Railway to Render - Complete ✅

## Changes Made

### Backend Configuration
- ✅ Removed `backend/railway.json`
- ✅ Removed Railway scripts from `backend/package.json`
- ✅ Updated health check comment in `backend/server.js`
- ✅ Removed Railway URL from CORS whitelist

### Frontend Configuration
- ✅ Updated `frontend/.env.production` → `https://ds-problem-framing-backend.onrender.com/api`
- ✅ Updated `frontend/vercel.json` → Render backend URL
- ✅ Updated `frontend/src/services/api.js` → Render backend URL

### Documentation
- ✅ Updated `README.md` → Removed Railway references
- ✅ Created `render.yaml` in project root
- ✅ Created deployment guides

## New Backend URL
```
https://ds-problem-framing-backend.onrender.com
```

## Next Steps

1. **Commit and push changes to GitHub**
   ```bash
   git add .
   git commit -m "Migrate from Railway to Render"
   git push
   ```

2. **Deploy backend on Render**
   - Go to https://dashboard.render.com/
   - Click "New +" → "Blueprint"
   - Connect your GitHub repo
   - Click "Apply"

3. **Add environment variables in Render**
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `FRONTEND_URL` - Already set to `https://beyond-polishing.vercel.app`

4. **Redeploy frontend on Vercel**
   ```bash
   cd frontend
   vercel --prod
   ```

5. **Test the deployment**
   - Backend health: https://ds-problem-framing-backend.onrender.com/health
   - Frontend: https://beyond-polishing.vercel.app

## Configuration Summary

**Backend (Render):**
- URL: `https://ds-problem-framing-backend.onrender.com`
- Root Directory: `backend`
- Build: `npm install`
- Start: `npm start`

**Frontend (Vercel):**
- URL: `https://beyond-polishing.vercel.app`
- API URL: `https://ds-problem-framing-backend.onrender.com/api`

All Railway references have been removed from the codebase.
