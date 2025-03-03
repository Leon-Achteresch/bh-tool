import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { promises as fs } from "fs";
import path from "path";

// Pfad zur Template-Datei
const templatePath = path.join(
  process.cwd(),
  "public",
  "reports",
  "Template.xlsx"
);

// API-Route zum Überprüfen der Template-Datei
export async function GET() {
  try {
    // Prüfen, ob die Datei existiert
    try {
      await fs.access(templatePath);
      console.log("Template-Datei existiert unter:", templatePath);
    } catch (error) {
      console.error("Template-Datei existiert nicht unter:", templatePath);
      return NextResponse.json(
        {
          error: "Template-Datei nicht gefunden",
          path: templatePath,
        },
        { status: 404 }
      );
    }

    // Datei lesen
    try {
      const templateBuffer = await fs.readFile(templatePath);
      console.log(
        "Template-Datei gelesen, Größe:",
        templateBuffer.length,
        "Bytes"
      );

      // Excel-Datei parsen
      const workbook = XLSX.read(templateBuffer);

      // Informationen über die Arbeitsblätter ausgeben
      const sheetInfo = workbook.SheetNames.map((name) => {
        const sheet = workbook.Sheets[name];
        const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");

        // Wenn es das KW 1 Arbeitsblatt ist, mehr Details anzeigen
        let details = {};
        if (name === "KW 1") {
          // Versuche, die ersten Zellen zu lesen, um die Struktur zu verstehen
          // Wir erstellen eine vollständige Analyse der ersten 10 Zeilen und 8 Spalten
          const cellData: Record<string, string> = {};
          const fullMap: Record<string, any> = {};

          // Scanne alle Zellen im Bereich
          for (let r = 0; r <= Math.min(15, range.e.r); r++) {
            for (let c = 0; c <= Math.min(8, range.e.c); c++) {
              const cellAddress = XLSX.utils.encode_cell({ r, c });
              const cell = sheet[cellAddress];
              if (cell) {
                cellData[cellAddress] = String(cell.v || "(leer)");

                // Füge die Zelle zur Karte hinzu (für eine visuelle Darstellung)
                fullMap[r] = fullMap[r] || {};
                fullMap[r][c] = cell.v;
              }
            }
          }

          // Analysiere die Merging-Zellen
          const merges = sheet["!merges"] || [];
          const mergeInfo = merges.map((merge, idx) => {
            return {
              id: idx + 1,
              range: `${XLSX.utils.encode_cell(
                merge.s
              )} : ${XLSX.utils.encode_cell(merge.e)}`,
              startRow: merge.s.r,
              endRow: merge.e.r,
              startCol: merge.s.c,
              endCol: merge.e.c,
            };
          });

          details = {
            cellData,
            fullMap,
            merges: mergeInfo,
            // Hier könnten weitere Analysen hinzugefügt werden
          };
        }

        return {
          name,
          rowCount: range.e.r - range.s.r + 1,
          colCount: range.e.c - range.s.c + 1,
          details,
        };
      });

      console.log(
        "Template-Arbeitsblätter:",
        JSON.stringify(sheetInfo, null, 2)
      );

      return NextResponse.json({
        success: true,
        message: "Template-Datei erfolgreich gelesen",
        path: templatePath,
        size: templateBuffer.length,
        sheets: sheetInfo,
      });
    } catch (error: any) {
      console.error("Fehler beim Lesen der Template-Datei:", error);
      return NextResponse.json(
        {
          error: "Fehler beim Lesen der Template-Datei",
          details: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Unerwarteter Fehler:", error);
    return NextResponse.json(
      {
        error: "Unerwarteter Fehler beim Überprüfen der Template-Datei",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
