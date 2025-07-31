import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { userId, role } = await request.json();

    // Validate input
    if (!userId || !role) {
      return new NextResponse("User ID and role are required", { status: 400 });
    }

    if (!["admin", "user"].includes(role)) {
      return new NextResponse('Invalid role. Must be "admin" or "user"', {
        status: 400,
      });
    }

    // Prevent admin from changing their own role
    if (userId === session.user.id) {
      return new NextResponse("You cannot change your own role", {
        status: 403,
      });
    }

    // Update user role in database
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ role })
      .eq("id", userId)
      .select("id, email, name, role")
      .single();

    if (error) {
      console.error("Database update error:", error);
      return new NextResponse("Failed to update user role", { status: 500 });
    }

    if (!data) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json({
      message: "User role updated successfully",
      user: data,
    });
  } catch (error) {
    console.error("API error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  return new NextResponse("Method not allowed", { status: 405 });
}

export async function POST() {
  return new NextResponse("Method not allowed", { status: 405 });
}

export async function DELETE() {
  return new NextResponse("Method not allowed", { status: 405 });
}
