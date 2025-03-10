"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  Download,
  Calendar,
  Clock,
  Edit,
  Info,
} from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { format, addDays } from "date-fns";
import { de } from "date-fns/locale";

interface ViewReportPageProps {
  params: {
    filename: string;
  };
}

interface ReportActivity {
  Datum: string;
  Wochentag: string;
  Tätigkeit: string;
  Stunden: number;
  Art: string;
}

interface ReportSummary {
  Titel: string;
  Berichtstyp: string;
  Abteilung: string;
  StartDatum: string;
  EndDatum: string;
  Anmerkungen: string;
}

// Template-Pfad für Excel-Export
const TEMPLATE_URL = "/reports/Template.xlsx";

export default function ViewReportPage({ params }: ViewReportPageProps) {
  const { filename } = params;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(
    null
  );
  const [workActivities, setWorkActivities] = useState<ReportActivity[]>([]);
  const [schoolActivities, setSchoolActivities] = useState<ReportActivity[]>(
    []
  );

  useEffect(() => {
    loadReportData();
  }, [filename]);

  const loadReportData = async () => {
    if (!filename) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports/${filename}`);
      if (!response.ok) {
        throw new Error("Fehler beim Laden des Berichts");
      }

      const data = await response.json();

      if (data.data) {
        // Zusammenfassung finden
        const summary = data.data.find(
          (item: any) => item.Berichtstyp || item.Titel
        );

        if (summary) {
          setReportSummary({
            Titel: summary.Titel || "",
            Berichtstyp: summary.Berichtstyp || "weekly",
            Abteilung: summary.Abteilung || "",
            StartDatum: summary.StartDatum || "",
            EndDatum: summary.EndDatum || "",
            Anmerkungen: summary.Anmerkungen || "",
          });
        }

        // Aktivitäten nach Typ sortieren
        const work: ReportActivity[] = [];
        const school: ReportActivity[] = [];

        data.data.forEach((entry: any) => {
          if (entry.Datum && entry.Tätigkeit) {
            if (entry.Art === "Schule") {
              school.push(entry as ReportActivity);
            } else {
              work.push(entry as ReportActivity);
            }
          }
        });

        setWorkActivities(work);
        setSchoolActivities(school);
      }
    } catch (error) {
      console.error("Fehler beim Laden des Berichts:", error);
      toast({
        title: "Fehler",
        description: "Der Bericht konnte nicht geladen werden.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!reportSummary) return;

    setIsLoading(true);

    try {
      // Kalenderwoche berechnen
      let weekNumber = "";
      if (reportSummary.StartDatum) {
        // ISO-Wochennummer berechnen
        const date = new Date(reportSummary.StartDatum);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
        const week1 = new Date(date.getFullYear(), 0, 4);
        weekNumber = String(
          1 +
            Math.round(
              ((date.getTime() - week1.getTime()) / 86400000 -
                3 +
                ((week1.getDay() + 6) % 7)) /
                7
            )
        );
      }

      // Aktivitäten sammeln und nach Datum gruppieren
      const activitiesByDate: Record<
        string,
        {
          date: string;
          descriptions: string[];
          hours: number;
        }
      > = {};

      // Arbeitstätigkeiten hinzufügen
      workActivities.forEach((activity) => {
        const dateKey = activity.Datum;

        if (!activitiesByDate[dateKey]) {
          activitiesByDate[dateKey] = {
            date: activity.Datum,
            descriptions: [],
            hours: 0,
          };
        }

        activitiesByDate[dateKey].descriptions.push(
          `${activity.Tätigkeit} (${activity.Art})`
        );
        activitiesByDate[dateKey].hours += activity.Stunden;
      });

      // Schultätigkeiten hinzufügen
      schoolActivities.forEach((activity) => {
        const dateKey = activity.Datum;

        if (!activitiesByDate[dateKey]) {
          activitiesByDate[dateKey] = {
            date: activity.Datum,
            descriptions: [],
            hours: 0,
          };
        }

        activitiesByDate[dateKey].descriptions.push(
          `[Schule] ${activity.Tätigkeit} (${activity.Art})`
        );
        activitiesByDate[dateKey].hours += activity.Stunden;
      });

      // In das API-Format konvertieren
      const days = Object.values(activitiesByDate).map((dayData) => ({
        date: dayData.date,
        description: dayData.descriptions.join("\n"),
        hours: dayData.hours.toString(),
      }));

      // Metadaten für den Report
      const metadata = {
        Titel: reportSummary.Titel,
        Berichtstyp: reportSummary.Berichtstyp,
        Berichtsnummer: filename.replace(".json", ""),
        Ausbildungsjahr: "Anwendungsentwickler",
        Abteilung: reportSummary.Abteilung,
        StartDatum: reportSummary.StartDatum,
        EndDatum: reportSummary.EndDatum,
        Anmerkungen: reportSummary.Anmerkungen,
      };

      // Daten für die API
      const requestData = {
        filename: `${reportSummary.Titel || "Ausbildungsnachweis"}.xlsx`,
        weekNumber,
        name: "Auszubildender",
        days,
        metadata,
      };

      // API aufrufen zum Herunterladen des generierten Reports
      const response = await fetch("/api/download-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Generieren des Berichts");
      }

      // Blob erzeugen und herunterladen
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = requestData.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Excel exportiert",
        description: "Die Daten wurden erfolgreich als Excel-Datei exportiert.",
      });
    } catch (error) {
      console.error("Fehler beim Exportieren der Excel-Datei:", error);
      toast({
        title: "Fehler",
        description: "Die Excel-Datei konnte nicht exportiert werden.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd.MM.yyyy", { locale: de });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <>
      <DashboardHeader />
      <DashboardShell>
        <PageHeader
          heading={reportSummary?.Titel || "Berichtsdetails"}
          text="Detaillierte Ansicht des Berichtshefts."
        >
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isLoading}
            >
              <Download className="mr-2 h-4 w-4" />
              Excel exportieren
            </Button>
            <Link href={`/dashboard/reports/edit/${filename}`}>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Bearbeiten
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
            </Link>
          </div>
        </PageHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <p>Berichtsdaten werden geladen...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Berichtsdetails</CardTitle>
                <CardDescription>
                  Grundlegende Informationen des Berichtshefts
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Berichtstyp:</span>
                    <span>
                      {reportSummary?.Berichtstyp === "weekly"
                        ? "Wochenbericht"
                        : reportSummary?.Berichtstyp === "daily"
                        ? "Tagesbericht"
                        : reportSummary?.Berichtstyp === "monthly"
                        ? "Monatsbericht"
                        : reportSummary?.Berichtstyp || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Abteilung:</span>
                    <span>
                      {reportSummary?.Abteilung === "it"
                        ? "IT-Abteilung"
                        : reportSummary?.Abteilung === "marketing"
                        ? "Marketing"
                        : reportSummary?.Abteilung === "sales"
                        ? "Vertrieb"
                        : reportSummary?.Abteilung === "hr"
                        ? "Personalabteilung"
                        : reportSummary?.Abteilung === "production"
                        ? "Produktion"
                        : reportSummary?.Abteilung || "-"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Startdatum:</span>
                    <span>{formatDate(reportSummary?.StartDatum || "")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Enddatum:</span>
                    <span>{formatDate(reportSummary?.EndDatum || "")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="work" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="work">Betriebliche Tätigkeiten</TabsTrigger>
                <TabsTrigger value="school">Schulische Tätigkeiten</TabsTrigger>
                {reportSummary?.Anmerkungen && (
                  <TabsTrigger value="notes">Anmerkungen</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="work">
                <Card>
                  <CardHeader>
                    <CardTitle>Betriebliche Tätigkeiten</CardTitle>
                    <CardDescription>
                      Auflistung aller betrieblichen Tätigkeiten
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {workActivities.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        Keine betrieblichen Tätigkeiten erfasst.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Datum</TableHead>
                            <TableHead>Wochentag</TableHead>
                            <TableHead>Tätigkeit</TableHead>
                            <TableHead className="text-right">
                              Stunden
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {workActivities.map((activity, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {formatDate(activity.Datum)}
                              </TableCell>
                              <TableCell>{activity.Wochentag}</TableCell>
                              <TableCell>{activity.Tätigkeit}</TableCell>
                              <TableCell className="text-right">
                                {activity.Stunden}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="school">
                <Card>
                  <CardHeader>
                    <CardTitle>Schulische Tätigkeiten</CardTitle>
                    <CardDescription>
                      Auflistung aller schulischen Tätigkeiten
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {schoolActivities.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        Keine schulischen Tätigkeiten erfasst.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Datum</TableHead>
                            <TableHead>Wochentag</TableHead>
                            <TableHead>Tätigkeit</TableHead>
                            <TableHead className="text-right">
                              Stunden
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {schoolActivities.map((activity, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {formatDate(activity.Datum)}
                              </TableCell>
                              <TableCell>{activity.Wochentag}</TableCell>
                              <TableCell>{activity.Tätigkeit}</TableCell>
                              <TableCell className="text-right">
                                {activity.Stunden}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {reportSummary?.Anmerkungen && (
                <TabsContent value="notes">
                  <Card>
                    <CardHeader>
                      <CardTitle>Anmerkungen</CardTitle>
                      <CardDescription>
                        Zusätzliche Anmerkungen zu diesem Berichtsheft
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-full">
                        <p>{reportSummary.Anmerkungen}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </DashboardShell>
    </>
  );
}
