# Railway Setup Guide for Vercel Deployment

**Estimated time: 15-20 minutes**

Railway is a simple, reliable platform to host your MySQL database. This guide walks you through setup step-by-step.

---

## Step 1: Create Railway Account

1. Open [railway.app](https://railway.app) in your browser
2. Click **"Start Free"** or **"Sign Up"**
3. Choose sign-up method:
   - GitHub (Recommended - simplest)
   - Google Account
   - Email

4. Verify your email if needed
5. You're now in the Railway Dashboard

---

## Step 2: Create MySQL Database

### 2a. Create New Project

1. In Railway Dashboard, click **"Create a new project"**
2. Select **"Provision MySQL"** from the options
3. Wait 30-60 seconds for the database to initialize

### 2b. Confirm MySQL is Running

You should see:
- ✅ A green checkmark next to "MySQL"
- ✅ The service shows "Running"
- ✅ You can see resource usage (Memory, Disk)

---

## Step 3: Get Database Credentials

### 3a. Open Database Details

1. Click on the **MySQL** service in your Railway project
2. You'll see tabs at the top: **Metrics**, **Logs**, **Variables**, **Settings**
3. Click the **"Variables"** tab

### 3b. Copy Connection Credentials

You'll see a list of environment variables. **Copy these four values:**

```
MYSQLHOST=xxx.railway.app
MYSQLUSER=root
MYSQLPASSWORD=xxxxxxxxxxxxxxxx
MYSQLDATABASE=railway
```

**IMPORTANT:** Write these down or copy to a temporary safe location!

#### Alternative: Connection String

If you see a `DATABASE_URL`, it looks like:
```
mysql://root:password@host:3306/railway
```

You can use this to extract credentials:
- `MYSQLHOST` = the domain part (between `@` and `:`)
- `MYSQLUSER` = `root`
- `MYSQLPASSWORD` = the password part (between `:` first and second `:`)
- `MYSQLDATABASE` = `railway` (the database name at the end)

---

## Step 4: Import Database Schema

Your project needs the database tables. You'll import the schema from `backend/schema.sql`.

### 4a: Get MySQL Client

Choose ONE option:

#### Option A: MySQL Command Line (Windows)

```bash
# Install MySQL from: https://dev.mysql.com/downloads/mysql/
# Or if you have it installed, open Command Prompt
mysql -h MYSQLHOST_VALUE -u MYSQLUSER_VALUE -p
```

When prompted for password, paste `MYSQLPASSWORD_VALUE`

#### Option B: MySQL Workbench (GUI - Easier)

1. Download [MySQL Workbench](https://dev.mysql.com/downloads/workbench/)
2. Install and open it
3. Click **"+"** to add new connection
4. Enter details:
   - Connection Name: `Railway Inventory`
   - Hostname: `MYSQLHOST_VALUE`
   - Username: `MYSQLUSER_VALUE`
   - Password: `MYSQLPASSWORD_VALUE` (click "Store in vault")
   - Default Schema: `railway`
5. Test Connection (should succeed)

#### Option C: Online SQL Client (No Install)

1. Go to [adminer.org](https://adminer.org) or [phpmyadmin.net](https://phpmyadmin.net)
2. Enter Railway connection details
3. Connect and proceed

### 4b: Import Schema (Command Line)

If using command line:

```bash
# Navigate to your project folder
cd c:\Users\richm\Downloads\Inventory_Management

# Import schema (replace with your actual credentials)
mysql -h MYSQLHOST_VALUE -u MYSQLUSER_VALUE -p MYSQLDATABASE_VALUE < backend\schema.sql
```

When it asks for password, paste `MYSQLPASSWORD_VALUE`

### 4c: Import Schema (MySQL Workbench)

If using Workbench:

1. Connect to your Railway database
2. File → Open SQL Script
3. Select `backend/schema.sql`
4. Execute (Ctrl + Shift + Enter or click Execute button)
5. Wait for completion - should see: "X queries executed successfully"

### 4d: Verify Import

After import, you should see tables created. In any SQL client, run:

```sql
SHOW TABLES;
```

Expected output: You should see tables like `deliveries`, `stock_cards`, `users`, `reports`, etc.

---

## Step 5: Update Railway Database Name (Optional)

By default, Railway uses `railway` as the database name. You can keep it or rename:

### Keep as-is (Easiest)
Your `MYSQLDATABASE` value will be `railway` - that's fine!

### Custom Database Name (Advanced)
If you want to use `inventory_db` instead:

```sql
-- In your SQL client, run:
CREATE DATABASE inventory_db;
use inventory_db;
-- Then import the schema again
```

Then use `MYSQLDATABASE=inventory_db` in Vercel later.

---

## Step 6: Verify Database Connection

Test that your database is working:

```bash
# From your project folder
cd c:\Users\richm\Downloads\Inventory_Management

# Test with sample query
mysql -h MYSQLHOST -u MYSQLUSER -p MYSQLDATABASE -e "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'MYSQLDATABASE';"
```

You should see a number greater than 0 (count of imported tables).

---

## Step 7: Deploy to Vercel

Now deploy your application with Railway database.

### 7a: Build and Test Locally (Optional but Recommended)

```bash
cd c:\Users\richm\Downloads\Inventory_Management

# Install dependencies
npm install

# Build frontend
npm run build

# Test API with environment variables
$env:DB_HOST = "MYSQLHOST"
$env:DB_USER = "MYSQLUSER"
$env:DB_PASSWORD = "MYSQLPASSWORD"
$env:DB_NAME = "MYSQLDATABASE"
# Then test API
```

### 7b: Deploy with Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Deploy!
cd c:\Users\richm\Downloads\Inventory_Management
vercel --prod
```

Follow Vercel prompts. When asked about existing `vercel.json`, keep it.

### 7c: Add Environment Variables to Vercel

1. After deployment, go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your project
3. Settings → Environment Variables
4. Add these 4 variables:

| Variable | Value |
|----------|-------|
| `DB_HOST` | Your MYSQLHOST (e.g., `xxx.railway.app`) |
| `DB_USER` | Your MYSQLUSER (usually `root`) |
| `DB_PASSWORD` | Your MYSQLPASSWORD (the long string) |
| `DB_NAME` | Your MYSQLDATABASE (e.g., `railway` or `inventory_db`) |

5. Click **"Save"**
6. You'll see a notification to **"Redeploy"** - click it

### 7d: Wait for Redeployment

Vercel will redeploy with your environment variables. Wait 1-2 minutes.

---

## Step 8: Test Your Deployment

### 8a: Get Your Vercel URL

In Vercel Dashboard → Deployments, you'll see your URL like:
```
https://your-app-name.vercel.app
```

### 8b: Test Frontend

Open in browser:
```
https://your-app-name.vercel.app
```

You should see your Inventory Management system load.

### 8c: Test API

Open in browser:
```
https://your-app-name.vercel.app/api/deliveries
```

You should get a JSON response with delivery data (or empty array `[]` if no data yet).

### 8d: Both Working? 🎉

If both tests pass, **you're deployed!**

---

## Troubleshooting

### ❌ "Cannot connect to database"

**Check 1: Verify credentials**
- Copy credentials again from Railway Variables tab
- No extra spaces or typos
- Password doesn't have special characters that need escaping

**Check 2: Check Vercel environment variables**
- Go to Vercel Dashboard → Settings → Environment Variables
- Verify all 4 variables are there
- Check for typos

**Check 3: Redeploy**
- Vercel Dashboard → Deployments → Click latest → Redeploy
- Wait 2 minutes for redeployment

**Check 4: Check Vercel logs**
- Vercel Dashboard → Deployments → Click latest
- Scroll down to see Function logs
- Look for database connection errors

### ❌ "404 Not Found on /api/deliveries"

**Check:**
- Frontend is loading correctly? ✓
- `api/server.js` exists in your project? ✓
- `vercel.json` is properly configured? ✓
- Run: `git status` to see if files are committed

### ❌ "Railway database connection timeout"

**Solutions:**
1. Check Railway Dashboard - is MySQL still running? (should be green)
2. Sometimes Railway restarts services - wait 2 minutes and try again
3. Check Railway logs → Logs tab for error messages

### ❌ "Cannot import schema - access denied"

**Fix:**
- Verify `MYSQLUSER` is correct (usually `root`)
- Verify `MYSQLPASSWORD` is correct (copy from Railway Variables again)
- Make sure you're connecting to right `MYSQLHOST`

---

## Next Steps

### 1. Add Sample Data
Connect to your Railway database and insert sample data:

```sql
INSERT INTO deliveries (type, date, supplier, item, item_description, unit, quantity, unit_price, total_price) 
VALUES ('IN', NOW(), 'Test Supplier', 'ITEM001', 'Test Item', 'pcs', 100, 50.00, 5000.00);
```

### 2. Custom Domain (Optional)
In Vercel Dashboard → Settings → Domains, add your custom domain.

### 3. Monitor Database
Railway Dashboard → Metrics tab to see:
- CPU usage
- Memory usage
- Disk usage
- Connection count

### 4. Database Backups
Railway automatically backs up your database. You can export manually:
- Railway Dashboard → MySQL → Settings → Export

---

## Railway Project Structure

After setup, you'll have:

```
Railway Project
├── MySQL Service
│   ├── Connection: railway.app
│   ├── Username: root
│   ├── Password: (auto-generated)
│   ├── Database: railway
│   └── Status: Running ✓
└── Environment Variables (Available for Vercel)
```

---

## Support

If you get stuck:

1. **Railway Support**: [railway.app/help](https://railway.app)
2. **Vercel Logs**: Vercel Dashboard → Deployments → Logs tab
3. **Database Connection**: Test with MySQL client to isolate issues

---

## Quick Reference

**Railway MySQL Credentials:**
```
MYSQLHOST = _______________
MYSQLUSER = _______________
MYSQLPASSWORD = _______________
MYSQLDATABASE = _______________
```

**Vercel Environment Variables:**
- `DB_HOST` = MYSQLHOST
- `DB_USER` = MYSQLUSER
- `DB_PASSWORD` = MYSQLPASSWORD
- `DB_NAME` = MYSQLDATABASE

**Test URLs:**
- Frontend: `https://your-app.vercel.app`
- API: `https://your-app.vercel.app/api/deliveries`

---

**You're ready to deploy! Start with Step 1.** 🚀
