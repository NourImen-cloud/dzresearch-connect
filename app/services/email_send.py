"""Optional SMTP email (configure via environment variables)."""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import Tuple


def _smtp_from_email() -> str:
    """Envelope / From address (email only)."""
    return (
        os.getenv("SMTP_FROM_EMAIL", "").strip()
        or os.getenv("SMTP_FROM", "").strip()
    )


def _smtp_from_header() -> str:
    """RFC From header; may include display name."""
    addr = _smtp_from_email()
    if not addr:
        return ""
    name = os.getenv("SMTP_FROM_NAME", "").strip()
    if name:
        return formataddr((name, addr))
    return addr


def _smtp_settings():
    raw_pw = os.getenv("SMTP_PASSWORD", "")
    # Gmail app passwords are 16 chars; users often paste with spaces
    password = raw_pw.replace(" ", "").strip()
    return {
        "host": os.getenv("SMTP_HOST", "").strip(),
        "port": int(os.getenv("SMTP_PORT", "587")),
        "user": os.getenv("SMTP_USER", "").strip(),
        "password": password,
        "from_email": _smtp_from_email(),
        "from_header": _smtp_from_header(),
    }


def smtp_configured() -> bool:
    s = _smtp_settings()
    return bool(s["host"] and s["from_email"])


def send_html_email(to_address: str, subject: str, html_body: str, text_fallback: str = "") -> Tuple[bool, str]:
    if not smtp_configured():
        return False, (
            "SMTP is not configured. Set SMTP_HOST and SMTP_FROM_EMAIL "
            "(or legacy SMTP_FROM), and SMTP_USER / SMTP_PASSWORD for Gmail."
        )

    cfg = _smtp_settings()
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = cfg["from_header"]
    msg["To"] = to_address
    msg.attach(MIMEText(text_fallback or "View the HTML version of this email.", "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=30) as server:
            if cfg["user"]:
                server.starttls()
                server.login(cfg["user"], cfg["password"])
            server.sendmail(cfg["from_email"], [to_address], msg.as_string())
    except Exception as exc:  # noqa: BLE001 — surface to caller
        return False, str(exc)
    return True, "sent"
