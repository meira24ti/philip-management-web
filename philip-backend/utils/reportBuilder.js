const STATUS_LABELS = {
  tersedia: "Tersedia",
  negosiasi: "Dalam Negosiasi",
  terjual: "Terjual",
  tersewa: "Tersewa",
};

const OFFER_LABELS = {
  dijual: "Dijual",
  disewa: "Disewakan",
  dijual_dan_disewa: "Dijual & Disewakan",
};

const TRANSACTION_LABELS = {
  terjual: "Penjualan",
  tersewa: "Penyewaan",
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
};

const CHART_COLORS = ["#7A0000", "#9F1239", "#BE123C", "#DC2626", "#E11D48", "#FB7185", "#B45309", "#1D4ED8"];

function escapeHtml(value) {
  return String(value === undefined || value === null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value) {
  return toNumber(value).toLocaleString("id-ID");
}

function formatCurrency(value) {
  return "Rp " + formatNumber(value);
}

function formatPercent(value) {
  return toNumber(value).toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }) + "%";
}

function formatDate(value) {
  if (!value) return "-";
  const date = value instanceof Date
    ? value
    : new Date(String(value).slice(0, 10) + "T00:00:00");
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatMonth(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return String(value || "-");
  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    year: "2-digit",
  }).format(new Date(Number(match[1]), Number(match[2]) - 1, 1));
}

function labelFor(map, value, fallback) {
  const key = String(value || "").trim().toLowerCase();
  if (map[key]) return map[key];
  if (!key) return fallback || "-";
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
}

function percentage(value, total) {
  if (!toNumber(total)) return 0;
  return (toNumber(value) / toNumber(total)) * 100;
}

function truncate(value, maxLength) {
  const text = String(value || "");
  return text.length > maxLength ? text.slice(0, Math.max(0, maxLength - 1)) + "…" : text;
}

