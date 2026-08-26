/**
 * Contrato único para imagens locais. Definitions e fichas guardam a imagem
 * como data URL, portanto não dependem de conexão ou de um servidor externo.
 */
export const acceptedImageTypes = ["image/png", "image/jpeg", "image/webp"] as const;
export const acceptedImageInput = acceptedImageTypes.join(",");
export const maxLocalImageBytes = 1_500_000;

export async function readLocalImage(file: File | undefined): Promise<string | undefined> {
  if (!file) return undefined;
  if (!acceptedImageTypes.includes(file.type as (typeof acceptedImageTypes)[number])) {
    throw new Error("Use uma imagem PNG, JPG ou WebP.");
  }
  if (file.size > maxLocalImageBytes) {
    throw new Error("A imagem deve ter no máximo 1,5 MB.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}
