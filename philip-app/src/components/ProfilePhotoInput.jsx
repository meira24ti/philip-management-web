import { useEffect, useRef, useState } from "react";
import { Camera, Crop, X } from "lucide-react";
import SquarePhotoCropper from "./SquarePhotoCropper";
import { getImageUrl } from "../utils/imageUrl";

export default function ProfilePhotoInput({ value, file, onChange, onBusyChange, disabled = false, name = "Foto profil" }) {
  const preview = useRef(null);
  const [source, setSource] = useState(null);
  const [original, setOriginal] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    preview.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const openCrop = next => { setSource(next); onBusyChange?.(true); };
  const closeCrop = () => { setSource(null); onBusyChange?.(false); };
  const image = getImageUrl(value);
  return <div className="profile-photo-input">
    <div className="profile-photo-preview">{file || image ? <img ref={preview} src={file ? undefined : image} alt={name} /> : <Camera size={32} aria-hidden="true" />}</div>
    <div className="min-w-0 flex-1">
      <p className="font-semibold text-gray-800">{name}</p>
      <p className="mt-1 text-sm text-gray-600">Pilih foto, lalu geser dan zoom untuk crop persegi. JPG, PNG, atau WEBP maksimal 5 MB.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="btn btn-outline relative cursor-pointer"><Camera size={16} /> Pilih foto
          <input type="file" className="photo-file-picker" aria-label={`Pilih ${name.toLowerCase()}`} accept="image/jpeg,image/png,image/webp" disabled={disabled || Boolean(source)} onChange={event => {
            const next = event.target.files?.[0]; event.target.value = ""; if (!next) return;
            setError("");
            if (next.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(next.type)) return setError("Gunakan JPG, PNG, atau WEBP maksimal 5 MB.");
            setOriginal(next); openCrop(next);
          }} />
        </label>
        {file && original && <button className="btn btn-ghost" type="button" disabled={disabled} onClick={() => openCrop(original)}><Crop size={16} /> Atur ulang</button>}
        {file && <button className="btn btn-ghost" type="button" disabled={disabled} onClick={() => onChange(null)}><X size={16} /> Batalkan</button>}
      </div>
      {file && <p className="mt-2 text-sm text-green-800">Crop siap. Simpan perubahan untuk menggunakan foto ini.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
    {source && <SquarePhotoCropper key={`${source.name}-${source.lastModified}`} file={source} title={`Atur ${name.toLowerCase()}`} maxSize={1000}
      onCancel={closeCrop} onSave={cropped => { onChange(cropped); closeCrop(); }} />}
  </div>;
}
