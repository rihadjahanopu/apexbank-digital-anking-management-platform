import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { runSeed } from "../../../../scripts/seed";

export async function POST() {
  try {
    await connectToDatabase();
    await runSeed();
    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with demo accounts and data.",
      demoCredentials: {
        admin: { email: "admin@apexbank.com", password: "AdminPassword123!" },
        staff: { email: "staff@apexbank.com", password: "StaffPassword123!" },
        customer: {
          email: "customer@apexbank.com",
          password: "CustomerPassword123!",
          pin: "1234",
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Seed failed";
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
