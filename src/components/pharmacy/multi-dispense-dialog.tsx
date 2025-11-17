"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pill, Plus, Trash2 } from "lucide-react"
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
import { dispenseMultipleDrugs } from "@/lib/actions/pharmacy"
import { searchPatients } from "@/lib/actions/patient"
import { getDrugs } from "@/lib/actions/pharmacy"
import { toast } from "sonner"

interface DispenseDialogProps {
  children?: React.ReactNode
}

interface DrugItem {
  drugId: string
  quantity: number
}

export function MultiDispenseDialog({ children }: DispenseDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [drugs, setDrugs] = useState<any[]>([])
  const [patientId, setPatientId] = useState("")
  const [notes, setNotes] = useState("")
  const [drugItems, setDrugItems] = useState<DrugItem[]>([{ drugId: "", quantity: 1 }])

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  async function loadData() {
    try {
      const [patientsResult, drugsResult] = await Promise.all([
        searchPatients("", "name"),
        getDrugs()
      ])

      if (patientsResult.patients) {
        setPatients(patientsResult.patients)
      }
      if (drugsResult.success) {
        setDrugs(drugsResult.data || [])
      }
    } catch (error) {
      toast.error("Failed to load data")
    }
  }

  function addDrugItem() {
    setDrugItems([...drugItems, { drugId: "", quantity: 1 }])
  }

  function removeDrugItem(index: number) {
    if (drugItems.length > 1) {
      setDrugItems(drugItems.filter((_, i) => i !== index))
    }
  }

  function updateDrugItem(index: number, field: keyof DrugItem, value: string | number) {
    const newItems = [...drugItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setDrugItems(newItems)
  }

  function getDrugDetails(drugId: string) {
    return drugs.find(d => d.id === drugId)
  }

  function calculateTotal() {
    return drugItems.reduce((total, item) => {
      const drug = getDrugDetails(item.drugId)
      if (drug && item.quantity > 0) {
        return total + (drug.price * item.quantity)
      }
      return total
    }, 0)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!patientId) {
      toast.error("Please select a patient")
      return
    }

    // Validate all drug items
    const validItems = drugItems.filter(item => item.drugId && item.quantity > 0)
    if (validItems.length === 0) {
      toast.error("Please add at least one drug")
      return
    }

    // Check stock for each drug
    for (const item of validItems) {
      const drug = getDrugDetails(item.drugId)
      if (!drug) {
        toast.error("Invalid drug selected")
        return
      }
      if (drug.currentStock < item.quantity) {
        toast.error(`Insufficient stock for ${drug.name}. Available: ${drug.currentStock}`)
        return
      }
    }

    setLoading(true)

    try {
      const result = await dispenseMultipleDrugs({
        patientId,
        drugs: validItems,
        notes: notes || undefined
      })

      if (result.success) {
        toast.success(`Successfully dispensed ${validItems.length} drug(s)`)
        setPatientId("")
        setNotes("")
        setDrugItems([{ drugId: "", quantity: 1 }])
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to dispense drugs")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = calculateTotal()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Pill className="mr-2 h-4 w-4" />
            Dispense Drugs
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dispense Drugs to Patient</DialogTitle>
          <DialogDescription>
            Sell multiple medicines to a patient and update stock
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientId">Patient *</Label>
            <Select value={patientId} onValueChange={setPatientId}>
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Drugs *</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addDrugItem}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Drug
              </Button>
            </div>

            {drugItems.map((item, index) => {
              const drug = getDrugDetails(item.drugId)
              return (
                <div key={index} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Select
                        value={item.drugId}
                        onValueChange={(value) => updateDrugItem(index, "drugId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select drug" />
                        </SelectTrigger>
                        <SelectContent>
                          {drugs.filter(d => d.isActive && d.currentStock > 0).map((drug) => (
                            <SelectItem key={drug.id} value={drug.id}>
                              {drug.name} ({drug.strength}) - Stock: {drug.currentStock} - ₹{drug.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {drug && (
                        <div className="text-xs text-muted-foreground space-y-1 pl-1">
                          <p>Generic: {drug.genericName} | Form: {drug.dosageForm}</p>
                          <p>Available: {drug.currentStock} | Unit Price: ₹{drug.price}</p>
                        </div>
                      )}
                    </div>

                    <div className="w-24">
                      <Input
                        type="number"
                        min="1"
                        max={drug?.currentStock || 9999}
                        value={item.quantity}
                        onChange={(e) => updateDrugItem(index, "quantity", parseInt(e.target.value) || 1)}
                        placeholder="Qty"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDrugItem(index)}
                      disabled={drugItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {drug && item.quantity > 0 && (
                    <div className="text-sm font-medium text-right">
                      Subtotal: ₹{(drug.price * item.quantity).toFixed(2)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {totalAmount > 0 && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-xl font-bold">
                Total Amount: ₹{totalAmount.toFixed(2)}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              className="resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              Dispense All
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
