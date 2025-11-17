"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Bed as BedIcon, Users, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BedFormDialog } from "./bed-form-dialog"
import { AdmissionDialog } from "./admission-dialog"

interface Ward {
  id: string
  name: string
  wardType: string
  totalBeds: number
  isActive: boolean
  beds: {
    id: string
    bedNumber: string
    bedType: string
    isOccupied: boolean
    isActive: boolean
  }[]
}

interface WardListProps {
  wards: Ward[]
}

export function WardList({ wards }: WardListProps) {
  const router = useRouter()
  const [expandedWard, setExpandedWard] = useState<string | null>(null)

  const toggleWard = (wardId: string) => {
    setExpandedWard(expandedWard === wardId ? null : wardId)
  }

  if (wards.length === 0) {
    return (
      <div className="text-center py-12">
        <BedIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No wards found</h3>
        <p className="text-muted-foreground">
          Get started by creating a new ward.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {wards.map((ward) => {
        const occupiedBeds = ward.beds.filter(bed => bed.isOccupied).length
        const availableBeds = ward.beds.length - occupiedBeds
        const occupancyRate = ward.beds.length > 0 
          ? Math.round((occupiedBeds / ward.beds.length) * 100) 
          : 0

        return (
          <Card key={ward.id}>
            <CardHeader 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => toggleWard(ward.id)}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {ward.name}
                    <Badge variant="outline">{ward.wardType}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {ward.totalBeds} beds • {occupiedBeds} occupied • {availableBeds} available
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold">{occupancyRate}%</div>
                    <div className="text-xs text-muted-foreground">Occupancy</div>
                  </div>
                  <BedFormDialog wardId={ward.id}>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Bed
                    </Button>
                  </BedFormDialog>
                </div>
              </div>
            </CardHeader>

            {expandedWard === ward.id && (
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bed Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ward.beds.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No beds in this ward
                        </TableCell>
                      </TableRow>
                    ) : (
                      ward.beds.map((bed) => (
                        <TableRow key={bed.id}>
                          <TableCell className="font-medium">{bed.bedNumber}</TableCell>
                          <TableCell>{bed.bedType}</TableCell>
                          <TableCell>
                            {bed.isOccupied ? (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">
                                Occupied
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Available
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!bed.isOccupied && (
                              <AdmissionDialog bedId={bed.id}>
                                <Button size="sm" variant="outline">
                                  <Users className="mr-2 h-4 w-4" />
                                  Admit Patient
                                </Button>
                              </AdmissionDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
