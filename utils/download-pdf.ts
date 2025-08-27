// Utility to download a DOM node as PDF using html2pdf.js
// Usage: import and call downloadElementAsPDF(element, filename)
import html2pdf from "html2pdf.js";

export function downloadElementAsPDF(element: HTMLElement, filename: string) {
  const opt = {
    margin: 0.5,
    filename: filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  };
  html2pdf().set(opt).from(element).save();
}
