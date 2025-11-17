"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Calendar,
  Clock,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  CalendarX
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { searchAppointments, updateAppointmentStatus } from "@/lib/actions/appointment";
import { AppointmentDetailsDialog } from "./appointment-details-dialog";
import { AppointmentFormDialog } from "./appointment-form-dialog";
import { Plus } from "lucide-react";

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
  patient: {
    firstName: string;
    lastName: string;
    mrn: string;
    phoneNumber: string;
  };
  doctor: {
    specialization: string;
    user: {
      name: string | null;
    };
  };
}

export function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Load appointments
  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    try {
      setLoading(true);
      const result = await searchAppointments("");
      if (result.success) {
        setAppointments(result.data || []);
      } else {
        toast.error("Failed to load appointments");
      }
    } catch (error) {
      toast.error("An error occurred while loading appointments");
    } finally {
      setLoading(false);
    }
  }

  // Filter appointments based on search and filters
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = searchTerm === "" || 
      appointment.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctor.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    const matchesType = typeFilter === "all";

    return matchesSearch && matchesStatus && matchesType;
  });

  async function handleStatusUpdate(appointmentId: string, newStatus: string) {
    try {
      const result = await updateAppointmentStatus(appointmentId, newStatus as any);
      if (result.success) {
        toast.success(`Appointment ${newStatus.toLowerCase()} successfully`);
        loadAppointments(); // Refresh the list
      } else {
        toast.error(result.error || "Failed to update appointment status");
      }
    } catch (error) {
      toast.error("An error occurred while updating appointment status");
    }
  }

  function getStatusBadge(status: string) {
    const statusConfig = {
      SCHEDULED: { variant: "secondary" as const, className: "bg-blue-100 text-blue-800" },
      CONFIRMED: { variant: "secondary" as const, className: "bg-green-100 text-green-800" },
      IN_PROGRESS: { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800" },
      COMPLETED: { variant: "secondary" as const, className: "bg-gray-100 text-gray-800" },
      CANCELLED: { variant: "secondary" as const, className: "bg-red-100 text-red-800" },
      NO_SHOW: { variant: "secondary" as const, className: "bg-orange-100 text-orange-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.SCHEDULED;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace('_', ' ')}
      </Badge>
    );
  }

  function getPriorityBadge(priority: string) {
    const priorityConfig = {
      LOW: { className: "bg-gray-100 text-gray-800" },
      NORMAL: { className: "bg-blue-100 text-blue-800" },
      HIGH: { className: "bg-orange-100 text-orange-800" },
      URGENT: { className: "bg-red-100 text-red-800" },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.NORMAL;
    
    return (
      <Badge variant="secondary" className={config.className}>
        {priority}
      </Badge>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center py-8">Loading appointments...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by patient name, MRN, doctor, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <AppointmentFormDialog onSuccess={loadAppointments}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Appointment
          </Button>
        </AppointmentFormDialog>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="NO_SHOW">No Show</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="CONSULTATION">Consultation</SelectItem>
              <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
              <SelectItem value="CHECK_UP">Check-up</SelectItem>
              <SelectItem value="EMERGENCY">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                      ? "No appointments found matching your criteria"
                      : "No appointments found"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        MRN: {appointment.patient.mrn}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        Dr. {appointment.doctor.user.name || 'Unknown'}
                      </div>
                      {appointment.doctor.specialization && (
                        <div className="text-sm text-muted-foreground">
                          {appointment.doctor.specialization}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div>{format(new Date(appointment.appointmentDate), "PPP")}</div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {appointment.appointmentTime} ({appointment.duration}min)
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      Consultation
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(appointment.status)}
                  </TableCell>
                  <TableCell>
                    Normal
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={appointment.reason}>
                      {appointment.reason}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {appointment.status === "SCHEDULED" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(appointment.id, "CONFIRMED")}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirm
                          </DropdownMenuItem>
                        )}
                        
                        {(appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED") && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(appointment.id, "IN_PROGRESS")}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Start Appointment
                          </DropdownMenuItem>
                        )}
                        
                        {appointment.status === "IN_PROGRESS" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(appointment.id, "COMPLETED")}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Complete
                          </DropdownMenuItem>
                        )}
                        
                        {(appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED") && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(appointment.id, "CANCELLED")}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(appointment.id, "NO_SHOW")}
                            >
                              <CalendarX className="mr-2 h-4 w-4" />
                              Mark No Show
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Appointment Details Dialog */}
      {selectedAppointment && (
        <AppointmentDetailsDialog
          appointment={selectedAppointment}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  );
}