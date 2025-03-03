"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Eye, XCircle } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface PendingApprovalsProps {
  showAll?: boolean;
}

export function PendingApprovals({ showAll = false }: PendingApprovalsProps) {
  const approvals = [
    {
      id: "1",
      title: "Wochenbericht KW 23",
      date: "10.06.2025",
      user: "Max Müller",
      userInitials: "MM",
      status: "pending"
    },
    {
      id: "2",
      title: "Wochenbericht KW 22",
      date: "03.06.2025",
      user: "Laura Schmidt",
      userInitials: "LS",
      status: "pending"
    },
    {
      id: "3",
      title: "Wochenbericht KW 21",
      date: "27.05.2025",
      user: "Thomas Weber",
      userInitials: "TW",
      status: "pending"
    },
    {
      id: "4",
      title: "Wochenbericht KW 20",
      date: "20.05.2025",
      user: "Max Müller",
      userInitials: "MM",
      status: "approved"
    },
    {
      id: "5",
      title: "Wochenbericht KW 19",
      date: "13.05.2025",
      user: "Laura Schmidt",
      userInitials: "LS",
      status: "rejected"
    }
  ];

  const displayApprovals = showAll ? approvals : approvals.filter(a => a.status === "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ausstehende Freigaben</CardTitle>
        <CardDescription>
          Berichte, die auf Ihre Freigabe warten
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayApprovals.length > 0 ? (
            displayApprovals.map((approval) => (
              <div
                key={approval.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{approval.userInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{approval.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {approval.user} • {approval.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {approval.status === "pending" ? (
                    <>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    </>
                  ) : (
                    <Badge
                      className={
                        approval.status === "approved"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      }
                    >
                      {approval.status === "approved" ? "Freigegeben" : "Abgelehnt"}
                    </Badge>
                  )}
                  <Link href={`/dashboard/approvals/${approval.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Keine ausstehenden Freigaben vorhanden.
            </div>
          )}
        </div>
      </CardContent>
      {!showAll && displayApprovals.length > 0 && (
        <CardFooter>
          <Link href="/dashboard/approvals" className="w-full">
            <Button variant="outline" className="w-full">
              Alle Freigaben anzeigen
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}