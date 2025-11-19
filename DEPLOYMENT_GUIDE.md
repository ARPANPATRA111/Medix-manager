## 🚀 Vercel Deployment Steps

### Prerequisites Changed:
✅ Database migrated from SQLite to PostgreSQL
✅ Build scripts updated for Vercel
✅ Environment variables configured

---

## Step-by-Step Deployment Guide

### 1️⃣ **Set Up PostgreSQL Database**

**Option A: Vercel Postgres (Easiest)**
```bash
# After connecting your project to Vercel:
1. Go to your Vercel project dashboard
2. Navigate to "Storage" tab
3. Click "Create Database" → Select "Postgres"
4. Vercel will automatically add DATABASE_URL to your environment variables
```

**Option B: Supabase (Free tier available)**
```bash
1. Go to https://supabase.com
2. Create a new project
3. Go to Project Settings → Database
4. Copy the "Connection string" (Transaction mode)
5. Use it as DATABASE_URL
```

**Option C: Neon (Free tier, serverless)**
```bash
1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string
4. Use it as DATABASE_URL
```

---

### 2️⃣ **Generate a Secure NEXTAUTH_SECRET**

```bash
# Run this command to generate a secure secret:
openssl rand -base64 32

# Or use Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

### 3️⃣ **Deploy to Vercel**

**Option A: Using Vercel CLI (Recommended)**
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
cd C:\Users\Arpan\Desktop\HHH\arp
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? medix-manager (or your choice)
# - Directory? ./
# - Override settings? No

# After first deployment, for production:
vercel --prod
```

**Option B: Using Vercel Dashboard (Easier for beginners)**
```bash
1. Push your code to GitHub:
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin Initial_Implementation

2. Go to https://vercel.com
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: ./
   - Build Command: npm run vercel-build (auto-detected)
   - Output Directory: .next (auto-detected)
```

---

### 4️⃣ **Configure Environment Variables in Vercel**

Go to your Vercel project → Settings → Environment Variables

Add these variables:

```env
# Database (from Step 1)
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# NextAuth (from Step 2)
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=https://your-app.vercel.app

# Admin Credentials (optional, for seeding)
ADMIN_EMAIL=admin@hospital.com
ADMIN_PASSWORD=admin123
```

**Important:** Make sure to add variables for:
- ✅ Production
- ✅ Preview (optional)
- ✅ Development (optional)

---

### 5️⃣ **Run Database Migrations**

After deployment, you need to set up the database:

**Option A: Using Vercel CLI**
```bash
# Set your DATABASE_URL locally for migration
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy

# Seed the database (create admin user)
npm run db:seed
```

**Option B: Using Vercel Dashboard**
```bash
1. Go to your Vercel project
2. Click "Deployments"
3. Click on your latest deployment
4. Go to "Functions" or use the terminal (if available)
5. Run: npx prisma migrate deploy
```

---

### 6️⃣ **Verify Deployment**

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Test login with admin credentials
3. Check all features:
   - ✅ Patient management
   - ✅ Doctor scheduling
   - ✅ Appointments
   - ✅ Ward admissions
   - ✅ Pharmacy dispensing
   - ✅ Billing system

---

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Test your connection string locally:
npx prisma db pull

# If it fails, check:
1. Is DATABASE_URL correct?
2. Does it include ?sslmode=require ?
3. Is the database accessible from outside?
```

### Build Failures
```bash
# Check Vercel build logs:
1. Go to Deployments → Click failed deployment
2. View Function Logs
3. Common issues:
   - Missing environment variables
   - Prisma client not generated
   - TypeScript errors
```

### Authentication Issues
```bash
# Common fixes:
1. NEXTAUTH_URL must match your Vercel domain
2. NEXTAUTH_SECRET must be set
3. Clear browser cookies and try again
```

---

## 📝 Post-Deployment Checklist

- [ ] Database is set up and accessible
- [ ] Environment variables are configured in Vercel
- [ ] Migrations are deployed successfully
- [ ] Admin user is seeded
- [ ] Can login to the application
- [ ] All features work correctly
- [ ] Custom domain configured (optional)

---

## 🔄 Future Deployments

After initial setup, deployments are automatic:

```bash
# Just push to GitHub:
git add .
git commit -m "Update features"
git push origin Initial_Implementation

# Vercel will automatically deploy!
```

Or use CLI:
```bash
vercel --prod
```

---

## 💡 Pro Tips

1. **Use Preview Deployments**: Each PR gets its own URL
2. **Environment Variables**: Keep production secrets separate from preview
3. **Database Backups**: Set up automated backups for your PostgreSQL database
4. **Monitoring**: Use Vercel Analytics to track performance
5. **Custom Domain**: Add your own domain in Vercel settings

---

## 🆘 Need Help?

- Vercel Docs: https://vercel.com/docs
- Prisma + Vercel: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
- Next.js on Vercel: https://nextjs.org/docs/deployment

---

## 🎉 Your App is Live!

Once deployed, share your hospital management system:
- URL: `https://your-app.vercel.app`
- Admin login: admin@hospital.com / admin123
- Remember to change admin password after first login!
