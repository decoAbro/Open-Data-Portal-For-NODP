// Utility to download a DOM node as PDF using html2pdf.js
// Usage: import and call downloadElementAsPDF(element, filename)
import html2pdf from "html2pdf.js";


// Download as before
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

// Generate PDF as base64 string (for upload)
export function getElementPDFBase64(element: HTMLElement): Promise<string> {
  const opt = {
    margin: 0.5,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  };
  return new Promise((resolve, reject) => {
    html2pdf().set(opt).from(element).outputPdf('blob').then((blob: Blob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }).catch(reject);
  });
}
