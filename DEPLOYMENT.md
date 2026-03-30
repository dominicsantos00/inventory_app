# Deployment Guide

This guide will help you deploy the Inventory Management System to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally
   ```bash
   npm install -g vercel
   ```
3. **Database**: You'll need a MySQL database hosted online (e.g., from services like PlanetScale, Railway, or Supabase)

## Step-by-Step Deployment

### 1. Login to Vercel
```bash
vercel login
```

### 2. Deploy to Vercel
```bash
vercel
```

The CLI will guide you through the deployment process. It will:
- Detect the project configuration
- Ask for project name and organization
- Deploy the application

### 3. Set Environment Variables

After deployment, you need to configure the database connection. In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | MySQL database host | `aws.connect.psdb.cloud` |
| `DB_USER` | MySQL username | `your-username` |
| `DB_PASSWORD` | MySQL password | `your-password` |
| `DB_NAME` | Database name | `inventory_db` |

### 4. Import Database Schema

You'll need to import the database schema to your MySQL database:

1. Connect to your MySQL database using a client (like MySQL Workbench, phpMyAdmin, or the command line)
2. Run the SQL commands from `backend/schema.sql`

### 5. Verify Deployment

Once deployed, Vercel will provide you with a deployment URL. Visit the URL to ensure:
- The frontend loads correctly
- API endpoints are accessible
- Database connections work properly

## Configuration Files

### `vercel.json`
This file configures how Vercel builds and deploys your application:
- Frontend: Built using Vite with output in `dist` directory
- Backend: Serverless functions in the `api/` directory
- Routes: API calls are routed to the backend, all other requests serve the frontend

### `api/server.js`
The backend API configured for Vercel serverless functions:
- Uses environment variables for database connection
- Exports the Express app for Vercel compatibility
- Handles all inventory management endpoints

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify environment variables are set correctly
   - Check if your database allows connections from Vercel IPs
   - Ensure your database user has proper permissions

2. **Build Failures**
   - Check that all dependencies are properly installed
   - Verify Node.js version compatibility
   - Review build logs in Vercel dashboard

3. **404 Not Found Errors**
   - **For API endpoints**: Ensure `vercel.json` routes `/api/*` to `/api/server.js`
   - **For React Router pages**: The current `vercel.json` configuration handles this by routing all non-API requests to `index.html`
   - **If still getting 404s**: Verify your `vercel.json` file matches the provided configuration exactly

4. **API Not Working**
   - Test API endpoints directly (e.g., `your-app.vercel.app/api/users`)
   - Check Vercel function logs for errors
   - Verify database schema is imported correctly

### Getting Help

- Check Vercel deployment logs in the dashboard
- Review Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Create an issue in this repository for project-specific problems

## Alternative Deployment Methods

### Using Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the project in Vercel dashboard
3. Configure environment variables
4. Deploy

### Using Vercel CLI with Git

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Push to your remote repository
git remote add origin <your-repo-url>
git push -u origin main

# Deploy from Git
vercel --prod
```

## Performance Optimization

The build process includes:
- Code minification and compression
- Bundle splitting for faster loading
- Gzip compression enabled by default

Consider these optimizations for production:
- Use a CDN for static assets
- Enable database connection pooling
- Implement caching strategies for frequently accessed data