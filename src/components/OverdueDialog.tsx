import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  bookingId: string;
  bookingUrl: string;
  onAcknowledged: () => void;
}

export function OverdueDialog({ bookingId, bookingUrl, onAcknowledged }: Props) {
  const [acknowledgements, setAcknowledgements] = useState(0);
  const lastClick = useRef<number | null>(null);

  useEffect(() => {
    const blockEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    document.addEventListener('keydown', blockEscape, true);
    return () => {
      document.removeEventListener('keydown', blockEscape, true);
    };
  }, []);

  const acknowledge = () => {
    const now = performance.now();
    if (lastClick.current !== null && now - lastClick.current < 1000) return;
    lastClick.current = now;
    if (acknowledgements === 2) {
      onAcknowledged();
      return;
    }
    setAcknowledgements(value => value + 1);
  };

  return <div className="notice-overlay overdue-overlay">
    <section className="notice-dialog overdue-dialog" role="alertdialog" aria-modal="true"
      aria-labelledby="overdue-title" aria-describedby="overdue-description">
      <h2 id="overdue-title">Просрочена заявка №{bookingId}</h2>
      <p id="overdue-description">Необходимо вернуть оборудование. Срок возврата истёк.</p>
      <Link className="overdue-booking-link" to={bookingUrl}>Посмотреть заявку №{bookingId}</Link>
      <button autoFocus type="button" className="button overdue-acknowledge"
        onClick={acknowledge}>Понял</button>
    </section>
  </div>;
}
