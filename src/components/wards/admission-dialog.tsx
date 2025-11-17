"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createAdmission } from "@/lib/actions/ward"
import { searchPatients } from "@/lib/actions/patient"
import { getDoctors } from "@/lib/actions/doctor"
import { toast } from "sonner"

interface AdmissionDialogProps {
  bedId: string
  children: React.ReactNode
}

export function AdmissionDialog({ bedId, children }: AdmissionDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [formData, setFormData] = useState({
    patientId: "",
    reason: "",
    admittingDoctorId: "",
    expectedDays: 1,
    notes: ""
  })

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  async function loadData() {
    try {
      const [patientsResult, doctorsResult] = await Promise.all([
        searchPatients("", "name"),
        getDoctors()
      ])

      if (patientsResult.patients) {
        setPatients(patientsResult.patients)
      }
      if (doctorsResult.success) {
        setDoctors(doctorsResult.data || [])
      }
    } catch (error) {
      toast.error("Failed to load data")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.patientId || !formData.reason || !formData.admittingDoctorId) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)

    try {
      const result = await createAdmission({
        patientId: formData.patientId,
        bedId,
        reason: formData.reason,
        admittingDoctorId: formData.admittingDoctorId,
        expectedDays: formData.expectedDays || 1,
        notes: formData.notes || undefined
      })

      if (result.success) {
        toast.success("Patient admitted successfully")
        setFormData({ patientId: "", reason: "", admittingDoctorId: "", expectedDays: 1, notes: "" })
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to admit patient")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Admit Patient</DialogTitle>
          <DialogDescription>
            Admit a patient to this bed
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientId">Patient *</Label>
            <Select
              value={formData.patientId}
              onValueChange={(value) => setFormData({ ...formData, patientId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} ({patient.mrn})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admittingDoctorId">Admitting Doctor *</Label>
            <Select
              value={formData.admittingDoctorId}
              onValueChange={(value) => setFormData({ ...formData, admittingDoctorId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    Dr. {doctor.user?.name} - {doctor.specialization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Admission *</Label>
            <Input
              id="reason"
              placeholder="e.g., Surgery, Critical care, etc."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedDays">Expected Stay (days) *</Label>
            <Input
              id="expectedDays"
              type="number"
              min="1"
              value={formData.expectedDays}
              onChange={(e) => setFormData({ ...formData, expectedDays: parseInt(e.target.value) || 1 })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              className="resize-none"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Admit Patient
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
