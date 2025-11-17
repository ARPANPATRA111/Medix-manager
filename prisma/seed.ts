import { PrismaClient, UserRole, Gender } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Hash password for default users
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hospital.com' },
    update: {},
    create: {
      email: 'admin@hospital.com',
      name: 'System Admin',
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  })

  // Create doctor user
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@hospital.com' },
    update: {},
    create: {
      email: 'doctor@hospital.com',
      name: 'Dr. John Smith',
      password: hashedPassword,
      role: UserRole.DOCTOR,
    },
  })

  // Create doctor profile
  const doctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      licenseNumber: 'MD001',
      specialization: 'General Medicine',
      qualification: 'MBBS, MD',
      experience: 10,
      consultationFee: 500,
      availableFrom: '09:00',
      availableTo: '17:00',
      department: 'General Medicine',
      maxPatientsPerDay: 25,
      phone: '+1234567890',
      email: 'dr.smith@hospital.com',
    },
  })

  // Create doctor schedule (Monday to Friday)
  for (let day = 1; day <= 5; day++) {
    await prisma.doctorSchedule.upsert({
      where: {
        doctorId_dayOfWeek: {
          doctorId: doctor.id,
          dayOfWeek: day,
        },
      },
      update: {},
      create: {
        doctorId: doctor.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
      },
    })
  }

  // Create nurse user
  const nurseUser = await prisma.user.upsert({
    where: { email: 'nurse@hospital.com' },
    update: {},
    create: {
      email: 'nurse@hospital.com',
      name: 'Sister Mary',
      password: hashedPassword,
      role: UserRole.NURSE,
    },
  })

  // Create nurse profile
  await prisma.nurse.upsert({
    where: { userId: nurseUser.id },
    update: {},
    create: {
      userId: nurseUser.id,
      department: 'General Ward',
      shift: 'DAY',
    },
  })

  // Create lab technician user
  const labTechUser = await prisma.user.upsert({
    where: { email: 'lab@hospital.com' },
    update: {},
    create: {
      email: 'lab@hospital.com',
      name: 'Lab Technician',
      password: hashedPassword,
      role: UserRole.LAB_TECHNICIAN,
    },
  })

  await prisma.labTechnician.upsert({
    where: { userId: labTechUser.id },
    update: {},
    create: {
      userId: labTechUser.id,
      department: 'Pathology',
    },
  })

  // Create pharmacist user
  const pharmacistUser = await prisma.user.upsert({
    where: { email: 'pharmacy@hospital.com' },
    update: {},
    create: {
      email: 'pharmacy@hospital.com',
      name: 'Pharmacist John',
      password: hashedPassword,
      role: UserRole.PHARMACIST,
    },
  })

  await prisma.pharmacist.upsert({
    where: { userId: pharmacistUser.id },
    update: {},
    create: {
      userId: pharmacistUser.id,
      licenseNumber: 'PH001',
    },
  })

  // Create wards
  const generalWard = await prisma.ward.upsert({
    where: { name: 'General Ward' },
    update: {},
    create: {
      name: 'General Ward',
      wardType: 'GENERAL',
      totalBeds: 20,
    },
  })

  const icuWard = await prisma.ward.upsert({
    where: { name: 'ICU' },
    update: {},
    create: {
      name: 'ICU',
      wardType: 'ICU',
      totalBeds: 10,
    },
  })

  const privateWard = await prisma.ward.upsert({
    where: { name: 'Private Ward' },
    update: {},
    create: {
      name: 'Private Ward',
      wardType: 'PRIVATE',
      totalBeds: 15,
    },
  })

  // Create beds
  const wards = [generalWard, icuWard, privateWard]
  const bedPrices: Record<string, number> = {
    'GENERAL': 500,
    'ICU': 2000,
    'PRIVATE': 1500,
  }
  
  for (const ward of wards) {
    for (let i = 1; i <= ward.totalBeds; i++) {
      const bedNumber = `${ward.name.charAt(0)}${i.toString().padStart(2, '0')}`
      await prisma.bed.upsert({
        where: {
          wardId_bedNumber: {
            wardId: ward.id,
            bedNumber,
          },
        },
        update: {},
        create: {
          wardId: ward.id,
          bedNumber,
          bedType: ward.wardType,
          pricePerDay: bedPrices[ward.wardType] || 500,
        },
      })
    }
  }

  // Create lab tests
  const labTests = [
    { name: 'Complete Blood Count', code: 'CBC', category: 'HEMATOLOGY', price: 300, normalRange: '4.5-11.0', unit: '10^9/L' },
    { name: 'Blood Sugar (Fasting)', code: 'BSF', category: 'BIOCHEMISTRY', price: 150, normalRange: '70-100', unit: 'mg/dL' },
    { name: 'Liver Function Test', code: 'LFT', category: 'BIOCHEMISTRY', price: 800, normalRange: 'Various', unit: 'Various' },
    { name: 'Kidney Function Test', code: 'KFT', category: 'BIOCHEMISTRY', price: 600, normalRange: 'Various', unit: 'Various' },
    { name: 'Thyroid Function Test', code: 'TFT', category: 'HORMONES', price: 1200, normalRange: 'Various', unit: 'Various' },
    { name: 'Urine Routine', code: 'UR', category: 'MICROBIOLOGY', price: 200, normalRange: 'Normal', unit: '-' },
  ]

  for (const test of labTests) {
    await prisma.labTest.upsert({
      where: { code: test.code },
      update: {},
      create: test,
    })
  }

  // Create radiology tests
  const radiologyTests = [
    { name: 'Chest X-Ray', code: 'CXR', category: 'X-RAY', price: 800 },
    { name: 'CT Scan Head', code: 'CTH', category: 'CT', price: 3500 },
    { name: 'MRI Brain', code: 'MRIB', category: 'MRI', price: 8000 },
    { name: 'Ultrasound Abdomen', code: 'USG', category: 'ULTRASOUND', price: 1500 },
    { name: 'ECG', code: 'ECG', category: 'CARDIAC', price: 300 },
    { name: 'ECHO', code: 'ECHO', category: 'CARDIAC', price: 2000 },
  ]

  for (const test of radiologyTests) {
    await prisma.radiologTest.upsert({
      where: { code: test.code },
      update: {},
      create: test,
    })
  }

  // Create drugs
  const drugs = [
    {
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      strength: '500mg',
      dosageForm: 'TABLET',
      manufacturer: 'Generic Pharma',
      price: 2.50,
      currentStock: 1000,
    },
    {
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      strength: '250mg',
      dosageForm: 'CAPSULE',
      manufacturer: 'Antibiotic Co.',
      price: 8.50,
      currentStock: 500,
    },
    {
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      strength: '400mg',
      dosageForm: 'TABLET',
      manufacturer: 'Pain Relief Ltd',
      price: 5.00,
      currentStock: 800,
    },
    {
      name: 'Omeprazole',
      genericName: 'Omeprazole',
      strength: '20mg',
      dosageForm: 'CAPSULE',
      manufacturer: 'Gastro Pharma',
      price: 12.00,
      currentStock: 300,
    },
    {
      name: 'Metformin',
      genericName: 'Metformin HCl',
      strength: '500mg',
      dosageForm: 'TABLET',
      manufacturer: 'Diabetes Care',
      price: 3.50,
      currentStock: 600,
    },
  ]

  for (const drug of drugs) {
    await prisma.drug.upsert({
      where: { name: drug.name },
      update: {},
      create: drug,
    })
  }

  // Create services
  const services = [
    { name: 'Doctor Consultation', code: 'CONS', category: 'CONSULTATION', price: 500 },
    { name: 'General Ward Bed', code: 'GWB', category: 'ROOM_CHARGE', price: 800 },
    { name: 'ICU Bed', code: 'ICU', category: 'ROOM_CHARGE', price: 2500 },
    { name: 'Private Room', code: 'PVT', category: 'ROOM_CHARGE', price: 1500 },
    { name: 'Emergency Service', code: 'EMG', category: 'EMERGENCY', price: 1000 },
    { name: 'Operation Theater', code: 'OT', category: 'PROCEDURE', price: 5000 },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { code: service.code },
      update: {},
      create: service,
    })
  }

  // Create sample patient
  const patient = await prisma.patient.create({
    data: {
      mrn: 'MRN001',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-05-15'),
      gender: Gender.MALE,
      phoneNumber: '+1234567890',
      email: 'john.doe@email.com',
      address: '123 Main St, City, State',
      emergencyContact: 'Jane Doe',
      emergencyPhone: '+1234567891',
      bloodGroup: 'O+',
      allergies: 'None known',
    },
  })

  console.log('✅ Seed completed successfully!')
  console.log('👤 Admin user: admin@hospital.com / admin123')
  console.log('👨‍⚕️ Doctor user: doctor@hospital.com / admin123')
  console.log('👩‍⚕️ Nurse user: nurse@hospital.com / admin123')
  console.log('🔬 Lab user: lab@hospital.com / admin123')
  console.log('💊 Pharmacy user: pharmacy@hospital.com / admin123')
  console.log(`🏥 Sample patient: ${patient.firstName} ${patient.lastName} (MRN: ${patient.mrn})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })