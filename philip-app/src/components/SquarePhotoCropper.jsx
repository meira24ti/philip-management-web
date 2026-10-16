import { useEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCcw, Move, Check, X } from "lucide-react";
import Modal from "./Modal";
import { cropImageFile, getSquareCrop } from "../utils/cropImage";

export default function SquarePhotoCropper({ file, remaining = 1, onSave, onCancel, title = "Atur foto properti", watermark = false, maxSize = 1600 }) {
  const canvas = useRef(null);
  const drag = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    let active = true;
    image.onload = () => { if (active) setPhoto(image); };
    image.onerror = () => { if (active) setError("Foto tidak dapat dibaca. Pilih JPG, PNG, atau WEBP lain."); };
    image.src = url;
    return () => { active = false; URL.revokeObjectURL(url); };
  }, [file]);
  useEffect(() => {
    if (!photo) return;
    const crop = getSquareCrop(photo.naturalWidth, photo.naturalHeight, zoom, position.x, position.y);
    const ctx = canvas.current.getContext("2d");
    ctx.clearRect(0, 0, 600, 600);
    ctx.drawImage(photo, crop.x, crop.y, crop.size, crop.size, 0, 0, 600, 600);
  }, [photo, zoom, position]);
  const move = (dx, dy) => setPosition(p => ({ x: Math.max(0, Math.min(1, p.x + dx)), y: Math.max(0, Math.min(1, p.y + dy)) }));
  const changeZoom = value => setZoom(Math.max(1, Math.min(4, value)));
  const save = async () => {
    if (!photo || saving) return;
    setSaving(true);
    try { await onSave(await cropImageFile(photo, getSquareCrop(photo.naturalWidth, photo.naturalHeight, zoom, position.x, position.y), file.name, { maxSize })); }
    catch (err) { setError(err.message); setSaving(false); }
  };
  return <Modal label={title} onClose={onCancel} busy={saving}>
    <div className="modal-box crop-dialog">
      <div className="dialog-heading"><div><h2>{title}</h2><p>Geser foto dan atur zoom hingga posisi sesuai.{remaining > 1 ? ` ${remaining} foto menunggu.` : ""}</p></div>
        <button type="button" className="icon-button" aria-label="Batalkan crop" disabled={saving} onClick={onCancel}><X size={20} /></button></div>
      <div className="crop-stage">
        <canvas ref={canvas} width={600} height={600} tabIndex={0} aria-label="Area crop foto. Gunakan tombol panah untuk menggeser."
          onKeyDown={event => { const steps = { ArrowLeft: [-0.03, 0], ArrowRight: [0.03, 0], ArrowUp: [0, -0.03], ArrowDown: [0, 0.03] }; if (steps[event.key]) { event.preventDefault(); move(...steps[event.key]); } }}
          onPointerDown={event => { if (saving) return; drag.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }}
          onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
          onPointerMove={event => {
            if (!drag.current || !photo || saving) return;
            const crop = getSquareCrop(photo.naturalWidth, photo.naturalHeight, zoom);
            const factor = crop.size / event.currentTarget.getBoundingClientRect().width;
            move(photo.naturalWidth > crop.size ? -(event.clientX - drag.current.x) * factor / (photo.naturalWidth - crop.size) : 0,
              photo.naturalHeight > crop.size ? -(event.clientY - drag.current.y) * factor / (photo.naturalHeight - crop.size) : 0);
            drag.current = { x: event.clientX, y: event.clientY };
          }} />
        {!photo && !error && <span className="crop-loading" role="status">Memuat foto…</span>}
      </div>
      <div className="crop-toolbar">
        <button type="button" className="icon-button" aria-label="Perkecil foto" disabled={saving || zoom <= 1} onClick={() => changeZoom(zoom - 0.1)}><Minus size={18} /></button>
        <input aria-label="Zoom foto" type="range" min="1" max="4" step="0.01" value={zoom} disabled={saving} onChange={e => changeZoom(Number(e.target.value))} />
        <button type="button" className="icon-button" aria-label="Perbesar foto" disabled={saving || zoom >= 4} onClick={() => changeZoom(zoom + 0.1)}><Plus size={18} /></button>
        <output>{zoom.toFixed(1)}×</output>
      </div>
      <p className="crop-hint"><Move size={15} /> Hasil berbentuk persegi.{watermark ? " Watermark ditambahkan saat disimpan." : " Foto disimpan sesuai area yang terlihat."}</p>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="dialog-actions">
        <button type="button" className="btn btn-ghost mr-auto" disabled={saving} onClick={() => { changeZoom(1); setPosition({ x: 0.5, y: 0.5 }); }}><RotateCcw size={16} /> Reset</button>
        <button type="button" className="btn btn-ghost" disabled={saving} onClick={onCancel}>Batal</button>
        <button type="button" className="btn btn-error" disabled={!photo || saving} onClick={save}><Check size={17} />{saving ? "Memproses…" : "Gunakan foto"}</button>
      </div>
    </div>
  </Modal>;
}
