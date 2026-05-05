"""
GeoIP enrichment via MaxMind GeoLite2 (Phase C.4 / mig 329).

Looks up IP → country/city/lat/lon using an offline MMDB file. Free of
rate-limits (vs ip-api.com), RGPD-friendly (data stays on our servers).

Setup:
1. Sign up at https://www.maxmind.com/en/geolite2/signup
2. Download GeoLite2-City.mmdb (~80 MB)
3. Either:
   a. Bundle in container at /app/geoip/GeoLite2-City.mmdb (read-only)
   b. Download at boot via MAXMIND_LICENSE_KEY env var → /tmp/GeoLite2-City.mmdb
4. Set GEOIP_DB_PATH env var if non-default

Soft init: when DB absent → lookup_ip returns all-NULL dict, never crashes.
LRU 4096: real traffic has IP locality (clients reconnect from same address).
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import TypedDict

from loguru import logger


class GeoInfo(TypedDict):
    geo_country: str | None       # ISO 3166-1 alpha-2 (GQ, FR, ES, …)
    geo_country_name: str | None
    geo_city: str | None
    geo_lat: float | None
    geo_lon: float | None
    geo_subdivision: str | None   # region / state


_EMPTY: GeoInfo = {
    "geo_country": None, "geo_country_name": None,
    "geo_city": None, "geo_lat": None, "geo_lon": None,
    "geo_subdivision": None,
}


_DB_PATH_DEFAULT = "/tmp/GeoLite2-City.mmdb"
_reader = None
_AVAILABLE = False


def init_geoip(db_path: str | None = None) -> bool:
    """Initialize the MMDB reader. Idempotent. Safe to call repeatedly.

    Returns True if reader is ready, False otherwise. Caller should handle
    False as a soft-fail (log + continue without geo enrichment).
    """
    global _reader, _AVAILABLE
    if _AVAILABLE:
        return True

    path = db_path or os.environ.get("GEOIP_DB_PATH") or _DB_PATH_DEFAULT
    if not os.path.exists(path):
        logger.info("geoip: DB not found at {} — geo enrichment disabled", path)
        return False

    try:
        import geoip2.database
        _reader = geoip2.database.Reader(path)
        _AVAILABLE = True
        logger.info("✅ GeoIP initialized from {} ({:.0f} KB)", path, os.path.getsize(path) / 1024)
        return True
    except ImportError:
        logger.warning("geoip: lib `geoip2` not installed — geo enrichment disabled")
        return False
    except Exception as exc:
        logger.warning("geoip: init failed at {}: {}", path, exc)
        return False


@lru_cache(maxsize=4096)
def lookup_ip(ip: str) -> GeoInfo:
    """Resolve an IP to its geo metadata. Cached. Always returns a GeoInfo."""
    if not _AVAILABLE or not ip or not _reader:
        return _EMPTY  # type: ignore[return-value]

    # Skip private / loopback IPs (RFC1918 + RFC3927 + IPv6 ULA)
    if (
        ip.startswith(("10.", "192.168.", "169.254.", "127.", "::1", "fe80:", "fc00:", "fd"))
        or ip.startswith(("172.", "0.", "255."))
    ):
        # 172.16-31 are private; quick check on 172.
        if ip.startswith("172."):
            try:
                second = int(ip.split(".")[1])
                if 16 <= second <= 31:
                    return _EMPTY  # type: ignore[return-value]
            except (IndexError, ValueError):
                pass
        else:
            return _EMPTY  # type: ignore[return-value]

    try:
        r = _reader.city(ip)  # type: ignore[union-attr]
        return {
            "geo_country": r.country.iso_code,
            "geo_country_name": r.country.name,
            "geo_city": r.city.name,
            "geo_lat": float(r.location.latitude) if r.location.latitude is not None else None,
            "geo_lon": float(r.location.longitude) if r.location.longitude is not None else None,
            "geo_subdivision": (
                r.subdivisions.most_specific.name
                if r.subdivisions and len(r.subdivisions) > 0
                else None
            ),
        }
    except Exception:
        # AddressNotFoundError, ValueError, etc. → silent fallback
        return _EMPTY  # type: ignore[return-value]


def cache_info() -> dict:
    info = lookup_ip.cache_info()
    return {
        "hits": info.hits,
        "misses": info.misses,
        "hit_rate": info.hits / (info.hits + info.misses) if (info.hits + info.misses) else 0.0,
        "current_size": info.currsize,
        "max_size": info.maxsize,
        "available": _AVAILABLE,
    }


def is_available() -> bool:
    return _AVAILABLE


__all__ = ["GeoInfo", "init_geoip", "lookup_ip", "cache_info", "is_available"]
