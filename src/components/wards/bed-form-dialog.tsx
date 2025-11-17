"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { createBed } from "@/lib/actions/ward"
import { toast } from "sonner"

interface BedFormDialogProps {
  wardId: string
  children: React.ReactNode
}

export function BedFormDialog({ wardId, children }: BedFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    bedNumber: "",
    bedType: ""
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.bedNumber || !formData.bedType) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)

    try {
      const result = await createBed({
        wardId,
        bedNumber: formData.bedNumber,
        bedType: formData.bedType
      })

      if (result.success) {
        toast.success("Bed created successfully")
        setFormData({ bedNumber: "", bedType: "" })
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to create bed")
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Bed</DialogTitle>
          <DialogDescription>
            Add a new bed to this ward
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bedNumber">Bed Number *</Label>
            <Input
              id="bedNumber"
              placeholder="e.g., A-101"
              value={formData.bedNumber}
              onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bedType">Bed Type *</Label>
            <Select
              value={formData.bedType}
              onValueChange={(value) => setFormData({ ...formData, bedType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select bed type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="ICU">ICU</SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
                <SelectItem value="SEMI_PRIVATE">Semi-Private</SelectItem>
              </SelectContent>
            </Select>
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
              Add Bed
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
