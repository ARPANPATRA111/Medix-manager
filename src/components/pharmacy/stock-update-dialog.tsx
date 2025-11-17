"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Minus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { updateDrugStock } from "@/lib/actions/pharmacy"

const stockFormSchema = z.object({
  quantity: z.string().min(1, "Quantity is required"),
  operation: z.enum(["add", "subtract"]),
})

type StockFormValues = z.infer<typeof stockFormSchema>

interface Drug {
  id: string
  name: string
  currentStock: number
}

interface StockUpdateDialogProps {
  drug: Drug
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function StockUpdateDialog({
  drug,
  open,
  onOpenChange,
  onSuccess,
}: StockUpdateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [operation, setOperation] = useState<"add" | "subtract">("add")

  const form = useForm<StockFormValues>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: {
      quantity: "",
      operation: "add",
    },
  })

  async function onSubmit(data: StockFormValues) {
    try {
      setIsSubmitting(true)

      const quantity = parseInt(data.quantity)
      const result = await updateDrugStock(drug.id, quantity, operation)

      if (result.success) {
        toast.success(`Stock ${operation === "add" ? "added" : "removed"} successfully`)
        form.reset()
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(result.error || "Failed to update stock")
      }
    } catch (error) {
      toast.error("An error occurred while updating stock")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Stock - {drug.name}</DialogTitle>
          <DialogDescription>
            Current stock: <strong>{drug.currentStock}</strong> units
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Enter quantity"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant={operation === "add" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setOperation("add")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to Stock
              </Button>
              <Button
                type="button"
                variant={operation === "subtract" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setOperation("subtract")}
              >
                <Minus className="mr-2 h-4 w-4" />
                Remove from Stock
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Stock"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
