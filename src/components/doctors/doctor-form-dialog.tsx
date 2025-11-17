"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Stethoscope } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { doctorSchema, type DoctorForm } from "@/lib/validations/doctor"
import { createDoctor, updateDoctor } from "@/lib/actions/doctor"
import { toast } from "sonner"

interface DoctorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  doctor?: any // For edit mode
}

const specializations = [
  "Cardiology",
  "Dermatology", 
  "Emergency Medicine",
  "Endocrinology",
  "Family Medicine",
  "Gastroenterology",
  "General Surgery",
  "Gynecology",
  "Hematology",
  "Internal Medicine",
  "Neurology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Otolaryngology",
  "Pathology",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Urology"
];

const departments = [
  "Emergency",
  "ICU",
  "General Medicine",
  "Surgery",
  "Pediatrics",
  "Gynecology",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Oncology",
  "Radiology",
  "Laboratory",
  "Pharmacy"
];

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00"
];

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export function DoctorFormDialog({
  open,
  onOpenChange,
  onSuccess,
  doctor,
}: DoctorFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  
  const isEditMode = !!doctor

  const form = useForm<DoctorForm>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      licenseNumber: "",
      specialization: "",
      qualification: "",
      experience: 0,
      consultationFee: 0,
      availableFrom: "",
      availableTo: "",
      department: "",
      maxPatientsPerDay: 20,
      phone: "",
      doctorEmail: "",
      workingDays: [],
    },
  })

  // Load doctor data in edit mode
  useEffect(() => {
    if (doctor) {
      form.reset({
        name: doctor.user?.name || "",
        email: doctor.user?.email || "",
        password: "", // Don't populate password
        licenseNumber: doctor.licenseNumber || "",
        specialization: doctor.specialization || "",
        qualification: doctor.qualification || "",
        experience: doctor.experience || 0,
        consultationFee: doctor.consultationFee || 0,
        availableFrom: doctor.availableFrom || "",
        availableTo: doctor.availableTo || "",
        department: doctor.department || "",
        maxPatientsPerDay: doctor.maxPatientsPerDay || 20,
        phone: doctor.phone || "",
        doctorEmail: doctor.email || "",
        workingDays: doctor.doctorSchedules?.map((s: any) => s.dayOfWeek) || [],
      })
      setSelectedDays(doctor.doctorSchedules?.map((s: any) => s.dayOfWeek) || [])
    } else {
      form.reset({
        name: "",
        email: "",
        password: "",
        licenseNumber: "",
        specialization: "",
        qualification: "",
        experience: 0,
        consultationFee: 0,
        availableFrom: "",
        availableTo: "",
        department: "",
        maxPatientsPerDay: 20,
        phone: "",
        doctorEmail: "",
        workingDays: [],
      })
      setSelectedDays([])
    }
  }, [doctor, form])

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  const onSubmit = async (data: DoctorForm) => {
    if (selectedDays.length === 0) {
      toast.error("Please select at least one working day")
      return
    }

    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'password' && isEditMode && !value) {
          // Skip empty password in edit mode
          return
        }
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })
      
      // Add working days as JSON
      formData.append('workingDays', JSON.stringify(selectedDays))

      const result = isEditMode 
        ? await updateDoctor(doctor.id, formData)
        : await createDoctor(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isEditMode ? "Doctor updated successfully" : "Doctor created successfully")
        onOpenChange(false)
        onSuccess?.()
        if (!isEditMode) {
          form.reset()
          setSelectedDays([])
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            {isEditMode ? "Edit Doctor" : "Add New Doctor"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Update doctor account and medical credentials."
              : "Create a new doctor account with medical credentials."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Login Credentials */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Login Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Dr. John Smith"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Login Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="john.smith@hospital.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="password">
                  Password {isEditMode ? "(leave blank to keep current)" : "*"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder={isEditMode ? "Leave blank to keep current password" : "Minimum 6 characters"}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Working Days */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Working Days *</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {daysOfWeek.map(day => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <Label 
                    htmlFor={`day-${day.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
            {selectedDays.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Select at least one working day
              </p>
            )}
          </div>

          <Separator />

          {/* Medical Credentials */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Medical Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">Medical License Number *</Label>
                <Input
                  id="licenseNumber"
                  {...form.register("licenseNumber")}
                  placeholder="MD123456"
                />
                {form.formState.errors.licenseNumber && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.licenseNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization *</Label>
                <Select
                  value={form.watch("specialization") || ""}
                  onValueChange={(value) => form.setValue("specialization", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.specialization && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.specialization.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification *</Label>
                <Input
                  id="qualification"
                  {...form.register("qualification")}
                  placeholder="MBBS, MD"
                />
                {form.formState.errors.qualification && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.qualification.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience *</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  {...form.register("experience", { valueAsNumber: true })}
                  placeholder="5"
                />
                {form.formState.errors.experience && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.experience.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Department & Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Department & Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select
                  value={form.watch("department") || ""}
                  onValueChange={(value) => form.setValue("department", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.department && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.department.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="consultationFee">Consultation Fee *</Label>
                <Input
                  id="consultationFee"
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register("consultationFee", { valueAsNumber: true })}
                  placeholder="100.00"
                />
                {form.formState.errors.consultationFee && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.consultationFee.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="availableFrom">Available From *</Label>
                <Select
                  value={form.watch("availableFrom") || ""}
                  onValueChange={(value) => form.setValue("availableFrom", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.availableFrom && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.availableFrom.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="availableTo">Available To *</Label>
                <Select
                  value={form.watch("availableTo") || ""}
                  onValueChange={(value) => form.setValue("availableTo", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.availableTo && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.availableTo.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="maxPatientsPerDay">Maximum Patients Per Day *</Label>
                <Input
                  id="maxPatientsPerDay"
                  type="number"
                  min="1"
                  max="100"
                  {...form.register("maxPatientsPerDay", { valueAsNumber: true })}
                  placeholder="20"
                />
                {form.formState.errors.maxPatientsPerDay && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.maxPatientsPerDay.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="+1234567890"
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctorEmail">Professional Email</Label>
                <Input
                  id="doctorEmail"
                  type="email"
                  {...form.register("doctorEmail")}
                  placeholder="john.smith@clinic.com"
                />
                {form.formState.errors.doctorEmail && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.doctorEmail.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditMode ? "Update Doctor" : "Create Doctor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}