import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import * as XLSX from "xlsx";

// Verzeichnis für Berichtsdateien
const reportsDirectory = path.join(process.cwd(), "public", "reports");
const templatePath = path.join(
  process.cwd(),
  "public",
  "reports",
  "Template.xlsx"
);

export async function GET() {
  try {
    const results: any = {
      workspace: process.cwd(),
      reportsPath: reportsDirectory,
      templatePath: templatePath,
      operations: [],
    };

    // 1. Prüfen, ob das Verzeichnis existiert
    try {
      await fs.access(reportsDirectory);
      results.operations.push({
        operation: "Verzeichnis überprüfen",
        status: "success",
        message: "Reports-Verzeichnis existiert",
      });
    } catch (error: any) {
      results.operations.push({
        operation: "Verzeichnis überprüfen",
        status: "error",
        message: "Reports-Verzeichnis existiert nicht",
        details: error.message,
      });

      // Versuchen, das Verzeichnis zu erstellen
      try {
        await fs.mkdir(reportsDirectory, { recursive: true });
        results.operations.push({
          operation: "Verzeichnis erstellen",
          status: "success",
          message: "Reports-Verzeichnis wurde erstellt",
        });
      } catch (createError: any) {
        results.operations.push({
          operation: "Verzeichnis erstellen",
          status: "error",
          message: "Fehler beim Erstellen des Reports-Verzeichnisses",
          details: createError.message,
        });
      }
    }

    // 2. Dateien im Verzeichnis auflisten
    try {
      const files = await fs.readdir(reportsDirectory);
      results.files = files.map((file) => {
        return {
          name: file,
          isTemplate: file === "Template.xlsx",
        };
      });

      results.operations.push({
        operation: "Dateien auflisten",
        status: "success",
        message: `${files.length} Dateien gefunden`,
      });
    } catch (error: any) {
      results.operations.push({
        operation: "Dateien auflisten",
        status: "error",
        message: "Fehler beim Auflisten der Dateien",
        details: error.message,
      });
    }

    // 3. Template-Datei überprüfen
    try {
      await fs.access(templatePath);

      results.operations.push({
        operation: "Template prüfen",
        status: "success",
        message: "Template-Datei existiert",
      });

      // Template-Dateigröße abrufen
      try {
        const stats = await fs.stat(templatePath);
        results.templateSize = stats.size;
        results.operations.push({
          operation: "Template-Größe",
          status: "success",
          message: `Template-Größe: ${stats.size} Bytes`,
        });
      } catch (error: any) {
        results.operations.push({
          operation: "Template-Größe",
          status: "error",
          message: "Fehler beim Abrufen der Template-Größe",
          details: error.message,
        });
      }

      // Template-Datei lesen und Excel-Struktur prüfen
      try {
        const templateBuffer = await fs.readFile(templatePath);
        const workbook = XLSX.read(templateBuffer);

        const sheetInfo = workbook.SheetNames.map((name) => {
          const sheet = workbook.Sheets[name];
          const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
          return {
            name,
            rowCount: range.e.r - range.s.r + 1,
            colCount: range.e.c - range.s.c + 1,
          };
        });

        results.templateSheets = sheetInfo;
        results.operations.push({
          operation: "Template-Inhalt prüfen",
          status: "success",
          message: `Template enthält ${sheetInfo.length} Arbeitsblätter`,
        });
      } catch (error: any) {
        results.operations.push({
          operation: "Template-Inhalt prüfen",
          status: "error",
          message: "Fehler beim Lesen der Template-Datei",
          details: error.message,
        });
      }
    } catch (error: any) {
      results.operations.push({
        operation: "Template prüfen",
        status: "error",
        message: "Template-Datei existiert nicht",
        details: error.message,
      });
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Fehler beim Debug der Reports",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
