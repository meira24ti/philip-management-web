import { useState } from "react";
import { HiOutlineDocumentReport, HiOutlineDownload, HiOutlineChartBar,
  HiOutlineChartPie, HiOutlineCurrencyDollar, HiTrendingUp,
  HiOutlineCalendar, HiOutlineRefresh } from "react-icons/hi";

const CURRENT_ROLE = "direktur"; // simulasi

// ── Dummy statistik ────────────────────────────────────────────────────────────
const statCards = [
  { label:"Total Listing",    value:"540",           sub:"unit properti",         icon: HiOutlineChartBar,      color:"text-red-700",   bg:"bg-red-50",    border:"border-red-100"   },
  { label:"Terjual Bulan Ini",value:"12",            sub:"unit",                  icon: HiTrendingUp,           color:"text-green-700", bg:"bg-green-50",  border:"border-green-100" },
  { label:"Tersewa Bulan Ini",value:"5",             sub:"unit",                  icon: HiOutlineChartPie,      color:"text-blue-700",  bg:"bg-blue-50",   border:"border-blue-100"  },
  { label:"Total Komisi",     value:"Rp 142jt",      sub:"bulan ini",             icon: HiOutlineCurrencyDollar,color:"text-amber-700", bg:"bg-amber-50",  border:"border-amber-100" },
];

const trenData = [
  { bulan:"Jan", terjual:8,  tersewa:3, komisi:95 },
  { bulan:"Feb", terjual:11, tersewa:4, komisi:128 },
  { bulan:"Mar", terjual:7,  tersewa:6, komisi:101 },
  { bulan:"Apr", terjual:14, tersewa:2, komisi:167 },
  { bulan:"Mei", terjual:9,  tersewa:5, komisi:118 },
  { bulan:"Jun", terjual:12, tersewa:5, komisi:142 },
];

const maxVal = Math.max(...trenData.map(d => d.terjual + d.tersewa));

const riwayatLaporan = [
  { id:1, judul:"Laporan Penjualan Q1 2025",  tipe:"Penjualan", periode:"Jan – Mar 2025", tanggal:"12 Apr 2025", size:"245 KB" },
  { id:2, judul:"Laporan Stok Properti Apr",   tipe:"Stok",      periode:"Apr 2025",       tanggal:"01 Mei 2025", size:"128 KB" },
  { id:3, judul:"Laporan Statistik Semester 1",tipe:"Statistik", periode:"Jan – Jun 2025", tanggal:"02 Jul 2025", size:"312 KB" },
];

const tipeBadge = { Penjualan:"badge-error", Stok:"badge-success", Statistik:"badge-info" };

