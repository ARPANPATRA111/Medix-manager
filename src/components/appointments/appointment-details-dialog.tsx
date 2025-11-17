"use client";

import { format } from "date-fns";
import { 
  Calendar,
  Clock,
  User,
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  FileText,
  Activity,
  AlertCircle
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Patient {
  firstName: string;
  lastName: string;
  mrn: string;
  phoneNumber: string;
}

interface Doctor {
  specialization: string;
  user: {
    name: string | null;
  };
}

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  appointmentTime: string;
  duration: number;
  status: string;
  reason: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  patient: Patient;
  doctor: Doctor;
}

interface AppointmentDetailsDialogProps {
  appointment: Appointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentDetailsDialog({ 
  appointment, 
  open, 
  onOpenChange 
}: AppointmentDetailsDialogProps) {
  function getStatusBadge(status: string) {
    const statusConfig = {
      SCHEDULED: { className: "bg-blue-100 text-blue-800" },
      CONFIRMED: { className: "bg-green-100 text-green-800" },
      IN_PROGRESS: { className: "bg-yellow-100 text-yellow-800" },
      COMPLETED: { className: "bg-gray-100 text-gray-800" },
      CANCELLED: { className: "bg-red-100 text-red-800" },
      NO_SHOW: { className: "bg-orange-100 text-orange-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.SCHEDULED;
    
    return (
      <Badge variant="secondary" className={config.className}>
        {status.replace('_', ' ')}
      </Badge>
    );
  }

  function getPriorityBadge(priority: string) {
    const priorityConfig = {
      LOW: { className: "bg-gray-100 text-gray-800", icon: null },
      NORMAL: { className: "bg-blue-100 text-blue-800", icon: null },
      HIGH: { className: "bg-orange-100 text-orange-800", icon: AlertCircle },
      URGENT: { className: "bg-red-100 text-red-800", icon: AlertCircle },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.NORMAL;
    
    return (
      <Badge variant="secondary" className={config.className}>
        {config.icon && <config.icon className="w-3 h-3 mr-1" />}
        {priority}
      </Badge>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Appointment Details</span>
          </DialogTitle>
          <DialogDescription>
            Complete information about the selected appointment
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appointment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Appointment Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(appointment.status)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Priority</p>
                  <div className="mt-1">
                    <Badge variant="secondary">Normal</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
                <div className="mt-1 flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(appointment.appointmentDate), "PPPP")}</span>
                </div>
                <div className="mt-1 flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{appointment.appointmentTime} ({appointment.duration} minutes)</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <div className="mt-1">
                  <Badge variant="outline">
                    Consultation
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Reason</p>
                <p className="mt-1">{appointment.reason}</p>
              </div>

              {appointment.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <p className="text-sm">{appointment.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Patient Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="mt-1 font-medium">
                  {appointment.patient.firstName} {appointment.patient.lastName}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Medical Record Number</p>
                <p className="mt-1 font-mono text-sm">{appointment.patient.mrn}</p>
              </div>

              {appointment.patient.phoneNumber && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <div className="mt-1 flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{appointment.patient.phoneNumber}</span>
                  </div>
                </div>
              )}

              {/* Email not available in current schema */}
            </CardContent>
          </Card>

          {/* Doctor Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5" />
                <span>Doctor Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="mt-1 font-medium">
                    Dr. {appointment.doctor.user.name || 'Unknown'}
                  </p>
                </div>

                {appointment.doctor.specialization && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Specialization</p>
                    <p className="mt-1">{appointment.doctor.specialization}</p>
                  </div>
                )}

                {/* Doctor phone not available in current schema */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Actions could be added here */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Appointment ID: {appointment.id}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}