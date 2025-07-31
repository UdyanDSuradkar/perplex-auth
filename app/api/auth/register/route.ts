import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("email", email)
      .single();

    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        name,
        email,
        password_hash: hashedPassword,
      })
      .select()
      .single();

    if (error) {
      return new NextResponse("Registration failed", { status: 500 });
    }

    return NextResponse.json({ message: "User created successfully" });
  } catch (error) {
    return new NextResponse("Internal server error", { status: 500 });
  }
}
