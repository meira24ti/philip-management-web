import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineChartBar,
  HiOutlineChartPie,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentReport,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiTrendingUp,
} from "react-icons/hi";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/useAuth";
import { useToast } from "../components/ToastContext";
import { laporanService } from "../services/laporanService";
import { statistikService } from "../services/statistikService";

const REPORT_TYPE_META = {
  penjualan: {
    label: "Laporan Penjualan",
    shortLabel: "Penjualan",
    badge: "badge-error",
    description: "Rincian transaksi, nilai deal, komisi, dan tren selama periode aktif.",
  },
  stok: {
    label: "Laporan Stok Properti",
    shortLabel: "Stok",
    badge: "badge-success",
    description: "Komposisi listing yang terdaftar pada periode aktif beserta statusnya.",
  },
  statistik: {
    label: "Laporan Statistik",
    shortLabel: "Statistik",
    badge: "badge-info",
    description: "Ikhtisar operasional, tren, dan visualisasi data pada periode aktif.",
  },
};

const TYPE_LABELS = {
  rumah: "Rumah",
  rumah_cluster: "Rumah Cluster",
  ruko: "Ruko",
  tanah: "Tanah",
  gudang: "Gudang",
  villa: "Villa",
  rumah_subsidi: "Rumah Subsidi",
  kios: "Kios",
  kombinasi: "Kombinasi",
  lainnya: "Lainnya",
};

const OFFER_LABELS = {
  dijual: "Dijual",
  disewa: "Disewakan",
  dijual_dan_disewa: "Dijual & Disewakan",
  lainnya: "Lainnya",
};

const TRANSACTION_LABELS = {
  terjual: "Penjualan",
  tersewa: "Penyewaan",
};

const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumber = (value) => number(value).toLocaleString("id-ID");
const formatCurrency = (value) => `Rp ${formatNumber(value)}`;

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = value instanceof Date
    ? value
    : new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return formatDate(value);
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toMonthInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthBounds(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { dari: toDateInputValue(start), sampai: toDateInputValue(end) };
}

function getMonthsRange(amount) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - amount + 1, 1);
  return { dari: toDateInputValue(start), sampai: toDateInputValue(today) };
}

function getYearRange() {
  const today = new Date();
  return {
    dari: toDateInputValue(new Date(today.getFullYear(), 0, 1)),
    sampai: toDateInputValue(today),
  };
}

function isPeriodValid(period) {
  return Boolean(period?.dari && period?.sampai && period.dari <= period.sampai);
}

function formatPeriod(period) {
  return `${formatDate(period?.dari)} – ${formatDate(period?.sampai)}`;
}

function normalizeRows(rows, key, labels) {
  return (rows || []).map((row) => {
    const rawLabel = row[key] || "lainnya";
    return {
      ...row,
      jumlah: number(row.jumlah),
      label: labels[rawLabel] || String(rawLabel).replace(/_/g, " "),
    };
  });
}

function EmptyChart({ message = "Belum ada data untuk periode ini." }) {
  return (
    <div className="flex h-[210px] items-center justify-center rounded-xl border border-dashed border-red-100 bg-red-50/40 px-5 text-center text-sm text-gray-400">
      {message}
    </div>
  );
}

