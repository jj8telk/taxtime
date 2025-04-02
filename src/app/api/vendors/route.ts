// app/api/vendors/route.ts
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
    SELECT DISTINCT vendor FROM expenses WHERE vendor IS NOT NULL ORDER BY vendor
  `);

  await connection.end();

  const vendors = (rows as { vendor: string }[]).map((r) => r.vendor);
  return NextResponse.json({ vendors: vendors });
}
