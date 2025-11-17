"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, X, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getPatientBillingSummary, markBillingAsPaid } from "@/lib/actions/billing"
import { toast } from "sonner"
import { format } from "date-fns"

export function BillingList() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string>("all")
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const result = await getPatientBillingSummary()
      if (result.success) {
        setPatients(result.data || [])
      } else {
        toast.error(result.error || "Failed to load billing data")
      }
    } catch (error) {
      toast.error("An error occurred while loading data")
    } finally {
      setLoading(false)
    }
  }

  function handleSelectRecord(recordId: string) {
    const newSelection = new Set(selectedRecords)
    if (newSelection.has(recordId)) {
      newSelection.delete(recordId)
    } else {
      newSelection.add(recordId)
    }
    setSelectedRecords(newSelection)
  }

  function handleSelectAllUnpaid(patientRecords: any[]) {
    const unpaidIds = patientRecords
      .filter(record => !record.isPaid)
      .map(record => record.id)
    
    const newSelection = new Set(selectedRecords)
    const allSelected = unpaidIds.every(id => newSelection.has(id))
    
    if (allSelected) {
      unpaidIds.forEach(id => newSelection.delete(id))
    } else {
      unpaidIds.forEach(id => newSelection.add(id))
    }
    
    setSelectedRecords(newSelection)
  }

  async function handleMarkAsPaid() {
    if (selectedRecords.size === 0) {
      toast.error("Please select at least one record to mark as paid")
      return
    }

    setProcessing(true)
    try {
      const result = await markBillingAsPaid(Array.from(selectedRecords))
      
      if (result.success) {
        toast.success(`Successfully marked ${selectedRecords.size} record(s) as paid`)
        setSelectedRecords(new Set())
        loadData()
        router.refresh()
      } else {
        toast.error(result.error || "Failed to process payment")
      }
    } catch (error) {
      toast.error("An error occurred while processing payment")
    } finally {
      setProcessing(false)
    }
  }

  const filteredPatients = selectedPatient === "all" 
    ? patients 
    : patients.filter(p => p.patient.id === selectedPatient)

  if (loading) {
    return <div className="text-center py-12">Loading billing records...</div>
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No billing records found. Charges will appear here when appointments are booked, patients are admitted, or drugs are dispensed.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by patient" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patients</SelectItem>
              {patients.map((p) => (
                <SelectItem key={p.patient.id} value={p.patient.id}>
                  {p.patient.firstName} {p.patient.lastName} ({p.patient.mrn})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedRecords.size > 0 && (
            <Badge variant="secondary">
              {selectedRecords.size} selected
            </Badge>
          )}
        </div>
        <Button 
          onClick={handleMarkAsPaid}
          disabled={selectedRecords.size === 0 || processing}
        >
          <DollarSign className="mr-2 h-4 w-4" />
          Mark as Paid ({selectedRecords.size})
        </Button>
      </div>

      {filteredPatients.map((patientData) => {
        const { patient, totalCharges, paidAmount, dueAmount, unpaidCount, records } = patientData
        const unpaidRecords = records.filter((r: any) => !r.isPaid)
        const allUnpaidSelected = unpaidRecords.length > 0 && 
          unpaidRecords.every((r: any) => selectedRecords.has(r.id))

        return (
          <div key={patient.id} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  {patient.firstName} {patient.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  MRN: {patient.mrn} | Phone: {patient.phoneNumber}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-muted-foreground">Total Charges</p>
                <p className="text-2xl font-bold">₹{totalCharges.toFixed(2)}</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">Paid: ₹{paidAmount.toFixed(2)}</span>
                  <span className="text-orange-600 font-semibold">Due: ₹{dueAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {records.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Charge History</h4>
                  {unpaidRecords.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectAllUnpaid(records)}
                    >
                      {allUnpaidSelected ? "Deselect" : "Select"} All Unpaid
                    </Button>
                  )}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {!record.isPaid && (
                            <Checkbox
                              checked={selectedRecords.has(record.id)}
                              onCheckedChange={() => handleSelectRecord(record.id)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(record.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-sm">{record.description}</TableCell>
                        <TableCell>
                          <Badge variant={
                            record.chargeType === "APPOINTMENT" ? "default" :
                            record.chargeType === "ADMISSION" ? "secondary" :
                            record.chargeType === "PHARMACY" ? "outline" :
                            "default"
                          }>
                            {record.chargeType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{record.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {record.isPaid ? (
                            <Badge variant="default" className="bg-green-600">
                              <Check className="mr-1 h-3 w-3" />
                              Paid
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-600">
                              <X className="mr-1 h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
