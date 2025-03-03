"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye } from "lucide-react";
import Link from "next/link";

interface RecentReportsProps {
  showAll?: boolean;
}

export function RecentReports({ showAll = false }: RecentReportsProps) {
  const reports = [
    {
      id: "1",
      title: "Wochenbericht KW 23",
      date: "10.06.2025",
      status: "approved",
      statusLabel: "Freigegeben"
    },
    {
      id: "2",
      title: "Wochenbericht KW 22",
      date: "03.06.2025",
      status: "approved",
      statusLabel: "Freigegeben"
    },
    {
      id: "3",
      title: "Wochenbericht KW 21",
      date: "27.05.2025",
      status: "pending",
      statusLabel: "Ausstehend"
    },
    {
      id: "4",
      title: "Wochenbericht KW 20",
      date: "20.05.2025",
      status: "rejected",
      statusLabel: "Abgelehnt"
    },
    {
      id: "5",
      title: "Wochenbericht KW 19",
      date: "13.05.2025",
      status: "approved",
      statusLabel: "Freigegeben"
    },
    {
      id: "6",
      title: "Wochenbericht KW 18",
      date: "06.05.2025",
      status: "approved",
      statusLabel: "Freigegeben"
    }
  ];

  const displayReports = showAll ? reports : reports.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktuelle Berichte</CardTitle>
        <CardDescription>
          Ihre zuletzt erstellten Berichtshefte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayReports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{report.title}</p>
                  <p className="text-sm text-muted-foreground">{report.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(report.status)}>
                  {report.statusLabel}
                </Badge>
                <Link href={`/dashboard/reports/${report.id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      {!showAll && (
        <CardFooter>
          <Link href="/dashboard/reports" className="w-full">
            <Button variant="outline" className="w-full">
              Alle Berichte anzeigen
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}