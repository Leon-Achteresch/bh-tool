import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { promises as fs } from "fs";
import path from "path";

// Verzeichnis für Berichtsdateien festlegen
const reportsDirectory = path.join(process.cwd(), "public", "reports");

interface RouteParams {
  params: {
    filename: string;
  };
}

// API-Route zum Abrufen eines einzelnen Berichts
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { filename } = params;
  const decodedFilename = decodeURIComponent(filename);
  const filePath = path.join(reportsDirectory, decodedFilename);

  try {
    if (!fs.access(filePath)) {
      return NextResponse.json(
        { error: "Bericht nicht gefunden" },
        { status: 404 }
      );
    }

    // Excel-Datei lesen
    const workbook = XLSX.readFile(filePath);

    // Daten aus allen Arbeitsblättern extrahieren
    const result: any[] = [];
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      result.push(...jsonData);
    });

    return NextResponse.json({ filename: decodedFilename, data: result });
  } catch (error) {
    console.error("Fehler beim Lesen des Berichts:", error);
    return NextResponse.json(
      { error: "Bericht konnte nicht gelesen werden" },
      { status: 500 }
    );
  }
}

// API-Route zum Löschen eines Berichts
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { filename } = params;
  const decodedFilename = decodeURIComponent(filename);
  const filePath = path.join(reportsDirectory, decodedFilename);

  try {
    if (!fs.access(filePath)) {
      return NextResponse.json(
        { error: "Bericht nicht gefunden" },
        { status: 404 }
      );
    }

    // Datei löschen
    await fs.unlink(filePath);

    return NextResponse.json({
      success: true,
      message: "Bericht erfolgreich gelöscht",
    });
  } catch (error) {
    console.error("Fehler beim Löschen des Berichts:", error);
    return NextResponse.json(
      { error: "Bericht konnte nicht gelöscht werden" },
      { status: 500 }
    );
  }
}
