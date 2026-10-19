import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Service from "@/models/Service";
import Booking from "@/models/Booking";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { serviceId, bookingId } = await req.json();
        await connectDB();

        // The amount is always derived server-side
        let amount;
        const notes = { userId: session.user.id };

        if (bookingId) {
            const booking = await Booking.findById(bookingId);
            if (!booking || booking.user.toString() !== session.user.id) {
                return NextResponse.json({ error: "Booking not found" }, { status: 404 });
            }
            if (booking.paymentStatus === "paid") {
                return NextResponse.json({ error: "Booking already paid" }, { status: 400 });
            }
            amount = booking.totalAmount;
            notes.bookingId = booking._id.toString();
        } else {
            const service = await Service.findById(serviceId);
            if (!service || !service.isActive) {
                return NextResponse.json({ error: "Service not found" }, { status: 404 });
            }
            amount = service.price;
            notes.serviceId = service._id.toString();
        }

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
