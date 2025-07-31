import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabase";

// Extend the Profile type to include avatar_url
interface ExtendedProfile {
  avatar_url?: string;
  picture?: string; // Google uses 'picture'
  image?: string; // GitHub uses 'avatar_url' but NextAuth maps it
  name?: string;
  email?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { data: user } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("email", credentials.email)
          .single();

        if (!user || !user.password_hash) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar_url,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          // Check if user exists
          const { data: existingUser } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("email", user.email!)
            .single();

          let userId = existingUser?.id;

          if (!existingUser) {
            // Create new user with proper avatar URL handling
            const extProfile = profile as ExtendedProfile;
            const avatarUrl =
              user.image ||
              extProfile?.picture ||
              extProfile?.avatar_url ||
              extProfile?.image ||
              null;

            const { data: newUser } = await supabaseAdmin
              .from("users")
              .insert({
                email: user.email!,
                name: user.name || extProfile?.name || null,
                avatar_url: avatarUrl,
              })
              .select()
              .single();

            userId = newUser.id;
          }

          // Upsert OAuth account
          await supabaseAdmin.from("oauth_accounts").upsert({
            user_id: userId,
            provider: account.provider,
            provider_id: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            token_expiry: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
          });

          return true;
        } catch (error) {
          console.error("OAuth sign in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the URL is relative, prepend the base URL
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      // If it's a valid URL that starts with our base URL, allow it
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // Default redirect to the base URL
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      },
    },
  },
};
