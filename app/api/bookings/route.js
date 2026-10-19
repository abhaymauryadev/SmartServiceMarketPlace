import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { createNotification } from "@/lib/notifications";
import Service from "@/models/Service";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const bookings = await Booking.find({
      $or: [{ user: session.user.id }, { provider: session.user.id }],
    })
      .populate("service")
      .populate("user", "name")
      .populate("provider", "name");

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();

    const service = await Service.findById(body.service);
    if (!service || !service.isActive) {
      return NextResponse.json({ message: "Service not found" }, { status: 404 });
    }
    if (service.provider.toString() === session.user.id) {
      return NextResponse.json({ message: "You cannot book your own service" }, { status: 400 });
    }

    const bookingDate = new Date(body.bookingDate);
    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);
    if ([bookingDate, startTime, endTime].some((d) => isNaN(d.getTime()))) {
      return NextResponse.json({ message: "Invalid date or time" }, { status: 400 });
    }
    if (startTime <= new Date() || endTime <= startTime) {
      return NextResponse.json({ message: "Invalid booking time range" }, { status: 400 });
    }

    // Provider and price come from the service, never from the client
    const booking = await Booking.create({
      user: session.user.id,
      provider: service.provider,
      service: service._id,
      bookingDate,
      startTime,
      endTime,
      totalAmount: service.price,
    });

    // Notify Provider
    try {
      await createNotification({
        user: booking.provider,
        title: "New Booking Received",
        message: `You have a new booking for "${service.title}" from ${session.user.name}.`,
        type: "booking",
        actionUrl: "/dashboard/provider/bookings",
        icon: "📅"
      });
    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
      // Don't fail the booking if notification fails
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}


