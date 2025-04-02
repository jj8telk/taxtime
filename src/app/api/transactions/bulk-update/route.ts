import { NextRequest, NextResponse } from "next/server";
import { createConnection } from "mysql2/promise";

export async function POST(req: NextRequest) {
  try {
    const { ids, updates } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    const fieldsToUpdate = [];
    const params: any[] = [];

    if (updates.vendor) {
      fieldsToUpdate.push("vendor = ?");
      params.push(updates.vendor);
    }

    if (updates.category) {
      fieldsToUpdate.push("category = ?");
      params.push(updates.category);
    }

    if (updates.tax_category) {
      fieldsToUpdate.push("tax_category_id = ?");
      params.push(updates.tax_category);
    }

    if (fieldsToUpdate.length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      );
    }

    const placeholders = ids.map(() => "?").join(",");
    params.push(...ids);

    const query = `
      UPDATE expenses
      SET ${fieldsToUpdate.join(", ")}
      WHERE id IN (${placeholders})
    `;

    const connection = await createConnection({
      host: "localhost",
      user: "jake",
      password: "thomas",
      database: "taxes",
    });

    const [result] = await connection.execute(query, params);
    await connection.end();

    return NextResponse.json({ updated: (result as any).affectedRows });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
