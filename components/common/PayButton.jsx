"use client";
import { useRouter } from "next/navigation";
// add the payment btn in user sides
export default function PayButton({ amount, bookingId, title, description, label, className }) {
    const router = useRouter();
    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        const res = await loadRazorpay();
        if (!res) {
            alert("Razorpay SDK failed to load");
            return;
        }

        try {
            const orderRes = await fetch("/api/create-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ bookingId }),
            });

            const order = await orderRes.json();

            if (!orderRes.ok) throw new Error(order.error || "Order creation failed");

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: "INR",
                name: "Smart Service Place",
                description: description || title || "Service Booking",
                order_id: order.id,
                handler: async function (response) {
                    console.log("Payment Success", response);

                    // Verify payment on the server
                    const verifyRes = await fetch("/api/verify-payment", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    });

                    const verifyData = await verifyRes.json();

                    if (verifyData.success) {
                        alert("Payment Successful");
                        router.refresh();
                    } else {
                        alert("Payment Verification Failed");
                    }
                },
                prefill: {
                    name: "User",
                    email: "user@example.com",
                    contact: "9999999999",
                },
                theme: {
                    color: "#2563eb",
                },
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        } catch (error) {
            console.error("Payment error:", error);
            alert(error.message);
        }
    };

    return (
        <button
            onClick={handlePayment}
            className={className || "w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-200"}
        >
            {label || `Pay Now (₹${amount})`}
        </button>
    );
}
