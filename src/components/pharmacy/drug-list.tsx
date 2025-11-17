"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import {
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Plus,
  Minus,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

import { getDrugs, deleteDrug, updateDrugStock } from "@/lib/actions/pharmacy"
import { DrugFormDialog } from "./drug-form-dialog"
import { StockUpdateDialog } from "./stock-update-dialog"

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
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export function DrugList() {
  const [drugs, setDrugs] = useState<Drug[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [stockOpen, setStockOpen] = useState(false)

  useEffect(() => {
    loadDrugs()
  }, [])

  async function loadDrugs() {
    try {
      setLoading(true)
      const result = await getDrugs()
      if (result.success) {
        setDrugs(result.data || [])
      } else {
        toast.error("Failed to load medications")
      }
    } catch (error) {
      toast.error("An error occurred while loading medications")
    } finally {
      setLoading(false)
    }
  }

  const filteredDrugs = drugs.filter(drug =>
    searchTerm === "" ||
    drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drug.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drug.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drug.dosageForm.toLowerCase().includes(searchTerm.toLowerCase())
  )

  async function handleDelete(drugId: string) {
    if (!confirm("Are you sure you want to delete this medication?")) return

    try {
      const result = await deleteDrug(drugId)
      if (result.success) {
        toast.success("Medication deleted successfully")
        loadDrugs()
      } else {
        toast.error(result.error || "Failed to delete medication")
      }
    } catch (error) {
      toast.error("An error occurred while deleting medication")
    }
  }

  function getStockBadge(drug: Drug) {
    if (drug.currentStock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    } else if (drug.currentStock <= drug.minStock) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-800">In Stock</Badge>
  }

  if (loading) {
    return <div>Loading medications...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <DrugFormDialog onSuccess={loadDrugs}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Medication
          </Button>
        </DrugFormDialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Generic Name</TableHead>
              <TableHead>Form & Strength</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDrugs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No medications found
                </TableCell>
              </TableRow>
            ) : (
              filteredDrugs.map((drug) => (
                <TableRow key={drug.id}>
                  <TableCell className="font-medium">
                    {drug.name}
                    {drug.currentStock <= drug.minStock && drug.currentStock > 0 && (
                      <AlertTriangle className="inline-block ml-2 h-4 w-4 text-yellow-600" />
                    )}
                  </TableCell>
                  <TableCell>{drug.genericName}</TableCell>
                  <TableCell>
                    {drug.dosageForm} - {drug.strength}
                  </TableCell>
                  <TableCell>
                    <span className={drug.currentStock <= drug.minStock ? "text-red-600 font-semibold" : ""}>
                      {drug.currentStock}
                    </span>
                    {" "}/ {drug.minStock}
                  </TableCell>
                  <TableCell>${drug.price.toFixed(2)}</TableCell>
                  <TableCell>{getStockBadge(drug)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedDrug(drug)
                            setStockOpen(true)
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Update Stock
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedDrug(drug)
                            setEditOpen(true)
                          }}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(drug.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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

      {selectedDrug && (
        <>
          <DrugFormDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            drug={selectedDrug}
            onSuccess={() => {
              loadDrugs()
              setEditOpen(false)
              setSelectedDrug(null)
            }}
          />
          <StockUpdateDialog
            open={stockOpen}
            onOpenChange={setStockOpen}
            drug={selectedDrug}
            onSuccess={() => {
              loadDrugs()
              setStockOpen(false)
              setSelectedDrug(null)
            }}
          />
        </>
      )}
    </div>
  )
}
