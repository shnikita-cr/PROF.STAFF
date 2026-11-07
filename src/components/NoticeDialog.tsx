import { useEffect } from 'react';

export function NoticeDialog({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [onClose]);
  return <div className="notice-overlay" role="presentation" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}><div className="notice-dialog" role="alertdialog" aria-modal="true" aria-labelledby="notice-title">
    <h2 id="notice-title">Результат операции</h2>
    <p>{message}</p>
    <button autoFocus className="button primary full" onClick={onClose}>Понятно</button>
  </div></div>;
}
