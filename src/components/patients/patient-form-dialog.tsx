"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { patientSchema, type PatientForm } from "@/lib/validations/patient"
import { createPatient, updatePatient } from "@/lib/actions/patient"
import { toast } from "sonner"

interface PatientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient?: any // For edit mode
  onSuccess?: () => void
}

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  onSuccess,
}: PatientFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const isEditMode = !!patient

  const form = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: patient?.firstName || "",
      lastName: patient?.lastName || "",
      dateOfBirth: patient?.dateOfBirth ? new Date(patient.dateOfBirth) : undefined,
      gender: patient?.gender || undefined,
      phoneNumber: patient?.phoneNumber || "",
      email: patient?.email || "",
      address: patient?.address || "",
      emergencyContact: patient?.emergencyContact || "",
      emergencyPhone: patient?.emergencyPhone || "",
      bloodGroup: patient?.bloodGroup || "",
      allergies: patient?.allergies || "",
    },
  })

  const onSubmit = async (data: PatientForm) => {
    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "dateOfBirth" && value instanceof Date) {
            formData.append(key, value.toISOString())
          } else {
            formData.append(key, value.toString())
          }
        }
      })

      const result = isEditMode
        ? await updatePatient(patient.id, formData)
        : await createPatient(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          isEditMode
            ? "Patient updated successfully"
            : "Patient created successfully"
        )
        onOpenChange(false)
        onSuccess?.()
        form.reset()
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Patient" : "Add New Patient"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update patient information below."
              : "Fill in the patient information below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...form.register("firstName")}
                  placeholder="John"
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...form.register("lastName")}
                  placeholder="Doe"
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth * (DD-MM-YYYY)</Label>
                <Input
                  id="dateOfBirth"
                  type="text"
                  placeholder="18-11-1990"
                  maxLength={10}
                  onChange={(e) => {
                    const input = e.target.value
                    
                    // Allow only digits and dashes
                    const cleaned = input.replace(/[^\d-]/g, "")
                    
                    // Auto-format as user types
                    let formatted = cleaned
                    if (cleaned.length >= 3 && cleaned.charAt(2) !== '-') {
                      formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2)
                    }
                    if (cleaned.length >= 6 && cleaned.charAt(5) !== '-') {
                      const parts = formatted.split('-')
                      formatted = parts[0] + '-' + parts[1].slice(0, 2) + '-' + parts[1].slice(2)
                    }
                    
                    e.target.value = formatted
                    
                    // Parse and validate complete date
                    if (formatted.length === 10 && formatted.includes('-')) {
                      const parts = formatted.split('-')
                      if (parts.length === 3) {
                        const day = parseInt(parts[0])
                        const month = parseInt(parts[1])
                        const year = parseInt(parts[2])
                        
                        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= new Date().getFullYear()) {
                          const date = new Date(year, month - 1, day)
                          
                          // Verify the date is valid (handles invalid dates like 31st Feb)
                          if (
                            date.getDate() === day &&
                            date.getMonth() === month - 1 &&
                            date.getFullYear() === year &&
                            date <= new Date()
                          ) {
                            form.setValue("dateOfBirth", date, { shouldValidate: true })
                            return
                          }
                        }
                      }
                    }
                    
                    // Clear the form value if incomplete or invalid
                    form.setValue("dateOfBirth", undefined as any)
                  }}
                />
                {form.formState.errors.dateOfBirth && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.dateOfBirth.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={form.watch("gender")}
                  onValueChange={(value) => form.setValue("gender", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.gender && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.gender.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select
                  value={form.watch("bloodGroup") || ""}
                  onValueChange={(value) => form.setValue("bloodGroup", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  {...form.register("phoneNumber")}
                  placeholder="+1234567890"
                />
                {form.formState.errors.phoneNumber && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="john.doe@example.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  {...form.register("address")}
                  placeholder="123 Main Street, City, State, ZIP"
                  rows={3}
                />
                {form.formState.errors.address && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.address.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Contact Name *</Label>
                <Input
                  id="emergencyContact"
                  {...form.register("emergencyContact")}
                  placeholder="Jane Doe"
                />
                {form.formState.errors.emergencyContact && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.emergencyContact.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Contact Phone *</Label>
                <Input
                  id="emergencyPhone"
                  {...form.register("emergencyPhone")}
                  placeholder="+1234567890"
                />
                {form.formState.errors.emergencyPhone && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.emergencyPhone.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Medical Information</h3>
            <div className="space-y-2">
              <Label htmlFor="allergies">Known Allergies</Label>
              <Textarea
                id="allergies"
                {...form.register("allergies")}
                placeholder="List any known allergies or enter 'None known'"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
                <>{isEditMode ? "Update Patient" : "Create Patient"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}