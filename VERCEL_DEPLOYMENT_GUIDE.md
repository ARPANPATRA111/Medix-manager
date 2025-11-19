# 🚀 Vercel Deployment Guide for Hospital Management System

This guide will walk you through deploying your Hospital Management System to Vercel with Vercel Postgres database.

## 📋 Prerequisites

- Vercel account (sign up at https://vercel.com)
- GitHub account
- Your code pushed to a GitHub repository

---

## 🔧 Step 1: Prepare Your Repository

### 1.1 Verify Required Files Exist

Make sure these files are in your repository:
- ✅ `.vercelignore` (already created)
- ✅ `.env.example` (already created)
- ✅ `DEPLOYMENT_GUIDE.md` (already created)
- ✅ `vercel.json` (we'll create this)

### 1.2 Create `vercel.json` Configuration

Create a file named `vercel.json` in your project root:

```json
{
  "buildCommand": "npm run vercel-build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["bom1"]
}
```

### 1.3 Commit and Push All Changes

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin Initial_Implementation
```

---

## 🌐 Step 2: Set Up Vercel Project

### 2.1 Import Your Repository

1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository: `ARPANPATRA111/Medix-manager`
4. Select the `Initial_Implementation` branch
5. Click **"Import"**

### 2.2 Configure Project Settings

**Framework Preset**: Next.js (should auto-detect)

**Root Directory**: `.` (leave as default)

**Build & Development Settings**:
- Build Command: `npm run vercel-build` (this will run migrations + build)
- Output Directory: `.next` (default)
- Install Command: `npm install` (default)

---

## 🗄️ Step 3: Set Up Vercel Postgres Database

### 3.1 Create Database (ALREADY DONE! ✅)

You already have:
- DATABASE_URL (Prisma Accelerate)
- DIRECT_URL (Direct Postgres connection)
- These are in your `.env` file

### 3.2 Verify Database Tables

Your database tables are already created from running `npx prisma db push` locally!

---

## 🔐 Step 4: Configure Environment Variables

In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**, add these:

### Required Variables:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `DATABASE_URL` | `prisma+postgres://accelerate.prisma-data.net/?api_key=...` | From your `.env` file |
| `DIRECT_URL` | `postgres://...@db.prisma.io:5432/postgres?sslmode=require` | From your `.env` file |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Will get after first deploy |
| `NEXTAUTH_SECRET` | Generate new one (see below) | For production |
| `ADMIN_EMAIL` | `admin@hospital.com` | Or your preferred admin email |
| `ADMIN_PASSWORD` | `your-secure-password` | Change from default! |

### Generate NEXTAUTH_SECRET:

Run this command locally:
```bash
openssl rand -base64 32
```

Or use this PowerShell command:
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))
```

Copy the output and use it as `NEXTAUTH_SECRET`.

### Important Notes:
- ⚠️ **DO NOT** add `.env` to environment variables scope - add each variable individually
- ✅ Apply variables to: **Production**, **Preview**, and **Development** environments
- 🔒 Mark sensitive variables (passwords, secrets) as "Sensitive"

---

## 🚀 Step 5: Deploy!

### 5.1 First Deployment

1. After setting environment variables, click **"Deploy"** in Vercel
2. Wait for build to complete (3-5 minutes)
3. Vercel will:
   - Install dependencies
   - Generate Prisma Client
   - Run database migrations (`prisma migrate deploy`)
   - Build Next.js app
   - Deploy to production

### 5.2 Update NEXTAUTH_URL

After first deployment:
1. Copy your deployment URL (e.g., `https://medix-manager.vercel.app`)
2. Go to **Settings** → **Environment Variables**
3. Update `NEXTAUTH_URL` to your actual URL
4. Redeploy: **Deployments** → **⋮** → **Redeploy**

---

## 🔍 Step 6: Verify Deployment

### 6.1 Check Deployment Logs

1. Go to **Deployments** tab
2. Click on your latest deployment
3. Check **Build Logs** for any errors
4. Verify these steps completed:
   - ✅ `npm install`
   - ✅ `prisma generate`
   - ✅ `prisma migrate deploy`
   - ✅ `next build`

### 6.2 Test Your Application

1. Visit your deployment URL
2. Try to sign in with admin credentials:
   - Email: `admin@hospital.com`
   - Password: (the one you set)

