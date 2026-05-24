import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { importFileBuffer } from "@/lib/import/importFiles";

export const runtime = "nodejs";

const allowedExtensions = [".xls", ".xlsx", ".csv"];

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Bạn cần đăng nhập admin." }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) {
    return NextResponse.json({ error: "Vui lòng chọn ít nhất 1 file Excel/CSV." }, { status: 400 });
  }

  const summaries = [];

  for (const file of files) {
    const name = file.name;
    const isAllowed = allowedExtensions.some((extension) => name.toLowerCase().endsWith(extension));
    if (!isAllowed) {
      summaries.push({
        filename: name,
        created: 0,
        updated: 0,
        unchanged: 0,
        duplicates: 0,
        errors: 1,
        issues: [{ level: "error", message: "Định dạng file không được hỗ trợ." }],
      });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    summaries.push(await importFileBuffer(buffer, name));
  }

  return NextResponse.json({ summaries });
}