function createMonthRange(start, end) {
  const startDate = new Date(String(start).slice(0, 10) + "T00:00:00");
  const endDate = new Date(String(end).slice(0, 10) + "T00:00:00");
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return [];

  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const last = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const months = [];
  while (cursor <= last && months.length < 120) {
    months.push(String(cursor.getFullYear()) + "-" + String(cursor.getMonth() + 1).padStart(2, "0"));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

function fillMonthlyTrend(rows, start, end) {
  const indexed = new Map((rows || []).map(function (row) {
    return [String(row.bulan || ""), row];
  }));
  const periodMonths = createMonthRange(start, end);
  const monthKeys = periodMonths.length ? periodMonths : Array.from(indexed.keys()).sort();

  return monthKeys.map(function (bulan) {
    const source = indexed.get(bulan) || {};
    return {
      bulan: bulan,
      label: formatMonth(bulan),
      total_transaksi: toNumber(source.total_transaksi),
      terjual: toNumber(source.terjual),
      tersewa: toNumber(source.tersewa),
      total_komisi: toNumber(source.total_komisi),
      nilai_transaksi: toNumber(source.nilai_transaksi || source.total_nilai),
    };
  });
}

function bucketRows(records, getLabel, getValue) {
  const buckets = new Map();
  (records || []).forEach(function (record) {
    const label = getLabel(record) || "Lainnya";
    const current = buckets.get(label) || 0;
    buckets.set(label, current + toNumber(getValue ? getValue(record) : 1));
  });

  return Array.from(buckets.entries())
    .map(function (entry) { return { label: entry[0], jumlah: entry[1] }; })
    .sort(function (a, b) { return b.jumlah - a.jumlah || a.label.localeCompare(b.label, "id"); });
}

function summaryFromTransactions(transaksi) {
  const list = Array.isArray(transaksi) ? transaksi : [];
  const totalTerjual = list.filter(function (item) { return item.jenis === "terjual"; }).length;
  const totalTersewa = list.filter(function (item) { return item.jenis === "tersewa"; }).length;
  const nilai = list.reduce(function (sum, item) { return sum + toNumber(item.harga_aktual); }, 0);
  const komisi = list.reduce(function (sum, item) { return sum + toNumber(item.komisi_nominal); }, 0);

  return {
    total_transaksi: list.length,
    total_terjual: totalTerjual,
    total_tersewa: totalTersewa,
    nilai_transaksi: nilai,
    total_komisi: komisi,
    rata_rata_nilai: list.length ? nilai / list.length : 0,
  };
}

function trendFromTransactions(transaksi, start, end) {
  const records = (transaksi || []).map(function (item) {
    const rawDate = item.tanggal_transaksi instanceof Date
      ? item.tanggal_transaksi
      : new Date(String(item.tanggal_transaksi || "").slice(0, 10) + "T00:00:00");
    if (Number.isNaN(rawDate.getTime())) return null;
    return {
      bulan: String(rawDate.getFullYear()) + "-" + String(rawDate.getMonth() + 1).padStart(2, "0"),
      jenis: item.jenis,
      harga_aktual: toNumber(item.harga_aktual),
      komisi_nominal: toNumber(item.komisi_nominal),
    };
  }).filter(Boolean);

  const grouped = new Map();
  records.forEach(function (item) {
    const current = grouped.get(item.bulan) || {
      bulan: item.bulan,
      total_transaksi: 0,
      terjual: 0,
      tersewa: 0,
      total_komisi: 0,
      nilai_transaksi: 0,
    };
    current.total_transaksi += 1;
    current.terjual += item.jenis === "terjual" ? 1 : 0;
    current.tersewa += item.jenis === "tersewa" ? 1 : 0;
    current.total_komisi += item.komisi_nominal;
    current.nilai_transaksi += item.harga_aktual;
    grouped.set(item.bulan, current);
  });

  return fillMonthlyTrend(Array.from(grouped.values()), start, end);
}

function normalizeStatus(byStatus) {
  const source = byStatus || {};
  return {
    total: toNumber(source.total || source.total_listing),
    tersedia: toNumber(source.tersedia),
    negosiasi: toNumber(source.negosiasi),
    terjual: toNumber(source.terjual),
    tersewa: toNumber(source.tersewa),
  };
}

function normalizeSimpleRows(rows, labels) {
  return (rows || [])
    .map(function (row) {
      const rawLabel = row.label || row.nama || row.kategori || row.jenis_penawaran || row.jenis || "lainnya";
      return {
        label: labelFor(labels || {}, rawLabel, "Lainnya"),
        jumlah: toNumber(row.jumlah),
      };
    })
    .filter(function (row) { return row.jumlah > 0; })
    .sort(function (a, b) { return b.jumlah - a.jumlah || a.label.localeCompare(b.label, "id"); });
}

function enrichReportData(tipe, originalData, dari, sampai) {
  const data = Object.assign({}, originalData || {});

  if (tipe === "penjualan") {
    const transaksi = Array.isArray(data.transaksi) ? data.transaksi : [];
    data.summary = summaryFromTransactions(transaksi);
    data.trenBulan = trendFromTransactions(transaksi, dari, sampai);
    data.byJenis = bucketRows(transaksi, function (item) {
      return labelFor(TRANSACTION_LABELS, item.jenis, "Lainnya");
    });
    data.byTipe = bucketRows(transaksi, function (item) {
      return labelFor(TYPE_LABELS, item.kategori, "Lainnya");
    });
    data.byMarketing = bucketRows(transaksi, function (item) {
      return item.dicatat_oleh_nama || "Belum diketahui";
    });
    data.byKota = bucketRows(transaksi, function (item) {
      return item.kota || "Belum diketahui";
    });
    return data;
  }

  data.byStatus = normalizeStatus(data.byStatus);
  data.byTipe = normalizeSimpleRows(data.byTipe, TYPE_LABELS);
  data.byPenawaran = normalizeSimpleRows(data.byPenawaran, OFFER_LABELS);

  if (tipe === "statistik") {
    data.summary = Object.assign({
      total_transaksi: 0,
      total_terjual: 0,
      total_tersewa: 0,
      nilai_transaksi: 0,
      total_komisi: 0,
    }, data.summary || {});
    data.summary.total_transaksi = toNumber(data.summary.total_transaksi);
    data.summary.total_terjual = toNumber(data.summary.total_terjual);
    data.summary.total_tersewa = toNumber(data.summary.total_tersewa);
    data.summary.nilai_transaksi = toNumber(data.summary.nilai_transaksi);
    data.summary.total_komisi = toNumber(data.summary.total_komisi);
    data.trenBulan = fillMonthlyTrend(data.trenBulan, dari, sampai);
    data.byJenis = normalizeSimpleRows(data.byJenis, TRANSACTION_LABELS);
    data.byMarketing = normalizeSimpleRows(data.byMarketing, {});
  }

  return data;
}

function kpiCard(item) {
  return [
    "<article class='kpi-card'>",
    "<p class='kpi-label'>", escapeHtml(item.label), "</p>",
    "<p class='kpi-value ", escapeHtml(item.tone || ""), "'>", escapeHtml(item.value), "</p>",
    item.note ? "<p class='kpi-note'>" + escapeHtml(item.note) + "</p>" : "",
    "</article>",
  ].join("");
}

function renderKpiGrid(items) {
  return "<div class='kpi-grid'>" + items.map(kpiCard).join("") + "</div>";
}

function renderEmpty(message) {
  return "<div class='empty-state'>" + escapeHtml(message) + "</div>";
}

function renderSection(title, description, content, className) {
  return [
    "<section class='report-section ", escapeHtml(className || ""), "'>",
    "<div class='section-heading'><div>",
    "<h2>", escapeHtml(title), "</h2>",
    description ? "<p>" + escapeHtml(description) + "</p>" : "",
    "</div></div>",
    content,
    "</section>",
  ].join("");
}

function renderInsightList(title, insights) {
  const list = (insights || []).filter(Boolean);
  if (!list.length) return "";
  return [
    "<aside class='insight-box'>",
    "<p class='eyebrow'>Ringkasan cepat</p>",
    "<h2>", escapeHtml(title), "</h2>",
    "<ul>", list.map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join(""), "</ul>",
    "</aside>",
  ].join("");
}

function renderHorizontalBars(title, description, items, valueFormatter) {
  const rows = (items || []).filter(function (item) { return toNumber(item.jumlah || item.value) > 0; }).slice(0, 8);
  if (!rows.length) {
    return "<article class='chart-card'><h3>" + escapeHtml(title) + "</h3>" +
      (description ? "<p class='chart-description'>" + escapeHtml(description) + "</p>" : "") +
      renderEmpty("Belum ada data untuk ditampilkan.") + "</article>";
  }

  const max = Math.max.apply(null, rows.map(function (item) { return toNumber(item.jumlah || item.value); })) || 1;
  const height = 46 + (rows.length * 34);
  const bars = rows.map(function (item, index) {
    const value = toNumber(item.jumlah || item.value);
    const y = 28 + (index * 34);
    const width = Math.max(3, Math.round((value / max) * 372));
    const color = CHART_COLORS[index % CHART_COLORS.length];
    const printable = valueFormatter ? valueFormatter(value) : formatNumber(value);
    return [
      "<text x='0' y='", y + 12, "' class='svg-label'>", escapeHtml(truncate(item.label, 24)), "</text>",
      "<rect x='184' y='", y, "' width='382' height='15' rx='7.5' class='bar-track'></rect>",
      "<rect x='184' y='", y, "' width='", width, "' height='15' rx='7.5' fill='", color, "'></rect>",
      "<text x='580' y='", y + 12, "' class='svg-value'>", escapeHtml(printable), "</text>",
    ].join("");
  }).join("");

  return [
    "<article class='chart-card'>",
    "<h3>", escapeHtml(title), "</h3>",
    description ? "<p class='chart-description'>" + escapeHtml(description) + "</p>" : "",
    "<svg class='bar-chart' viewBox='0 0 680 ", height, "' role='img' aria-label='", escapeHtml(title), "'>",
    bars,
    "</svg></article>",
  ].join("");
}

function renderDonut(title, description, items) {
  const rows = (items || []).filter(function (item) { return toNumber(item.jumlah || item.value) > 0; }).slice(0, 7);
  if (!rows.length) {
    return "<article class='chart-card'><h3>" + escapeHtml(title) + "</h3>" +
      (description ? "<p class='chart-description'>" + escapeHtml(description) + "</p>" : "") +
      renderEmpty("Belum ada data untuk ditampilkan.") + "</article>";
  }

  const total = rows.reduce(function (sum, item) { return sum + toNumber(item.jumlah || item.value); }, 0);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const rings = rows.map(function (item, index) {
    const value = toNumber(item.jumlah || item.value);
    const length = (value / total) * circumference;
    const markup = [
      "<circle cx='84' cy='84' r='", radius, "' fill='none' stroke='", CHART_COLORS[index % CHART_COLORS.length],
      "' stroke-width='22' stroke-linecap='butt' stroke-dasharray='", length, " ", circumference - length,
      "' stroke-dashoffset='", -offset, "' transform='rotate(-90 84 84)'></circle>",
    ].join("");
    offset += length;
    return markup;
  }).join("");
  const legend = rows.map(function (item, index) {
    const value = toNumber(item.jumlah || item.value);
    return [
      "<li><span class='legend-dot' style='background:", CHART_COLORS[index % CHART_COLORS.length], "'></span>",
      "<span>", escapeHtml(truncate(item.label, 26)), "</span>",
      "<strong>", escapeHtml(formatNumber(value)), " <small>(", escapeHtml(formatPercent(percentage(value, total))), ")</small></strong></li>",
    ].join("");
  }).join("");

  return [
    "<article class='chart-card'>",
    "<h3>", escapeHtml(title), "</h3>",
    description ? "<p class='chart-description'>" + escapeHtml(description) + "</p>" : "",
    "<div class='donut-layout'><svg class='donut-chart' viewBox='0 0 168 168' role='img' aria-label='", escapeHtml(title), "'>",
    "<circle cx='84' cy='84' r='", radius, "' fill='none' stroke='#F7EDEE' stroke-width='22'></circle>",
    rings,
    "<text x='84' y='80' text-anchor='middle' class='donut-total'>", escapeHtml(formatNumber(total)), "</text>",
    "<text x='84' y='98' text-anchor='middle' class='donut-caption'>unit</text>",
    "</svg><ul class='legend-list'>", legend, "</ul></div>",
    "</article>",
  ].join("");
}

function renderTrendChart(title, description, rows, series) {
  const allRows = (rows || []).slice(-12);
  if (!allRows.length || !allRows.some(function (row) {
    return (series || []).some(function (item) { return toNumber(row[item.key]) > 0; });
  })) {
    return "<article class='chart-card chart-card-full'><h3>" + escapeHtml(title) + "</h3>" +
      (description ? "<p class='chart-description'>" + escapeHtml(description) + "</p>" : "") +
      renderEmpty("Belum ada transaksi pada periode ini.") + "</article>";
  }

  const chartSeries = series || [];
  const max = Math.max.apply(null, allRows.flatMap(function (row) {
    return chartSeries.map(function (item) { return toNumber(row[item.key]); });
  })) || 1;
  const width = 720;
  const height = 274;
  const left = 44;
  const top = 26;
  const base = 202;
  const plotHeight = 150;
  const plotWidth = 652;
  const groupWidth = plotWidth / allRows.length;
  const totalBarWidth = Math.min(groupWidth - 10, chartSeries.length * 15);
  const barWidth = Math.max(4, totalBarWidth / Math.max(chartSeries.length, 1));

  const grid = [0, 1, 2, 3, 4].map(function (step) {
    const y = base - ((plotHeight / 4) * step);
    const tick = Math.round((max / 4) * step);
    return [
      "<line x1='", left, "' y1='", y, "' x2='", left + plotWidth, "' y2='", y, "' class='chart-grid-line'></line>",
      "<text x='", left - 8, "' y='", y + 4, "' text-anchor='end' class='svg-axis'>", escapeHtml(formatNumber(tick)), "</text>",
    ].join("");
  }).join("");

  const bars = allRows.map(function (row, rowIndex) {
    const xBase = left + (rowIndex * groupWidth) + ((groupWidth - totalBarWidth) / 2);
    const renderedBars = chartSeries.map(function (item, seriesIndex) {
      const value = toNumber(row[item.key]);
      const barHeight = (value / max) * plotHeight;
      return [
        "<rect x='", xBase + (seriesIndex * barWidth), "' y='", base - barHeight,
        "' width='", Math.max(3, barWidth - 2), "' height='", barHeight,
        "' rx='2' fill='", item.color, "'></rect>",
      ].join("");
    }).join("");
    return renderedBars + [
      "<text x='", left + (rowIndex * groupWidth) + (groupWidth / 2), "' y='224' text-anchor='middle' class='svg-axis'>",
      escapeHtml(truncate(row.label || formatMonth(row.bulan), 8)), "</text>",
    ].join("");
  }).join("");

  const legend = chartSeries.map(function (item) {
    return "<span><i style='background:" + item.color + "'></i>" + escapeHtml(item.label) + "</span>";
  }).join("");

  return [
    "<article class='chart-card chart-card-full'>",
    "<h3>", escapeHtml(title), "</h3>",
    description ? "<p class='chart-description'>" + escapeHtml(description) + "</p>" : "",
    "<div class='chart-legend'>", legend, "</div>",
    "<svg class='trend-chart' viewBox='0 0 ", width, " ", height, "' role='img' aria-label='", escapeHtml(title), "'>",
    grid, bars, "</svg></article>",
  ].join("");
}

function td(value, className) {
  return "<td" + (className ? " class='" + escapeHtml(className) + "'" : "") + ">" + escapeHtml(value) + "</td>";
}

function renderTable(headers, rows, emptyText, className) {
  const content = rows && rows.length
    ? rows.join("")
    : "<tr><td colspan='" + headers.length + "' class='table-empty'>" + escapeHtml(emptyText || "Belum ada data.") + "</td></tr>";
  return [
    "<div class='table-wrap ", escapeHtml(className || ""), "'>",
    "<table><thead><tr>",
    headers.map(function (header) { return "<th>" + escapeHtml(header) + "</th>"; }).join(""),
    "</tr></thead><tbody>", content, "</tbody></table></div>",
  ].join("");
}

function statusItems(status) {
  return ["tersedia", "negosiasi", "terjual", "tersewa"].map(function (key) {
    return { label: STATUS_LABELS[key], jumlah: toNumber(status[key]) };
  });
}

function topLabel(items) {
  return items && items.length ? items[0].label : null;
}

function buildPenjualanReport(data, dari, sampai) {
  const summary = data.summary || summaryFromTransactions(data.transaksi);
  const transaksi = Array.isArray(data.transaksi) ? data.transaksi : [];
  const highest = transaksi.reduce(function (current, item) {
    return !current || toNumber(item.harga_aktual) > toNumber(current.harga_aktual) ? item : current;
  }, null);
  const dominantType = topLabel(data.byTipe);
  const insights = [
    summary.total_transaksi
      ? formatNumber(summary.total_transaksi) + " transaksi dicatat dalam periode laporan."
      : "Belum ada transaksi yang tercatat dalam periode laporan.",
    summary.total_terjual || summary.total_tersewa
      ? "Komposisi transaksi: " + formatNumber(summary.total_terjual) + " penjualan dan " + formatNumber(summary.total_tersewa) + " penyewaan."
      : null,
    dominantType ? "Tipe properti dengan transaksi terbanyak adalah " + dominantType + "." : null,
    highest ? "Nilai transaksi tertinggi: " + formatCurrency(highest.harga_aktual) + "." : null,
  ];
  const detailRows = transaksi.map(function (item) {
    const propertyName = [item.nama_jalan, item.kota].filter(Boolean).join(", ") || item.no_folder || "-";
    return "<tr>" +
      td(propertyName) +
      td(labelFor(TYPE_LABELS, item.kategori, "-")) +
      td(labelFor(OFFER_LABELS, item.jenis_penawaran, "-")) +
      td(labelFor(TRANSACTION_LABELS, item.jenis, "-")) +
      td(formatDate(item.tanggal_transaksi)) +
      td(formatCurrency(item.harga_aktual), "number") +
      td(formatPercent(item.komisi_persen || 0), "number") +
      td(formatCurrency(item.komisi_nominal), "number") +
      "</tr>";
  });

  return [
    renderKpiGrid([
      { label: "Total transaksi", value: formatNumber(summary.total_transaksi), note: "pada periode laporan" },
      { label: "Penjualan", value: formatNumber(summary.total_terjual), tone: "tone-success", note: "transaksi terjual" },
      { label: "Penyewaan", value: formatNumber(summary.total_tersewa), tone: "tone-info", note: "transaksi sewa" },
      { label: "Nilai transaksi", value: formatCurrency(summary.nilai_transaksi), tone: "tone-primary", note: "akumulasi harga aktual" },
      { label: "Komisi perusahaan", value: formatCurrency(summary.total_komisi), tone: "tone-success", note: "akumulasi komisi" },
      { label: "Rata-rata transaksi", value: formatCurrency(summary.rata_rata_nilai), note: "per transaksi" },
    ]),
    renderInsightList("Performa transaksi", insights),
    "<div class='chart-grid'>",
    renderDonut("Komposisi transaksi", "Perbandingan penjualan dan penyewaan.", data.byJenis),
    renderHorizontalBars("Kontribusi tipe properti", "Berdasarkan jumlah transaksi.", data.byTipe, function (value) { return formatNumber(value) + " transaksi"; }),
    "</div>",
    renderSection(
      "Tren transaksi bulanan",
      "Jumlah penjualan dan penyewaan pada setiap bulan dalam periode yang dipilih.",
      renderTrendChart("Aktivitas transaksi", "", data.trenBulan, [
        { key: "terjual", label: "Penjualan", color: "#7A0000" },
        { key: "tersewa", label: "Penyewaan", color: "#2563EB" },
      ])
    ),
    renderSection(
      "Kinerja pencatatan",
      "Jumlah transaksi yang dicatat oleh masing-masing pengguna.",
      renderHorizontalBars("Kontributor transaksi", "", data.byMarketing, function (value) { return formatNumber(value) + " transaksi"; })
    ),
    renderSection(
      "Detail transaksi",
      "Daftar lengkap transaksi yang termasuk dalam periode laporan.",
      renderTable(
        ["Properti", "Tipe", "Penawaran", "Transaksi", "Tanggal", "Harga aktual", "Komisi", "Nominal komisi"],
        detailRows,
        "Belum ada transaksi dalam periode ini.",
        "transaction-table"
      ),
      "page-break-before"
    ),
  ].join("");
}

function buildStokReport(data, dari, sampai) {
  const status = data.byStatus || normalizeStatus({});
  const total = status.total;
  const items = statusItems(status);
  const leadingType = topLabel(data.byTipe);
  const leadingOffer = topLabel(data.byPenawaran);
  const insights = [
    total ? "Terdapat " + formatNumber(total) + " listing yang terdaftar pada periode laporan." : "Belum ada listing yang terdaftar pada periode laporan.",
    total ? formatNumber(status.tersedia) + " unit (" + formatPercent(percentage(status.tersedia, total)) + ") masih tersedia untuk ditawarkan." : null,
    leadingType ? "Komposisi stok terbesar berasal dari tipe " + leadingType + "." : null,
    leadingOffer ? "Jenis penawaran terbanyak adalah " + leadingOffer + "." : null,
  ];
  const statusRows = items.map(function (item) {
    return "<tr>" + td(item.label) + td(formatNumber(item.jumlah), "number") + td(formatPercent(percentage(item.jumlah, total)), "number") + "</tr>";
  });
  const typeRows = (data.byTipe || []).map(function (item) {
    return "<tr>" + td(item.label) + td(formatNumber(item.jumlah), "number") + td(formatPercent(percentage(item.jumlah, total)), "number") + "</tr>";
  });
  const offerRows = (data.byPenawaran || []).map(function (item) {
    return "<tr>" + td(item.label) + td(formatNumber(item.jumlah), "number") + td(formatPercent(percentage(item.jumlah, total)), "number") + "</tr>";
  });

  return [
    renderKpiGrid([
      { label: "Total listing", value: formatNumber(total), note: "terdaftar pada periode" },
      { label: "Tersedia", value: formatNumber(status.tersedia), tone: "tone-success", note: "siap ditawarkan" },
      { label: "Dalam negosiasi", value: formatNumber(status.negosiasi), tone: "tone-warning", note: "menunggu keputusan" },
      { label: "Terjual", value: formatNumber(status.terjual), tone: "tone-primary", note: "status unit" },
      { label: "Tersewa", value: formatNumber(status.tersewa), tone: "tone-info", note: "status unit" },
    ]),
    renderInsightList("Kondisi stok", insights),
    "<div class='chart-grid'>",
    renderDonut("Status unit", "Status terkini untuk listing yang terdaftar pada periode laporan.", items),
    renderDonut("Jenis penawaran", "Pilihan penawaran pada listing yang terdaftar dalam periode laporan.", data.byPenawaran),
    "</div>",
    renderSection(
      "Komposisi stok",
      "Distribusi listing yang terdaftar pada periode laporan berdasarkan tipe properti.",
      renderHorizontalBars("Distribusi tipe properti", "", data.byTipe, function (value) { return formatNumber(value) + " unit"; })
    ),
    renderSection(
      "Ringkasan status unit",
      "Status mencerminkan kondisi terkini dari listing yang masuk pada periode laporan.",
      renderTable(["Status unit", "Jumlah", "Proporsi"], statusRows, "Belum ada data status unit."),
      "page-break-before"
    ),
    renderSection(
      "Rincian tipe dan penawaran",
      "Perincian membantu menentukan fokus pemasaran untuk listing yang terdaftar pada periode laporan.",
      "<div class='two-tables'>" +
        "<div><h3 class='table-title'>Menurut tipe properti</h3>" +
        renderTable(["Tipe", "Jumlah", "Proporsi"], typeRows, "Belum ada tipe properti.") + "</div>" +
        "<div><h3 class='table-title'>Menurut jenis penawaran</h3>" +
        renderTable(["Penawaran", "Jumlah", "Proporsi"], offerRows, "Belum ada jenis penawaran.") + "</div>" +
      "</div>"
    ),
  ].join("");
}

function buildStatistikReport(data, dari, sampai) {
  const status = data.byStatus || normalizeStatus({});
  const summary = data.summary || {};
  const totalListing = status.total;
  const totalTransaction = toNumber(summary.total_transaksi);
  const leadingType = topLabel(data.byTipe);
  const leadingMarketing = topLabel(data.byMarketing);
  const insights = [
    totalListing
      ? formatNumber(status.tersedia) + " dari " + formatNumber(totalListing) + " listing masih tersedia."
      : "Belum ada listing yang terdaftar pada periode laporan.",
    totalTransaction
      ? formatNumber(totalTransaction) + " transaksi menghasilkan nilai " + formatCurrency(summary.nilai_transaksi) + "."
      : "Belum ada transaksi pada periode yang dipilih.",
    toNumber(summary.total_komisi)
      ? "Total komisi yang tercatat adalah " + formatCurrency(summary.total_komisi) + "."
      : null,
    leadingType ? "Tipe listing terbesar pada periode laporan adalah " + leadingType + "." : null,
    leadingMarketing ? "Pencatat transaksi terbanyak adalah " + leadingMarketing + "." : null,
  ];
  const monthlyRows = (data.trenBulan || []).map(function (item) {
    return "<tr>" +
      td(item.label || formatMonth(item.bulan)) +
      td(formatNumber(item.total_transaksi), "number") +
      td(formatCurrency(item.total_komisi), "number") +
      "</tr>";
  });
  const statusRows = statusItems(status).map(function (item) {
    return "<tr>" + td(item.label) + td(formatNumber(item.jumlah), "number") + td(formatPercent(percentage(item.jumlah, totalListing)), "number") + "</tr>";
  });

  return [
    renderKpiGrid([
      { label: "Total listing", value: formatNumber(totalListing), note: "terdaftar pada periode" },
      { label: "Unit tersedia", value: formatNumber(status.tersedia), tone: "tone-success", note: "siap ditawarkan" },
      { label: "Transaksi periode", value: formatNumber(totalTransaction), tone: "tone-primary", note: formatDate(dari) + " - " + formatDate(sampai) },
      { label: "Nilai transaksi", value: formatCurrency(summary.nilai_transaksi), tone: "tone-primary", note: "akumulasi periode" },
      { label: "Komisi tercatat", value: formatCurrency(summary.total_komisi), tone: "tone-success", note: "akumulasi periode" },
    ]),
    renderInsightList("Ikhtisar bisnis", insights),
    "<div class='chart-grid'>",
    renderDonut("Status listing", "Status terkini untuk listing yang terdaftar pada periode laporan.", statusItems(status)),
    renderDonut("Komposisi transaksi", "Perbandingan penjualan dan penyewaan pada periode laporan.", data.byJenis),
    "</div>",
    renderSection(
      "Diagram tren transaksi",
      "Pergerakan jumlah transaksi dalam periode yang dipilih.",
      renderTrendChart("Transaksi per bulan", "", data.trenBulan, [
        { key: "total_transaksi", label: "Total transaksi", color: "#7A0000" },
      ])
    ),
    renderSection(
      "Distribusi tipe properti",
      "Komposisi listing yang terdaftar pada periode laporan untuk membantu prioritas pemasaran.",
      renderHorizontalBars("Tipe properti", "", data.byTipe, function (value) { return formatNumber(value) + " unit"; })
    ),
    renderSection(
      "Kinerja pencatatan transaksi",
      "Jumlah transaksi yang dicatat oleh masing-masing pengguna pada periode laporan.",
      renderHorizontalBars("Kontributor transaksi", "", data.byMarketing, function (value) { return formatNumber(value) + " transaksi"; })
    ),
    renderSection(
      "Tabel pendukung statistik",
      "Angka rinci yang mendasari diagram pada laporan ini.",
      "<div class='two-tables'>" +
        "<div><h3 class='table-title'>Status listing</h3>" +
        renderTable(["Status", "Jumlah", "Proporsi"], statusRows, "Belum ada data status.") + "</div>" +
        "<div><h3 class='table-title'>Tren transaksi</h3>" +
        renderTable(["Bulan", "Transaksi", "Komisi"], monthlyRows, "Belum ada transaksi.") + "</div>" +
      "</div>",
      "page-break-before"
    ),
  ].join("");
}

function buildLaporanHTML(judul, tipe, data, dari, sampai) {
  const reportType = {
    penjualan: "Laporan Penjualan",
    stok: "Laporan Stok Properti",
    statistik: "Laporan Statistik",
  }[tipe] || "Laporan";
  const generatedAt = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
  const content = tipe === "penjualan"
    ? buildPenjualanReport(data, dari, sampai)
    : tipe === "stok"
      ? buildStokReport(data, dari, sampai)
      : buildStatistikReport(data, dari, sampai);
  const periodDescription = tipe === "stok"
    ? "Periode listing"
    : tipe === "statistik"
      ? "Periode operasional"
      : "Periode transaksi";

  return [
    "<!DOCTYPE html><html lang='id'><head><meta charset='UTF-8'>",
    "<title>", escapeHtml(judul), "</title>",
    "<style>",
    "@page{size:A4;margin:13mm 11mm 16mm}",
    "*{box-sizing:border-box}",
    "body{margin:0;color:#3f3434;background:#fff;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.45}",
    ".report-header{overflow:hidden;border-radius:14px;background:linear-gradient(135deg,#3d0000 0%,#7a0000 60%,#991b1b 100%);color:#fff;padding:20px 22px 18px;position:relative}",
    ".report-header:after{content:'';position:absolute;right:-55px;top:-75px;width:230px;height:230px;border:32px solid rgba(255,255,255,.07);border-radius:50%}",
    ".brand-row{position:relative;z-index:1;display:flex;align-items:center;gap:12px}",
    ".brand-mark{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:1px solid rgba(255,255,255,.55);border-radius:10px;font-weight:800;font-size:15px;letter-spacing:.5px}",
    ".brand-name{font-size:14px;font-weight:700;letter-spacing:.2px}.brand-subtitle{font-size:8px;opacity:.76;text-transform:uppercase;letter-spacing:1.1px}",
    ".report-title{position:relative;z-index:1;margin:22px 0 6px;font-size:23px;line-height:1.18}.report-period{position:relative;z-index:1;margin:0;font-size:10px;color:#fee2e2}",
    ".meta-row{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.meta-pill{border:1px solid rgba(255,255,255,.26);background:rgba(255,255,255,.1);border-radius:999px;padding:4px 8px;font-size:8px}",
    ".report-content{padding-top:14px}.kpi-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px;break-inside:avoid}",
    ".kpi-card{min-height:77px;border:1px solid #f0d9dc;border-radius:10px;background:linear-gradient(180deg,#fff 0%,#fff8f8 100%);padding:10px 11px}",
    ".kpi-label{margin:0;color:#795f62;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.55px}.kpi-value{margin:4px 0 2px;color:#7a0000;font-size:17px;line-height:1.12;font-weight:800;word-break:break-word}.kpi-note{margin:0;color:#8c7678;font-size:8px}",
    ".tone-success{color:#166534}.tone-info{color:#1d4ed8}.tone-warning{color:#a16207}.tone-primary{color:#7a0000}",
    ".insight-box{border-left:4px solid #7a0000;background:#fff5f5;border-radius:0 10px 10px 0;padding:10px 13px;margin:0 0 13px;break-inside:avoid}.eyebrow{margin:0 0 2px;color:#a11b2f;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.8px}.insight-box h2{margin:0;color:#570000;font-size:12px}.insight-box ul{margin:6px 0 0;padding-left:16px}.insight-box li{margin:2px 0;color:#59494a}",
    ".report-section{margin:15px 0}.section-heading{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1.5px solid #7a0000;padding-bottom:5px;margin-bottom:9px}.section-heading h2{margin:0;color:#640000;font-size:13px}.section-heading p{margin:2px 0 0;color:#867173;font-size:8.5px}",
    ".chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:11px 0 13px;break-inside:avoid}.chart-card{border:1px solid #efdde0;border-radius:11px;background:#fff;padding:10px;min-height:130px;break-inside:avoid}.chart-card-full{width:100%}.chart-card h3{margin:0;color:#650000;font-size:10.5px}.chart-description{margin:2px 0 8px;color:#8b7678;font-size:8px}.empty-state{display:flex;align-items:center;justify-content:center;min-height:74px;border:1px dashed #e8c8ce;border-radius:7px;background:#fffafa;color:#9b7d80;text-align:center;padding:8px}",
    ".bar-chart{display:block;width:100%;height:auto;margin-top:5px}.bar-track{fill:#f8e7e9}.svg-label{fill:#5e4d4f;font-size:10px}.svg-value{fill:#6f5558;font-size:9px;font-weight:700}.svg-axis{fill:#8a7376;font-size:8px}.chart-grid-line{stroke:#f0e4e5;stroke-width:1}",
    ".donut-layout{display:flex;align-items:center;gap:8px}.donut-chart{width:43%;min-width:115px;height:auto}.donut-total{fill:#650000;font-size:17px;font-weight:800}.donut-caption{fill:#9a7f82;font-size:9px}.legend-list{list-style:none;margin:0;padding:0;flex:1}.legend-list li{display:grid;grid-template-columns:8px minmax(0,1fr) auto;gap:4px;align-items:center;margin:3px 0;color:#6d5759;font-size:8px}.legend-list strong{color:#5d4649;font-size:8px}.legend-list small{color:#967d80;font-weight:400}.legend-dot{width:7px;height:7px;border-radius:50%}",
    ".chart-legend{display:flex;flex-wrap:wrap;gap:10px;margin:4px 0 3px;color:#796165;font-size:8px}.chart-legend span{display:inline-flex;align-items:center;gap:4px}.chart-legend i{display:inline-block;width:8px;height:8px;border-radius:2px}.trend-chart{display:block;width:100%;height:auto;margin-top:2px}",
    ".table-wrap{overflow:hidden;border:1px solid #ead5d9;border-radius:9px;background:#fff}.table-wrap table{width:100%;border-collapse:collapse;table-layout:auto}.table-wrap thead{display:table-header-group}.table-wrap th{background:#7a0000;color:#fff;padding:6px 7px;font-size:8px;font-weight:700;text-align:left;vertical-align:bottom}.table-wrap td{padding:6px 7px;border-bottom:1px solid #f3e5e7;color:#5a4749;font-size:8.2px;vertical-align:top;word-break:break-word}.table-wrap tbody tr:nth-child(even) td{background:#fffafa}.table-wrap tbody tr:last-child td{border-bottom:0}.table-wrap .number{text-align:right;white-space:nowrap}.table-empty{text-align:center!important;color:#9a7f82!important;padding:13px!important}.transaction-table th,.transaction-table td{font-size:7.3px;padding:5px 4px}.two-tables{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.table-title{margin:0 0 6px;color:#710000;font-size:10px}",
    ".page-break-before{break-before:page}.report-footer{border-top:1px solid #ecdfe0;margin-top:19px;padding-top:8px;color:#987f82;text-align:center;font-size:8px}",
    "@media print{.chart-card,.kpi-card,.insight-box{break-inside:avoid}.page-break-before{break-before:page}}",
    "</style></head><body>",
    "<header class='report-header'><div class='brand-row'><div class='brand-mark'>PR</div><div><div class='brand-name'>Philip Real Estate</div><div class='brand-subtitle'>Property Management Report</div></div></div>",
    "<h1 class='report-title'>", escapeHtml(reportType), "</h1>",
    "<p class='report-period'>", escapeHtml(periodDescription), ": ", escapeHtml(formatDate(dari)), " sampai ", escapeHtml(formatDate(sampai)), "</p>",
    "<div class='meta-row'><span class='meta-pill'>", escapeHtml(judul), "</span><span class='meta-pill'>Dibuat ", escapeHtml(generatedAt), "</span></div></header>",
    "<main class='report-content'>", content, "</main>",
    "<footer class='report-footer'>Dokumen ini dibuat otomatis oleh Sistem Web Management Property Philip Real Estate. Data listing dibatasi oleh periode listing dan status unit mencerminkan kondisi ketika laporan dibuat.</footer>",
    "</body></html>",
  ].join("");
}

module.exports = {
  buildLaporanHTML: buildLaporanHTML,
  enrichReportData: enrichReportData,
  labels: {
    STATUS_LABELS: STATUS_LABELS,
    OFFER_LABELS: OFFER_LABELS,
    TRANSACTION_LABELS: TRANSACTION_LABELS,
    TYPE_LABELS: TYPE_LABELS,
  },
};
