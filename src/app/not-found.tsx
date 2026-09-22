import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] text-white px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 text-8xl font-bold font-mono text-[#22c55e]">404</div>
        <h1 className="text-2xl font-bold mb-3">Strategy Not Found</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          This page has been delisted from the exchange. The strategy or endpoint you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-[#22c55e] px-6 py-3 font-semibold text-black hover:bg-[#22c55e]/80 transition-colors"
        >
          ← Back to Terminal
        </Link>
      </div>
    </div>
  );
}
