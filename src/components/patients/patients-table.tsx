"use client"

import { useState } from "react"
import { format } from "date-fns"
import { MoreHorizontal, Plus, Search, Eye, Edit, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PatientFormDialog } from "@/components/patients/patient-form-dialog"
import { PatientDetailsDialog } from "@/components/patients/patient-details-dialog"

interface Patient {
  id: string
  mrn: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: string
  phoneNumber: string
  email: string | null
  createdAt: Date
}

interface PatientsTableProps {
  patients: Patient[]
}

export function PatientsTable({ patients }: PatientsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState("name")
  const [filteredPatients, setFilteredPatients] = useState(patients)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  // Filter patients based on search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query) {
      setFilteredPatients(patients)
      return
    }

    const filtered = patients.filter(patient => {
      switch (searchType) {
        case "mrn":
          return patient.mrn.toLowerCase().includes(query.toLowerCase())
        case "phone":
          return patient.phoneNumber.includes(query)
        case "email":
          return patient.email?.toLowerCase().includes(query.toLowerCase())
        default: // name
          return (
            patient.firstName.toLowerCase().includes(query.toLowerCase()) ||
            patient.lastName.toLowerCase().includes(query.toLowerCase())
          )
      }
    })
    setFilteredPatients(filtered)
  }

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setShowEditDialog(true)
  }

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setShowDetailsDialog(true)
  }

  const refreshData = () => {
    // In a real app, you'd refetch the data
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Search by ${searchType}...`}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={searchType} onValueChange={setSearchType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Search by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="mrn">MRN</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Results Summary */}
      {searchQuery && (
        <div className="text-sm text-gray-600">
          Found {filteredPatients.length} patient(s) matching "{searchQuery}"
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MRN</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Age/Gender</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {searchQuery ? "No patients found matching your search." : "No patients registered yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono font-medium">
                      {patient.mrn}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {patient.firstName} {patient.lastName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{calculateAge(patient.dateOfBirth)} years</span>
                        <Badge variant="outline" className="text-xs">
                          {patient.gender}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone className="mr-1 h-3 w-3 text-gray-400" />
                          {patient.phoneNumber}
                        </div>
                        {patient.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="mr-1 h-3 w-3 text-gray-400" />
                            {patient.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {format(patient.createdAt, "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewPatient(patient)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditPatient(patient)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Patient
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              {searchQuery ? "No patients found matching your search." : "No patients registered yet."}
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div>
                      <div className="font-medium text-lg">
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div className="text-sm font-mono text-gray-600">
                        {patient.mrn}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{calculateAge(patient.dateOfBirth)} years</span>
                      <Badge variant="outline" className="text-xs">
                        {patient.gender}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="mr-1 h-3 w-3 text-gray-400" />
                        {patient.phoneNumber}
                      </div>
                      {patient.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="mr-1 h-3 w-3 text-gray-400" />
                          {patient.email}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Registered {format(patient.createdAt, "MMM dd, yyyy")}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewPatient(patient)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditPatient(patient)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Patient
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialogs */}
      <PatientFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={refreshData}
      />

      <PatientFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        patient={selectedPatient}
        onSuccess={refreshData}
      />

      {selectedPatient && (
        <PatientDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          patientId={selectedPatient.id}
        />
      )}
    </div>
  )
}