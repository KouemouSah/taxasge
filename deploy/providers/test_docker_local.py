"""Tests for deploy/providers/docker_local.py.

Run from repo root:
    pytest deploy/providers/test_docker_local.py -v --no-cov
"""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest
import yaml

PROVIDERS_DIR = Path(__file__).parent
sys.path.insert(0, str(PROVIDERS_DIR))
SCRIPTS_DIR = PROVIDERS_DIR.parent / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))

import docker_local as dl  # noqa: E402
import validate_config as vc  # noqa: E402


@pytest.fixture
def minimal_config_dict() -> dict:
    return {
        "meta": {"config_version": 1, "project_name": "facil",
                 "environment": "development", "version": "v1.0.0"},
        "database": {"url_secret": "database-url"},
        "redis": {"url_secret": "REDIS_URL"},
        "auth": {
            "jwt_secret_name": "jwt-secret-key",
            "app_secret_name": "jwt-secret-key",
            "totp_encryption_secret": "totp-encryption-key",
        },
        "firebase": {"project_id": "facil-prod", "storage_bucket": "facil-prod-uploads"},
        "ai": {"gemini_api_key_secret": "gemini-api-key"},
        "server": {"frontend_url": "http://localhost:3000",
                   "api_base_url": "http://localhost:8080"},
        "cron": {"secret_name": "cron-secret"},
    }


@pytest.fixture
def cfg(minimal_config_dict: dict) -> vc.DeployConfig:
    return vc.DeployConfig.model_validate(minimal_config_dict)


# ---------------------------------------------------------------------------
# Compose generation
# ---------------------------------------------------------------------------

class TestGenerateCompose:
    def test_contains_postgres_redis_backend_frontend(
        self, cfg: vc.DeployConfig
    ) -> None:
        out = dl.generate_compose(cfg)
        assert "services:" in out
        assert "postgres:" in out
        assert "redis:" in out
        assert "backend:" in out
        assert "frontend:" in out

    def test_uses_config_ports(self, cfg: vc.DeployConfig) -> None:
        out = dl.generate_compose(cfg)
        # Defaults from DockerLocalConfig: backend_port=8080, frontend_port=3000
        assert "8080:8080" in out
        assert "3000:3000" in out

    def test_uses_config_postgres_image(
        self, minimal_config_dict: dict
    ) -> None:
        minimal_config_dict["docker_local"] = {
            "postgres_image": "postgres:15-alpine",
            "redis_image": "redis:7-alpine",
        }
        cfg = vc.DeployConfig.model_validate(minimal_config_dict)
        out = dl.generate_compose(cfg)
        assert "image: postgres:15-alpine" in out

    def test_pg_user_db_uses_project_name(
        self, minimal_config_dict: dict
    ) -> None:
        minimal_config_dict["meta"]["project_name"] = "myproject"
        cfg = vc.DeployConfig.model_validate(minimal_config_dict)
        out = dl.generate_compose(cfg)
        assert "POSTGRES_DB: myproject" in out
        assert "POSTGRES_USER: myproject" in out

    def test_yaml_parses(self, cfg: vc.DeployConfig) -> None:
        """Generated compose file must be valid YAML."""
        out = dl.generate_compose(cfg)
        parsed = yaml.safe_load(out)
        assert parsed is not None
        assert "services" in parsed
        assert set(parsed["services"].keys()) == {
            "postgres", "redis", "backend", "frontend"
        }


# ---------------------------------------------------------------------------
# Prereq detection
# ---------------------------------------------------------------------------

class TestFindDocker:
    def test_returns_path_when_on_path(self) -> None:
        with patch("docker_local.shutil.which", return_value="/usr/bin/docker"):
            assert dl.find_docker() == "/usr/bin/docker"

    def test_returns_none_when_absent(self) -> None:
        with patch("docker_local.shutil.which", return_value=None):
            assert dl.find_docker() is None


class TestDockerComposeAvailable:
    def test_returns_true_on_success(self) -> None:
        with patch("docker_local.find_docker", return_value="/usr/bin/docker"), \
             patch("docker_local.subprocess.run",
                   return_value=MagicMock(returncode=0, stdout="Docker Compose v2.x")):
            assert dl.docker_compose_available()

    def test_returns_false_when_no_docker(self) -> None:
        with patch("docker_local.find_docker", return_value=None):
            assert not dl.docker_compose_available()

    def test_returns_false_on_error(self) -> None:
        with patch("docker_local.find_docker", return_value="/usr/bin/docker"), \
             patch("docker_local.subprocess.run",
                   return_value=MagicMock(returncode=1)):
            assert not dl.docker_compose_available()


# ---------------------------------------------------------------------------
# CLI integration
# ---------------------------------------------------------------------------

class TestCli:
    def test_validate_passes_when_docker_present(
        self,
        tmp_path: Path,
        minimal_config_dict: dict,
        capsys: pytest.CaptureFixture,
    ) -> None:
        cfg_file = tmp_path / "config.yaml"
        cfg_file.write_text(yaml.safe_dump(minimal_config_dict))

        with patch("docker_local.find_docker", return_value="/usr/bin/docker"), \
             patch("docker_local.docker_compose_available", return_value=True):
            rc = dl.main([
                "--config", str(cfg_file),
                "--validate",
            ])

        out = capsys.readouterr().out
        assert rc == 0
        assert "Prereqs validated" in out

    def test_plan_prints_compose_content(
        self,
        tmp_path: Path,
        minimal_config_dict: dict,
        capsys: pytest.CaptureFixture,
    ) -> None:
        cfg_file = tmp_path / "config.yaml"
        cfg_file.write_text(yaml.safe_dump(minimal_config_dict))

        with patch("docker_local.find_docker", return_value="/usr/bin/docker"), \
             patch("docker_local.docker_compose_available", return_value=True):
            rc = dl.main([
                "--config", str(cfg_file),
                "--plan",
            ])

        out = capsys.readouterr().out
        assert rc == 0
        assert "services:" in out
        assert "postgres:" in out

    def test_validate_fails_without_docker(
        self,
        tmp_path: Path,
        minimal_config_dict: dict,
    ) -> None:
        cfg_file = tmp_path / "config.yaml"
        cfg_file.write_text(yaml.safe_dump(minimal_config_dict))

        with patch("docker_local.find_docker", return_value=None), \
             patch("docker_local.docker_compose_available", return_value=False):
            rc = dl.main([
                "--config", str(cfg_file),
                "--validate",
            ])
        assert rc == 1

    def test_apply_fails_without_secrets_file(
        self,
        tmp_path: Path,
        minimal_config_dict: dict,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        cfg_file = tmp_path / "config.yaml"
        cfg_file.write_text(yaml.safe_dump(minimal_config_dict))
        monkeypatch.setattr(dl, "SECRETS_FILE", tmp_path / ".env.secrets-missing")

        with patch("docker_local.find_docker", return_value="/usr/bin/docker"), \
             patch("docker_local.docker_compose_available", return_value=True):
            rc = dl.main([
                "--config", str(cfg_file),
                "--apply",
            ])
        assert rc == 1
