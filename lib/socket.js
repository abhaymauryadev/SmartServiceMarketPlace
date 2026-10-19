import { Server } from "socket.io";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";

let io;

const STATUSES = ["accepted", "rejected", "completed", "cancelled"];

// Returns the booking only if the user is its customer or provider
async function getAuthorizedBooking(bookingId, userId) {
    if (typeof bookingId !== "string") return null;
    try {
        await connectDB();
        const booking = await Booking.findById(bookingId).select("user provider");
        if (!booking) return null;
        const isMember = [booking.user, booking.provider].some((id) => id.toString() === userId);
        return isMember ? booking : null;
    } catch {
        return null;
    }
}

export function initSocket(server) {
    if (io) return io;

    io = new Server(server, {
        path: "/api/socket",
        cors: {
            origin: process.env.NEXTAUTH_URL,
            credentials: true,
        },
    });

    // Authenticate every connection with the NextAuth session cookie
    io.use(async (socket, next) => {
        try {
            const token = await getToken({
                req: { headers: socket.handshake.headers },
                secret: process.env.NEXTAUTH_SECRET,
            });
            if (!token?.id) return next(new Error("Unauthorized"));
            socket.data.userId = token.id;
            next();
        } catch {
            next(new Error("Unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.data.userId;

        // Rooms are booking IDs; only the booking's customer/provider may join
        socket.on("join", async (bookingId) => {
            if (await getAuthorizedBooking(bookingId, userId)) socket.join(bookingId);
        });

        socket.on("leave", (bookingId) => {
            if (typeof bookingId === "string") socket.leave(bookingId);
        });

        // Relay only; the booking PATCH API remains the source of truth and only the provider may push updates
        socket.on("booking-update", async ({ bookingId, status } = {}) => {
            if (!STATUSES.includes(status)) return;
            const booking = await getAuthorizedBooking(bookingId, userId);
            if (booking && booking.provider.toString() === userId) {
                io.to(bookingId).emit("booking-status", status);
            }
        });
    });

    return io;
}
