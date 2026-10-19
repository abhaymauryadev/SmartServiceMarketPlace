import Link from "next/link";

export default function Unauthorized() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Access denied</h1>
      <p className="text-gray-500">You don&apos;t have permission to view this page.</p>
      <Link href="/" className="text-blue-600 font-medium">Go home</Link>
    </main>
  );
}
