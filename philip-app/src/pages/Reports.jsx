// philip-app/src/pages/Reports.jsx
import { useState, useEffect, useCallback } from "react";
import {
  HiOutlineDocumentReport, HiOutlineDownload, HiOutlineChartBar,
  HiOutlineChartPie, HiOutlineCurrencyDollar, HiTrendingUp,
  HiOutlineRefresh
} from "react-icons/hi";
import { useAuth } from "../context/useAuth";
import { useToast } from "../components/ToastContext";
import { statistikService } from "../services/statistikService";
import { laporanService } from "../services/laporanService";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";

const COLORS = ["#7A0000", "#3D0000", "#b91c1c", "#dc2626", "#ef4444", "#f87171"];

const REPORT_TYPE_META = {
  penjualan: {
    label: "Laporan Penjualan",
    shortLabel: "Penjualan",
    badge: "badge-error",
    description: "Rincian transaksi, nilai deal, dan komisi pada periode terpilih.",
  },
  stok: {
    label: "Laporan Stok Properti",
    shortLabel: "Stok",
    badge: "badge-success",
    description: "Komposisi listing aktif dan persebaran kategori properti.",
  },
  statistik: {
    label: "Laporan Statistik",
    shortLabel: "Statistik",
    badge: "badge-info",
    description: "Ringkasan performa, tren transaksi, dan visualisasi data utama.",
  },
};

const formatDate = (value) => value
  ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  : "-";

