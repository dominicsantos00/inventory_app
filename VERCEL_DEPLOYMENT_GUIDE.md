# Vercel Deployment Guide - Inventory Management System

## Quick Start (5 minutes)

### 1. **Install Vercel CLI**
```bash
npm install -g vercel
```

### 2. **Choose a Database Provider**

Select ONE of these options:

#### Option A: PlanetScale (Recommended - Free tier available)
- Go to [planetscale.com](https://planetscale.com)
- Create account and new database
- Get connection credentials (host, user, password)

#### Option B: Railway
- Go to [railway.app](https://railway.app)
- Create MySQL database
- View database connection details

#### Option C: Supabase (PostgreSQL)
- Go to [supabase.com](https://supabase.com)
- Create database
- Get connection string

#### Option D: AWS RDS
- Create RDS MySQL instance
- Configure security groups to allow Vercel IPs
- Get connection endpoint

### 3. **Prepare Database Schema**

1. Connect to your hosted database using an SQL client
2. Run all SQL statements from `backend/schema.sql`
   - This creates all required tables and structure

### 4. **Push to GitHub**

```bash
# If not already done
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 5. **Deploy with Vercel**

#### Option A: Using Vercel CLI (Fastest)
```bash
cd c:\Users\richm\Downloads\Inventory_Management
vercel login
vercel --prod
```

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Accept default settings
5. Deploy

### 6. **Configure Environment Variables**

After deployment, Vercel will show your deployment URL. Now:

1. Go to **Vercel Dashboard** → Your Project → **Settings**
2. Navigate to **Environment Variables**
3. Add these variables (from your chosen database provider):

| Variable | Value |
|----------|-------|
| `DB_HOST` | Your database host |
| `DB_USER` | Your database username |
| `DB_PASSWORD` | Your database password |
| `DB_NAME` | `inventory_db` |

4. Click "Save" and **Redeploy**:
   - Vercel Dashboard → Deployments → Click latest → "Redeploy"

### 7. **Verify Deployment**

Test your live application:

```bash
# Test frontend
https://your-app.vercel.app

# Test API
https://your-app.vercel.app/api/deliveries
https://your-app.vercel.app/api/users

# If both work, you're deployed! ✅
```

---

## Detailed Setup by Provider

### PlanetScale Setup

1. **Create Database:**
   - Dashboard → Create new database
   - Name: `inventory_db`
   - Region: Choose closest to you

2. **Get Credentials:**
   - Connections → Connect dropdown → General
   - Copy: `host`, `user name`, `password`

3. **Update Vercel Environment Variables:**
   ```
   DB_HOST: aws.connect.psdb.cloud
   DB_USER: xxxxxxxxxxxxx
   DB_PASSWORD: pscale_pw_xxxxxxxxxxxxx
   DB_NAME: inventory_db
   ```

4. **Import Schema:**
   ```bash
   mysql -h aws.connect.psdb.cloud -u your_user -p inventory_db < backend/schema.sql
   ```

### Railway Setup

1. **Create MySQL Service:**
   - Railway Dashboard → New → MySQL
   - Wait for deployment

2. **Get Credentials:**
   - Click MySQL service
   - Variables tab
   - Copy: `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`

3. **Update Vercel:**
   ```
   DB_HOST: MYSQLHOST value
   DB_USER: MYSQLUSER value
   DB_PASSWORD: MYSQLPASSWORD value
   DB_NAME: MYSQLDATABASE value
   ```

4. **Import Schema:**
   ```bash
   mysql -h $MYSQLHOST -u $MYSQLUSER -p $MYSQLDATABASE < backend/schema.sql
   ```

---

## Troubleshooting

### ❌ "Cannot connect to database"
- ✅ Verify credentials in Vercel Environment Variables
- ✅ Check database allows connections from Vercel
- ✅ Ensure schema was imported (run `backend/schema.sql`)

### ❌ "API returns 500 error"
- ✅ Check Vercel Function logs (Dashboard → Deployments → Logs)
- ✅ Verify database connection string
- ✅ Ensure all tables exist in database

### ❌ "Frontend loads but API fails"
- ✅ API routes are at `/api/*` endpoints
- ✅ Check CORS is enabled (it is in `api/server.js`)
- ✅ Verify environment variables are set

### ❌ "Getting 404 on page refresh"
- ✅ Already handled by `vercel.json` routes
- ✅ All non-API requests route to `index.html`

---

## Project Structure for Vercel

```
inventory_management/
├── api/
│   ├── server.js          ← Backend API (Serverless Functions)
│   └── package.json
├── src/                   ← React Frontend (Vite)
│   └── ...
├── backend/              ← Local development only
│   ├── schema.sql       ← Database schema (IMPORTANT)
│   └── ...
├── package.json         ← Root dependencies (with Node 20.x)
├── vercel.json          ← Vercel configuration (DO NOT CHANGE)
├── vite.config.ts       ← Frontend build config
└── dist/                ← Build output (auto-generated)
```

---

## Security Checklist

Before going to production:

- [ ] Database credentials are in Vercel Environment Variables (NOT in code)
- [ ] `.env.local` is in `.gitignore` (already configured)
- [ ] Database user has minimum required permissions
- [ ] Database allows connections only from Vercel
- [ ] SSL/TLS enabled for database connection
- [ ] Vercel project is NOT set to public if containing sensitive data

---

## Performance Tips

1. **Database Connection Pooling:**
   - Currently set to 10 connections
   - Serverless functions are lightweight by default

2. **API Response Caching:**
   - Consider adding caching headers for GET requests
   - Reduces database load

3. **Monitor Usage:**
   - Vercel Dashboard → Analytics
   - Check function execution times and errors

---

## Support

If you encounter issues:

1. **Check Logs:**
   - Vercel Dashboard → Deployments → Logs
   
2. **Test Locally:**
   ```bash
   npm install
   npm run build
   npm --prefix api run start
   ```

3. **Contact Support:**
   - Vercel: [vercel.com/support](https://vercel.com/support)
   - Your Database Provider's support

---

## Next Steps After Deployment

1. **Set up Custom Domain:**
   - Vercel Dashboard → Settings → Domains
   - Add your domain name

2. **Enable Analytics:**
   - Vercel Dashboard → Analytics
   - Monitor application performance

3. **Set up CI/CD:**
   - Push to main branch automatically redeploys
   - No additional setup needed!

4. **Backup Database:**
   - Set up automated backups with your database provider
   - Schedule regular exports

---

**Your System is Ready to Deploy! 🚀**

Estimated deployment time: **5-10 minutes**

Questions? Check `DEPLOYMENT.md` for additional details.
