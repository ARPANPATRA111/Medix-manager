"use client";

import { useState } from "react";
import { Plus, Search, Stethoscope, Mail, Phone, Building, Calendar, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DoctorFormDialog } from "./doctor-form-dialog";

interface Doctor {
  id: string;
  licenseNumber: string;
  specialization: string;
  qualification: string;
  experience: number;
  consultationFee: number;
  availableFrom: string;
  availableTo: string;
  department: string;
  maxPatientsPerDay: number;
  phone?: string | null;
  email?: string | null;
  isAvailable: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  doctorSchedules?: any[];
}

interface DoctorListProps {
  initialDoctors: Doctor[];
  userRole?: string;
}

export function DoctorList({ initialDoctors, userRole }: DoctorListProps) {
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  const filteredDoctors = doctors.filter((doctor) => {
    const query = searchQuery.toLowerCase();
    return (
      doctor.user.name?.toLowerCase().includes(query) ||
      doctor.specialization.toLowerCase().includes(query) ||
      doctor.department.toLowerCase().includes(query) ||
      doctor.licenseNumber.toLowerCase().includes(query)
    );
  });

  const handleDoctorCreated = () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search doctors by name, specialization, or license..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Doctor
        </Button>
      </div>

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => (
          <Card key={doctor.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Stethoscope className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Dr. {doctor.user.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {doctor.licenseNumber}
                    </p>
                  </div>
                </div>
                <Badge variant={doctor.isAvailable ? "default" : "secondary"}>
                  {doctor.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Specialization & Department */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{doctor.department}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {doctor.specialization}
                </Badge>
              </div>

              {/* Qualification & Experience */}
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium">Qualification:</span> {doctor.qualification}
                </div>
                <div>
                  <span className="font-medium">Experience:</span> {doctor.experience} years
                </div>
                <div>
                  <span className="font-medium">Consultation Fee:</span> ${doctor.consultationFee}
                </div>
              </div>

              {/* Schedule */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {doctor.availableFrom} - {doctor.availableTo}
                </span>
                <span className="text-muted-foreground">
                  (Max {doctor.maxPatientsPerDay} patients/day)
                </span>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{doctor.user.email}</span>
                </div>
                {doctor.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{doctor.phone}</span>
                  </div>
                )}
              </div>

              {/* Edit Button for Admins */}
              {userRole === 'ADMIN' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setEditingDoctor(doctor)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Doctor
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredDoctors.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {searchQuery ? "No doctors found" : "No doctors registered"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Get started by adding your first doctor to the system"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Doctor
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Doctor Dialog */}
      <DoctorFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleDoctorCreated}
      />

      {/* Edit Doctor Dialog */}
      {editingDoctor && (
        <DoctorFormDialog
          open={!!editingDoctor}
          onOpenChange={(open) => !open && setEditingDoctor(null)}
          onSuccess={handleDoctorCreated}
          doctor={editingDoctor}
        />
      )}
    </div>
  );
}