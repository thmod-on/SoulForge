#!/usr/bin/env python3
"""Gera versões WebP de detalhe e miniatura sem ampliar a arte de origem."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

from PIL import Image, ImageOps

SUPPORTED_FORMATS = {".jpg", ".jpeg", ".png", ".webp"}


def positive_int(value: str) -> int:
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("deve ser maior que zero")
    return parsed


def output_path(value: str) -> Path:
    path = Path(value)
    if path.suffix.lower() != ".webp":
        raise argparse.ArgumentTypeError("a saída deve terminar em .webp")
    return path


def resize_to_longest_side(image: Image.Image, maximum: int) -> Image.Image:
    width, height = image.size
    longest = max(width, height)
    if longest <= maximum:
        return image.copy()
    ratio = maximum / longest
    return image.resize((round(width * ratio), round(height * ratio)), Image.Resampling.LANCZOS)


def save_webp(image: Image.Image, destination: Path, quality: int) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, format="WEBP", quality=quality, method=6)
    if not destination.exists() or destination.stat().st_size == 0:
        raise RuntimeError(f"não foi possível gravar {destination}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Gera WebP de detalhe e miniatura, preservando proporção e sem ampliar a origem."
    )
    parser.add_argument("--input", required=True, type=Path, help="arquivo PNG, JPEG ou WebP de origem")
    parser.add_argument("--detail", required=True, type=output_path, help="destino WebP da arte de detalhe")
    parser.add_argument("--thumbnail", required=True, type=output_path, help="destino WebP da miniatura")
    parser.add_argument("--detail-max", type=positive_int, default=960, help="maior lado máximo do detalhe (padrão: 960)")
    parser.add_argument("--thumbnail-max", type=positive_int, default=384, help="maior lado máximo da miniatura (padrão: 384)")
    parser.add_argument("--quality", type=positive_int, default=82, help="qualidade WebP de 1 a 100 (padrão: 82)")
    args = parser.parse_args()

    if args.input.suffix.lower() not in SUPPORTED_FORMATS:
        parser.error("a origem deve ser PNG, JPEG ou WebP")
    if not args.input.is_file():
        parser.error(f"origem não encontrada: {args.input}")
    if args.detail.resolve() == args.thumbnail.resolve():
        parser.error("detalhe e miniatura precisam ter caminhos diferentes")
    if args.quality > 100:
        parser.error("--quality deve estar entre 1 e 100")
    if args.thumbnail_max > args.detail_max:
        parser.error("a miniatura não pode ser maior que o detalhe")

    with Image.open(args.input) as source:
        normalized = ImageOps.exif_transpose(source)
        # RGBA conserva transparência; RGB remove índices e modos incompatíveis com WebP.
        image = normalized.convert("RGBA" if "A" in normalized.getbands() else "RGB")
        detail = resize_to_longest_side(image, args.detail_max)
        thumbnail = resize_to_longest_side(detail, args.thumbnail_max)
        save_webp(detail, args.detail, args.quality)
        save_webp(thumbnail, args.thumbnail, args.quality)

    print(f"Detalhe: {args.detail} ({detail.width}×{detail.height}, {args.detail.stat().st_size} bytes)")
    print(f"Miniatura: {args.thumbnail} ({thumbnail.width}×{thumbnail.height}, {args.thumbnail.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, RuntimeError) as error:
        print(f"ART-002: {error}", file=sys.stderr)
        raise SystemExit(1)
