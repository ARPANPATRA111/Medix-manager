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
import { createWard } from "@/lib/actions/ward"
import { toast } from "sonner"

interface WardFormDialogProps {
  children: React.ReactNode
}

export function WardFormDialog({ children }: WardFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    wardType: "",
    totalBeds: ""
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.name || !formData.wardType || !formData.totalBeds) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)

    try {
      const result = await createWard({
        name: formData.name,
        wardType: formData.wardType,
        totalBeds: parseInt(formData.totalBeds)
      })

      if (result.success) {
        toast.success("Ward created successfully")
        setFormData({ name: "", wardType: "", totalBeds: "" })
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to create ward")
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
          <DialogTitle>Add New Ward</DialogTitle>
          <DialogDescription>
            Create a new hospital ward with specified capacity
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ward Name *</Label>
            <Input
              id="name"
              placeholder="e.g., General Ward A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wardType">Ward Type *</Label>
            <Select
              value={formData.wardType}
              onValueChange={(value) => setFormData({ ...formData, wardType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select ward type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ICU">ICU</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
                <SelectItem value="SEMI_PRIVATE">Semi-Private</SelectItem>
                <SelectItem value="PEDIATRIC">Pediatric</SelectItem>
                <SelectItem value="MATERNITY">Maternity</SelectItem>
                <SelectItem value="SURGICAL">Surgical</SelectItem>
                <SelectItem value="EMERGENCY">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalBeds">Total Beds *</Label>
            <Input
              id="totalBeds"
              type="number"
              min="1"
              placeholder="e.g., 20"
              value={formData.totalBeds}
              onChange={(e) => setFormData({ ...formData, totalBeds: e.target.value })}
              required
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
              Create Ward
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
