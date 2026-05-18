export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      {/* 404 Number */}
      <h1 className="text-8xl font-black text-[#7B1C1C] opacity-10 select-none leading-none">
        404
      </h1>

      {/* Icon */}
      <div className="w-20 h-20 bg-[#7B1C1C]/10 rounded-full flex items-center justify-center -mt-6 mb-6">
        <svg
          className="w-10 h-10 text-[#7B1C1C]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Text */}
      <h2 className="text-xl font-bold text-gray-800 mb-2">
        Halaman Tidak Ditemukan
      </h2>
      <p className="text-sm text-gray-400 text-center max-w-xs mb-8">
        Halaman yang kamu cari tidak tersedia atau telah dipindahkan.
      </p>

      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 bg-[#7B1C1C] hover:bg-[#5e1515] text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors duration-150"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Kembali
      </button>
    </div>
  );
}
