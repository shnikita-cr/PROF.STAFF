import { useEffect, useId, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface Props {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function Scanner({ onScan, onClose }: Props) {
  const id = useId().replaceAll(':', '');
  const onScanRef = useRef(onScan);
  const scannedRef = useRef(false);
  const [manual, setManual] = useState('');
  onScanRef.current = onScan;

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(id, {
      fps: 8,
      qrbox: { width: 230, height: 230 },
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA, Html5QrcodeScanType.SCAN_TYPE_FILE],
      rememberLastUsedCamera: false,
    }, false);
    scanner.render(result => {
      if (scannedRef.current) return;
      scannedRef.current = true;
      onScanRef.current(result);
    }, () => undefined);
    return () => { void scanner.clear().catch(() => undefined); };
  }, [id]);

  return <div className="scanner-modal" role="presentation"
    onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="scanner-panel" role="dialog" aria-modal="true" aria-label="Сканирование QR-кода">
      <div className="spread"><h2>Сканирование QR</h2><button className="link-button" onClick={onClose}>Закрыть</button></div>
      <p className="muted">Наведите камеру на код или загрузите его фотографию.</p>
      <div id={id} className="scanner-view" />
      <form onSubmit={event => { event.preventDefault(); if (manual.trim()) onScan(manual.trim()); }}>
        <label>Ввести номер вручную</label>
        <div className="inline-form"><input value={manual} onChange={event => setManual(event.target.value)} placeholder="RAD-001 или номер заявки" /><button className="button primary" type="submit">Найти</button></div>
      </form>
    </div>
  </div>;
}
