"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";

const faqs = [
  {
    q: "How do I book a service?",
    a: "Browse the services, pick one, choose a date and time slot, and confirm your booking. The provider will accept or reject it, and you will be notified either way.",
  },
  {
    q: "How do payments work?",
    a: "Once your booking is created you can pay securely online with Razorpay. The amount is always the price set by the provider.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Yes. You can cancel a booking from your dashboard, and the provider is notified straight away.",
  },
  {
    q: "How do I become a provider?",
    a: "Register with a provider account, then list your services with pricing, duration and photos. You can manage bookings and earnings from your provider dashboard.",
  },
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);
  const contentRefs = useRef([]);

  useEffect(() => {
    contentRefs.current.forEach((el, i) => {
      if (!el) return;

      if (i === activeIndex) {
        gsap.to(el, {
          height: "auto",
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
        });
      } else {
        gsap.to(el, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.inOut",
        });
      }
    });
  }, [activeIndex]);

  return (
    <section className="py-32 bg-white text-black">
      <h2 className="text-4xl font-bold text-center mb-20">
        Frequently Asked Questions
      </h2>

      <div className="max-w-3xl mx-auto space-y-4 px-4">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-xl bg-white shadow-sm"
          >
            <button
              onClick={() =>
                setActiveIndex(activeIndex === i ? null : i)
              }
              aria-expanded={activeIndex === i}
              aria-controls={`faq-panel-${i}`}
              className="w-full flex justify-between items-center p-6 text-left"
            >
              <span className="font-medium text-gray-900">
                {faq.q}
              </span>
              <span className="text-xl" aria-hidden="true">
                {activeIndex === i ? "−" : "+"}
              </span>
            </button>

            <div
              id={`faq-panel-${i}`}
              role="region"
              aria-hidden={activeIndex !== i}
              inert={activeIndex !== i}
              ref={(el) => (contentRefs.current[i] = el)}
              className="overflow-hidden h-0 opacity-0"
            >
              <p className="px-6 pb-6 text-gray-600 leading-relaxed">
                {faq.a}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
