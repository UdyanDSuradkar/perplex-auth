import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user details with auth type
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select(
        `
        id,
        email,
        name,
        role,
        avatar_url,
        created_at,
        oauth_accounts!left (
          provider
        )
      `
      )
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error("Database query error:", error);
      return new NextResponse("User not found", { status: 404 });
    }

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Determine auth type
    const hasOAuth = user.oauth_accounts && user.oauth_accounts.length > 0;
    const authType = hasOAuth ? "OAuth" : "Email/Password";

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "user",
      avatar_url: user.avatar_url,
      auth_type: authType,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
