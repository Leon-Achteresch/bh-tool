"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  ChevronLeft,
  Clock,
  Plus,
  Trash,
  Save,
  Download,
} from "lucide-react";
import { format, addDays, startOfWeek, getDay, parse } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

interface ActivityEntry {
  id: string;
  description: string;
  hours: number;
  activityType?: string;
}

interface DayEntry {
  date: Date;
  workActivities: ActivityEntry[];
  schoolActivities: ActivityEntry[];
  isSchoolDay: boolean;
}

interface EditReportPageProps {
  params: {
    filename: string;
  };
}

// Template-Pfad für Excel-Export
const TEMPLATE_URL = "/reports/Template.xlsx";

export default function EditReportPage({ params }: EditReportPageProps) {
  const { filename } = params;
  const [startDate, setStartDate] = useState<Date | undefined>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [reportType, setReportType] = useState("weekly");
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("it");
  const [isLoading, setIsLoading] = useState(false);
  const [dayEntries, setDayEntries] = useState<DayEntry[]>(
    initializeDayEntries()
  );
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  function initializeDayEntries(): DayEntry[] {
    const entries: DayEntry[] = [];
    const startDay = startOfWeek(new Date(), { weekStartsOn: 1 }); // Montag

    // 5 Arbeitstage (Mo-Fr)
    for (let i = 0; i < 5; i++) {
      const date = addDays(startDay, i);
      entries.push({
        date,
        workActivities: [
          { id: `work-${date.toISOString()}-1`, description: "", hours: 0 },
        ],
        schoolActivities: [
          { id: `school-${date.toISOString()}-1`, description: "", hours: 0 },
        ],
        isSchoolDay: i === 3 || i === 4, // Default: Do und Fr sind Schultage
      });
    }

    return entries;
  }

  // Laden der Berichtsdaten
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

      // Daten aus den Arbeitsblättern extrahieren
      if (data.data) {
        const summaryData = data.data.find(
          (item: any) => item.Berichtstyp || item.Titel
        );

        if (summaryData) {
          setTitle(summaryData.Titel || "");
          setReportType(summaryData.Berichtstyp || "weekly");
          setDepartment(summaryData.Abteilung || "it");
          setNotes(summaryData.Anmerkungen || "");

          if (summaryData.StartDatum) {
            try {
              setStartDate(new Date(summaryData.StartDatum));
            } catch (error) {
              console.error("Fehler beim Parsen des Datums:", error);
            }
          }
        }

        // Alle Aktivitäten verarbeiten
        const newEntries = initializeDayEntries();

        data.data.forEach((entry: any) => {
          if (!entry.Datum || !entry.Tätigkeit) return;

          const date = new Date(entry.Datum);
          const dayOfWeek = getDay(date) - 1; // 0 = Montag in unserem Array

          if (dayOfWeek >= 0 && dayOfWeek < 5) {
            const isSchoolActivity = entry.Art === "Schule";

            if (isSchoolActivity) {
              // Schultag markieren
              newEntries[dayOfWeek].isSchoolDay = true;

              // Bestehenden Eintrag finden oder neuen erstellen
              const existingIndex = newEntries[
                dayOfWeek
              ].schoolActivities.findIndex(
                (a) => a.description === "" && a.hours === 0
              );

              if (existingIndex >= 0) {
                newEntries[dayOfWeek].schoolActivities[existingIndex] = {
                  id: `school-${date.toISOString()}-${existingIndex}`,
                  description: entry.Tätigkeit || "",
                  hours: entry.Stunden || 0,
                  activityType: entry.Art || "Schule",
                };
              } else {
                newEntries[dayOfWeek].schoolActivities.push({
                  id: `school-${date.toISOString()}-${
                    newEntries[dayOfWeek].schoolActivities.length + 1
                  }`,
                  description: entry.Tätigkeit || "",
                  hours: entry.Stunden || 0,
                  activityType: entry.Art || "Schule",
                });
              }
            } else {
              // Bestehenden Eintrag finden oder neuen erstellen
              const existingIndex = newEntries[
                dayOfWeek
              ].workActivities.findIndex(
                (a) => a.description === "" && a.hours === 0
              );

              if (existingIndex >= 0) {
                newEntries[dayOfWeek].workActivities[existingIndex] = {
                  id: `work-${date.toISOString()}-${existingIndex}`,
                  description: entry.Tätigkeit || "",
                  hours: entry.Stunden || 0,
                  activityType: entry.Art || "Arbeit",
                };
              } else {
                newEntries[dayOfWeek].workActivities.push({
                  id: `work-${date.toISOString()}-${
                    newEntries[dayOfWeek].workActivities.length + 1
                  }`,
                  description: entry.Tätigkeit || "",
                  hours: entry.Stunden || 0,
                  activityType: entry.Art || "Arbeit",
                });
              }
            }
          }
        });

        setDayEntries(newEntries);
      }

      setIsDataLoaded(true);
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

  const addActivityEntry = (dayIndex: number, type: "work" | "school") => {
    const newEntries = [...dayEntries];
    const day = newEntries[dayIndex];
    const activities =
      type === "work" ? day.workActivities : day.schoolActivities;
    const newId = `${type}-${day.date.toISOString()}-${activities.length + 1}`;

    activities.push({
      id: newId,
      description: "",
      hours: 0,
    });

    setDayEntries(newEntries);
  };

  const removeActivityEntry = (
    dayIndex: number,
    activityIndex: number,
    type: "work" | "school"
  ) => {
    const newEntries = [...dayEntries];
    const day = newEntries[dayIndex];
    const activities =
      type === "work" ? day.workActivities : day.schoolActivities;

    if (activities.length > 1) {
      activities.splice(activityIndex, 1);
      setDayEntries(newEntries);
    } else {
      toast({
        title: "Hinweis",
        description: "Mindestens ein Eintrag muss vorhanden sein.",
      });
    }
  };

  const updateActivityDescription = (
    dayIndex: number,
    activityIndex: number,
    type: "work" | "school",
    description: string
  ) => {
    const newEntries = [...dayEntries];
    const day = newEntries[dayIndex];
    const activities =
      type === "work" ? day.workActivities : day.schoolActivities;

    activities[activityIndex].description = description;
    setDayEntries(newEntries);
  };

  const updateActivityHours = (
    dayIndex: number,
    activityIndex: number,
    type: "work" | "school",
    hours: number
  ) => {
    const newEntries = [...dayEntries];
    const day = newEntries[dayIndex];
    const activities =
      type === "work" ? day.workActivities : day.schoolActivities;

    activities[activityIndex].hours = hours;
    setDayEntries(newEntries);
  };

  const toggleSchoolDay = (dayIndex: number, isSchoolDay: boolean) => {
    const newEntries = [...dayEntries];
    newEntries[dayIndex].isSchoolDay = isSchoolDay;
    setDayEntries(newEntries);
  };

  const handleExportExcel = async () => {
    if (!isDataLoaded) return;

    setIsLoading(true);

    try {
      // Kalenderwoche berechnen
      let weekNumber = "";
      if (startDate) {
        // ISO-Wochennummer berechnen
        const date = new Date(startDate);
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

      // Tageseinträge für die API vorbereiten
      const days = dayEntries.map((day) => {
        // Aktivitäten sammeln, mit Kennzeichnung für die Art
        let description = "";
        let totalHours = 0;

        // Arbeitstätigkeiten
        day.workActivities.forEach((activity) => {
          if (activity.description.trim() && activity.hours > 0) {
            description += `${activity.description}\n`;
            totalHours += activity.hours;
          }
        });

        // Schulische Tätigkeiten mit Tag kennzeichnen
        if (day.isSchoolDay) {
          day.schoolActivities.forEach((activity) => {
            if (activity.description.trim() && activity.hours > 0) {
              description += `[Schule] ${activity.description}\n`;
              totalHours += activity.hours;
            }
          });
        }

        return {
          date: format(day.date, "dd.MM.yyyy"),
          description: description.trim(),
          hours: totalHours.toString(),
        };
      });

      // Zusätzliche Metadaten für den Report
      const metadata = {
        Titel: title,
        Berichtstyp: "weekly",
        Berichtsnummer: filename.replace(".json", ""),
        Ausbildungsjahr: "Anwendungsentwickler",
        Abteilung: "IT",
        StartDatum: startDate ? format(startDate, "dd.MM.yyyy") : "",
        EndDatum: startDate ? format(addDays(startDate, 4), "dd.MM.yyyy") : "",
        Anmerkungen: notes,
      };

      // Daten für die API
      const requestData = {
        filename: `${title || "Ausbildungsnachweis"}.xlsx`,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const deleteResponse = await fetch(`/api/reports/${filename}`, {
        method: "DELETE",
      });

      if (!deleteResponse.ok) {
        throw new Error("Fehler beim Aktualisieren des Berichts");
      }

      const workData: Record<string, any>[] = [];
      const schoolData: Record<string, any>[] = [];

      dayEntries.forEach((day) => {
        day.workActivities.forEach((activity) => {
          if (activity.description.trim() && activity.hours > 0) {
            workData.push({
              Datum: format(day.date, "dd.MM.yyyy"),
              Wochentag: format(day.date, "EEEE", { locale: de }),
              Tätigkeit: activity.description,
              Stunden: activity.hours,
              Art: "Betrieb",
            });
          }
        });

        if (day.isSchoolDay) {
          day.schoolActivities.forEach((activity) => {
            if (activity.description.trim() && activity.hours > 0) {
              schoolData.push({
                Datum: format(day.date, "dd.MM.yyyy"),
                Wochentag: format(day.date, "EEEE", { locale: de }),
                Tätigkeit: activity.description,
                Stunden: activity.hours,
                Art: "Schule",
              });
            }
          });
        }
      });

      const allActivities = [...workData, ...schoolData];
      allActivities.sort((a, b) => {
        const dateA = new Date(a.Datum.split(".").reverse().join("-"));
        const dateB = new Date(b.Datum.split(".").reverse().join("-"));
        return dateA.getTime() - dateB.getTime();
      });

      const workbook = XLSX.utils.book_new();

      // Hauptarbeitsblatt erstellen
      const worksheet = XLSX.utils.json_to_sheet(allActivities);

      // Spaltenbreiten anpassen
      const cols = [
        { wch: 12 }, // Datum
        { wch: 15 }, // Wochentag
        { wch: 60 }, // Tätigkeit
        { wch: 10 }, // Stunden
        { wch: 10 }, // Art
      ];

      worksheet["!cols"] = cols;

      // Hauptarbeitsblatt hinzufügen
      XLSX.utils.book_append_sheet(workbook, worksheet, "Berichtsheft");

      // Metadaten-Blatt
      const metaData = [
        {
          Name: "Berichtsheft",
          Azubi: "",
          Ausbildungsjahr: "",
          Zeitraum: startDate
            ? `${format(startDate, "dd.MM.yyyy")} - ${format(
                addDays(startDate, 4),
                "dd.MM.yyyy"
              )}`
            : "",
          Titel: title,
          Abteilung: "IT",
          Notizen: notes,
        },
      ];

      const metaSheet = XLSX.utils.json_to_sheet(metaData);
      XLSX.utils.book_append_sheet(workbook, metaSheet, "Metadaten");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const file = new File([blob], `${title || "Berichtsheft"}.xlsx`, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);

      const response = await fetch("/api/reports", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Fehler beim Speichern des Berichts");
      }

      toast({
        title: "Bericht aktualisiert",
        description: "Ihr Berichtsheft wurde erfolgreich aktualisiert.",
      });

      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Der Bericht konnte nicht aktualisiert werden.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DashboardHeader />
      <DashboardShell>
        <PageHeader
          heading="Berichtsheft bearbeiten"
          text="Aktualisieren Sie die Informationen in Ihrem Berichtsheft."
        >
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isLoading || !isDataLoaded}
            >
              <Download className="mr-2 h-4 w-4" />
              Excel exportieren
            </Button>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
            </Link>
          </div>
        </PageHeader>

        {isLoading && !isDataLoaded ? (
          <div className="flex justify-center py-12">
            <p>Berichtsdaten werden geladen...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Berichtsdetails</CardTitle>
                  <CardDescription>
                    Bearbeiten Sie die grundlegenden Informationen des
                    Berichtshefts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titel</Label>
                      <Input
                        id="title"
                        placeholder="z.B. Berichtsheft KW 24"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Startdatum</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="start-date"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate
                              ? format(startDate, "PPP", { locale: de })
                              : "Datum auswählen"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            weekStartsOn={1}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="workdays" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="workdays">Arbeitstage</TabsTrigger>
                  <TabsTrigger value="schooldays">Schultage</TabsTrigger>
                  <TabsTrigger value="notes">Anmerkungen</TabsTrigger>
                </TabsList>

                <TabsContent value="workdays">
                  <Card>
                    <CardHeader>
                      <CardTitle>Betriebliche Tätigkeiten</CardTitle>
                      <CardDescription>
                        Erfassen Sie Ihre täglichen betrieblichen Tätigkeiten
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {dayEntries.map((day, dayIndex) => (
                        <div key={dayIndex} className="border rounded-lg p-4">
                          <div className="font-medium mb-2">
                            {startDate &&
                              format(
                                addDays(startDate, dayIndex),
                                "EEEE, dd.MM.yyyy",
                                { locale: de }
                              )}
                          </div>

                          {day.workActivities.map((activity, activityIndex) => (
                            <div
                              key={activity.id}
                              className="grid grid-cols-12 gap-2 mb-2 items-start"
                            >
                              <div className="col-span-7 md:col-span-8">
                                <Label
                                  htmlFor={`work-activity-${dayIndex}-${activityIndex}`}
                                  className="sr-only"
                                >
                                  Tätigkeitsbeschreibung
                                </Label>
                                <Textarea
                                  id={`work-activity-${dayIndex}-${activityIndex}`}
                                  placeholder="Tätigkeitsbeschreibung"
                                  className="resize-none min-h-[60px]"
                                  value={activity.description}
                                  onChange={(e) =>
                                    updateActivityDescription(
                                      dayIndex,
                                      activityIndex,
                                      "work",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="col-span-3 md:col-span-3">
                                <Label
                                  htmlFor={`work-hours-${dayIndex}-${activityIndex}`}
                                  className="sr-only"
                                >
                                  Stunden
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <Input
                                    id={`work-hours-${dayIndex}-${activityIndex}`}
                                    type="number"
                                    placeholder="Std."
                                    min="0"
                                    max="24"
                                    step="0.5"
                                    value={activity.hours || ""}
                                    onChange={(e) =>
                                      updateActivityHours(
                                        dayIndex,
                                        activityIndex,
                                        "work",
                                        Number(e.target.value)
                                      )
                                    }
                                  />
                                </div>
                              </div>
                              <div className="col-span-2 md:col-span-1 flex items-center justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    removeActivityEntry(
                                      dayIndex,
                                      activityIndex,
                                      "work"
                                    )
                                  }
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => addActivityEntry(dayIndex, "work")}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Tätigkeit hinzufügen
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="schooldays">
                  <Card>
                    <CardHeader>
                      <CardTitle>Schulische Tätigkeiten</CardTitle>
                      <CardDescription>
                        Erfassen Sie Ihre schulischen Tätigkeiten an
                        Berufsschultagen
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {dayEntries.map((day, dayIndex) => (
                        <div key={dayIndex} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">
                              {startDate &&
                                format(
                                  addDays(startDate, dayIndex),
                                  "EEEE, dd.MM.yyyy",
                                  { locale: de }
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`school-day-${dayIndex}`}
                                checked={day.isSchoolDay}
                                onCheckedChange={(checked) =>
                                  toggleSchoolDay(dayIndex, checked === true)
                                }
                              />
                              <Label htmlFor={`school-day-${dayIndex}`}>
                                Schultag
                              </Label>
                            </div>
                          </div>

                          {day.isSchoolDay && (
                            <>
                              {day.schoolActivities.map(
                                (activity, activityIndex) => (
                                  <div
                                    key={activity.id}
                                    className="grid grid-cols-12 gap-2 mb-2 items-start"
                                  >
                                    <div className="col-span-7 md:col-span-8">
                                      <Label
                                        htmlFor={`school-activity-${dayIndex}-${activityIndex}`}
                                        className="sr-only"
                                      >
                                        Tätigkeitsbeschreibung
                                      </Label>
                                      <Textarea
                                        id={`school-activity-${dayIndex}-${activityIndex}`}
                                        placeholder="Tätigkeitsbeschreibung (z.B. Unterrichtsfach, Thema)"
                                        className="resize-none min-h-[60px]"
                                        value={activity.description}
                                        onChange={(e) =>
                                          updateActivityDescription(
                                            dayIndex,
                                            activityIndex,
                                            "school",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="col-span-3 md:col-span-3">
                                      <Label
                                        htmlFor={`school-hours-${dayIndex}-${activityIndex}`}
                                        className="sr-only"
                                      >
                                        Stunden
                                      </Label>
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <Input
                                          id={`school-hours-${dayIndex}-${activityIndex}`}
                                          type="number"
                                          placeholder="Std."
                                          min="0"
                                          max="24"
                                          step="0.5"
                                          value={activity.hours || ""}
                                          onChange={(e) =>
                                            updateActivityHours(
                                              dayIndex,
                                              activityIndex,
                                              "school",
                                              Number(e.target.value)
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                    <div className="col-span-2 md:col-span-1 flex items-center justify-end">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          removeActivityEntry(
                                            dayIndex,
                                            activityIndex,
                                            "school"
                                          )
                                        }
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )
                              )}

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() =>
                                  addActivityEntry(dayIndex, "school")
                                }
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Tätigkeit hinzufügen
                              </Button>
                            </>
                          )}

                          {!day.isSchoolDay && (
                            <div className="py-4 text-center text-muted-foreground text-sm">
                              Kein Schultag. Aktivieren Sie die Checkbox, um
                              Schultätigkeiten einzutragen.
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notes">
                  <Card>
                    <CardHeader>
                      <CardTitle>Anmerkungen</CardTitle>
                      <CardDescription>
                        Zusätzliche Anmerkungen zu Ihrem Berichtsheft
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Hier können Sie zusätzliche Anmerkungen erfassen..."
                        className="min-h-[200px]"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  Als Entwurf speichern
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Wird gespeichert..." : "Speichern"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DashboardShell>
    </>
  );
}