3. Test key features:
   - ✅ Dashboard loads
   - ✅ Patient registration
   - ✅ Appointments
   - ✅ Pharmacy dispensing
   - ✅ Billing

---

## 🛠️ Step 7: Post-Deployment Configuration

### 7.1 Set Up Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

### 7.2 Configure Production Database Backup

Vercel Postgres includes automatic backups, but verify:
1. Go to **Storage** tab
2. Select your Postgres database
3. Check **Backups** section
4. Backups are automatic every 24 hours

### 7.3 Monitor Application

1. **Analytics**: Vercel provides built-in analytics
2. **Logs**: Check **Deployments** → **Functions** for runtime logs
3. **Performance**: Monitor Core Web Vitals in **Analytics**

---

## 🔄 Step 8: Future Updates

### 8.1 Continuous Deployment

Every time you push to `Initial_Implementation` branch:
- Vercel automatically builds and deploys
- Migrations run automatically via `vercel-build` script

### 8.2 Manual Deployment

If needed:
```bash
npm install -g vercel
vercel --prod
```

### 8.3 Database Migrations

When you add new Prisma models:

1. **Locally**:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

2. **Commit migration files**:
   ```bash
   git add prisma/migrations
   git commit -m "Add new migration"
   git push
   ```

3. **Vercel will automatically run** `prisma migrate deploy` on next deployment

---

## 🐛 Troubleshooting

### Build Fails

**Problem**: `prisma generate` fails
**Solution**: Ensure `DATABASE_URL` is set in environment variables

**Problem**: Migration errors
**Solution**: Check `DIRECT_URL` is correct and database is accessible

### Runtime Errors

**Problem**: "Database connection failed"
**Solution**: 
- Verify `DATABASE_URL` starts with `prisma+postgres://`
- Check Prisma Accelerate API key is valid

**Problem**: "NextAuth session error"
**Solution**: 
- Ensure `NEXTAUTH_URL` matches your deployment URL
- Verify `NEXTAUTH_SECRET` is set

### Performance Issues

**Problem**: Slow database queries
**Solution**: 
- Prisma Accelerate provides connection pooling
- Monitor queries in Vercel Logs
- Consider adding database indexes

---

## 📊 Step 9: Seed Database (Optional)

If you need to seed the production database:

### Option 1: Using Vercel CLI

```bash
vercel env pull .env.production
npx prisma db seed --env-file .env.production
```

### Option 2: Create API Endpoint

Create `src/app/api/seed/route.ts`:

```typescript
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  // Add authentication check here!
  const { secret } = await request.json()
  
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Seed admin user
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 10)
  
  await db.user.create({
    data: {
      email: process.env.ADMIN_EMAIL!,
      password: hashedPassword,
      name: "System Admin",
      role: "ADMIN",
      isActive: true
    }
  })

  return NextResponse.json({ success: true })
}
```

Then call: `POST https://your-app.vercel.app/api/seed` with `{ "secret": "your-secret" }`

---

## ✅ Deployment Checklist

Before going live:

- [ ] All environment variables set in Vercel
- [ ] `NEXTAUTH_SECRET` is unique and secure
- [ ] `NEXTAUTH_URL` points to production URL
- [ ] Database migrations completed successfully
- [ ] Admin user can login
- [ ] All core features tested
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring and logging verified
- [ ] Backup strategy confirmed

---

## 🎉 Success!

Your Hospital Management System is now live on Vercel!

**Deployment URL**: https://your-app.vercel.app

### Next Steps:
1. Change default admin password immediately
2. Create additional user accounts
3. Configure role-based permissions
4. Set up regular backups
5. Monitor application performance

### Support Resources:
- Vercel Documentation: https://vercel.com/docs
- Prisma Documentation: https://www.prisma.io/docs
- Next.js Documentation: https://nextjs.org/docs

---

## 📝 Important Notes

### Security
- 🔒 Never commit `.env` file to GitHub
- 🔑 Use strong passwords for admin accounts
- 🛡️ Enable 2FA for Vercel account
- 🔐 Rotate secrets regularly

### Database
- 📊 Monitor connection pool usage
- 💾 Verify automatic backups are running
- 🔄 Test restore process periodically
- 📈 Monitor query performance

### Cost Management
- Vercel Hobby plan: Free for personal projects
- Prisma Accelerate: Free tier includes 1GB data
- Monitor usage in Vercel dashboard
- Upgrade plan as needed

---

**Happy Deploying! 🚀**