export default function Reports() {
  const [periodeStart, setPeriodeStart] = useState("2025-01-01");
  const [periodeEnd,   setPeriodeEnd]   = useState("2025-06-30");
  const [tipe,         setTipe]         = useState("penjualan");
  const [generating,   setGenerating]   = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  const isDirektur = CURRENT_ROLE === "direktur";
  const canSeeStats = ["direktur","admin"].includes(CURRENT_ROLE);

  if (!canSeeStats) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <p>Anda tidak memiliki akses ke halaman ini.</p>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-red-900">Statistik & Laporan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan performa properti Philip Real Estate</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className={`${s.bg} ${s.border} border rounded-2xl p-4`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
                <p className="text-xs font-semibold text-gray-600 mt-1">{s.label}</p>
              </div>
              <s.icon size={22} className={`${s.color} opacity-60`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Tren penjualan chart ── */}
      <div className="card bg-base-100 shadow border border-red-50">
        <div className="card-body p-5">
          <h3 className="font-bold text-red-900 mb-4">Tren Transaksi 6 Bulan Terakhir</h3>
          <div className="flex items-end gap-3 h-40">
            {trenData.map(d => {
              const total = d.terjual + d.tersewa;
              const heightPct = Math.round((total / maxVal) * 100);
              const jualPct   = Math.round((d.terjual / total) * 100);
              return (
                <div key={d.bulan} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-gray-500">{total}</span>
                  <div className="w-full rounded-lg overflow-hidden flex flex-col-reverse" style={{ height:`${heightPct}%`, minHeight:8 }}>
                    <div className="bg-red-600" style={{ height:`${jualPct}%` }} title={`Terjual: ${d.terjual}`} />
                    <div className="bg-blue-400" style={{ height:`${100-jualPct}%` }} title={`Tersewa: ${d.tersewa}`} />
                  </div>
                  <span className="text-[10px] text-gray-500">{d.bulan}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-600" /><span className="text-xs text-gray-500">Terjual</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-400" /><span className="text-xs text-gray-500">Tersewa</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Tipe properti terlaku ── */}
        <div className="card bg-base-100 shadow border border-red-50">
          <div className="card-body p-5">
            <h3 className="font-bold text-red-900 mb-3">Properti Terlaku per Tipe</h3>
            <div className="space-y-2">
              {[
                { tipe:"Rumah",  pct:54, val:29 },
                { tipe:"Ruko",   pct:26, val:14 },
                { tipe:"Tanah",  pct:13, val:7  },
                { tipe:"Lainnya",pct:7,  val:4  },
              ].map(r => (
                <div key={r.tipe}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{r.tipe}</span>
                    <span className="text-gray-400">{r.val} unit · {r.pct}%</span>
                  </div>
                  <progress className="progress progress-error w-full h-2" value={r.pct} max={100} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Komisi per bulan ── */}
        <div className="card bg-base-100 shadow border border-red-50">
          <div className="card-body p-5">
            <h3 className="font-bold text-red-900 mb-3">Komisi Perusahaan (Juta Rp)</h3>
            <div className="flex items-end gap-2 h-32">
              {trenData.map(d => {
                const maxK = Math.max(...trenData.map(x=>x.komisi));
                const pct  = Math.round((d.komisi / maxK) * 100);
                return (
                  <div key={d.bulan} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-amber-600">{d.komisi}</span>
                    <div className="w-full bg-amber-400 rounded-t-lg" style={{height:`${pct}%`, minHeight:4}} />
                    <span className="text-[10px] text-gray-400">{d.bulan}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Generate Laporan (Direktur only) ── */}
      {isDirektur && (
        <div className="card bg-base-100 shadow border border-red-50">
          <div className="card-body p-5">
            <h3 className="font-bold text-red-900 mb-1">Generate Laporan PDF</h3>
            <p className="text-xs text-gray-400 mb-4">Laporan dibuat otomatis dari data yang tersedia di sistem.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Jenis Laporan</span></div>
                <select className="select select-bordered select-sm rounded-xl" value={tipe} onChange={e=>setTipe(e.target.value)}>
                  <option value="penjualan">Laporan Penjualan</option>
                  <option value="stok">Laporan Stok Properti</option>
                  <option value="statistik">Laporan Statistik</option>
                </select>
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Dari Tanggal</span></div>
                <input type="date" className="input input-bordered input-sm rounded-xl" value={periodeStart} onChange={e=>setPeriodeStart(e.target.value)} />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Sampai Tanggal</span></div>
                <input type="date" className="input input-bordered input-sm rounded-xl" value={periodeEnd} onChange={e=>setPeriodeEnd(e.target.value)} />
              </label>
            </div>
            <div className="mt-4">
              <button onClick={handleGenerate} disabled={generating}
                className="btn btn-sm btn-error text-white rounded-xl gap-2 shadow">
                {generating
                  ? <><span className="loading loading-spinner loading-xs" /> Membuat laporan...</>
                  : <><HiOutlineDocumentReport size={16} /> Generate Laporan PDF</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Riwayat Laporan ── */}
      {isDirektur && (
        <div className="card bg-base-100 shadow border border-red-50">
          <div className="card-body p-5">
            <h3 className="font-bold text-red-900 mb-3">Riwayat Laporan</h3>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-red-50">
                    <th>Judul Laporan</th>
                    <th>Tipe</th>
                    <th>Periode</th>
                    <th>Dibuat</th>
                    <th>Ukuran</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {riwayatLaporan.map(r => (
                    <tr key={r.id} className="hover:bg-red-50/30 transition-colors border-b border-red-50">
                      <td className="font-medium text-sm text-gray-700">{r.judul}</td>
                      <td><span className={`badge badge-sm ${tipeBadge[r.tipe]} text-white`}>{r.tipe}</span></td>
                      <td className="text-xs text-gray-500">{r.periode}</td>
                      <td className="text-xs text-gray-500">{r.tanggal}</td>
                      <td className="text-xs text-gray-400">{r.size}</td>
                      <td>
                        <button className="btn btn-xs btn-ghost text-red-600 hover:bg-red-50 rounded-lg gap-1">
                          <HiOutlineDownload size={13} /> Unduh
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
