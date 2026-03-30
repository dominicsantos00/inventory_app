# Railway + Vercel Deployment Checklist

Use this checklist as you follow the [RAILWAY_SETUP_GUIDE.md](RAILWAY_SETUP_GUIDE.md)

---

## PHASE 1: Railway Database Setup (5-10 minutes)

- [ ] **Step 1:** Go to [railway.app](https://railway.app) and create account
  - Sign up with GitHub/Google/Email
  - Verify email if needed

- [ ] **Step 2:** Create new project and provision MySQL
  - Create new project
  - Select "Provision MySQL"
  - Wait for MySQL to show green "Running"

- [ ] **Step 3:** Get database credentials from Variables tab
  - Copy: `MYSQLHOST`
  - Copy: `MYSQLUSER` 
  - Copy: `MYSQLPASSWORD`
  - Copy: `MYSQLDATABASE`
  - **Save these somewhere safe!**

- [ ] **Step 4:** Import database schema
  - [ ] Option A: Use MySQL Workbench GUI
  - [ ] Option B: Use MySQL command line
  - [ ] Option C: Use online SQL client
  
  Use this command (replace with your values):
  ```bash
  mysql -h MYSQLHOST -u MYSQLUSER -p MYSQLDATABASE < backend\schema.sql
  ```

- [ ] **Step 5:** Verify schema imported
  - Run: `SHOW TABLES;`
  - You should see: `deliveries`, `stock_cards`, `users`, `reports`, etc.

---

## PHASE 2: Vercel Deployment (5-10 minutes)

- [ ] **Step 6:** Install and login to Vercel CLI
  ```bash
  npm install -g vercel
  vercel login
  ```

- [ ] **Step 7:** Deploy to Vercel
  ```bash
  cd c:\Users\richm\Downloads\Inventory_Management
  vercel --prod
  ```
  - Follow prompts
  - Wait for deployment (2-3 minutes)

- [ ] **Step 8:** Add Environment Variables in Vercel Dashboard
  1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
  2. Click your project
  3. Settings → Environment Variables
  4. Add these 4 variables:
     - [ ] `DB_HOST` = `MYSQLHOST value`
     - [ ] `DB_USER` = `MYSQLUSER value`
     - [ ] `DB_PASSWORD` = `MYSQLPASSWORD value`
     - [ ] `DB_NAME` = `MYSQLDATABASE value`
  5. Click "Save"
  6. Click "Redeploy" when prompted

- [ ] **Step 9:** Wait for redeployment (1-2 minutes)

---

## PHASE 3: Testing (2-5 minutes)

- [ ] **Test 1:** Frontend loads
  ```
  https://your-app.vercel.app
  ```
  ✓ Should show login page

- [ ] **Test 2:** API responds
  ```
  https://your-app.vercel.app/api/deliveries
  ```
  ✓ Should show JSON data (or empty array `[]`)

- [ ] **Both tests pass?** 🎉 **YOU'RE DEPLOYED!**

---

## If Something Goes Wrong

### Checklist Before Debugging

- [ ] Vercel environment variables are saved? (Refresh dashboard to confirm)
- [ ] You clicked "Redeploy"?
- [ ] You waited 2+ minutes after redeploy?
- [ ] Railway MySQL is still running? (Check Railway Dashboard)
- [ ] Database credentials copied correctly? (No extra spaces)

### Common Issues & Fixes

| Issue | Check | Fix |
|-------|-------|-----|
| API returns 500 error | Check Vercel logs (Deployments → Logs) | Usually database credentials issue |
| "Cannot connect to database" | Verify DB credentials in Vercel | Copy credentials again from Railway |
| Frontend loads but API fails | Check CORS - it's enabled in code | Might be database connection issue |
| Page shows 404 | Check `vercel.json` exists | Run `git status` to verify files committed |
| Railway DB not responding | Check Railway Dashboard - is it green? | Sometimes needs restart, wait 2 mins |

---

## Quick Reference

**Railway Database Credentials:**
```
MYSQLHOST = ____________________________
MYSQLUSER = ____________________________
MYSQLPASSWORD = ____________________________
MYSQLDATABASE = ____________________________
```

**Vercel Project URL:**
```
https://____________________________
```

**Test URLs:**
- Frontend: https://your-app.vercel.app
- API: https://your-app.vercel.app/api/deliveries

---

## Need Help?

1. **Check logs:** Vercel Dashboard → Deployments → Latest → Logs
2. **Railway status:** Railway Dashboard → MySQL service
3. **Guides:**
   - Full guide: [RAILWAY_SETUP_GUIDE.md](RAILWAY_SETUP_GUIDE.md)
   - General deployment: [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md)
   - Original deployment doc: [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Start with Step 1 of [RAILWAY_SETUP_GUIDE.md](RAILWAY_SETUP_GUIDE.md)** → Then come back here to track progress! ✅
