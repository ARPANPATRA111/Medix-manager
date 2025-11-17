"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pill } from "lucide-react"
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
import { dispenseDrug } from "@/lib/actions/pharmacy"
import { searchPatients } from "@/lib/actions/patient"
import { getDrugs } from "@/lib/actions/pharmacy"
import { toast } from "sonner"

interface DispenseDialogProps {
  children?: React.ReactNode
}

export function DispenseDialog({ children }: DispenseDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [drugs, setDrugs] = useState<any[]>([])
  const [selectedDrug, setSelectedDrug] = useState<any>(null)
  const [formData, setFormData] = useState({
    patientId: "",
    drugId: "",
    quantity: 1,
    notes: ""
  })

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  useEffect(() => {
    if (formData.drugId) {
      const drug = drugs.find(d => d.id === formData.drugId)
      setSelectedDrug(drug)
    } else {
      setSelectedDrug(null)
    }
  }, [formData.drugId, drugs])

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.patientId || !formData.drugId || formData.quantity < 1) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)

    try {
      const result = await dispenseDrug({
        drugId: formData.drugId,
        patientId: formData.patientId,
        quantity: formData.quantity,
        notes: formData.notes || undefined
      })

      if (result.success) {
        toast.success("Drug dispensed successfully")
        setFormData({ patientId: "", drugId: "", quantity: 1, notes: "" })
        setSelectedDrug(null)
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to dispense drug")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const totalPrice = selectedDrug ? selectedDrug.price * formData.quantity : 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Pill className="mr-2 h-4 w-4" />
            Dispense Drug
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dispense Drug to Patient</DialogTitle>
          <DialogDescription>
            Sell medicine to a patient and update stock
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
            <Label htmlFor="drugId">Drug *</Label>
            <Select
              value={formData.drugId}
              onValueChange={(value) => setFormData({ ...formData, drugId: value })}
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
          </div>

          {selectedDrug && (
            <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
              <p><span className="font-medium">Generic:</span> {selectedDrug.genericName}</p>
              <p><span className="font-medium">Manufacturer:</span> {selectedDrug.manufacturer}</p>
              <p><span className="font-medium">Form:</span> {selectedDrug.dosageForm}</p>
              <p><span className="font-medium">Available Stock:</span> {selectedDrug.currentStock}</p>
              <p><span className="font-medium">Unit Price:</span> ₹{selectedDrug.price}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={selectedDrug?.currentStock || 9999}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              required
            />
          </div>

          {selectedDrug && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-lg font-semibold">
                Total Amount: ₹{totalPrice.toFixed(2)}
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
              Dispense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
