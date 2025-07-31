import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const limit = 10;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin.from("users").select(`
        id,
        name,
        email,
        role,
        created_at,
        oauth_accounts!left (provider)
      `);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) {
      return new NextResponse("Failed to fetch users", { status: 500 });
    }

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true });

    const totalPages = Math.ceil((count || 0) / limit);

    // Transform data to include auth type
    const transformedUsers = users.map((user) => ({
      ...user,
      auth_type: user.oauth_accounts?.length > 0 ? "OAuth" : "Email/Password",
      oauth_accounts: undefined, // Remove from response
    }));

    return NextResponse.json({
      users: transformedUsers,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    return new NextResponse("Internal server error", { status: 500 });
  }
}
