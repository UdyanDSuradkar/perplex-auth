import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PUT(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { name, avatarUrl } = body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return new NextResponse("Name is required", { status: 400 });
    }

    if (name.trim().length > 100) {
      return new NextResponse("Name must be less than 100 characters", {
        status: 400,
      });
    }

    // Validate avatar URL if provided
    if (avatarUrl && avatarUrl.trim() !== "") {
      try {
        new URL(avatarUrl.trim());
      } catch {
        return new NextResponse("Invalid avatar URL format", { status: 400 });
      }
    }

    // Update user in database
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        name: name.trim(),
        avatar_url: avatarUrl?.trim() || null,
      })
      .eq("id", session.user.id)
      .select("id, name, avatar_url, email, role")
      .single();

    if (error) {
      console.error("Database update error:", error);
      return new NextResponse("Failed to update profile", { status: 500 });
    }

    if (!data) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Return success response with updated user data
    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        avatar_url: data.avatar_url,
        role: data.role,
      },
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
