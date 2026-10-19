import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Service from "@/models/Service";
import Image from "next/image";
import PayButton from "@/components/common/PayButton";

async function getService(id) {
  try {
    await connectDB();
    const service = await Service.findOne({ _id: id, isActive: true })
      .populate("provider", "name")
      .lean();
    return service;
  } catch (error) {
    console.error("Error fetching service:", error);
    return null;
  }
}

export default async function ServiceDetailsPage({ params }) {
  const { id } = await params;
  const service = await getService(id);

  if (!service) {
    notFound();
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 text-black">
      <div className="grid md:grid-cols-2 gap-10">
        {/* Images Section */}
        <div className="space-y-4">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
            {service.images && service.images.length > 0 ? (
              <Image
                src={service.images[0]}
                alt={service.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No Image Available
              </div>
            )}
          </div>

          {service.images && service.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {service.images.slice(1).map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                  <Image
                    src={img}
                    alt={`${service.title} - ${idx + 2}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {service.title}
          </h1>

          <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">
              {service.category}
            </span>
            <span>•</span>
            <span>Provider: {service.provider?.name}</span>
          </div>

          <p className="text-gray-600 mb-8 leading-relaxed">
            {service.description}
          </p>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Price</p>
                <p className="text-3xl font-bold">
                  ₹{service.price}
                  <span className="text-base font-normal text-gray-500 ml-1">
                    /{service.pricingModel === "hourly" ? "hour" : "flat rate"}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Duration</p>
                <p className="font-semibold">{service.duration} mins</p>
              </div>
            </div>

            <PayButton
              amount={service.price}
              serviceId={service._id?.toString() || service.id}
              title={service.title}
              description={service.description}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
