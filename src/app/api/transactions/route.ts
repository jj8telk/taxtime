// app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createConnection } from "mysql2/promise";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const year = url.searchParams.get("year");
  const month = url.searchParams.get("month");
  const vendor = url.searchParams.get("vendor");
  const sourceBank = url.searchParams.get("source_bank");
  const category = url.searchParams.get("category");
  const taxCategory = url.searchParams.get("tax_category_id");

  const connection = await createConnection({
    host: "localhost",
    user: "jake",
    password: "thomas",
    database: "taxes",
  });

  let query = `
    SELECT e.*, tc.name as tax_category_name
    FROM expenses e
    LEFT JOIN tax_categories tc ON e.tax_category_id = tc.id
    WHERE 1 = 1
  `;
  const params: any[] = [];

  if (year) {
    query += " AND YEAR(e.date) = ?";
    params.push(year);
  }

  if (month) {
    query += " AND MONTH(e.date) = ?";
    params.push(month);
  }

  if (vendor) {
    query += " AND e.vendor = ?";
    params.push(vendor);
  }

  if (sourceBank) {
    query += " AND e.source_bank = ?";
    params.push(sourceBank);
  }

  if (category) {
    query += " AND e.category = ?";
    params.push(category);
  }

  if (taxCategory) {
    query += " AND e.tax_category_id = ?";
    params.push(taxCategory);
  }

  const [rows] = await connection.execute(query, params);
  await connection.end();

  return NextResponse.json({ data: rows });
}
