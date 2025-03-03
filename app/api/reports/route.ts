import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { promises as fs } from "fs";
import path from "path";

// Route als dynamisch konfigurieren
export const dynamic = "force-dynamic";

const reportsDirectory = path.join(process.cwd(), "public", "reports");
const templatePath = path.join(
  process.cwd(),
  "public",
  "reports",
  "Template.xlsx"
);

interface ReportData {
  Name?: string;
  Ausbildungsjahr?: string;
  Kalenderwoche?: string;
  Datum?: string;
  Wochentag?: string;
  Tätigkeit?: string;
  Stunden?: number;
  Art?: "Betrieb" | "Schule";
}

interface ReportMetadata {
  Azubi?: string;
  Ausbildungsjahr?: string;
  Zeitraum?: string;
  Titel?: string;
  Abteilung?: string;
  Notizen?: string;
}

// API-Route zum Speichern eines Berichts
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = (formData.get("title") as string) || "Berichtsheft";

    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei gefunden" },
        { status: 400 }
      );
    }

    // Erstelle den Dateinamen ohne Sonderzeichen
    const safeName = title.replace(/[^a-zA-Z0-9äöüÄÖÜß\s]/g, "_");
    const filename = `${safeName}.xlsx`;
    const filepath = path.join(reportsDirectory, filename);

    // Stelle sicher, dass das Verzeichnis existiert
    try {
      await fs.mkdir(reportsDirectory, { recursive: true });
    } catch (error: any) {
      return NextResponse.json(
        {
          error: "Verzeichnis konnte nicht erstellt werden",
          details: error.message,
        },
        { status: 500 }
      );
    }

    try {
      // Template-Datei lesen
      const templateBuffer = await fs.readFile(templatePath);
      if (!templateBuffer) {
        return NextResponse.json(
          {
            error: "Vorlage konnte nicht geladen werden",
            details: "Template.xlsx wurde nicht gefunden",
          },
          { status: 500 }
        );
      }

      // Template als Excel-Workbook laden mit allen Formatierungen
      const template = XLSX.read(templateBuffer, {
        type: "buffer",
        cellStyles: true,
        cellDates: true,
      });

      // Daten aus dem hochgeladenen File lesen
      const uploadedBytes = await file.arrayBuffer();
      const uploadedWorkbook = XLSX.read(new Uint8Array(uploadedBytes));

      // Hauptdaten aus dem ersten Sheet extrahieren
      const sourceSheet =
        uploadedWorkbook.Sheets[uploadedWorkbook.SheetNames[0]];
      const sourceData = XLSX.utils.sheet_to_json<ReportData>(sourceSheet);

      // Metadaten aus dem Metadaten-Sheet extrahieren
      let metaData: ReportMetadata | null = null;
      if (uploadedWorkbook.SheetNames.includes("Metadaten")) {
        const metaSheet = uploadedWorkbook.Sheets["Metadaten"];
        const metaArray = XLSX.utils.sheet_to_json<ReportMetadata>(metaSheet);
        if (metaArray.length > 0) {
          metaData = metaArray[0];
        }
      }

      // Zielsheet aus dem Template (KW 1)
      const targetSheet = template.Sheets[template.SheetNames[0]];

      // Berichtsnummer in Zelle A2 eintragen
      targetSheet["A2"] = {
        t: "s",
        v: `Ausbildungsnachweis Nr. ${filename.replace(".xlsx", "")}`,
        s: targetSheet["A2"]?.s || {},
      };

      // Name des Auszubildenden in Zelle A4 eintragen
      if (metaData?.Azubi) {
        targetSheet["A4"] = {
          t: "s",
          v: `Name: ${metaData.Azubi}`,
          s: targetSheet["A4"]?.s || {},
        };
      }

      // Ausbildungsjahr in Zelle C4 eintragen
      if (metaData?.Ausbildungsjahr) {
        targetSheet["C4"] = {
          t: "s",
          v: `Ausbildungsjahr: ${metaData.Ausbildungsjahr}`,
          s: targetSheet["C4"]?.s || {},
        };
      }

      // Zeitraum in Zelle C7 eintragen
      if (metaData?.Zeitraum) {
        targetSheet["C7"] = {
          t: "s",
          v: metaData.Zeitraum,
          s: targetSheet["C7"]?.s || {},
        };
      }

      // Tätigkeiten nach Kategorien sortieren
      const betrieblicheTaetigkeiten: {
        beschreibung: string;
        stunden: number;
      }[] = [];
      const schulischeTaetigkeiten: {
        beschreibung: string;
        stunden: number;
      }[] = [];
      let betrieblicheStundenGesamt = 0;
      let schulischeStundenGesamt = 0;

      sourceData.forEach((row) => {
        if (row.Art === "Betrieb" && row.Tätigkeit) {
          const beschreibung = `${row.Datum} (${row.Wochentag || ""}): ${
            row.Tätigkeit
          }`;
          const stunden = row.Stunden || 0;
          betrieblicheTaetigkeiten.push({ beschreibung, stunden });
          betrieblicheStundenGesamt += stunden;
        } else if (row.Art === "Schule" && row.Tätigkeit) {
          const beschreibung = `${row.Datum} (${row.Wochentag || ""}): ${
            row.Tätigkeit
          }`;
          const stunden = row.Stunden || 0;
          schulischeTaetigkeiten.push({ beschreibung, stunden });
          schulischeStundenGesamt += stunden;
        }
      });

      // Betriebliche Tätigkeiten eintragen (Zeilen 10-24)
      betrieblicheTaetigkeiten.forEach((taetigkeit, index) => {
        if (index < 15) {
          // Maximal 15 Einträge (Zeilen 10-24)
          const zeilenIndex = 10 + index;
          const zelle = `A${zeilenIndex}`;

          targetSheet[zelle] = {
            t: "s",
            v: taetigkeit.beschreibung,
            s: targetSheet[zelle]?.s || {},
          };

          const stundenZelle = `H${zeilenIndex}`;
          targetSheet[stundenZelle] = {
            t: "n",
            v: taetigkeit.stunden,
            s: targetSheet[stundenZelle]?.s || {},
          };
        }
      });

      // Gesamtstunden für betriebliche Tätigkeiten in Zelle H24 eintragen
      targetSheet["H24"] = {
        t: "n",
        v: betrieblicheStundenGesamt,
        s: targetSheet["H24"]?.s || {},
      };

      // Schulische Tätigkeiten eintragen (Zeilen 30-42)
      schulischeTaetigkeiten.forEach((taetigkeit, index) => {
        if (index < 13) {
          // Maximal 13 Einträge (Zeilen 30-42)
          const zeilenIndex = 30 + index;
          const zelle = `A${zeilenIndex}`;

          targetSheet[zelle] = {
            t: "s",
            v: taetigkeit.beschreibung,
            s: targetSheet[zelle]?.s || {},
          };

          const stundenZelle = `H${zeilenIndex}`;
          targetSheet[stundenZelle] = {
            t: "n",
            v: taetigkeit.stunden,
            s: targetSheet[stundenZelle]?.s || {},
          };
        }
      });

      // Gesamtstunden für schulische Tätigkeiten in Zelle H29 eintragen
      targetSheet["H29"] = {
        t: "n",
        v: schulischeStundenGesamt,
        s: targetSheet["H29"]?.s || {},
      };

      // Gesamtstunden in Zelle H43 eintragen
      const gesamtStunden = betrieblicheStundenGesamt + schulischeStundenGesamt;
      targetSheet["H43"] = {
        t: "n",
        v: gesamtStunden,
        s: targetSheet["H43"]?.s || {},
      };

      // Notizen in Zelle C44 eintragen (falls vorhanden)
      if (metaData?.Notizen) {
        targetSheet["C44"] = {
          t: "s",
          v: metaData.Notizen,
          s: targetSheet["C44"]?.s || {},
        };
      }

      // Unterschrift des Auszubildenden in Zelle A48 eintragen
      if (metaData?.Azubi) {
        targetSheet["A48"] = {
          t: "s",
          v: metaData.Azubi,
          s: targetSheet["A48"]?.s || {},
        };
      }

      // Modifiziertes Template mit allen Formatierungen speichern
      const outputBuffer = XLSX.write(template, {
        type: "buffer",
        bookType: "xlsx",
        cellStyles: true,
        compression: true,
      });

      await fs.writeFile(filepath, outputBuffer);
    } catch (error: any) {
      return NextResponse.json(
        {
          error: "Datei konnte nicht geschrieben werden",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bericht erfolgreich gespeichert",
      filename,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Fehler beim Speichern des Berichts" },
      { status: 500 }
    );
  }
}

// API-Route zum Abrufen aller Berichte
export async function GET() {
  try {
    // Stellen Sie sicher, dass das Verzeichnis existiert
    try {
      await fs.mkdir(reportsDirectory, { recursive: true });
    } catch (error: any) {
      console.error("Fehler beim Erstellen des Verzeichnisses:", error);
    }

    // Liste aller Berichtsdateien abrufen
    const files = await fs.readdir(reportsDirectory);
    const reports = files
      .filter((file) => file.endsWith(".xlsx") && file !== "Template.xlsx")
      .map((file) => ({
        filename: file,
        path: `/reports/${file}`,
        createdAt: new Date().toISOString(),
      }));

    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Berichte" },
      { status: 500 }
    );
  }
}
