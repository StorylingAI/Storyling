import { z } from "zod";

export interface EnrollmentRow {
  name: string;
  email: string;
}

const enrollmentRowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
});

export function parseEnrollmentCSV(csvContent: string): {
  success: boolean;
  data?: EnrollmentRow[];
  errors?: string[];
} {
  const lines = csvContent.trim().split("\n");
  
  if (lines.length === 0) {
    return { success: false, errors: ["CSV file is empty"] };
  }

  // Parse header
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  
  const requiredColumns = ["name", "email"];
  const missingColumns = requiredColumns.filter((col) => !header.includes(col));
  
  if (missingColumns.length > 0) {
    return {
      success: false,
      errors: [`Missing required columns: ${missingColumns.join(", ")}`],
    };
  }

  const nameIndex = header.indexOf("name");
  const emailIndex = header.indexOf("email");

  const data: EnrollmentRow[] = [];
  const errors: string[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = line.split(",").map((v) => v.trim());

    const row = {
      name: values[nameIndex] || "",
      email: values[emailIndex] || "",
    };

    // Validate row
    const validation = enrollmentRowSchema.safeParse(row);
    if (!validation.success) {
      errors.push(`Row ${i + 1}: ${validation.error.issues.map((e: { message: string }) => e.message).join(", ")}`);
      continue;
    }

    data.push(row);
  }

  if (data.length === 0 && errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data, errors: errors.length > 0 ? errors : undefined };
}

export function generateEnrollmentCSVTemplate(): string {
  return `name,email
John Doe,john.doe@example.com
Jane Smith,jane.smith@example.com`;
}
