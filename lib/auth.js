import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db.js";
import User from "@/models/User.js";
import crypto from "crypto";
import { rateLimit, getClientIp } from "@/lib/rateLimit.js";


console.log("NEXTAUTH_SECRET status:", process.env.NEXTAUTH_SECRET ? "DEFINED" : "UNDEFINED");
console.log("MONGODB_URI status:", process.env.MONGODB_URI ? "DEFINED" : "UNDEFINED");

export const authOptions = {
  debug: process.env.NODE_ENV === "development",

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, req) {
        console.log("Authorize called with:", { email: credentials?.email }); // Security: Don't log password

        const email = typeof credentials?.email === "string" ? credentials.email.toLowerCase().trim() : "";
        const rl = rateLimit(`login:${getClientIp(req)}:${email}`, { limit: 10, windowMs: 15 * 60_000 });
        if (!rl.ok) {
          throw new Error("Too many login attempts. Try again later.");
        }

        try {
          await connectDB();
          console.log("DB Connected");
        } catch (dbError) {
          console.error("DB Connection Failed:", dbError);
          throw new Error("Database connection failed");
        }

        if (typeof credentials?.email !== "string" || typeof credentials?.password !== "string") {
          throw new Error("Invalid email or password");
        }

        const user = await User.findOne({ email: credentials.email.toLowerCase().trim() }).select("+password +role"); // selecting password explicitly if it was set to select:false

        console.log("User search result:", user ? "Found" : "Not Found");

        if (!user) {
          console.log("User not found in DB");
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        console.log("Password validation:", isValid ? "Valid" : "Invalid");

        if (!isValid) {
          console.log("Invalid password provided");
          throw new Error("Invalid email or password");
        }

        return {
          id: user._id.toString(), // Ensure string
          email: user.email,
          role: user.role,
          name: user.name,
        };
      },
    }),


    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),

    AppleProvider({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_SECRET
    })
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // Google/Apple sign-ins: find or create the matching DB user so they get an id and role
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
      if (!user?.email) return false;

      await connectDB();
      const email = user.email.toLowerCase().trim();
      let dbUser = await User.findOne({ email });
      if (!dbUser) {
        dbUser = await User.create({
          name: user.name || email.split("@")[0],
          email,
          // Unusable random password: OAuth users never log in with credentials
          password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
          role: "user",
          isVerified: true,
        });
      }
      user.id = dbUser._id.toString();
      user.role = dbUser.role;
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


//Shows role-based auth, JWT control, secure login.