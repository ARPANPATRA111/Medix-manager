"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { createAppointment } from "@/lib/actions/appointment";
import { searchPatients } from "@/lib/actions/patient";
import { getDoctors } from "@/lib/actions/doctor";

interface AppointmentFormDialogProps {
  children: React.ReactNode;
  patientId?: string;
  onSuccess?: () => void;
}

export function AppointmentFormDialog({ children, patientId, onSuccess }: AppointmentFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    patientId: patientId || "",
    doctorId: "",
    appointmentDate: undefined as Date | undefined,
    appointmentTime: "",
    duration: 30,
    reason: "",
    notes: "",
  });

  // Load patients and doctors when dialog opens
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, patientId]);

  async function loadData() {
    try {
      // Load patients if not pre-selected
      if (!patientId) {
        const patientsResult = await searchPatients("", "name");
        if (patientsResult.patients) {
          setPatients(patientsResult.patients);
        }
      }

      // Load doctors
      const doctorsResult = await getDoctors();
      if (doctorsResult.success) {
        setDoctors(doctorsResult.data || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    }
  }

  function updateFormData(field: string, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.patientId || !formData.doctorId || !formData.appointmentDate || 
        !formData.appointmentTime || !formData.reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const result = await createAppointment({
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        duration: formData.duration,
        reason: formData.reason,
        notes: formData.notes,
      });

      if (result.success) {
        toast.success("Appointment created successfully");
        setFormData({
          patientId: patientId || "",
          doctorId: "",
          appointmentDate: undefined,
          appointmentTime: "",
          duration: 30,
          reason: "",
          notes: "",
        });
        setOpen(false);
        router.refresh(); // Auto-refresh the page to show new appointment
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create appointment");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Appointment</DialogTitle>
          <DialogDescription>
            Create a new appointment for a patient with a doctor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Selection */}
            {!patientId && (
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient *</Label>
                <Select 
                  value={formData.patientId} 
                  onValueChange={(value) => updateFormData("patientId", value)}
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
            )}

            {/* Doctor Selection */}
            <div className="space-y-2">
              <Label htmlFor="doctorId">Doctor *</Label>
              <Select 
                value={formData.doctorId} 
                onValueChange={(value) => updateFormData("doctorId", value)}
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

            {/* Appointment Date */}
            <div className="space-y-2">
              <Label>Appointment Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.appointmentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.appointmentDate ? (
                      format(formData.appointmentDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.appointmentDate}
                    onSelect={(date) => updateFormData("appointmentDate", date)}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    captionLayout="dropdown-months"
                    fromYear={new Date().getFullYear()}
                    toYear={new Date().getFullYear() + 2}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Appointment Time */}
            <div className="space-y-2">
              <Label htmlFor="appointmentTime">Appointment Time *</Label>
              <Select 
                value={formData.appointmentTime} 
                onValueChange={(value) => updateFormData("appointmentTime", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00">09:00 AM</SelectItem>
                  <SelectItem value="09:30">09:30 AM</SelectItem>
                  <SelectItem value="10:00">10:00 AM</SelectItem>
                  <SelectItem value="10:30">10:30 AM</SelectItem>
                  <SelectItem value="11:00">11:00 AM</SelectItem>
                  <SelectItem value="11:30">11:30 AM</SelectItem>
                  <SelectItem value="14:00">02:00 PM</SelectItem>
                  <SelectItem value="14:30">02:30 PM</SelectItem>
                  <SelectItem value="15:00">03:00 PM</SelectItem>
                  <SelectItem value="15:30">03:30 PM</SelectItem>
                  <SelectItem value="16:00">04:00 PM</SelectItem>
                  <SelectItem value="16:30">04:30 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Select 
                value={formData.duration.toString()} 
                onValueChange={(value) => updateFormData("duration", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Appointment *</Label>
            <Input 
              id="reason"
              placeholder="e.g., Regular checkup, Follow-up consultation, etc." 
              value={formData.reason}
              onChange={(e) => updateFormData("reason", e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information or special instructions..."
              className="resize-none"
              rows={3}
              value={formData.notes}
              onChange={(e) => updateFormData("notes", e.target.value)}
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
              {loading ? "Creating..." : "Create Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}