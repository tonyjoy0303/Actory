# Actoryy Deployment Guide for Render

This guide will help you deploy your Actoryy project to Render, including both the backend and frontend services.

## Prerequisites

1. A Render account (free tier available)
2. A MongoDB Atlas account (free tier available)
3. A Cloudinary account (free tier available)
4. Your project code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Set up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (choose the free M0 tier)
3. Create a database user with read/write permissions
4. Whitelist all IP addresses (0.0.0.0/0) for Render access
5. Get your connection string (it will look like: `mongodb+srv://username:password@cluster.mongodb.net/actory-spotlight?retryWrites=true&w=majority`)

## Step 2: Set up Cloudinary

1. Go to [Cloudinary](https://cloudinary.com)
2. Create a free account
3. Note down your:
   - Cloud Name
   - API Key
   - API Secret

## Step 3: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" and select "Web Service"
3. Connect your Git repository
4. Configure the backend service:
   - **Name**: `actory-backend`
   - **Root Directory**: `actory-spotlight-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/actory-spotlight?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=30d
   CLIENT_ORIGIN=https://actory-frontend.onrender.com
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   EMAIL_FROM=noreply@actory.com
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USERNAME=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

6. Click "Create Web Service"

## Step 4: Deploy Frontend to Render

1. In Render Dashboard, click "New +" and select "Static Site"
2. Connect your Git repository
3. Configure the frontend service:
   - **Name**: `actory-frontend`
   - **Root Directory**: `actory-spotlight-ui`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: Free

4. Add Environment Variables:
   ```
   VITE_API_URL=https://actory-backend.onrender.com
   VITE_SOCKET_URL=https://actory-backend.onrender.com
   ```

5. Click "Create Static Site"

## Step 5: Update Backend CORS Settings

After deploying the frontend, update the backend's `CLIENT_ORIGIN` environment variable to match your frontend URL:
```
CLIENT_ORIGIN=https://actory-frontend.onrender.com
```

## Step 6: Test Your Deployment

1. Visit your frontend URL: `https://actory-frontend.onrender.com`
2. Test user registration and login
3. Test file uploads (profile photos, videos)
4. Test video calling functionality

## Important Notes

### Free Tier Limitations

- **Render Free Tier**:
  - Services sleep after 15 minutes of inactivity
  - Cold starts can take 30-60 seconds
  - Limited to 750 hours per month

- **MongoDB Atlas Free Tier**:
  - 512 MB storage
  - Shared clusters

- **Cloudinary Free Tier**:
  - 25 GB storage
  - 25 GB bandwidth per month

### Performance Optimization

1. **Enable Auto-Deploy**: Both services will automatically redeploy when you push to your main branch
2. **Monitor Logs**: Use Render's log viewer to debug issues
3. **Database Indexing**: Add indexes to frequently queried fields in MongoDB
4. **Image Optimization**: Use Cloudinary's transformation features for optimized images

### Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **JWT Secret**: Use a strong, random JWT secret
3. **CORS**: Only allow your frontend domain in CORS settings
4. **MongoDB**: Use strong passwords and limit IP access when possible

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version compatibility
   - Ensure all dependencies are in package.json
   - Check build logs in Render dashboard

2. **Database Connection Issues**:
   - Verify MongoDB URI format
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has correct permissions

3. **CORS Errors**:
   - Verify CLIENT_ORIGIN matches your frontend URL exactly
   - Check browser developer tools for specific CORS errors

4. **File Upload Issues**:
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper CORS headers

### Getting Help

- Check Render's [documentation](https://render.com/docs)
- Review MongoDB Atlas [connection guide](https://docs.atlas.mongodb.com/connect-to-cluster/)
- Cloudinary [documentation](https://cloudinary.com/documentation)

## Next Steps

1. Set up a custom domain (optional)
2. Configure SSL certificates (automatic with Render)
3. Set up monitoring and alerts
4. Consider upgrading to paid plans for better performance
5. Implement CI/CD pipelines for automated testing

Your Actoryy application should now be live and accessible to users worldwide!
