"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Plus,
  FileEdit,
  Download,
  Trash2,
  RefreshCw,
  FileText,
  PencilIcon,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

interface Report {
  filename: string;
  path: string;
  createdAt: string;
  title?: string;
  reportDate?: string;
  reportType?: string;
  department?: string;
}

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Berichte beim Laden abrufen
  useEffect(() => {
    fetchReports();
  }, []);

  // Funktion zum Abrufen aller Berichte
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/reports");
      if (!response.ok) {
        throw new Error("Fehler beim Abrufen der Berichte");
      }
      const data = await response.json();

      // Erweiterte Informationen für jeden Bericht abrufen
      const reportsWithDetails = await Promise.all(
        (data.reports || []).map(async (report: Report) => {
          try {
            const detailResponse = await fetch(
              `/api/reports/${report.filename}`
            );
            if (detailResponse.ok) {
              const detail = await detailResponse.json();
              if (detail.data && detail.data[0]) {
                return {
                  ...report,
                  title: detail.data[0].Titel || "Kein Titel",
                  reportDate: detail.data[0].Datum || "-",
                  reportType: detail.data[0].Berichtstyp || "-",
                  department: detail.data[0].Abteilung || "-",
                };
              }
            }
            return report;
          } catch (error) {
            console.error("Fehler beim Abrufen der Berichtsdetails:", error);
            return report;
          }
        })
      );

      setReports(reportsWithDetails);
    } catch (error) {
      console.error("Fehler beim Abrufen der Berichte:", error);
      toast({
        title: "Fehler",
        description: "Die Berichte konnten nicht abgerufen werden.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Funktion zum Löschen eines Berichts
  const handleDeleteReport = async (filename: string) => {
    if (!confirm("Möchten Sie diesen Bericht wirklich löschen?")) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/reports/${filename}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Fehler beim Löschen des Berichts");
      }

      // Liste der Berichte aktualisieren
      await fetchReports();

      toast({
        title: "Bericht gelöscht",
        description: "Der Bericht wurde erfolgreich gelöscht.",
      });
    } catch (error) {
      console.error("Fehler beim Löschen des Berichts:", error);
      toast({
        title: "Fehler",
        description: "Der Bericht konnte nicht gelöscht werden.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Funktion zum Exportieren eines Berichts
  const handleExportReport = async (filename: string) => {
    setIsLoading(true);

    try {
      // Direkter Download-Link zur Datei im public-Verzeichnis
      const downloadUrl = `/reports/${filename}`;

      // Link-Element erstellen und klicken
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download gestartet",
        description: "Die Excel-Datei wird heruntergeladen.",
      });
    } catch (error) {
      console.error("Fehler beim Herunterladen der Excel-Datei:", error);
      toast({
        title: "Fehler",
        description: "Die Excel-Datei konnte nicht heruntergeladen werden.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardShell>
      <DashboardHeader />
      <PageHeader
        heading="Dashboard"
        text="Verwalten Sie hier Ihre Berichtshefte."
      >
        <div className="flex items-center gap-2">
          <Link href="/dashboard/reports/new">
            <Button disabled={isLoading}>
              <Plus className="mr-2 h-4 w-4" />
              Neues Berichtsheft
            </Button>
          </Link>
          <Button variant="outline" onClick={fetchReports} disabled={isLoading}>
            <RefreshCw
              className={cn("mr-2 h-4 w-4", {
                "animate-spin": isLoading,
              })}
            />
            Aktualisieren
          </Button>
          <Link href="/dashboard/template-test">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Template testen
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Alle Berichtshefte</CardTitle>
              <CardDescription>
                Hier finden Sie eine Übersicht aller Ihrer Berichtshefte.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchReports}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Berichte werden geladen...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="mb-4 text-muted-foreground">
                  Keine Berichtshefte gefunden
                </p>
                <Link href="/dashboard/reports/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Berichtsheft erstellen
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableCaption>
                  Eine Liste aller Ihrer Berichtshefte.
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titel</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Berichtstyp</TableHead>
                    <TableHead>Abteilung</TableHead>
                    <TableHead>Erstellt am</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.filename}>
                      <TableCell className="font-medium">
                        {report.title || "Kein Titel"}
                      </TableCell>
                      <TableCell>{report.reportDate || "-"}</TableCell>
                      <TableCell>
                        {report.reportType === "weekly"
                          ? "Wochenbericht"
                          : report.reportType === "daily"
                          ? "Tagesbericht"
                          : report.reportType === "monthly"
                          ? "Monatsbericht"
                          : report.reportType === "project"
                          ? "Projektbericht"
                          : report.reportType || "-"}
                      </TableCell>
                      <TableCell>
                        {report.department === "it"
                          ? "IT-Abteilung"
                          : report.department === "marketing"
                          ? "Marketing"
                          : report.department === "sales"
                          ? "Vertrieb"
                          : report.department === "hr"
                          ? "Personalabteilung"
                          : report.department === "production"
                          ? "Produktion"
                          : report.department || "-"}
                      </TableCell>
                      <TableCell>
                        {report.createdAt
                          ? format(new Date(report.createdAt), "dd.MM.yyyy", {
                              locale: de,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/dashboard/reports/view/${report.filename}`}
                          >
                            <Button variant="outline" size="icon">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link
                            href={`/dashboard/reports/edit/${report.filename}`}
                          >
                            <Button variant="outline" size="icon">
                              <FileEdit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleExportReport(report.filename)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteReport(report.filename)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
