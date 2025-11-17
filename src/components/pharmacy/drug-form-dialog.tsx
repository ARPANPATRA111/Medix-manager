"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { createDrug, updateDrug } from "@/lib/actions/pharmacy"

const drugFormSchema = z.object({
  name: z.string().min(1, "Drug name is required"),
  genericName: z.string().min(1, "Generic name is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  dosageForm: z.string().min(1, "Dosage form is required"),
  strength: z.string().min(1, "Strength is required"),
  price: z.string().min(1, "Price is required"),
  currentStock: z.string().min(1, "Stock quantity is required"),
  minStock: z.string().min(1, "Minimum stock is required"),
  maxStock: z.string().min(1, "Maximum stock is required"),
  expiryDate: z.date().optional(),
})

type DrugFormValues = z.infer<typeof drugFormSchema>

interface Drug {
  id: string
  name: string
  genericName: string
  manufacturer: string
  dosageForm: string
  strength: string
  price: number
  currentStock: number
  minStock: number
  maxStock: number
  expiryDate?: Date | null
}

interface DrugFormDialogProps {
  children?: React.ReactNode
  drug?: Drug
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function DrugFormDialog({
  children,
  drug,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: DrugFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const form = useForm<DrugFormValues>({
    resolver: zodResolver(drugFormSchema),
    defaultValues: drug
      ? {
          name: drug.name,
          genericName: drug.genericName,
          manufacturer: drug.manufacturer,
          dosageForm: drug.dosageForm,
          strength: drug.strength,
          price: drug.price.toString(),
          currentStock: drug.currentStock.toString(),
          minStock: drug.minStock.toString(),
          maxStock: drug.maxStock.toString(),
          expiryDate: drug.expiryDate || undefined,
        }
      : {
          name: "",
          genericName: "",
          manufacturer: "",
          dosageForm: "",
          strength: "",
          price: "",
          currentStock: "0",
          minStock: "10",
          maxStock: "1000",
        },
  })

  async function onSubmit(data: DrugFormValues) {
    try {
      setIsSubmitting(true)

      const drugData = {
        name: data.name,
        genericName: data.genericName,
        manufacturer: data.manufacturer,
        dosageForm: data.dosageForm,
        strength: data.strength,
        price: parseFloat(data.price),
        currentStock: parseInt(data.currentStock),
        minStock: parseInt(data.minStock),
        maxStock: parseInt(data.maxStock),
        expiryDate: data.expiryDate,
      }

      const result = drug
        ? await updateDrug(drug.id, drugData)
        : await createDrug(drugData)

      if (result.success) {
        toast.success(drug ? "Medication updated successfully" : "Medication added successfully")
        form.reset()
        setOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error || "Failed to save medication")
      }
    } catch (error) {
      toast.error("An error occurred while saving medication")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{drug ? "Edit Medication" : "Add New Medication"}</DialogTitle>
          <DialogDescription>
            {drug ? "Update medication details" : "Add a new medication to the inventory"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Aspirin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="genericName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Generic Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Acetylsalicylic Acid" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bayer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dosageForm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage Form *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Tablet, Capsule, Syrup" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strength *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 500mg, 10ml" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Stock *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stock *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Stock *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiry Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : drug ? "Update" : "Add Medication"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
