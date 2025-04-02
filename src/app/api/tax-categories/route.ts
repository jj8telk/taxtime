import { NextRequest, NextResponse } from "next/server";
import { createConnection } from "mysql2/promise";

export async function GET(req: NextRequest) {
  try {
    const connection = await createConnection({
      host: "localhost",
      user: "jake",
      password: "thomas",
      database: "taxes",
    });

    const [rows] = await connection.execute(`
      SELECT id, name FROM tax_categories ORDER BY name
    `);

    await connection.end();

    return NextResponse.json({
      tax_categories: rows as { id: number; name: string }[],
    });
  } catch (error) {
    console.error("Error fetching tax categories:", error);
    return NextResponse.json(
      { error: "Failed to load tax categories" },
      { status: 500 }
    );
  }
}
