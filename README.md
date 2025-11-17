# Hospital Management System (HMS)

A comprehensive hospital management system built with Next.js 16, TypeScript, Prisma, SQLite, and NextAuth for authentication.

## 🚀 Features

### ✅ Completed Modules

#### Authentication & Authorization
- **NextAuth.js** integration with credentials provider
- **Role-based access control** (RBAC) with 8 user roles:
  - Admin, Doctor, Nurse, Receptionist, Lab Technician, Radiologist, Pharmacist, Accountant
- **Secure password hashing** with bcrypt
- **Protected routes** with middleware
- **Session management**

#### Patient Management
- **Patient registration** with comprehensive form validation
- **Patient search** by name, MRN, phone, or email
- **Patient details view** with medical history
- **Visit history tracking**
- **Allergy and blood group management**
- **Emergency contact information**
- **Responsive design** with mobile and desktop views

#### Dashboard
- **Role-based dashboard** with different views per user type
- **Real-time statistics** including:
  - Total patients
  - Today's appointments
  - Pending lab orders
  - Low stock drugs
  - Bed occupancy rates
  - Unpaid bills
- **Quick actions** for common tasks
- **Notification system** for important alerts

#### Database Schema
- **Comprehensive SQLite database** with 30+ tables
- **Proper relationships** and foreign keys
- **Data integrity** with constraints
- **Activity logging** for audit trails
- **Soft delete** for important records

### 🏗️ In Progress
- Appointment booking system with conflict checking
- OPD/IPD workflows
- Laboratory management
- Pharmacy management

### 🎯 Planned Features
- Ward and bed management
- Radiology module
- Prescription management
- Billing and invoicing
- Reports and analytics

## 🛠️ Technology Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Database:** SQLite with Prisma ORM
- **Authentication:** NextAuth.js
- **UI Components:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Date Handling:** date-fns

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

The `.env` file is already configured with:
- SQLite database connection
- NextAuth secret and URL
- Default admin credentials

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (already done)
npx prisma migrate dev

# Seed the database with sample data
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to access the application.

## 👥 Default User Accounts

| Role | Email | Password | Access |
|------|-------|----------|---------|
| Admin | admin@hospital.com | admin123 | Full system access |
| Doctor | doctor@hospital.com | admin123 | Patient care, prescriptions |
| Nurse | nurse@hospital.com | admin123 | Ward management, vitals |
| Lab Technician | lab@hospital.com | admin123 | Laboratory tests |
| Pharmacist | pharmacy@hospital.com | admin123 | Medication management |

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Protected dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components
│   └── patients/          # Patient-specific components
├── lib/                   # Utilities and configurations
│   ├── actions/           # Server actions
│   ├── validations/       # Zod schemas
│   ├── auth.ts           # NextAuth configuration
│   └── db.ts             # Database connection
├── types/                 # TypeScript type definitions
└── middleware.ts          # Route protection middleware

prisma/
├── schema.prisma          # Database schema
├── migrations/            # Database migrations
└── seed.ts               # Database seeding script
```

## 🔒 Security Features

- **Password hashing** with bcrypt
- **CSRF protection** via NextAuth
- **SQL injection prevention** via Prisma ORM
- **Role-based access control**
- **Input validation** with Zod
- **Activity logging** for audit trails

## 📊 Database Design

The system includes comprehensive entities:
- **Users & Authentication** (Users, Sessions, Accounts)
- **Medical Staff** (Doctors, Nurses, Lab Technicians, Pharmacists)
- **Patients** (Patient records, emergency contacts)
- **Appointments** (Scheduling, doctor availability)
- **Medical Records** (Visits, vitals, nurse notes)
- **Ward Management** (Wards, beds, admissions)
- **Laboratory** (Tests, orders, results)
- **Radiology** (Imaging tests, reports)
- **Pharmacy** (Drugs, prescriptions, dispensing)
- **Billing** (Services, bills, payments)
- **Audit** (Activity logs)

## 🎨 UI/UX Features

- **Responsive design** for all screen sizes
- **Clean, modern interface** with consistent styling
- **Loading states** and error handling
- **Form validation** with real-time feedback
- **Toast notifications** for user feedback
- **Keyboard navigation** support
- **Accessible components** with proper ARIA labels

## 📈 Performance Optimizations

- **Server Components** for improved performance
- **Client-side caching** with React Query patterns
- **Optimistic updates** for better UX
- **Lazy loading** for large datasets
- **Proper database indexing**

## 🧪 Development Features

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** integration ready
- **Hot reload** in development
- **Error boundaries** for graceful error handling

## 📝 API Endpoints

### Authentication
- `GET/POST /api/auth/*` - NextAuth endpoints

### Patients (Server Actions)
- `createPatient()` - Create new patient
- `updatePatient()` - Update patient information
- `searchPatients()` - Search patients by various criteria
- `getPatientById()` - Get detailed patient information

## 🚀 Deployment

The application is ready for deployment on:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Docker containers**

For production deployment:
1. Update environment variables
2. Configure production database
3. Set up proper domain and SSL
4. Enable database backups

## 🔄 Development Roadmap

### Phase 1 (Completed)
- [x] Authentication system
- [x] Patient management
- [x] Basic dashboard
- [x] Database schema

### Phase 2 (In Progress)
- [ ] Appointment scheduling
- [ ] Doctor schedules
- [ ] Conflict checking
- [ ] OPD workflows

### Phase 3 (Planned)
- [ ] IPD management
- [ ] Ward and bed assignment
- [ ] Laboratory module
- [ ] Radiology integration

### Phase 4 (Future)
- [ ] Pharmacy management
- [ ] Prescription workflows
- [ ] Billing system
- [ ] Reports and analytics

## 📊 System Metrics

- **Database Tables:** 30+
- **UI Components:** 20+ shadcn/ui components
- **User Roles:** 8 different roles
- **Validation Schemas:** Comprehensive Zod validation
- **Security Features:** Multi-layer protection

## 🤝 Contributing

This is a production-style hospital management system. For contributions:
1. Follow TypeScript best practices
2. Ensure proper validation with Zod
3. Add comprehensive error handling
4. Test on multiple screen sizes
5. Maintain security standards

## 📧 Support

For issues or questions about the hospital management system, please refer to:
- Database schema documentation in `/prisma/schema.prisma`
- Component documentation in respective files
- TypeScript types in `/src/types/`

## ⚠️ Important Notes

- **Data Security:** Ensure proper backup procedures in production
- **HIPAA Compliance:** Additional measures needed for healthcare data
- **Performance:** Monitor database performance with larger datasets
- **Updates:** Keep dependencies updated for security

---

**Built with ❤️ for modern healthcare management**
