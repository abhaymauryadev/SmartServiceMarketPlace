"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function BookingForm({ services, user, initialServiceId }) {
    const router = useRouter();

    // State
    const [selectedCategory, setSelectedCategory] = useState(
        () => services.find((s) => s._id === initialServiceId)?.category || ""
    );
    const [selectedServiceId, setSelectedServiceId] = useState(
        () => (services.some((s) => s._id === initialServiceId) ? initialServiceId : "")
    );
    const [description, setDescription] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Extract unique categories from services
    const categories = useMemo(() => {
        const cats = [...new Set(services.map(s => s.category).filter(Boolean))];
        return cats.sort();
    }, [services]);

    // Filter services by category
    const filteredServices = useMemo(() => {
        if (!selectedCategory) return [];
        return services.filter(s => s.category === selectedCategory);
    }, [selectedCategory, services]);

    // Get selected service object
    const selectedService = useMemo(() => {
        return services.find(s => s._id === selectedServiceId);
    }, [selectedServiceId, services]);

    // Time slots
    const timeSlots = [
        { label: "Morning (08:00 AM - 12:00 PM)", start: "08:00", end: "12:00" },
        { label: "Afternoon (12:00 PM - 05:00 PM)", start: "12:00", end: "17:00" },
        { label: "Evening (05:00 PM - 09:00 PM)", start: "17:00", end: "21:00" },
    ];

    // Calculate start and end times
    const calculateTimes = () => {
        if (!selectedDate || !selectedTimeSlot) return null;

        const slot = timeSlots.find(s => s.label === selectedTimeSlot);
        if (!slot) return null;

        const startTime = new Date(`${selectedDate}T${slot.start}:00`);
        const duration = selectedService?.duration || 60;
        const endTime = new Date(startTime.getTime() + duration * 60000);

        return { startTime, endTime };
    };

    // Handle category selection
    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setSelectedServiceId(""); // Reset service when category changes
        setError(null);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!selectedCategory) {
            setError("Please select a category");
            return;
        }
        if (!selectedServiceId) {
            setError("Please select a service");
            return;
        }
        if (!selectedDate) {
            setError("Please select a date");
            return;
        }
        if (!selectedTimeSlot) {
            setError("Please select a time slot");
            return;
        }

        const times = calculateTimes();
        if (!times) {
            setError("Invalid date/time selection");
            return;
        }

        // Check if date is in the past
        if (times.startTime < new Date()) {
            setError("Cannot book a date in the past");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    service: selectedServiceId,
                    provider: selectedService.provider._id || selectedService.provider,
                    bookingDate: selectedDate,
                    startTime: times.startTime.toISOString(),
                    endTime: times.endTime.toISOString(),
                    totalAmount: selectedService.price,
                    description: description || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to create booking");
            }

            setSuccess(true);

            // Reset form
            setTimeout(() => {
                router.push("/dashboard/user");
                router.refresh();
            }, 2000);
        } catch (err) {
            console.error("Booking error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Get minimum date (today)
    const minDate = new Date().toISOString().split("T")[0];

    return (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 text-black overflow-y-auto">
            {/* Success Message */}
            {success && (
                <div className="lg:col-span-3 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                    <p className="font-medium">Booking created successfully!</p>
                    <p className="text-sm">Redirecting to your bookings...</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="lg:col-span-3 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Left Form */}
            <div className="lg:col-span-2 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Book a Service</h1>
                    <p className="text-gray-500 text-sm">
                        Tell us what you need, and we'll match you with a professional.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Step 1: Category */}
                    <section className="bg-white border rounded-xl p-5">
                        <h2 className="font-semibold mb-4">1. Select a Category</h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {categories.length === 0 ? (
                                <p className="text-gray-500 text-sm col-span-full">
                                    No categories available
                                </p>
                            ) : (
                                categories.map((category) => (
                                    <div
                                        key={category}
                                        onClick={() => handleCategorySelect(category)}
                                        className={`border rounded-lg p-4 text-center text-sm cursor-pointer transition-colors ${selectedCategory === category
                                                ? "border-blue-500 bg-blue-50 text-blue-600"
                                                : "text-gray-500 hover:border-gray-400"
                                            }`}
                                    >
                                        {category}
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Step 2: Service Details */}
                    <section className="bg-white border rounded-xl p-5">
                        <h2 className="font-semibold mb-4">2. Service Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select
                                value={selectedServiceId}
                                onChange={(e) => setSelectedServiceId(e.target.value)}
                                className="border rounded-lg px-3 py-2 text-sm"
                                disabled={!selectedCategory}
                            >
                                <option value="">
                                    {selectedCategory ? "Select a service" : "Select category first"}
                                </option>
                                {filteredServices.map((service) => (
                                    <option key={service._id} value={service._id}>
                                        {service.title} - ${service.price}
                                        {service.pricingModel === "hourly" ? "/hr" : ""}
                                    </option>
                                ))}
                            </select>

                            <input
                                value={user?.address || "Set address in profile"}
                                readOnly
                                className="border rounded-lg px-3 py-2 text-sm bg-gray-50"
                                placeholder="Address"
                            />
                        </div>

                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the service you need... (optional)"
                            className="mt-4 w-full border rounded-lg p-3 text-sm"
                            rows={4}
                        />
                    </section>

                    {/* Step 3: Date & Time */}
                    <section className="bg-white border rounded-xl p-5">
                        <h2 className="font-semibold mb-4">3. Preferred Date & Time</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={minDate}
                                className="border rounded-lg px-3 py-2 text-sm"
                            />
                            <select
                                value={selectedTimeSlot}
                                onChange={(e) => setSelectedTimeSlot(e.target.value)}
                                className="border rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">Select time slot</option>
                                {timeSlots.map((slot) => (
                                    <option key={slot.label} value={slot.label}>
                                        {slot.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </section>
                </form>
            </div>

            {/* Right Summary */}
            <aside className="space-y-4">
                <div className="bg-white border rounded-xl p-5">
                    <h3 className="font-semibold mb-4">Booking Summary</h3>

                    <div className="text-sm space-y-2">
                        <p className="flex justify-between">
                            <span className="text-gray-500">Category</span>
                            <span className={selectedCategory ? "text-blue-600" : "text-gray-400"}>
                                {selectedCategory || "Not selected"}
                            </span>
                        </p>

                        <p className="flex justify-between">
                            <span className="text-gray-500">Service</span>
                            <span className={selectedService ? "" : "text-gray-400"}>
                                {selectedService?.title || "Not selected"}
                            </span>
                        </p>

                        <p className="flex justify-between">
                            <span className="text-gray-500">Date & Time</span>
                            <span className={selectedDate && selectedTimeSlot ? "" : "text-gray-400"}>
                                {selectedDate && selectedTimeSlot
                                    ? `${selectedDate}`
                                    : "Select date"}
                            </span>
                        </p>

                        {selectedService?.duration && (
                            <p className="flex justify-between">
                                <span className="text-gray-500">Duration</span>
                                <span>{selectedService.duration} min</span>
                            </p>
                        )}

                        <hr />

                        <p className="flex justify-between font-semibold">
                            <span>Estimated Total</span>
                            <span className="text-blue-600">
                                ${selectedService?.price || "0.00"}
                            </span>
                        </p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || success}
                        className="w-full mt-4 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating Booking..." : "Confirm Booking →"}
                    </button>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm">
                    <p className="font-medium mb-1">Need Help?</p>
                    <p className="text-gray-600">
                        Chat with our support team for assistance.
                    </p>
                    <button className="mt-3 text-green-700 font-medium">
                        Start Chat
                    </button>
                </div>
            </aside>
        </div>
    );
}
