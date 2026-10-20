"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Platform() {
  const sectionsRef = useRef([]);
  const imagesRef = useRef([]);

  const data = [
  {
    title: "Your Peace of Mind is Our Priority",
    desc: [
      {
        title: "Certified Professionals",
        description:
          "Each provider is thoroughly vetted, background-checked, and verified to ensure consistent quality and dependable service."
      },
      {
        title: "Effortless Scheduling",
        description:
          "Book services instantly with clear availability and upfront pricing—no surprises, just seamless convenience."
      },
      {
        title: "Trusted Transactions",
        description:
          "Complete payments securely through our platform, with funds released only after your service is successfully delivered."
      }
    ],
    img: "/assets/hero-image.png",
    bg: "bg-[#ffffff]",
  },

  {
    title: "Effortless Scheduling, Simplified",
    desc: [
      {
        title: "Real-Time Availability",
        description:
          "View live time slots and service availability, so you always know exactly when help is available."
      },
      {
        title: "Quick Booking Flow",
        description:
          "Schedule services in just a few clicks with an intuitive, step-by-step booking experience."
      },
      {
        title: "Clear Pricing Upfront",
        description:
          "Know the cost before you confirm—transparent pricing with no hidden fees or last-minute changes."
      }
    ],
    img: "/assets/Login-image.png",
    bg: "bg-[#e5e7eb]",
  },

  {
    title: "Trusted Transactions, Guaranteed",
    desc: [
      {
        title: "Secure Payments",
        description:
          "All transactions are protected using industry-standard security to keep your financial data safe."
      },
      {
        title: "Payment Protection",
        description:
          "Your payment is held securely and released only after the service has been completed to your satisfaction."
      },
      {
        title: "Complete Transparency",
        description:
          "Track payment status, invoices, and service history clearly within your account at all times."
      }
    ],
    img: "/assets/payment.png",
    bg: "bg-[#ffffff]",
  }
];

  useEffect(() => {
    // Only run on md+ where the sticky image layer is visible
    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      sectionsRef.current.forEach((trigger, i) => {
        const image = imagesRef.current[i];
        // The last image stays put and scrolls away with the section
        if (!image || !trigger || i === data.length - 1) return;

        gsap.fromTo(
          image,
          { clipPath: "inset(0 0 0% 0)" },
          {
            clipPath: "inset(0 0 100% 0)",
            ease: "none",
            scrollTrigger: {
              trigger,
              start: "top top",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        );
      });
    });

    // Recalculate positions once images/fonts have loaded
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);

    return () => {
      window.removeEventListener("load", refresh);
      mm.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 relative">
      {/* Content Layer (Backgrounds & Text) */}
      <div className="col-start-1 row-start-1 z-0">
        {data.map((item, i) => (
          <section
            key={i}
            ref={(el) => (sectionsRef.current[i] = el)}
            className={`relative md:h-screen h-auto flex flex-col md:flex-row items-start md:items-center px-6 md:px-12 py-10 md:py-0 ${item.bg}`}
          >
            <div className="w-full md:w-1/2 pl-0 md:pl-[10%] space-y-6 text-black">
              <h2 className="text-2xl md:text-4xl font-bold">{item.title}</h2>
              {Array.isArray(item.desc) ? (
                <div className="space-y-4">
                  {item.desc.map((feature, idx) => (
                    <div key={idx}>
                      <h3 className="font-semibold text-lg md:text-xl">{feature.title}</h3>
                      <p className="text-sm md:text-base text-gray-700">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base md:text-lg leading-relaxed">{item.desc}</p>
              )}
            </div>

            {/* Mobile inline image (hidden on md and up) */}
            <div className="md:hidden w-full mt-6">
              <div className="relative w-full h-64 rounded-2xl overflow-hidden">
                <Image src={item.img} alt={item.title} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Images Layer (Sticky on md+) */}
      <div className="col-start-1 row-start-1 z-10 h-screen sticky top-0 pointer-events-none hidden md:block">
        <div className="relative w-full h-full">
          {data.map((item, i) => (
            <div
              key={i}
              ref={(el) => (imagesRef.current[i] = el)}
              className="absolute right-6 top-0 bottom-0 m-auto w-[40vw] max-w-150 h-[60vh] max-h-125 overflow-hidden"
              style={{ zIndex: data.length - i }}
            >
              <Image
                src={item.img}
                alt={item.title}
                fill
                sizes="(min-width: 1024px) 600px, 40vw"
                className="object-cover rounded-3xl"
                loading="eager"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
