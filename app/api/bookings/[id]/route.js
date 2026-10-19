import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { createNotification } from "@/lib/notifications";
import Service from "@/models/Service";
import User from "@/models/User";

export async function PATCH(req, { params }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { status } = await req.json();
        if (!["accepted", "rejected", "completed", "cancelled"].includes(status)) {
            return NextResponse.json({ message: "Invalid status" }, { status: 400 });
        }

        await connectDB();

        const booking = await Booking.findById(id).populate("service");
        if (!booking) {
            return NextResponse.json({ message: "Booking not found" }, { status: 404 });
        }

        const isProvider = booking.provider.toString() === session.user.id;
        const isCustomer = booking.user.toString() === session.user.id;

        // Providers manage the booking; the customer may only cancel
        const allowed = status === "cancelled" ? isCustomer : isProvider;
        if (!allowed) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        booking.status = status;
        await booking.save();

        // Notify the other party
        try {
            const serviceTitle = booking.service?.title;
            const copy = {
                accepted: ["Booking Accepted", `Your booking for "${serviceTitle}" has been accepted by the provider.`, "✅"],
                rejected: ["Booking Rejected", `Your booking for "${serviceTitle}" has been rejected.`, "❌"],
                completed: ["Booking Completed", `Your booking for "${serviceTitle}" has been marked as completed.`, "🎉"],
                cancelled: ["Booking Cancelled", `A booking for "${serviceTitle}" has been cancelled by the customer.`, "🚫"],
            }[status];

            await createNotification({
                user: status === "cancelled" ? booking.provider : booking.user,
                title: copy[0],
                message: copy[1],
                type: "booking",
                actionUrl: status === "cancelled" ? "/dashboard/provider/bookings" : "/dashboard/user/bookings",
                icon: copy[2],
            });
        } catch (notifError) {
            console.error("Failed to send notification:", notifError);
        }

        return NextResponse.json(booking);
    } catch (error) {
        console.error("Error updating booking:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
