import { NextAuthOptions } from "next-auth";
import LineProvider from "next-auth/providers/line";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.sub) return false;

      try {
        // LINE profile type
        const lineProfile = profile as {
          sub: string;
          name?: string;
          picture?: string;
        };

        // Create or update user in database
        const existingUser = await prisma.user.findUnique({
          where: { lineUserId: lineProfile.sub },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              lineUserId: lineProfile.sub,
              name: lineProfile.name || "LINE User",
              avatarUrl: lineProfile.picture || null,
            },
          });
        } else {
          // Update user profile on each login
          await prisma.user.update({
            where: { lineUserId: lineProfile.sub },
            data: {
              name: lineProfile.name || existingUser.name,
              avatarUrl: lineProfile.picture || existingUser.avatarUrl,
            },
          });
        }

        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },
    async session({ session, token }) {
      // Add user ID to session
      if (token.sub) {
        try {
          const user = await prisma.user.findUnique({
            where: { lineUserId: token.sub },
          });
          if (user) {
            session.user.id = user.id;
            session.user.name = user.name;
            session.user.image = user.avatarUrl || undefined;
          }
        } catch (error) {
          console.error("Error fetching user in session callback:", error);
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful login
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard`;
      }
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
