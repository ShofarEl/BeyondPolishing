# Deployment Guide

This guide covers deploying the AI-Powered Data Science Problem Framing App to production.

## Prerequisites

- Node.js 18+ installed locally
- MongoDB Atlas account (free tier available)
- Google Gemini API key
- Render account (for backend)
- Vercel account (for frontend)
- GitHub repository

## Backend Deployment (Render)

### 1. Prepare MongoDB Database

1. Create a MongoDB Atlas cluster
2. Create a database named `ds-problem-framing`
3. Get your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/ds-problem-framing`)

### 2. Deploy to Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use the `render.yaml` configuration file
4. Set environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `JWT_SECRET`: Generate a secure random string
   - `ADMIN_KEY`: Generate a secure admin key for research team
   - `FRONTEND_URL`: Your frontend URL (will be set after frontend deployment)

### 3. Verify Backend

Test your backend API:
```bash
curl https://your-backend-url.render.com/health
```

## Frontend Deployment (Vercel)

### 1. Prepare Frontend

1. Create environment variables file:
```bash
cp frontend/env.example frontend/.env
```

2. Update `frontend/.env`:
```
VITE_API_URL=https://your-backend-url.render.com/api
```

### 2. Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Set build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Set environment variable:
   - `VITE_API_URL`: Your backend API URL

### 3. Update Backend CORS

Update your backend's `FRONTEND_URL` environment variable to your Vercel URL.

## Database Setup

### Initial Setup

The application will automatically create the necessary collections when first accessed.

### Admin Access

Use the admin endpoints with the `X-Admin-Key` header:
```bash
curl -H "X-Admin-Key: your-admin-key" https://your-backend-url.render.com/api/admin/stats
```

## Environment Variables Reference

### Backend (.env)
```
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secure-jwt-secret
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=https://your-frontend.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ADMIN_KEY=your-admin-key
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend-url.render.com/api
VITE_NODE_ENV=production
```

## Testing Deployment

### 1. Test User Flow

1. Visit your frontend URL
2. Register a new participant
3. Give consent
4. Create a problem
5. Test AI interactions
6. Complete a task

### 2. Test Admin Functions

```bash
# Get study statistics
curl -H "X-Admin-Key: your-admin-key" \
  https://your-backend-url.render.com/api/admin/stats

# Export research data
curl -H "X-Admin-Key: your-admin-key" \
  https://your-backend-url.render.com/api/admin/export
```

## Monitoring and Maintenance

### Health Checks

- Backend: `GET /health`
- Frontend: Check Vercel deployment status

### Logs

- Backend: Render dashboard logs
- Frontend: Vercel function logs

### Database Monitoring

- Monitor MongoDB Atlas dashboard
- Set up alerts for storage and performance

## Security Considerations

1. **API Keys**: Store securely, never commit to repository
2. **CORS**: Configure properly for your domains
3. **Rate Limiting**: Adjust based on expected usage
4. **Data Privacy**: Ensure IRB compliance for research data
5. **HTTPS**: All traffic should be encrypted

## Scaling Considerations

### Backend (Render)
- Upgrade to paid plan for better performance
- Consider horizontal scaling for high traffic
- Monitor database connections

### Database (MongoDB Atlas)
- Monitor storage usage
- Consider read replicas for analytics
- Set up automated backups

### Frontend (Vercel)
- Monitor bandwidth usage
- Consider CDN optimization
- Monitor Core Web Vitals

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check FRONTEND_URL in backend
2. **Database Connection**: Verify MongoDB URI and network access
3. **API Key Issues**: Verify Gemini API key is valid
4. **Build Failures**: Check Node.js version compatibility

### Debug Mode

Enable debug mode by setting `NODE_ENV=development` (backend) and `VITE_DEBUG_MODE=true` (frontend).

## Backup and Recovery

### Database Backups
- MongoDB Atlas provides automatic backups
- Export data regularly using admin endpoints

### Code Backups
- Use Git for version control
- Tag releases for easy rollback

## Research Data Management

### Data Export
Use the admin export endpoint to download anonymized research data:
```bash
curl -H "X-Admin-Key: your-admin-key" \
  https://your-backend-url.render.com/api/admin/export > research_data.json
```

### Data Privacy
- All participant data is anonymized
- Regular data purging may be required per IRB protocol
- Secure data storage and transmission

## Support

For technical issues:
1. Check application logs
2. Verify environment variables
3. Test API endpoints individually
4. Contact hosting provider support

For research-related questions, contact the research team.
