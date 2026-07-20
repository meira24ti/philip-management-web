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

const tipeBadge = { Penjualan: "badge-error", Stok: "badge-success", Statistik: "badge-info" };

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

  const isDirektur = role === "direktur";
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
    if (!isDirektur) return;
    try {
      setLoadingRiwayat(true);
      const data = await laporanService.getAll();
      setRiwayatLaporan(data);
    } catch {
      showToast("Gagal memuat riwayat laporan", "error");
    } finally {
      setLoadingRiwayat(false);
    }
  }, [isDirektur, showToast]);

  useEffect(() => {
    const loadAll = async () => {
      await loadStats();
      if (isDirektur) {
        await loadRiwayat();
      }
    };
    loadAll();
  }, [isDirektur, loadStats, loadRiwayat]);
  const handleGenerate = async () => {
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

      {/* ── Tren transaksi chart (Recharts) ── */}
      <div className="card bg-base-100 shadow border border-red-50">
        <div className="card-body p-5">
          <h3 className="font-bold text-red-900 mb-4">Tren Transaksi 6 Bulan Terakhir</h3>
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
          <div className="card-body p-5">
            <h3 className="font-bold text-red-900 mb-3">Properti Terlaku per Tipe</h3>
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
          <div className="card-body p-5">
            <h3 className="font-bold text-red-900 mb-3">Komisi Perusahaan (Rp)</h3>
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
      {isDirektur && (
        <div className="card bg-base-100 shadow border border-red-50">
          <div className="card-body p-5">
            <h3 className="font-bold text-red-900 mb-1">Generate Laporan PDF</h3>
            <p className="text-xs text-gray-400 mb-4">Laporan dibuat otomatis dari data yang tersedia di sistem.</p>
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
            <div className="mt-4">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn btn-sm btn-error text-white rounded-xl gap-2 shadow"
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
      {isDirektur && (
        <div className="card bg-base-100 shadow border border-red-50">
          <div className="card-body p-5">
            <div className="flex justify-between items-center mb-3">
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
                <table className="table table-sm">
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
                            <span className={`badge badge-sm ${tipeBadge[r.tipe] || "badge-ghost"} text-white`}>
                              {r.tipe || "Laporan"}
                            </span>
                          </td>
                          <td className="text-xs text-gray-500">
                            {r.periode_mulai || r.periode_start || "-"} — {r.periode_selesai || r.periode_end || "-"}
                          </td>
                          <td className="text-xs text-gray-500">
                            {r.created_at ? new Date(r.created_at).toLocaleDateString("id-ID") : "-"}
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