/** Compresses an image file in the browser and returns a Blob ready to upload. */
export function compressImage(file: File, maxWidth = 1100, quality = 0.72): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível processar a imagem."));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Não foi possível comprimir a imagem."))),
          "image/jpeg",
          quality
        );
      };
      img.onerror = reject;
      img.src = String(e.target?.result ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
