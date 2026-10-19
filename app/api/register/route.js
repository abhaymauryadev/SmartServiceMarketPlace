import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db.js";
import User from "@/models/User.js";
import { rateLimit, getClientIp } from "@/lib/rateLimit.js";

export async function POST(req) {
    const rl = rateLimit(`register:${getClientIp(req)}`, { limit: 5, windowMs: 60 * 60_000 });
    if (!rl.ok) {
        return NextResponse.json(
            { message: "Too many attempts. Try again later." },
            { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
        );
    }

    try {
        const body = await req.json();
        const { name, email, password, role } = body;

        // Input validation
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name || !email || !password
        ) {
            return NextResponse.json(
                { message: "Name, email, and password are required" },
                { status: 400 }
            );
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: "Invalid email format" },
                { status: 400 }
            );
        }

        // Password validation
        if (password.length < 6) {
            return NextResponse.json(
                { message: "Password must be at least 6 characters long" },
                { status: 400 }
            );
        }

        await connectDB();

        // Check for existing user
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: role === "provider" ? "provider" : "user",
        });

        // Remove password from response
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        return NextResponse.json({ user: userResponse }, { status: 201 });
    } catch (error) {
        console.error("Registration error:", error);

        // Handle Mongoose validation errors
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map(
                (err) => err.message
            );
            return NextResponse.json(
                { message: messages.join(", ") },
                { status: 400 }
            );
        }

        // Handle duplicate key error (unique constraint)
        if (error.code === 11000) {
            return NextResponse.json(
                { message: "User with this email already exists" },
                { status: 400 }
            );
        }

        // Generic error
        return NextResponse.json(
            { message: "Registration failed" },
            { status: 500 }
        );
    }
}
