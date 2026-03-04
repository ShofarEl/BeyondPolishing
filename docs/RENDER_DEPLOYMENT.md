# Deploying Backend to Render

This guide walks you through deploying your backend API to Render.

## Prerequisites

- A Render account (sign up at https://render.com)
- Your GitHub repository connected to Render
- MongoDB Atlas account (or another MongoDB provider)
- OpenAI API key

## Step-by-Step Deployment

### 1. Prepare Your MongoDB Database

If you don't have a MongoDB database yet:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with password
4. Whitelist all IPs (0.0.0.0/0) for Render access
5. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)

### 2. Deploy to Render Using Blueprint (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file in your backend folder
5. Click "Apply" to create the services

### 3. Configure Environment Variables

After the blueprint is applied, you need to set the environment variables that are marked as `sync: false`:

1. Go to your web service in Render dashboard
2. Navigate to "Environment" tab
3. Add the following environment variables:

```
OPENAI_API_KEY=sk-proj-your-actual-openai-key
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

The following variables are auto-generated or set by the blueprint:
- `NODE_ENV=production`
- `PORT=3001`
- `MONGODB_URI` (from database)
- `JWT_SECRET` (auto-generated)
- `ADMIN_KEY` (auto-generated)
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX_REQUESTS=100`

### 4. Manual Deployment (Alternative)

If you prefer manual setup instead of blueprint:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `ds-problem-framing-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add all environment variables listed in step 3 above

6. Create a MongoDB database:
   - Click "New +" → "PostgreSQL" (or use external MongoDB)
   - Name: `ds-problem-framing-db`
   - Plan: Free
   - Copy the connection string to `MONGODB_URI`

### 5. Update Frontend Configuration

After deployment, update your frontend to use the new backend URL:

1. Get your Render backend URL (e.g., `https://ds-problem-framing-backend.onrender.com`)
2. Update `frontend/.env.production`:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```
3. Redeploy your frontend on Vercel

### 6. Update CORS Settings

Make sure your backend URL is added to the CORS whitelist in `backend/server.js`:

```javascript
origin: [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://your-frontend-domain.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean),
```

### 7. Verify Deployment

1. Check the health endpoint: `https://your-backend-url.onrender.com/health`
2. You should see:
   ```json
   {
     "status": "OK",
     "timestamp": "2026-03-04T...",
     "environment": "production"
   }
   ```

## Important Notes

- **Free Tier Limitations**: Render free tier spins down after 15 minutes of inactivity. First request after spin-down may take 30-60 seconds.
- **Database**: The free MongoDB database on Render expires after 90 days. Consider using MongoDB Atlas for production.
- **Environment Variables**: Never commit sensitive keys to Git. Always use environment variables.
- **Logs**: View logs in Render dashboard under "Logs" tab for debugging.

## Troubleshooting

### Service Won't Start
- Check logs in Render dashboard
- Verify all required environment variables are set
- Ensure MongoDB connection string is correct

### CORS Errors
- Verify `FRONTEND_URL` environment variable is set correctly
- Check that frontend URL is in CORS whitelist in `server.js`

### Database Connection Issues
- Verify MongoDB Atlas allows connections from all IPs (0.0.0.0/0)
- Check connection string format
- Ensure database user has proper permissions

## Useful Commands

View your deployment status:
- Check Render dashboard for build and deploy logs
- Monitor health endpoint for uptime

## Next Steps

After successful deployment:
1. Test all API endpoints
2. Update frontend environment variables
3. Test the full application flow
4. Set up monitoring and alerts (optional)
5. Consider upgrading to paid tier for production use

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com/)