export default function Reports() {
  const { role } = useAuth();
  const { showToast } = useToast();

  // ─── State ──────────────────────────────────────────────
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodeStart, setPeriodeStart] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
  );
  const [periodeEnd, setPeriodeEnd] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [tipe, setTipe] = useState("penjualan");
  const [generating, setGenerating] = useState(false);
  const [riwayatLaporan, setRiwayatLaporan] = useState([]);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);

  const canManageReports = ["direktur", "admin"].includes(role);
  const canSeeStats = ["direktur", "admin"].includes(role);

  // ─── Load Statistik ──────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await statistikService.getRingkasan();
      setStats(data);
    } catch {
      showToast("Gagal memuat data statistik", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // ─── Load Riwayat Laporan ──────────────────────────────
  const loadRiwayat = useCallback(async () => {
    if (!canManageReports) return;
    try {
      setLoadingRiwayat(true);
      const data = await laporanService.getAll();
      setRiwayatLaporan(data);
    } catch {
      showToast("Gagal memuat riwayat laporan", "error");
    } finally {
      setLoadingRiwayat(false);
    }
  }, [canManageReports, showToast]);

  useEffect(() => {
    const loadAll = async () => {
      await loadStats();
      if (canManageReports) {
        await loadRiwayat();
      }
    };
    loadAll();
  }, [canManageReports, loadStats, loadRiwayat]);
  const handleGenerate = async () => {
    if (!periodeStart || !periodeEnd || periodeStart > periodeEnd) {
      showToast("Pilih periode laporan yang valid terlebih dahulu", "error");
      return;
    }

    try {
      setGenerating(true);
      await laporanService.generate({
        tipe,
        periodeStart,
        periodeEnd,
      });
      showToast("Laporan berhasil dibuat", "success");
      await loadRiwayat(); // Refresh riwayat
    } catch {
      showToast("Gagal membuat laporan", "error");
    } finally {
      setGenerating(false);
    }
  };

  // ─── Handle Download Laporan ────────────────────────────
  const handleDownload = async (id) => {
    try {
      const data = await laporanService.download(id);
      const blob = new Blob([data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `laporan-${id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Gagal mengunduh laporan", "error");
    }
  };

  // ─── Access Denied ───────────────────────────────────────
  if (!canSeeStats) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    );
  }

  // ─── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-red-800" />
      </div>
    );
  }

  // ─── Data Statistik ──────────────────────────────────────
  const byStatus = stats?.byStatus || { tersedia: 0, terjual: 0, tersewa: 0, negosiasi: 0 };
  const byTipe = stats?.byTipe || [];
  const trenBulan = stats?.trenBulan || [];
  const komisiBulanIni = stats?.komisiBulanIni || 0;
  const selectedReport = REPORT_TYPE_META[tipe] || REPORT_TYPE_META.penjualan;
  const isPeriodValid = Boolean(periodeStart && periodeEnd && periodeStart <= periodeEnd);

  // Format tren bulan untuk chart
  const formattedTren = trenBulan.map(item => ({
    ...item,
    bulan: item.bulan,
    total_komisi_formatted: Number(item.total_komisi) || 0,
  }));

  // ─── Stat Cards ──────────────────────────────────────────
  const statCards = [
    { label: "Total Listing", value: byStatus.total || 0, sub: "unit properti", icon: HiOutlineChartBar, color: "text-red-700", bg: "bg-red-50", border: "border-red-100" },
    { label: "Terjual", value: byStatus.terjual || 0, sub: "unit", icon: HiTrendingUp, color: "text-green-700", bg: "bg-green-50", border: "border-green-100" },
    { label: "Tersewa", value: byStatus.tersewa || 0, sub: "unit", icon: HiOutlineChartPie, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Total Komisi", value: "Rp " + Number(komisiBulanIni).toLocaleString("id-ID"), sub: "bulan ini", icon: HiOutlineCurrencyDollar, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100" },
  ];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-red-900">Statistik & Laporan</h1>
          <span className="rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">Data operasional</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Ringkasan performa properti Philip Real Estate dan dokumen siap unduh.</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className={`${s.bg} ${s.border} group border rounded-2xl p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
                <p className="text-xs font-semibold text-gray-600 mt-1">{s.label}</p>
              </div>
              <s.icon size={22} className={`${s.color} opacity-60 transition-transform duration-300 group-hover:scale-110`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Tren transaksi chart (Recharts) ── */}
      <div className="card bg-base-100 shadow border border-red-50">
        <div className="card-body p-4 sm:p-5">
          <div className="mb-4"><h3 className="font-bold text-red-900">Tren Transaksi 6 Bulan Terakhir</h3><p className="mt-0.5 text-xs text-gray-400">Perbandingan unit terjual dan tersewa per bulan.</p></div>
          {formattedTren.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={formattedTren}>
                <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="terjual" fill="#7A0000" name="Terjual" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tersewa" fill="#3b82f6" name="Tersewa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8">Belum ada data transaksi</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Distribusi Tipe Properti (Pie Chart) ── */}
        <div className="card bg-base-100 shadow border border-red-50">
          <div className="card-body p-4 sm:p-5">
            <div className="mb-3"><h3 className="font-bold text-red-900">Properti Terlaku per Tipe</h3><p className="mt-0.5 text-xs text-gray-400">Komposisi listing berdasarkan kategori.</p></div>
            {byTipe.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={byTipe}
                    dataKey="jumlah"
                    nameKey="kategori"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {byTipe.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 py-8">Belum ada data properti</p>
            )}
          </div>
        </div>

        {/* ── Komisi per bulan (Area Chart) ── */}
        <div className="card bg-base-100 shadow border border-red-50">
          <div className="card-body p-4 sm:p-5">
            <div className="mb-3"><h3 className="font-bold text-red-900">Komisi Perusahaan (Rp)</h3><p className="mt-0.5 text-xs text-gray-400">Akumulasi komisi dari transaksi tercatat.</p></div>
            {formattedTren.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={formattedTren}>
                  <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => Number(v).toLocaleString("id-ID")}
                  />
                  <Tooltip
                    formatter={(v) => "Rp " + Number(v).toLocaleString("id-ID")}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_komisi"
                    stroke="#7A0000"
                    fill="#fef2f2"
                    name="Komisi"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 py-8">Belum ada data komisi</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Generate Laporan (Direktur only) ── */}
      {canManageReports && (
        <div className="card bg-base-100 shadow border border-red-50 overflow-hidden">
          <div className="card-body p-4 sm:p-5">
            <h3 className="font-bold text-red-900 mb-1">Generate Laporan PDF</h3>
            <p className="text-xs text-gray-400 mb-4">Laporan dibuat otomatis dari data yang tersedia di sistem dan disimpan di riwayat.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Jenis Laporan</span></div>
                <select
                  className="select select-bordered select-sm rounded-xl"
                  value={tipe}
                  onChange={e => setTipe(e.target.value)}
                >
                  <option value="penjualan">Laporan Penjualan</option>
                  <option value="stok">Laporan Stok Properti</option>
                  <option value="statistik">Laporan Statistik</option>
                </select>
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Dari Tanggal</span></div>
                <input
                  type="date"
                  className="input input-bordered input-sm rounded-xl"
                  value={periodeStart}
                  onChange={e => setPeriodeStart(e.target.value)}
                />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Sampai Tanggal</span></div>
                <input
                  type="date"
                  className="input input-bordered input-sm rounded-xl"
                  value={periodeEnd}
                  onChange={e => setPeriodeEnd(e.target.value)}
                />
              </label>
            </div>
            <div className="mt-4 flex flex-col gap-2 rounded-xl border border-red-100 bg-red-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xs font-bold text-red-900">{selectedReport.label}</p><p className="mt-0.5 text-xs text-gray-600">{selectedReport.description}</p></div>
              <span className="shrink-0 text-xs font-semibold text-red-700">{formatDate(periodeStart)} – {formatDate(periodeEnd)}</span>
            </div>
            {!isPeriodValid && <p className="mt-2 text-xs font-medium text-red-600" role="alert">Tanggal akhir harus sama dengan atau setelah tanggal mulai.</p>}
            <div className="mt-4">
              <button
                onClick={handleGenerate}
                disabled={generating || !isPeriodValid}
                className="btn btn-sm btn-error text-white rounded-xl gap-2 shadow w-full sm:w-auto"
              >
                {generating ? (
                  <><span className="loading loading-spinner loading-xs" /> Membuat laporan...</>
                ) : (
                  <><HiOutlineDocumentReport size={16} /> Generate Laporan PDF</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Riwayat Laporan (Direktur only) ── */}
      {canManageReports && (
        <div className="card bg-base-100 shadow border border-red-50">
          <div className="card-body p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="font-bold text-red-900">Riwayat Laporan</h3>
              <button
                onClick={loadRiwayat}
                className="btn btn-xs btn-ghost text-gray-400 hover:text-red-800"
              >
                <HiOutlineRefresh size={14} /> Refresh
              </button>
            </div>
            {loadingRiwayat ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-sm text-red-800" />
              </div>
            ) : riwayatLaporan.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Belum ada laporan yang dibuat</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm min-w-[42rem]">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-red-50">
                      <th>Judul Laporan</th>
                      <th>Tipe</th>
                      <th>Periode</th>
                      <th>Dibuat</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayatLaporan.map(r => {
                      const reportId = r.id || r.id_laporan;
                      return (
                        <tr key={reportId} className="hover:bg-red-50/30 transition-colors border-b border-red-50">
                          <td className="font-medium text-sm text-gray-700">{r.judul}</td>
                          <td>
                            <span className={`badge badge-sm ${REPORT_TYPE_META[r.tipe]?.badge || "badge-ghost"} text-white`}>
                              {REPORT_TYPE_META[r.tipe]?.shortLabel || r.tipe || "Laporan"}
                            </span>
                          </td>
                          <td className="text-xs text-gray-500">
                            {formatDate(r.periode_mulai || r.periode_start)} – {formatDate(r.periode_selesai || r.periode_end)}
                          </td>
                          <td className="text-xs text-gray-500">
                            {formatDate(r.created_at)}
                          </td>
                          <td>
                            <button
                              onClick={() => handleDownload(reportId)}
                              className="btn btn-xs btn-ghost text-red-600 hover:bg-red-50 rounded-lg gap-1"
                            >
                              <HiOutlineDownload size={13} /> Unduh
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
