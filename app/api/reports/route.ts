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
  "BerichtsHeft Nr.1.xlsx"
);

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

    // Kopiere die Vorlage-Datei als Basis für die neue Datei
    try {
      const templateBuffer = await fs.readFile(templatePath);

      // Schreibe die Vorlage in die neue Datei
      await fs.writeFile(filepath, new Uint8Array(templateBuffer));

      // Dann überschreibe sie mit den Daten aus dem Request
      const bytes = await file.arrayBuffer();
      await fs.writeFile(filepath, new Uint8Array(bytes));
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
      .filter(
        (file) => file.endsWith(".xlsx") && file !== "BerichtsHeft Nr.1.xlsx"
      )
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
