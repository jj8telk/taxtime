import { NextRequest, NextResponse } from "next/server";
import { createConnection } from "mysql2/promise";

export async function GET(req: NextRequest) {
  const connection = await createConnection({
    host: "localhost",
    user: "jake",
    password: "thomas",
    database: "taxes",
  });

  const [rows] = await connection.execute(`
    SELECT DISTINCT source_bank FROM expenses WHERE source_bank IS NOT NULL ORDER BY source_bank
  `);

  await connection.end();

  const banks = (rows as { source_bank: string }[]).map((r) => r.source_bank);
  return NextResponse.json({ source_banks: banks });
}
