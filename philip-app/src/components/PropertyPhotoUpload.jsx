import { useEffect, useRef, useState } from "react";
import SquarePhotoCropper from "./SquarePhotoCropper";

export default function PropertyPhotoUpload({ onChange, onBusyChange, existingCount = 0 }) {
  const [entries, setEntries] = useState([]);
  const [queue, setQueue] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const urls = useRef(new Set());
  useEffect(() => {
    const allocated = urls.current;
    return () => { allocated.forEach(url => URL.revokeObjectURL(url)); };
  }, []);
  useEffect(() => { onBusyChange?.(queue.length > 0); }, [queue.length, onBusyChange]);
  const update = next => { setEntries(next); onChange(next.map(entry => entry.file)); };
  const release = url => { URL.revokeObjectURL(url); urls.current.delete(url); };
  const cancel = () => { setQueue([]); setEditing(null); };

  return <div className="space-y-2">
    <input type="file" aria-label="Tambah foto properti" accept="image/jpeg,image/png,image/webp" multiple disabled={queue.length > 0}
      className="file-input file-input-bordered file-input-sm w-full rounded-xl"
      onChange={event => {
        const files = Array.from(event.target.files || []);
        event.target.value = "";
        setError("");
        if (existingCount + entries.length + files.length > 10) return setError("Maksimal 10 foto per properti, termasuk foto yang sudah tersimpan.");
        if (files.some(file => file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
          return setError("Gunakan JPG, PNG, atau WEBP dengan ukuran maksimal 5MB per foto.");
        }
        setQueue(files);
      }} />
    <p className="text-xs text-gray-500">Maksimal 10 foto, 5MB/foto. Setiap foto diatur dengan crop persegi sebelum diunggah.</p>
    {existingCount > 0 && <p className="text-xs text-gray-500">{existingCount} foto tersimpan. Foto baru ditambahkan ke galeri.</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="flex flex-wrap gap-3">{entries.map((entry, index) => <div key={entry.url} className="w-24 space-y-1">
      <img src={entry.url} alt={`Hasil crop foto ${index + 1}`} className="aspect-square w-full rounded-lg object-contain" />
      <p className="text-center text-xs">{index === 0 && existingCount === 0 ? "Cover" : `Foto ${existingCount + index + 1}`}</p>
      <div className="flex gap-1">
        <button type="button" className="btn btn-xs" onClick={() => { setEditing(index); setQueue([entry.original]); }}>Crop</button>
        <button type="button" className="btn btn-xs text-red-700" onClick={() => { release(entry.url); update(entries.filter((_, i) => i !== index)); }}>Hapus</button>
      </div>
    </div>)}</div>
    {queue.length > 0 && <SquarePhotoCropper watermark key={`${queue[0].name}-${queue[0].lastModified}-${queue.length}-${editing}`} file={queue[0]} remaining={queue.length} onCancel={cancel}
      onSave={file => {
        const url = URL.createObjectURL(file);
        urls.current.add(url);
        const entry = { file, url, original: queue[0] };
        if (editing !== null) { release(entries[editing].url); update(entries.map((old, index) => index === editing ? entry : old)); }
        else update([...entries, entry]);
        setEditing(null);
        setQueue(queue.slice(1));
      }} />}
  </div>;
}
