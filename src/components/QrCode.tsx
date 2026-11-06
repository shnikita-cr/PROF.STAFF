import { QRCodeSVG } from 'qrcode.react';

export function QrCode({ value, caption }: { value: string; caption?: string }) {
  return <div className="qr-code"><QRCodeSVG value={value} size={152} marginSize={2} />{caption && <small>{caption}</small>}</div>;
}
