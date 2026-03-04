# Render Deployment Checklist

## ✅ Quick Setup Steps

### 1. Deploy to Render (5 minutes)

1. **Go to Render**: https://dashboard.render.com/
2. **Click**: "New +" → "Blueprint"
3. **Connect**: Your GitHub repository
4. **Select**: The repository containing this project
5. **Render will detect**: `backend/render.yaml` automatically
6. **Click**: "Apply" to create services

**The render.yaml is configured with:**
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: Node.js
- **Plan**: Free tier

### 2. Set Required Environment Variables (2 minutes)

After blueprint deployment, go to your web service → "Environment" tab and add:

```
OPENAI_API_KEY=your-actual-openai-key-here
FRONTEND_URL=https://beyond-polishing.vercel.app
```

**Where to get these:**
- OpenAI API Key: https://platform.openai.com/api-keys
- Frontend URL: Your Vercel deployment URL (already set to `https://beyond-polishing.vercel.app`)

### 3. Get Your Backend URL (1 minute)

After deployment completes:
- Copy your Render backend URL (e.g., `https://ds-problem-framing-backend.onrender.com`)
- Test it: `https://your-backend-url.onrender.com/health`

### 4. Update Frontend (2 minutes)

Update `frontend/.env.production`:
```env
VITE_API_URL=https://your-render-backend-url.onrender.com/api
VITE_NODE_ENV=production
```

Then redeploy on Vercel:
```bash
cd frontend
vercel --prod
```

### 5. Verify Everything Works (2 minutes)

- ✅ Backend health check: `https://your-backend-url.onrender.com/health`
- ✅ Frontend loads: `https://beyond-polishing.vercel.app`
- ✅ Login/signup works
- ✅ AI features work

## 📋 Pre-Deployment Checklist

- [ ] MongoDB Atlas database ready (or will use Render's free MongoDB)
- [ ] OpenAI API key ready
- [ ] GitHub repository is up to date
- [ ] `backend/render.yaml` exists (✅ already present)

## 🔑 Environment Variables Summary

**Auto-configured by Render:**
- `NODE_ENV=production`
- `PORT=3001`
- `MONGODB_URI` (from database)
- `JWT_SECRET` (auto-generated)
- `ADMIN_KEY` (auto-generated)
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX_REQUESTS=100`

**You need to add manually:**
- `OPENAI_API_KEY` - Get from OpenAI dashboard
- `FRONTEND_URL` - Your Vercel frontend URL

## ⚠️ Important Notes

1. **First Request Delay**: Free tier spins down after 15 min inactivity. First request takes ~30-60 seconds.
2. **Database**: Render's free MongoDB expires after 90 days. Use MongoDB Atlas for long-term.
3. **CORS**: Your frontend URL is already configured in `server.js`

## 🐛 Quick Troubleshooting

**Service won't start?**
- Check Render logs in dashboard
- Verify all environment variables are set

**CORS errors?**
- Ensure `FRONTEND_URL` matches your Vercel URL exactly
- Check Render logs for CORS-related errors

**Database connection failed?**
- If using MongoDB Atlas, whitelist all IPs: `0.0.0.0/0`
- Verify connection string format

## 📚 Full Documentation

See `docs/RENDER_DEPLOYMENT.md` for detailed instructions.

## 🚀 Ready to Deploy?

1. Push your code to GitHub
2. Go to https://dashboard.render.com/
3. Click "New +" → "Blueprint"
4. Follow steps above

Total time: ~12 minutes
