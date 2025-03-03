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
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { PageHeader } from "@/components/dashboard/page-header";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { ChevronLeft, Download, Eye, FileText } from "lucide-react";

export default function TemplateTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [templateInfo, setTemplateInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState<any>(null);
  const { toast } = useToast();

  const checkTemplate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/template");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Fehler beim Überprüfen der Template-Datei"
        );
      }

      setTemplateInfo(data);
      toast({
        title: "Template überprüft",
        description: "Die Template-Datei wurde erfolgreich überprüft.",
      });
    } catch (error: any) {
      console.error("Fehler:", error);
      setError(error.message);
      toast({
        title: "Fehler",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testTemplateDownload = async () => {
    setIsLoading(true);

    try {
      // Lade die Template-Datei direkt aus dem public-Verzeichnis
      const templateUrl = "/reports/Template.xlsx";

      // Link-Element erstellen und klicken
      const link = document.createElement("a");
      link.href = templateUrl;
      link.download = "Template-Test.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download gestartet",
        description: "Die Template-Datei wird heruntergeladen.",
      });
    } catch (error: any) {
      console.error("Fehler beim Herunterladen:", error);
      toast({
        title: "Fehler",
        description: "Die Template-Datei konnte nicht heruntergeladen werden.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testTemplateLoad = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Lade die Template-Datei direkt aus dem public-Verzeichnis
      const templateUrl = "/reports/Template.xlsx";

      const response = await fetch(templateUrl);
      if (!response.ok) {
        throw new Error("Template konnte nicht geladen werden");
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log("Template geladen, Größe:", arrayBuffer.byteLength, "Bytes");

      // Parse als Excel
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), {
        type: "array",
      });

      // Arbeitsblätter ausgeben
      const sheetInfo = workbook.SheetNames.map((name) => {
        const sheet = workbook.Sheets[name];
        const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
        return {
          name,
          rowCount: range.e.r - range.s.r + 1,
          colCount: range.e.c - range.s.c + 1,
        };
      });

      setTemplateInfo({
        success: true,
        message: "Template-Datei erfolgreich clientseitig geladen",
        size: arrayBuffer.byteLength,
        sheets: sheetInfo,
      });

      toast({
        title: "Template geladen",
        description: "Die Template-Datei wurde erfolgreich geladen.",
      });
    } catch (error: any) {
      console.error("Fehler beim Laden des Templates:", error);
      setError(error.message);
      toast({
        title: "Fehler",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Neue Funktion zum Anzeigen des rohen Inhalts
  const showRawContent = async () => {
    setIsLoading(true);
    setError(null);
    setRawContent(null);

    try {
      // Lade die Template-Datei direkt aus dem public-Verzeichnis
      const templateUrl = "/reports/Template.xlsx";

      const response = await fetch(templateUrl);
      if (!response.ok) {
        throw new Error("Template konnte nicht geladen werden");
      }

      const arrayBuffer = await response.arrayBuffer();

      // Parse als Excel mit allen Optionen für maximale Details
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), {
        type: "array",
        cellStyles: true,
        cellDates: true,
        cellNF: true,
      });

      // Detaillierte Informationen für jedes Arbeitsblatt sammeln
      const detailedSheets: any = {};

      workbook.SheetNames.forEach((name) => {
        const sheet = workbook.Sheets[name];

        // Zellen-Informationen extrahieren
        const cells: any = {};
        const cellAddresses = Object.keys(sheet).filter(
          (key) => !key.startsWith("!")
        );

        // Zellen nach Zeilen gruppieren
        const rowsWithContent: Record<number, any> = {};

        cellAddresses.forEach((address) => {
          const cell = sheet[address];
          const cellRef = XLSX.utils.decode_cell(address);
          const rowIndex = cellRef.r;
          const colIndex = cellRef.c;

          // Zelle speichern
          cells[address] = {
            type: cell.t, // Typ (s=string, n=number, b=boolean, etc.)
            value: cell.v, // Wert
            formula: cell.f, // Formel (falls vorhanden)
            style: cell.s, // Stil (falls vorhanden)
            rowIndex,
            colIndex,
            address,
          };

          // Zeile mit Inhalt markieren
          if (!rowsWithContent[rowIndex]) {
            rowsWithContent[rowIndex] = {
              rowIndex,
              cells: [],
            };
          }

          rowsWithContent[rowIndex].cells.push({
            address,
            colIndex,
            value: cell.v,
            type: cell.t,
            formula: cell.f,
          });
        });

        // Zeilen sortieren
        const sortedRows = Object.values(rowsWithContent).sort(
          (a: any, b: any) => a.rowIndex - b.rowIndex
        );

        // Für jede Zeile die Zellen nach Spalte sortieren
        sortedRows.forEach((row: any) => {
          row.cells.sort((a: any, b: any) => a.colIndex - b.colIndex);
        });

        // Bereichsinformationen
        const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");

        // Spaltenbreiten
        const cols = sheet["!cols"] || [];

        // Zeilenbreiten
        const rows = sheet["!rows"] || [];

        // Zusammenführungen
        const merges = sheet["!merges"] || [];

        detailedSheets[name] = {
          range: {
            startRow: range.s.r,
            startCol: range.s.c,
            endRow: range.e.r,
            endCol: range.e.c,
          },
          cells,
          rowsWithContent: sortedRows,
          cols: cols.map((col: any) => ({ width: col.wch })),
          rows: rows.map((row: any) => ({ height: row.hpt })),
          merges: merges.map((merge: any) => ({
            startRow: merge.s.r,
            startCol: merge.s.c,
            endRow: merge.e.r,
            endCol: merge.e.c,
          })),
        };
      });

      // Rohen Inhalt setzen
      const rawContentData = {
        workbookProps: workbook.Workbook || {},
        sheets: detailedSheets,
      };

      // In der Konsole ausgeben
      console.log("Roher Template-Inhalt:", rawContentData);

      // Für die Anzeige setzen
      setRawContent(rawContentData);

      toast({
        title: "Roher Inhalt analysiert",
        description:
          "Der rohe Inhalt der Template-Datei wurde in der Konsole ausgegeben.",
      });
    } catch (error: any) {
      console.error("Fehler beim Analysieren des rohen Inhalts:", error);
      setError(error.message);
      toast({
        title: "Fehler",
        description: error.message,
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
          heading="Template-Test"
          text="Überprüfe den Zugriff auf die Template-Datei."
        >
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
            </Link>
          </div>
        </PageHeader>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Template-Datei testen</CardTitle>
              <CardDescription>
                Überprüfe, ob die Template-Datei gelesen werden kann.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button onClick={checkTemplate} disabled={isLoading}>
                  <Eye className="mr-2 h-4 w-4" />
                  Template serverseitig prüfen
                </Button>
                <Button onClick={testTemplateLoad} disabled={isLoading}>
                  <Eye className="mr-2 h-4 w-4" />
                  Template clientseitig laden
                </Button>
                <Button onClick={testTemplateDownload} disabled={isLoading}>
                  <Download className="mr-2 h-4 w-4" />
                  Template herunterladen
                </Button>
                <Button onClick={showRawContent} disabled={isLoading}>
                  <FileText className="mr-2 h-4 w-4" />
                  Rohen Inhalt anzeigen
                </Button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md">
                  <p className="font-semibold">Fehler:</p>
                  <p>{error}</p>
                </div>
              )}

              {templateInfo && !rawContent && (
                <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-md">
                  <p className="font-semibold">Template-Informationen:</p>
                  <p>
                    Status: {templateInfo.success ? "Erfolgreich" : "Fehler"}
                  </p>
                  <p>Nachricht: {templateInfo.message}</p>
                  {templateInfo.path && <p>Pfad: {templateInfo.path}</p>}
                  <p>Größe: {templateInfo.size} Bytes</p>

                  <div className="mt-2">
                    <p className="font-semibold">Arbeitsblätter:</p>
                    <ul className="list-disc pl-6">
                      {templateInfo.sheets?.map((sheet: any, index: number) => (
                        <li key={index}>
                          {sheet.name}: {sheet.rowCount} Zeilen,{" "}
                          {sheet.colCount} Spalten
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {rawContent && (
                <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-md overflow-auto max-h-[600px]">
                  <p className="font-semibold">Roher Template-Inhalt:</p>
                  <p className="text-sm">
                    Der vollständige Inhalt wurde in der Konsole ausgegeben
                    (F12).
                  </p>

                  <div className="mt-2">
                    <p className="font-semibold">Arbeitsblätter:</p>
                    <ul className="list-disc pl-6">
                      {Object.keys(rawContent.sheets).map(
                        (sheetName, index) => {
                          const sheet = rawContent.sheets[sheetName];
                          const cellCount = Object.keys(sheet.cells).length;
                          return (
                            <li key={index} className="mb-4">
                              <strong>{sheetName}</strong>: {cellCount} Zellen,
                              {sheet.merges.length} Zusammenführungen
                              <div className="text-xs mt-1 mb-2">
                                <p>
                                  Bereich: Zeilen {sheet.range.startRow + 1}-
                                  {sheet.range.endRow + 1}, Spalten{" "}
                                  {sheet.range.startCol + 1}-
                                  {sheet.range.endCol + 1}
                                </p>

                                <p className="font-semibold mt-2">
                                  Alle Zeilen mit Inhalt:
                                </p>
                                <div className="overflow-x-auto">
                                  <table className="border-collapse border border-blue-300 mt-1 w-full">
                                    <thead>
                                      <tr>
                                        <th className="border border-blue-300 px-2 py-1">
                                          Zeile
                                        </th>
                                        <th className="border border-blue-300 px-2 py-1">
                                          Zellen
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sheet.rowsWithContent.map(
                                        (row: any, rowIndex: number) => (
                                          <tr
                                            key={rowIndex}
                                            className={
                                              rowIndex % 2 === 0
                                                ? "bg-blue-100"
                                                : ""
                                            }
                                          >
                                            <td className="border border-blue-300 px-2 py-1 text-center">
                                              {row.rowIndex + 1}
                                            </td>
                                            <td className="border border-blue-300 px-2 py-1">
                                              <div className="flex flex-wrap gap-2">
                                                {row.cells.map(
                                                  (
                                                    cell: any,
                                                    cellIndex: number
                                                  ) => {
                                                    // Spaltenindex in Buchstaben umwandeln (A, B, C, ...)
                                                    const colLetter =
                                                      XLSX.utils.encode_col(
                                                        cell.colIndex
                                                      );
                                                    return (
                                                      <span
                                                        key={cellIndex}
                                                        className="inline-block bg-blue-200 px-1 rounded"
                                                      >
                                                        {colLetter}
                                                        {row.rowIndex + 1}:{" "}
                                                        {JSON.stringify(
                                                          cell.value
                                                        )}
                                                      </span>
                                                    );
                                                  }
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        )
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </li>
                          );
                        }
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    </>
  );
}
