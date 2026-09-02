import type { PDFDocument, PDFFont, PDFPage } from 'pdf-lib';

export type OrderPdfLine = {
  name: string;
  qty: number;
  customization: string;
  amount: string;
};

export type OrderPdfData = {
  orderId: string;
  date: string;
  customer: string;
  business: string;
  location: string;
  lines: OrderPdfLine[];
  subtotal: string;
  shipping: string;
  total: string;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const margin = 42;
type PdfColor = ReturnType<typeof import('pdf-lib')['rgb']>;
type PdfColors = { ink: PdfColor; muted: PdfColor; soft: PdfColor; acid: PdfColor; line: PdfColor; white: PdfColor; mutedLight: PdfColor };

function makeColors(rgb: typeof import('pdf-lib')['rgb']): PdfColors {
  return { ink: rgb(0.055, 0.09, 0.07), muted: rgb(0.36, 0.42, 0.37), soft: rgb(0.93, 0.96, 0.91), acid: rgb(0.78, 0.87, 0.66), line: rgb(0.82, 0.86, 0.81), white: rgb(0.98, 0.99, 0.97), mutedLight: rgb(0.72, 0.79, 0.72) };
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth || !current) current = next;
    else {
      lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function drawLabel(page: PDFPage, text: string, x: number, y: number, font: PDFFont, colors: PdfColors) {
  page.drawText(text.toUpperCase(), { x, y, size: 7.5, font, color: colors.muted });
}

function drawWrapped(page: PDFPage, text: string, x: number, y: number, maxWidth: number, font: PDFFont, size: number, color: PdfColor, lineHeight = size * 1.35) {
  const lines = wrapText(text, font, size, maxWidth);
  lines.forEach((line, index) => page.drawText(line, { x, y: y - index * lineHeight, size, font, color }));
  return y - lines.length * lineHeight;
}

async function embedLogo(pdf: PDFDocument) {
  const baseUrl = typeof import.meta.env === 'object' && import.meta.env.BASE_URL ? import.meta.env.BASE_URL : '/';
  const response = await fetch(`${baseUrl}brand/tapless.ec.png`);
  if (!response.ok) return null;
  return pdf.embedPng(await response.arrayBuffer());
}

export async function createOrderPdf(data: OrderPdfData) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const colors = makeColors(rgb);
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const oblique = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const logo = await embedLogo(pdf);

  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 164, width: PAGE_WIDTH, height: 164, color: colors.ink });
  page.drawRectangle({ x: margin, y: PAGE_HEIGHT - 113, width: 166, height: 52, color: colors.white });
  if (logo) {
    const scale = Math.min(140 / logo.width, 37 / logo.height);
    page.drawImage(logo, { x: margin + 13, y: PAGE_HEIGHT - 103, width: logo.width * scale, height: logo.height * scale });
  }
  page.drawText('PROFORMA DE PEDIDO', { x: 365, y: PAGE_HEIGHT - 77, size: 9, font: bold, color: colors.acid });
  page.drawText(`N.º de proforma ${data.orderId}`, { x: 365, y: PAGE_HEIGHT - 96, size: 11, font: bold, color: colors.white });
  page.drawText(data.date, { x: 365, y: PAGE_HEIGHT - 115, size: 8.5, font: regular, color: colors.mutedLight });

  let y = PAGE_HEIGHT - 205;
  drawLabel(page, 'Datos de entrega', margin, y, bold, colors);
  page.drawLine({ start: { x: margin, y: y - 10 }, end: { x: PAGE_WIDTH - margin, y: y - 10 }, thickness: 1, color: colors.line });
  y -= 36;
  const columnX = [margin, 235, 390];
  [['Cliente', data.customer], ['Negocio', data.business], ['Ubicación', data.location]].forEach(([label, value], index) => {
    drawLabel(page, label, columnX[index], y, bold, colors);
    drawWrapped(page, value, columnX[index], y - 17, index === 2 ? 160 : 145, regular, 10, colors.ink, 13);
  });

  y -= 77;
  drawLabel(page, 'Detalle del pedido', margin, y, bold, colors);
  page.drawLine({ start: { x: margin, y: y - 10 }, end: { x: PAGE_WIDTH - margin, y: y - 10 }, thickness: 1, color: colors.line });
  y -= 31;
  page.drawText('PRODUCTO', { x: margin, y, size: 7.5, font: bold, color: colors.muted });
  page.drawText('CANT.', { x: 385, y, size: 7.5, font: bold, color: colors.muted });
  page.drawText('IMPORTE', { x: 462, y, size: 7.5, font: bold, color: colors.muted });
  y -= 17;

  data.lines.forEach((line, index) => {
    const rowHeight = line.customization ? 48 : 36;
    page.drawRectangle({ x: margin, y: y - rowHeight + 9, width: PAGE_WIDTH - margin * 2, height: rowHeight, color: index % 2 ? colors.white : colors.soft });
    page.drawText(line.name, { x: margin + 12, y: y - 9, size: 10, font: bold, color: colors.ink });
    if (line.customization) page.drawText(`Personalización: ${line.customization}`, { x: margin + 12, y: y - 23, size: 8, font: regular, color: colors.muted });
    page.drawText(String(line.qty), { x: 390, y: y - 9, size: 10, font: regular, color: colors.ink });
    page.drawText(line.amount, { x: 462, y: y - 9, size: 10, font: bold, color: colors.ink });
    y -= rowHeight + 7;
  });

  y -= 10;
  page.drawLine({ start: { x: 350, y }, end: { x: PAGE_WIDTH - margin, y }, thickness: 1, color: colors.line });
  y -= 24;
  [['Subtotal', data.subtotal], ['Envío', data.shipping]].forEach(([label, value]) => {
    page.drawText(label, { x: 350, y, size: 9.5, font: regular, color: colors.muted });
    page.drawText(value, { x: 462, y, size: 9.5, font: bold, color: colors.ink });
    y -= 19;
  });
  const totalY = y - 48;
  page.drawRectangle({ x: 338, y: totalY, width: PAGE_WIDTH - margin - 338, height: 45, color: colors.ink });
  page.drawText('TOTAL A CONFIRMAR', { x: 351, y: totalY + 18, size: 8, font: bold, color: colors.acid });
  page.drawText(data.total, { x: 462, y: totalY + 17, size: 14, font: bold, color: colors.white });

  const noteY = 165;
  page.drawRectangle({ x: margin, y: noteY, width: PAGE_WIDTH - margin * 2, height: 75, color: colors.soft });
  drawLabel(page, 'Estado del pedido', margin + 16, noteY + 52, bold, colors);
  page.drawText('Pendiente de confirmación por WhatsApp', { x: margin + 16, y: noteY + 34, size: 11, font: bold, color: colors.ink });
  drawWrapped(page, 'Esta proforma resume tu pedido y no constituye una factura. Tapless confirmará disponibilidad, personalización, entrega y forma de pago por WhatsApp.', margin + 16, noteY + 18, PAGE_WIDTH - margin * 2 - 32, oblique, 8.5, colors.muted, 11);

  page.drawLine({ start: { x: margin, y: 116 }, end: { x: PAGE_WIDTH - margin, y: 116 }, thickness: 1, color: colors.line });
  page.drawText('tapless.ec', { x: margin, y: 94, size: 10, font: bold, color: colors.ink });
  page.drawText('Pequeños puntos de contacto. Grandes señales de confianza.', { x: margin, y: 78, size: 8.5, font: regular, color: colors.muted });
  page.drawText('Ecuador · 593 992 678 401', { x: 391, y: 94, size: 8.5, font: bold, color: colors.muted });
  page.drawText('Gracias por confiar en Tapless.', { x: 391, y: 78, size: 8.5, font: regular, color: colors.muted });

  const bytes = await pdf.save();
  const filename = `tapless-proforma-${data.orderId.toLowerCase()}.pdf`;
  return { blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }), filename };
}

export function downloadPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
