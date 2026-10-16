import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Native dialogs keep keyboard focus inside the active modal, including when
// the photo crop dialog opens on top of a property form.
export default function Modal({ children, label, onClose, busy = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    dialog.querySelector('input:not([type="hidden"]):not([type="file"]):not(:disabled), select:not(:disabled), button:not(:disabled)')?.focus({ preventScroll: true });
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  return createPortal(<dialog ref={ref} className="modal" aria-label={label} aria-busy={busy}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const controls = [...ref.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')].filter(node => node.getClientRects().length);
      const first = controls[0]; const last = controls.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}
    onClickCapture={event => {
      if (busy && event.target.classList.contains('modal-backdrop')) { event.preventDefault(); event.stopPropagation(); }
    }}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    {children}
  </dialog>, document.body);
}
