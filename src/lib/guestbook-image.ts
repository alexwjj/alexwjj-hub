// Convert before transport so that all four images fit a single atomic message.
export async function prepareImage(file: File): Promise<string> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("请选择 PNG、JPEG 或 WebP 图片");
  if (file.size > 8 * 1024 * 1024) throw new Error("每张图片最多 8 MB");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    for (const maxSide of [1920, 1440, 1024, 768]) {
      const ratio = Math.min(
        1,
        maxSide / Math.max(image.naturalWidth, image.naturalHeight),
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const ctx = canvas.getContext("2d");
      if (!ctx) break;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      let data = canvas.toDataURL("image/webp", 0.84);
      if (!data.startsWith("data:image/webp;")) {
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        data = canvas.toDataURL("image/jpeg", 0.84);
      }
      if (data.length < (480 * 1024 * 4) / 3) return data;
    }
    throw new Error("图片处理失败，请换一张较小的图片");
  } finally {
    URL.revokeObjectURL(url);
  }
}
