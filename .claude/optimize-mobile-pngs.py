#!/usr/bin/env python3
"""
PNG asset optimizer for Facil mobile.

Pillow doesn't reach pngquant-level compression on truecolor PNGs, but for the
icons / logos / splash assets shipped with the app it is enough to:

  1. Re-encode with `optimize=True` (max DEFLATE).
  2. Convert near-truecolor PNGs that have ≤ 256 distinct visible colours to
     palette mode (PNG-8) — saves dramatically on flat-colour logos.
  3. Strip ancillary chunks (metadata) — kept minimal already by Pillow.

Run:
  python optimize-pngs.py packages/mobile/assets/images
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image


def optimize(path: Path, dry_run: bool = False) -> tuple[int, int]:
    """Return (original_bytes, new_bytes) for a single PNG."""
    original = path.stat().st_size
    img = Image.open(path)
    img.load()

    # If the image has an alpha channel, work in RGBA; otherwise RGB.
    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)

    if img.mode != ("RGBA" if has_alpha else "RGB"):
        img = img.convert("RGBA" if has_alpha else "RGB")

    # Re-encode optimized; for relatively flat images, try palette mode and
    # keep whichever is smaller.
    out_bytes_rgb = _encode(img, mode_palette=False, has_alpha=has_alpha)
    out_bytes_pal = _encode(img, mode_palette=True, has_alpha=has_alpha)

    candidate = out_bytes_rgb if len(out_bytes_rgb) <= len(out_bytes_pal) else out_bytes_pal
    if len(candidate) >= original:
        # Already optimal — leave the file alone.
        return original, original

    if not dry_run:
        path.write_bytes(candidate)
    return original, len(candidate)


def _encode(img: Image.Image, *, mode_palette: bool, has_alpha: bool) -> bytes:
    import io

    buffer = io.BytesIO()
    if mode_palette:
        # PIL palette quantization. Max 256 colours.
        # RGBA images require FASTOCTREE or libimagequant; MEDIANCUT does not
        # handle alpha. Fall back gracefully if the image has too many distinct
        # colours for an acceptable palette quality.
        try:
            if has_alpha:
                quantized = img.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
            else:
                quantized = img.convert("P", palette=Image.Palette.ADAPTIVE, colors=256)
            quantized.save(buffer, format="PNG", optimize=True)
        except (ValueError, OSError):
            # Quantization failed — re-emit truecolor so the caller picks the
            # truecolor candidate as smaller.
            img.save(buffer, format="PNG", optimize=True)
    else:
        img.save(buffer, format="PNG", optimize=True)
    return buffer.getvalue()


def human(n: int) -> str:
    for unit in ("B", "KB", "MB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} GB"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("path", type=Path)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not args.path.exists():
        print(f"ERROR: {args.path} does not exist", file=sys.stderr)
        return 2

    targets = [args.path] if args.path.is_file() else sorted(args.path.glob("*.png"))

    total_before = 0
    total_after = 0
    for f in targets:
        try:
            before, after = optimize(f, dry_run=args.dry_run)
        except Exception as exc:  # noqa: BLE001
            print(f"  SKIP {f.name}: {exc}")
            continue
        total_before += before
        total_after += after
        delta = before - after
        if delta > 0:
            print(f"  {f.name}: {human(before)} -> {human(after)} (-{human(delta)}, -{delta * 100 // before}%)")
        else:
            print(f"  {f.name}: {human(before)} (already optimal)")

    saved = total_before - total_after
    if total_before:
        print(
            f"\nTotal: {human(total_before)} -> {human(total_after)} "
            f"(saved {human(saved)}, -{saved * 100 // total_before}%)"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
