"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Calendar, Phone, Mail, MapPin, User, Heart, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getPatientById } from "@/lib/actions/patient"
import { toast } from "sonner"

interface PatientDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
}

export function PatientDetailsDialog({
  open,
  onOpenChange,
  patientId,
}: PatientDetailsDialogProps) {
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && patientId) {
      fetchPatientDetails()
    }
  }, [open, patientId])

  const fetchPatientDetails = async () => {
    setLoading(true)
    try {
      const result = await getPatientById(patientId)
      if (result.error) {
        toast.error(result.error)
      } else {
        setPatient(result.patient)
      }
    } catch (error) {
      toast.error("Failed to fetch patient details")
    } finally {
      setLoading(false)
    }
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

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading patient details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!patient) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load patient details.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{patient.firstName} {patient.lastName}</span>
          </DialogTitle>
          <DialogDescription>
            Patient ID: {patient.mrn} • Age: {calculateAge(patient.dateOfBirth)} • {patient.gender}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="visits">Visits</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Date of Birth:</strong> {format(new Date(patient.dateOfBirth), "MMMM dd, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Phone:</strong> {patient.phoneNumber}
                    </span>
                  </div>
                  {patient.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        <strong>Email:</strong> {patient.email}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <span className="text-sm">
                      <strong>Address:</strong> {patient.address}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {patient.bloodGroup && (
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-sm">
                        <strong>Blood Group:</strong> 
                        <Badge variant="outline" className="ml-2">
                          {patient.bloodGroup}
                        </Badge>
                      </span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-start space-x-2">
                      <User className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div className="text-sm">
                        <div><strong>Emergency Contact:</strong> {patient.emergencyContact}</div>
                        <div className="text-gray-600">Phone: {patient.emergencyPhone}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Medical Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Medical Information</h3>
              {patient.allergies ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-900">Known Allergies</div>
                      <div className="text-sm text-red-800 mt-1">{patient.allergies}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-800">No known allergies recorded</div>
                </div>
              )}
            </div>

            <Separator />

            {/* Registration Details */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Registration Details</h3>
              <div className="text-sm text-gray-600">
                <div>Registered on: {format(new Date(patient.createdAt), "MMMM dd, yyyy 'at' hh:mm a")}</div>
                <div>Last updated: {format(new Date(patient.updatedAt), "MMMM dd, yyyy 'at' hh:mm a")}</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="visits" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Visits</h3>
              <Badge variant="secondary">{patient.visits?.length || 0} visits</Badge>
            </div>
            
            {patient.visits && patient.visits.length > 0 ? (
              <div className="space-y-4">
                {patient.visits.map((visit: any, index: number) => (
                  <div key={visit.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={visit.visitType === "OPD" ? "default" : "destructive"}>
                            {visit.visitType}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {format(new Date(visit.visitDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">Chief Complaint</div>
                          <div className="text-sm text-gray-600">{visit.chiefComplaint}</div>
                        </div>
                        {visit.diagnosis && (
                          <div>
                            <div className="font-medium">Diagnosis</div>
                            <div className="text-sm text-gray-600">{visit.diagnosis}</div>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Doctor: Dr. {visit.doctor.user.name}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No visits recorded yet.
              </div>
            )}
          </TabsContent>

          <TabsContent value="tests" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Laboratory Orders</h3>
              <Badge variant="secondary">{patient.labOrders?.length || 0} orders</Badge>
            </div>

            {patient.labOrders && patient.labOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Tests</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patient.labOrders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.orderNumber}</TableCell>
                      <TableCell>{format(new Date(order.orderDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {order.orderItems.map((item: any, idx: number) => (
                            <div key={idx} className="text-sm">
                              {item.test.name}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.status === "COMPLETED" ? "default" : "secondary"}>
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No laboratory orders yet.
              </div>
            )}
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Billing History</h3>
              <Badge variant="secondary">{patient.bills?.length || 0} bills</Badge>
            </div>

            {patient.bills && patient.bills.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patient.bills.map((bill: any) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-mono">{bill.billNumber}</TableCell>
                      <TableCell>{format(new Date(bill.billDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell>${bill.netAmount.toFixed(2)}</TableCell>
                      <TableCell>${bill.paidAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          bill.status === "PAID" ? "default" : 
                          bill.status === "PARTIALLY_PAID" ? "secondary" : "destructive"
                        }>
                          {bill.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No billing history yet.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}