function StatCard({ label, value, note, Icon, tone = "red" }) {
  const tones = {
    red: "border-red-100 bg-red-50/70 text-red-800",
    green: "border-emerald-100 bg-emerald-50/70 text-emerald-800",
    blue: "border-blue-100 bg-blue-50/70 text-blue-800",
    amber: "border-amber-100 bg-amber-50/70 text-amber-800",
  };

  return (
    <article className={`group min-w-0 rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.08em] opacity-65">{label}</p>
          <p className="mt-2 truncate text-lg font-extrabold leading-tight sm:text-xl" title={value}>{value}</p>
          <p className="mt-1 text-xs opacity-70">{note}</p>
        </div>
        <Icon size={22} className="shrink-0 opacity-55 transition-transform duration-300 group-hover:scale-110" />
      </div>
    </article>
  );
}

export default function Reports() {
  const { role } = useAuth();
  const { showToast } = useToast();
  const today = useMemo(() => new Date(), []);
  const initialMonth = useMemo(() => toMonthInputValue(today), [today]);
  const initialPeriod = useMemo(() => getMonthBounds(initialMonth), [initialMonth]);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodMode, setPeriodMode] = useState("month");
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [draftPeriod, setDraftPeriod] = useState(initialPeriod);
  const [activePeriod, setActivePeriod] = useState(initialPeriod);
  const [tipe, setTipe] = useState("penjualan");
  const [generating, setGenerating] = useState(false);
  const [riwayatLaporan, setRiwayatLaporan] = useState([]);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);
  const statsRequestRef = useRef(0);

  const canManageReports = ["direktur", "admin"].includes(role);
  const canSeeStats = ["direktur", "admin"].includes(role);
  const validDraftPeriod = isPeriodValid(draftPeriod);

  const loadStats = useCallback(async () => {
    if (!isPeriodValid(activePeriod)) return;
    const requestId = ++statsRequestRef.current;
    try {
      setLoading(true);
      const data = await statistikService.getRingkasan({
        dari: activePeriod.dari,
        sampai: activePeriod.sampai,
      });
      if (requestId === statsRequestRef.current) setStats(data);
    } catch {
      if (requestId === statsRequestRef.current) {
        showToast("Gagal memuat statistik untuk periode yang dipilih", "error");
      }
    } finally {
      if (requestId === statsRequestRef.current) setLoading(false);
    }
  }, [activePeriod, showToast]);

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
    const requestId = window.setTimeout(loadStats, 0);
    return () => window.clearTimeout(requestId);
  }, [loadStats]);

  useEffect(() => {
    if (!canManageReports) return undefined;
    const requestId = window.setTimeout(loadRiwayat, 0);
    return () => window.clearTimeout(requestId);
  }, [canManageReports, loadRiwayat]);

  const applyPeriod = useCallback((period, mode = "range") => {
    if (!isPeriodValid(period)) {
      showToast("Tanggal akhir harus sama dengan atau setelah tanggal mulai", "error");
      return;
    }
    setPeriodMode(mode);
    setDraftPeriod(period);
    setActivePeriod(period);
  }, [showToast]);

  const handleMonthChange = (value) => {
    const bounds = getMonthBounds(value);
    setSelectedMonth(value);
    if (bounds) applyPeriod(bounds, "month");
  };

  const handlePeriodModeChange = (mode) => {
    if (mode === "month") {
      const bounds = getMonthBounds(selectedMonth);
      if (bounds) applyPeriod(bounds, "month");
      return;
    }
    setPeriodMode("range");
    setDraftPeriod(activePeriod);
  };

  const handleQuickPeriod = (kind) => {
    if (kind === "current-month") {
      const month = toMonthInputValue(new Date());
      setSelectedMonth(month);
      applyPeriod(getMonthBounds(month), "month");
      return;
    }
    if (kind === "previous-month") {
      const date = new Date();
      date.setMonth(date.getMonth() - 1);
      const month = toMonthInputValue(date);
      setSelectedMonth(month);
      applyPeriod(getMonthBounds(month), "month");
      return;
    }
    if (kind === "three-months") {
      applyPeriod(getMonthsRange(3));
      return;
    }
    applyPeriod(getYearRange());
  };

  const handleApplyCustomPeriod = () => {
    applyPeriod(draftPeriod);
  };

  const handleGenerate = async () => {
    if (!isPeriodValid(activePeriod)) {
      showToast("Pilih periode laporan yang valid terlebih dahulu", "error");
      return;
    }

    try {
      setGenerating(true);
      await laporanService.generate({
        tipe,
        periodeStart: activePeriod.dari,
        periodeEnd: activePeriod.sampai,
      });
      showToast("Laporan PDF berhasil dibuat", "success");
      await loadRiwayat();
    } catch {
      showToast("Gagal membuat laporan", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id) => {
    try {
      const data = await laporanService.download(id);
      const blob = new Blob([data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `laporan-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Gagal mengunduh laporan", "error");
    }
  };

  if (!canSeeStats) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <p>Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    );
  }

  const responsePeriod = stats?.period || activePeriod;
  const summary = stats?.summary || {};
  const byStatus = stats?.byStatus || { total: 0, tersedia: 0, terjual: 0, tersewa: 0, negosiasi: 0 };
  const currentStock = stats?.currentStock || { total: 0, tersedia: 0, terjual: 0, tersewa: 0, negosiasi: 0 };
  const transactionTypes = normalizeRows(stats?.byJenis, "jenis", TRANSACTION_LABELS);
  const propertyTypes = normalizeRows(stats?.byTipe, "kategori", TYPE_LABELS);
  const listingOffers = normalizeRows(stats?.byPenawaran, "jenis_penawaran", OFFER_LABELS);
  const marketingRows = (stats?.byMarketing || []).map((row) => ({ ...row, jumlah: number(row.jumlah) }));
  const trend = (stats?.trenBulan || []).map((row) => ({
    ...row,
    total_transaksi: number(row.total_transaksi),
    terjual: number(row.terjual),
    tersewa: number(row.tersewa),
    total_komisi: number(row.total_komisi),
  }));
  const selectedReport = REPORT_TYPE_META[tipe] || REPORT_TYPE_META.penjualan;
  const rangeCaption = formatPeriod(responsePeriod);
  const trendInterval = responsePeriod?.granularity === "harian"
    ? Math.max(0, Math.ceil(trend.length / 8) - 1)
    : 0;
  const maxMarketing = Math.max(...marketingRows.map((row) => row.jumlah), 1);

  const statCards = [
    {
      label: "Transaksi",
      value: formatNumber(summary.total_transaksi),
      note: "pada periode aktif",
      Icon: HiOutlineChartBar,
      tone: "red",
    },
    {
      label: "Nilai transaksi",
      value: formatCurrency(summary.nilai_transaksi),
      note: "akumulasi harga aktual",
      Icon: HiTrendingUp,
      tone: "green",
    },
    {
      label: "Komisi tercatat",
      value: formatCurrency(summary.total_komisi),
      note: "akumulasi periode",
      Icon: HiOutlineCurrencyDollar,
      tone: "amber",
    },
    {
      label: "Listing terdaftar",
      value: formatNumber(summary.listing_baru),
      note: "masuk pada periode aktif",
      Icon: HiOutlineChartPie,
      tone: "blue",
    },
  ];

  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-red-900">Statistik & Laporan</h1>
          <span className="rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">Data operasional</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Pantau transaksi dan listing pada waktu yang Anda pilih, lalu buat laporan dengan periode yang sama.</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/90 via-white to-white shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-red-700">Filter waktu</p>
            <h2 className="mt-1 text-base font-bold text-red-950">Periode analitik & laporan</h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">Semua kartu, diagram, dan PDF memakai periode aktif ini.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => handleQuickPeriod("current-month")} className="btn btn-xs rounded-lg border-red-100 bg-white text-red-800 hover:border-red-200 hover:bg-red-50">Bulan ini</button>
            <button type="button" onClick={() => handleQuickPeriod("previous-month")} className="btn btn-xs rounded-lg border-red-100 bg-white text-red-800 hover:border-red-200 hover:bg-red-50">Bulan lalu</button>
            <button type="button" onClick={() => handleQuickPeriod("three-months")} className="btn btn-xs rounded-lg border-red-100 bg-white text-red-800 hover:border-red-200 hover:bg-red-50">3 bulan</button>
            <button type="button" onClick={() => handleQuickPeriod("year")} className="btn btn-xs rounded-lg border-red-100 bg-white text-red-800 hover:border-red-200 hover:bg-red-50">Tahun ini</button>
          </div>
        </div>

        <div className="border-t border-red-100 bg-white/70 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
              <label className="form-control">
                <span className="mb-1.5 text-xs font-semibold text-gray-600">Tampilan waktu</span>
                <select
                  className="select select-bordered select-sm rounded-xl"
                  value={periodMode}
                  onChange={(event) => handlePeriodModeChange(event.target.value)}
                >
                  <option value="month">Pilih bulan</option>
                  <option value="range">Rentang tanggal</option>
                </select>
              </label>

              {periodMode === "month" ? (
                <label className="form-control">
                  <span className="mb-1.5 text-xs font-semibold text-gray-600">Bulan statistik</span>
                  <input
                    type="month"
                    className="input input-bordered input-sm rounded-xl"
                    value={selectedMonth}
                    onChange={(event) => handleMonthChange(event.target.value)}
                  />
                </label>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="form-control">
                    <span className="mb-1.5 text-xs font-semibold text-gray-600">Dari tanggal</span>
                    <input
                      type="date"
                      className="input input-bordered input-sm rounded-xl"
                      value={draftPeriod.dari}
                      onChange={(event) => setDraftPeriod((current) => ({ ...current, dari: event.target.value }))}
                    />
                  </label>
                  <label className="form-control">
                    <span className="mb-1.5 text-xs font-semibold text-gray-600">Sampai tanggal</span>
                    <input
                      type="date"
                      className="input input-bordered input-sm rounded-xl"
                      value={draftPeriod.sampai}
                      onChange={(event) => setDraftPeriod((current) => ({ ...current, sampai: event.target.value }))}
                    />
                  </label>
                </div>
              )}
            </div>

            {periodMode === "range" ? (
              <button
                type="button"
                disabled={!validDraftPeriod}
                onClick={handleApplyCustomPeriod}
                className="btn btn-sm rounded-xl border-0 bg-red-800 text-white shadow-sm hover:bg-red-900"
              >
                Terapkan periode
              </button>
            ) : (
              <button
                type="button"
                onClick={loadStats}
                disabled={loading}
                className="btn btn-sm rounded-xl border border-red-100 bg-white text-red-800 hover:bg-red-50"
              >
                {loading ? <span className="loading loading-spinner loading-xs" /> : <HiOutlineRefresh size={15} />}
                Perbarui
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-red-100 bg-red-50/65 px-3 py-2 text-xs">
            <span className="font-bold text-red-900">Periode aktif</span>
            <span className="font-semibold text-red-700">{rangeCaption}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">{responsePeriod?.granularity === "harian" ? "Tren ditampilkan per hari" : "Tren ditampilkan per bulan"}</span>
          </div>
        </div>
      </section>

      {loading && !stats ? (
        <div className="flex h-64 items-center justify-center">
          <span className="loading loading-spinner loading-lg text-red-800" />
        </div>
      ) : (
        <>
          <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
            {statCards.map((card) => <StatCard key={card.label} {...card} />)}
          </div>

          <section className="grid gap-3 rounded-2xl border border-red-50 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">Penjualan</p>
              <p className="mt-1 text-lg font-bold text-red-800">{formatNumber(summary.total_terjual)} <span className="text-xs font-medium text-gray-400">transaksi</span></p>
            </div>
            <div className="sm:border-l sm:border-red-50 sm:pl-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">Penyewaan</p>
              <p className="mt-1 text-lg font-bold text-blue-700">{formatNumber(summary.total_tersewa)} <span className="text-xs font-medium text-gray-400">transaksi</span></p>
            </div>
            <div className="lg:border-l lg:border-red-50 lg:pl-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">Rata-rata nilai</p>
              <p className="mt-1 truncate text-lg font-bold text-gray-700" title={formatCurrency(summary.rata_rata_nilai)}>{formatCurrency(summary.rata_rata_nilai)}</p>
            </div>
            <div className="lg:border-l lg:border-red-50 lg:pl-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">Properti ditransaksikan</p>
              <p className="mt-1 text-lg font-bold text-gray-700">{formatNumber(summary.properti_tertransaksi)} <span className="text-xs font-medium text-gray-400">unit unik</span></p>
            </div>
          </section>

          <section className="card border border-red-50 bg-base-100 shadow-sm">
            <div className="card-body p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-red-900">Aktivitas transaksi</h3>
                  <p className="mt-0.5 text-xs text-gray-400">Perbandingan penjualan dan penyewaan selama {rangeCaption}.</p>
                </div>
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">{responsePeriod?.granularity === "harian" ? "Harian" : "Bulanan"}</span>
              </div>
              {trend.some((item) => item.total_transaksi > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid vertical={false} stroke="#f6e7e8" />
                    <XAxis dataKey="label" interval={trendInterval} minTickGap={10} tick={{ fontSize: 11, fill: "#8a7073" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8a7073" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "#fff5f5" }}
                      labelStyle={{ color: "#650000", fontWeight: 700 }}
                      contentStyle={{ borderRadius: 12, borderColor: "#f0d6d9", boxShadow: "0 8px 24px rgba(122, 0, 0, .08)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                    <Bar dataKey="terjual" fill="#7A0000" name="Penjualan" radius={[5, 5, 0, 0]} maxBarSize={38} />
                    <Bar dataKey="tersewa" fill="#2563eb" name="Penyewaan" radius={[5, 5, 0, 0]} maxBarSize={38} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart message="Belum ada transaksi yang tercatat pada periode ini." />}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className="card border border-red-50 bg-base-100 shadow-sm">
              <div className="card-body p-4 sm:p-5">
                <div className="mb-3">
                  <h3 className="font-bold text-red-900">Komposisi transaksi</h3>
                  <p className="mt-0.5 text-xs text-gray-400">Bagian penjualan dan penyewaan dalam periode aktif.</p>
                </div>
                {transactionTypes.length ? (
                  <ResponsiveContainer width="100%" height={225}>
                    <PieChart>
                      <Pie data={transactionTypes} dataKey="jumlah" nameKey="label" cx="50%" cy="48%" innerRadius={48} outerRadius={82} paddingAngle={3}>
                        {transactionTypes.map((item, index) => <Cell key={`${item.label}-${index}`} fill={item.jenis === "terjual" ? "#7A0000" : "#2563eb"} />)}
                      </Pie>
                      <Tooltip formatter={(value) => `${formatNumber(value)} transaksi`} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </div>
            </section>

            <section className="card border border-red-50 bg-base-100 shadow-sm">
              <div className="card-body p-4 sm:p-5">
                <div className="mb-3">
                  <h3 className="font-bold text-red-900">Transaksi per tipe properti</h3>
                  <p className="mt-0.5 text-xs text-gray-400">Jenis properti yang paling sering bertransaksi pada periode aktif.</p>
                </div>
                {propertyTypes.length ? (
                  <ResponsiveContainer width="100%" height={225}>
                    <BarChart data={propertyTypes.slice(0, 6)} layout="vertical" margin={{ top: 2, right: 18, bottom: 0, left: 18 }}>
                      <CartesianGrid horizontal={false} stroke="#f6e7e8" />
                      <XAxis type="number" allowDecimals={false} hide />
                      <YAxis type="category" dataKey="label" width={96} tick={{ fontSize: 11, fill: "#725f61" }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value) => `${formatNumber(value)} transaksi`} cursor={{ fill: "#fff5f5" }} />
                      <Bar dataKey="jumlah" fill="#9f1239" radius={[0, 5, 5, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </div>
            </section>

            <section className="card border border-red-50 bg-base-100 shadow-sm">
              <div className="card-body p-4 sm:p-5">
                <div className="mb-3">
                  <h3 className="font-bold text-red-900">Akumulasi komisi</h3>
                  <p className="mt-0.5 text-xs text-gray-400">Komisi yang tercatat mengikuti aktivitas transaksi pada periode aktif.</p>
                </div>
                {trend.some((item) => item.total_komisi > 0) ? (
                  <ResponsiveContainer width="100%" height={225}>
                    <AreaChart data={trend} margin={{ top: 6, right: 6, bottom: 0, left: -12 }}>
                      <defs>
                        <linearGradient id="commissionArea" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#7A0000" stopOpacity={0.34} />
                          <stop offset="100%" stopColor="#7A0000" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#f6e7e8" />
                      <XAxis dataKey="label" interval={trendInterval} minTickGap={10} tick={{ fontSize: 11, fill: "#8a7073" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(value) => `${Math.round(number(value) / 1000000)} jt`} tick={{ fontSize: 10, fill: "#8a7073" }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 12, borderColor: "#f0d6d9" }} />
                      <Area type="monotone" dataKey="total_komisi" stroke="#7A0000" strokeWidth={2.5} fill="url(#commissionArea)" name="Komisi" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <EmptyChart message="Belum ada komisi yang tercatat pada periode ini." />}
              </div>
            </section>

            <section className="card border border-red-50 bg-base-100 shadow-sm">
              <div className="card-body p-4 sm:p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-red-900">Kontributor transaksi</h3>
                    <p className="mt-0.5 text-xs text-gray-400">Pengguna yang mencatat transaksi terbanyak pada periode aktif.</p>
                  </div>
                  <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700">Top {Math.min(marketingRows.length, 5)}</span>
                </div>
                {marketingRows.length ? (
                  <div className="space-y-3">
                    {marketingRows.slice(0, 5).map((row, index) => (
                      <div key={`${row.nama}-${index}`}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                          <span className="truncate font-semibold text-gray-700">{row.nama}</span>
                          <span className="shrink-0 font-bold text-red-800">{formatNumber(row.jumlah)} transaksi</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-red-50">
                          <div className="h-full rounded-full bg-gradient-to-r from-red-900 to-red-600 transition-all duration-500" style={{ width: `${Math.max((row.jumlah / maxMarketing) * 100, 8)}%` }} />
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400">Nilai: {formatCurrency(row.nilai_transaksi)}</p>
                      </div>
                    ))}
                  </div>
                ) : <EmptyChart message="Belum ada transaksi yang dapat dikelompokkan berdasarkan pencatat." />}
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-red-50 bg-red-50/55 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <h3 className="font-bold text-red-900">Kondisi listing</h3>
                <p className="mt-0.5 text-xs text-gray-500">Listing yang terdaftar pada periode aktif dan snapshot stok sistem saat ini.</p>
              </div>
              <span className="text-xs font-semibold text-red-700">{formatNumber(byStatus.total)} listing pada periode</span>
            </div>
            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.1fr_.9fr]">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Tersedia", byStatus.tersedia, "text-emerald-700 bg-emerald-50 border-emerald-100"],
                  ["Negosiasi", byStatus.negosiasi, "text-amber-700 bg-amber-50 border-amber-100"],
                  ["Terjual", byStatus.terjual, "text-red-700 bg-red-50 border-red-100"],
                  ["Tersewa", byStatus.tersewa, "text-blue-700 bg-blue-50 border-blue-100"],
                ].map(([label, value, classes]) => (
                  <div key={label} className={`rounded-xl border p-3 ${classes}`}>
                    <p className="text-lg font-extrabold">{formatNumber(value)}</p>
                    <p className="mt-0.5 text-[11px] font-semibold opacity-75">{label}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-red-100 bg-white p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">Snapshot stok saat ini</p>
                <p className="mt-1 text-xl font-bold text-red-900">{formatNumber(currentStock.total)} <span className="text-xs font-medium text-gray-400">listing tersimpan</span></p>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span><b className="text-emerald-700">{formatNumber(currentStock.tersedia)}</b> tersedia</span>
                  <span><b className="text-amber-700">{formatNumber(currentStock.negosiasi)}</b> negosiasi</span>
                  <span><b className="text-red-700">{formatNumber(currentStock.terjual)}</b> terjual</span>
                  <span><b className="text-blue-700">{formatNumber(currentStock.tersewa)}</b> tersewa</span>
                </div>
                {listingOffers.length > 0 && (
                  <p className="mt-3 border-t border-red-50 pt-3 text-xs text-gray-500">Penawaran periode ini: {listingOffers.map((item) => `${item.label} (${formatNumber(item.jumlah)})`).join(" • ")}</p>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {canManageReports && (
        <section className="overflow-hidden rounded-2xl border border-red-100 bg-base-100 shadow-sm">
          <div className="card-body p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-bold text-red-900">Generate Laporan PDF</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">Pilih jenis laporan; periode akan mengikuti filter analitik aktif agar angka pada layar dan PDF konsisten.</p>
              </div>
              <span className="shrink-0 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">{rangeCaption}</span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <label className="form-control">
                <span className="mb-1.5 text-xs font-semibold text-gray-600">Jenis laporan</span>
                <select className="select select-bordered select-sm rounded-xl" value={tipe} onChange={(event) => setTipe(event.target.value)}>
                  <option value="penjualan">Laporan Penjualan</option>
                  <option value="stok">Laporan Stok Properti</option>
                  <option value="statistik">Laporan Statistik</option>
                </select>
              </label>
              <button onClick={handleGenerate} disabled={generating || !isPeriodValid(activePeriod)} className="btn btn-sm rounded-xl border-0 bg-red-800 text-white shadow-sm hover:bg-red-900">
                {generating ? <><span className="loading loading-spinner loading-xs" /> Membuat...</> : <><HiOutlineDocumentReport size={16} /> Generate PDF</>}
              </button>
            </div>

            <div className="mt-3 rounded-xl border border-red-100 bg-red-50/60 p-3">
              <p className="text-xs font-bold text-red-900">{selectedReport.label}</p>
              <p className="mt-0.5 text-xs text-gray-600">{selectedReport.description}</p>
            </div>
          </div>
        </section>
      )}

      {canManageReports && (
        <section className="card border border-red-50 bg-base-100 shadow-sm">
          <div className="card-body p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-red-900">Riwayat Laporan</h3>
                <p className="mt-0.5 text-xs text-gray-400">Dokumen yang telah dibuat dan siap diunduh kembali.</p>
              </div>
              <button type="button" onClick={loadRiwayat} disabled={loadingRiwayat} className="btn btn-xs rounded-lg btn-ghost text-gray-500 hover:bg-red-50 hover:text-red-800">
                {loadingRiwayat ? <span className="loading loading-spinner loading-xs" /> : <HiOutlineRefresh size={14} />}
                Refresh
              </button>
            </div>

            {loadingRiwayat ? (
              <div className="flex justify-center py-8"><span className="loading loading-spinner loading-sm text-red-800" /></div>
            ) : riwayatLaporan.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Belum ada laporan yang dibuat.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm min-w-[44rem]">
                  <thead>
                    <tr className="border-b border-red-50 text-xs text-gray-500">
                      <th>Judul laporan</th>
                      <th>Tipe</th>
                      <th>Periode</th>
                      <th>Dibuat</th>
                      <th aria-label="Aksi" />
                    </tr>
                  </thead>
                  <tbody>
                    {riwayatLaporan.map((report) => {
                      const reportId = report.id || report.id_laporan;
                      const meta = REPORT_TYPE_META[report.tipe];
                      return (
                        <tr key={reportId} className="border-b border-red-50 transition-colors hover:bg-red-50/30">
                          <td className="font-medium text-gray-700">{report.judul}</td>
                          <td><span className={`badge badge-sm text-white ${meta?.badge || "badge-ghost"}`}>{meta?.shortLabel || report.tipe || "Laporan"}</span></td>
                          <td className="text-xs text-gray-500">{formatPeriod({ dari: report.periode_mulai || report.periode_start, sampai: report.periode_selesai || report.periode_end })}</td>
                          <td className="text-xs text-gray-500">{formatDateTime(report.created_at)}</td>
                          <td><button type="button" onClick={() => handleDownload(reportId)} className="btn btn-xs rounded-lg btn-ghost gap-1 text-red-700 hover:bg-red-50"><HiOutlineDownload size={13} /> Unduh</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
