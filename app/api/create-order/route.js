import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { bookingId } = await req.json();
        await connectDB();

        // The amount is always derived server-side from the booking
        const booking = bookingId ? await Booking.findById(bookingId) : null;
        if (!booking || booking.user.toString() !== session.user.id) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }
        if (booking.paymentStatus === "paid") {
            return NextResponse.json({ error: "Booking already paid" }, { status: 400 });
        }
        if (["rejected", "cancelled"].includes(booking.status)) {
            return NextResponse.json({ error: "Booking is no longer payable" }, { status: 400 });
        }

        const amount = booking.totalAmount;
        const notes = { userId: session.user.id, bookingId: booking._id.toString() };

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // paise
            currency: "INR",
            receipt: "receipt_" + Date.now(),
            notes,
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error("Order creation error:", error);
        return NextResponse.json(
            { error: "Order creation failed" },
            { status: 500 }
        );
    }
}
