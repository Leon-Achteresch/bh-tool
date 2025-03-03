"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import Link from "next/link";

export function UpcomingDeadlines() {
  const deadlines = [
    {
      id: "1",
      title: "Wochenbericht KW 24",
      date: "15.06.2025",
      daysLeft: 5,
      priority: "high"
    },
    {
      id: "2",
      title: "Wochenbericht KW 25",
      date: "22.06.2025",
      daysLeft: 12,
      priority: "medium"
    },
    {
      id: "3",
      title: "Monatsbericht Juni",
      date: "30.06.2025",
      daysLeft: 20,
      priority: "medium"
    },
    {
      id: "4",
      title: "Wochenbericht KW 26",
      date: "29.06.2025",
      daysLeft: 19,
      priority: "low"
    }
  ];

  const getPriorityColor = (priority: string, daysLeft: number) => {
    if (daysLeft <= 3) return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
    if (daysLeft <= 7) return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
    return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anstehende Fristen</CardTitle>
        <CardDescription>
          Ihre nächsten Abgabetermine
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deadlines.map((deadline) => (
            <div
              key={deadline.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{deadline.title}</p>
                  <p className="text-sm text-muted-foreground">{deadline.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getPriorityColor(deadline.priority, deadline.daysLeft)}>
                  <Clock className="mr-1 h-3 w-3" />
                  {deadline.daysLeft} {deadline.daysLeft === 1 ? "Tag" : "Tage"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Link href="/dashboard/calendar" className="w-full">
          <Button variant="outline" className="w-full">
            Kalender öffnen
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}