import { NextRequest, NextResponse } from "next/server";
import { createConnection } from "mysql2/promise";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const records = body.records;

  if (!records || !Array.isArray(records)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const connection = await createConnection({
    host: "localhost",
    user: "jake",
    password: "thomas",
    database: "taxes",
  });

  for (const row of records) {
    const { date, amount, description, vendor, source_bank } = row;

    if (!date || isNaN(amount)) continue;

    await connection.execute(
      `INSERT INTO expenses (date, amount, description, vendor, source_bank) VALUES (?, ?, ?, ?, ?)`,
      [date, amount, description, vendor, source_bank]
    );
  }

  await connection.end();
  return NextResponse.json({ success: true, inserted: records.length });
}
