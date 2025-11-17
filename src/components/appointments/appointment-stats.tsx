"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, CheckCircle, XCircle } from "lucide-react";
import { getAppointmentStatistics } from "@/lib/actions/appointment";
import { toast } from "sonner";

interface AppointmentStatsProps {
  className?: string;
}

export function AppointmentStats({ className }: AppointmentStatsProps) {
  const [stats, setStats] = useState({
    totalToday: 0,
    scheduledToday: 0,
    completedToday: 0,
    cancelledToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const result = await getAppointmentStatistics();
        
        if (result.success && result.data) {
          setStats(result.data);
        } else {
          toast.error("Failed to load appointment statistics");
        }
      } catch (error) {
        console.error("Error loading appointment stats:", error);
        toast.error("An error occurred while loading statistics");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Today's Appointments
          </CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "-" : stats.totalToday}</div>
          <p className="text-xs text-muted-foreground">
            Total appointments today
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Scheduled
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "-" : stats.scheduledToday}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting patients
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Completed
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "-" : stats.completedToday}</div>
          <p className="text-xs text-muted-foreground">
            Finished today
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Cancelled
          </CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "-" : stats.cancelledToday}</div>
          <p className="text-xs text-muted-foreground">
            Cancelled today
          </p>
        </CardContent>
      </Card>
    </div>
  );
}