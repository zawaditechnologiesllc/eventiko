import QRCode from "qrcode";

/** Render a QR token to a PNG data URL (for web display). */
export async function qrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: { dark: "#0B0A1A", light: "#FFFFFF" },
  });
}

/** Render a QR token to a PNG buffer (for embedding in the ticket PDF). */
export async function qrBuffer(token: string): Promise<Buffer> {
  return QRCode.toBuffer(token, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 600,
    color: { dark: "#0B0A1A", light: "#FFFFFF" },
  });
}
