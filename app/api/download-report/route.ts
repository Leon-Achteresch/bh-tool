import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

// Pfad zur Template-Datei
const TEMPLATE_PATH = path.join(
  process.cwd(),
  "public",
  "reports",
  "Template.xlsx"
);

// Typ-Definitionen für die API
interface DayEntry {
  date: string;
  description: string;
  hours: string;
}

interface ReportData {
  filename: string;
  weekNumber: string;
  name: string;
  days: DayEntry[];
  metadata: Record<string, string>;
}

/**
 * Generiert einen Report basierend auf dem Template und den übergebenen Daten
 */
async function generateReport(data: ReportData): Promise<Buffer> {
  try {
    // Template-Datei einlesen
    if (!fs.existsSync(TEMPLATE_PATH)) {
      throw new Error("Template-Datei nicht gefunden: " + TEMPLATE_PATH);
    }

    const templateBuffer = fs.readFileSync(TEMPLATE_PATH);
    const workbook = XLSX.read(templateBuffer, { type: "buffer" });

    // Prüfen, ob ein Arbeitsblatt vorhanden ist
    if (workbook.SheetNames.length === 0) {
      throw new Error("Keine Arbeitsblätter in der Template-Datei gefunden");
    }

    // Das erste Arbeitsblatt verwenden (sollte das Hauptblatt sein)
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Ausbildungsnachweis Nummer (falls vorhanden)
    if (data.metadata && data.metadata["Berichtsnummer"]) {
      sheet["B2"] = { t: "s", v: data.metadata["Berichtsnummer"] };
    }

    // Name des Auszubildenden
    sheet["D4"] = { t: "s", v: data.name || "Name des Auszubildenden" };

    // Ausbildungsjahr
    if (data.metadata && data.metadata["Ausbildungsjahr"]) {
      sheet["D5"] = { t: "s", v: data.metadata["Ausbildungsjahr"] };
    }

    // Ausbildungswoche
    const weekInfo = `KW ${data.weekNumber || ""}: ${
      data.metadata?.StartDatum || ""
    } - ${data.metadata?.EndDatum || ""}`;
    sheet["D7"] = { t: "s", v: weekInfo };

    // Tätigkeiten eintragen
    // Wir verwenden die übergebenen Tage, gruppieren sie aber in Kategorien

    // Variablen für die verschiedenen Bereiche
    let betrieblicheTaetigkeiten = "";
    let betrieblicheStunden = 0;

    let unterweisungen = "";
    let unterweisungenStunden = 0;

    let berufsschule = "";
    let berufsschuleStunden = 0;

    // Daten in die entsprechenden Kategorien aufteilen
    data.days.forEach((day) => {
      if (!day.description) return;

      const hours = parseFloat(day.hours) || 0;

      // Kategorisieren nach Art der Tätigkeit
      // Wir nehmen an, dass die Art in der Beschreibung mit erwähnt wird
      const desc = day.description.toLowerCase();

      if (desc.includes("[schule]")) {
        // Berufsschule
        berufsschule += `${day.date}: ${day.description
          .replace(/\[schule\]/i, "")
          .trim()}\n`;
        berufsschuleStunden += hours;
      } else if (
        desc.includes("[unterweisung]") ||
        desc.includes("[unterricht]")
      ) {
        // Unterweisungen
        unterweisungen += `${day.date}: ${day.description
          .replace(/\[unterweisung\]|\[unterricht\]/i, "")
          .trim()}\n`;
        unterweisungenStunden += hours;
      } else {
        // Standardmäßig als betriebliche Tätigkeit behandeln
        betrieblicheTaetigkeiten += `${day.date}: ${day.description}\n`;
        betrieblicheStunden += hours;
      }
    });

    // Betriebliche Tätigkeiten eintragen (Zeilen 10-17)
    // Wir tragen den gesamten Text in Zelle C10 ein
    if (betrieblicheTaetigkeiten) {
      sheet["C10"] = { t: "s", v: betrieblicheTaetigkeiten.trim() };
      sheet["H10"] = { t: "n", v: betrieblicheStunden };
    }

    // Unterweisungen eintragen (Zeilen 25-28)
    if (unterweisungen) {
      sheet["C26"] = { t: "s", v: unterweisungen.trim() };
      sheet["H26"] = { t: "n", v: unterweisungenStunden };
    }

    // Berufsschule eintragen (Zeilen 29-42)
    if (berufsschule) {
      sheet["C30"] = { t: "s", v: berufsschule.trim() };
      sheet["H30"] = { t: "n", v: berufsschuleStunden };
    }

    // Summe berechnen und eintragen
    const gesamtStunden =
      betrieblicheStunden + unterweisungenStunden + berufsschuleStunden;
    sheet["H43"] = { t: "n", v: gesamtStunden };

    // Namen für die Unterschriften eintragen
    sheet["B48"] = { t: "s", v: data.name || "Auszubildender" };

    // Optional: Metadaten speichern
    if (data.metadata && Object.keys(data.metadata).length > 0) {
      if (!workbook.SheetNames.includes("Metadaten")) {
        const metaArray = [data.metadata];
        const metaSheet = XLSX.utils.json_to_sheet(metaArray);
        XLSX.utils.book_append_sheet(workbook, metaSheet, "Metadaten");
      }
    }

    // Workbook in einen Buffer schreiben
    const outputBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });
    return outputBuffer;
  } catch (error) {
    console.error("Fehler beim Generieren des Reports:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Daten aus dem Request auslesen
    const data: ReportData = await req.json();

    // Validieren der Eingabedaten
    if (!data.filename) {
      return NextResponse.json(
        { error: "Filename ist erforderlich" },
        { status: 400 }
      );
    }

    // Report generieren
    const reportBuffer = await generateReport(data);

    // Response mit dem generierten Report zurückgeben
    return new NextResponse(reportBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${data.filename}"`,
      },
    });
  } catch (error: any) {
    console.error("API-Fehler:", error);
    return NextResponse.json(
      { error: error.message || "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}
