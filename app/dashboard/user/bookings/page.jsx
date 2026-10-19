import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import BookingForm from "./BookingForm";
import PayButton from "@/components/common/PayButton";

async function getBookings(userId) {
  try {
    await connectDB();
    const bookings = await Booking.find({ user: userId })
      .populate("service")
      .populate("provider", "name")
      .sort({ createdAt: -1 })
      .lean();

    // Convert MongoDB objects to plain objects and stringify dates
    return bookings.map(booking => ({
      ...booking,
      _id: booking._id.toString(),
      user: booking.user?.toString(),
      provider: {
        _id: booking.provider?._id?.toString(),
        name: booking.provider?.name
      },
      service: booking.service ? {
        ...booking.service,
        _id: booking.service._id.toString(),
        provider: booking.service.provider?.toString()
      } : null,
      createdAt: booking.createdAt?.toISOString(),
      updatedAt: booking.updatedAt?.toISOString(),
      bookingDate: booking.bookingDate?.toISOString(),
      startTime: booking.startTime?.toISOString(),
      endTime: booking.endTime?.toISOString()
    }));
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
}
// check the bookings service page while confirming the booking is not showing 
async function getServices() {
  try {
    await connectDB();
    const services = await Service.find({ isActive: true })
      .populate("provider", "name")
      .lean();

    // Convert MongoDB objects to plain objects
    return services.map(service => ({
      ...service,
      _id: service._id.toString(),
      provider: service.provider ? {
        _id: service.provider._id?.toString(),
        name: service.provider.name
      } : null,
      createdAt: service.createdAt?.toISOString(),
      updatedAt: service.updatedAt?.toISOString()
    }));
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
}

export default async function UserBookingsPage({ searchParams }) {
  const { service: initialServiceId } = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-red-600">Please log in to view this page.</p>
      </div>
    );
  }

  const [bookings, services] = await Promise.all([
    getBookings(session.user.id),
    getServices()
  ]);

  return (
    <div className="h-full overflow-y-auto">
      {/* My Bookings Section */}
      <div className="p-6 border-b bg-white text-black">
        <h1 className="text-2xl font-bold mb-4">My Bookings</h1>

        {bookings.length === 0 && (
          <p className="text-gray-500">No bookings yet.</p>
        )}

        {bookings.length > 0 && (
          <ul className="space-y-3">
            {bookings.map((b) => (
              <li
                key={b._id}
                className="border rounded p-4 bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{b.service?.title || "Service"}</p>
                    <p className="text-sm text-gray-600">
                      Provider: {b.provider?.name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Date: {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full ${b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      b.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                        b.status === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                    }`}>
                    {b.status}
                  </span>
                  {b.paymentStatus === "paid" ? (
                    <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">paid</span>
                  ) : !["rejected", "cancelled"].includes(b.status) && (
                    <PayButton
                      bookingId={b._id}
                      amount={b.totalAmount}
                      title={b.service?.title}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                    />
                  )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Booking Form */}
      <BookingForm services={services} user={session.user} initialServiceId={initialServiceId} />
    </div>
  );
}
