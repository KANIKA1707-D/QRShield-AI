import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
# cv2 will be imported lazily
import numpy as np

app = Flask(__name__)

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    return response
load_dotenv()
@app.route("/api/scan", methods=["POST"])
def api_scan():
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image file provided"}), 400
    file = request.files['image']
    # Read image file bytes into numpy array
    file_bytes = file.read()
    np_arr = np.frombuffer(file_bytes, np.uint8)
    import cv2
    # Decode image
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        return jsonify({"success": False, "error": "Failed to read image"}), 400
    detector = cv2.QRCodeDetector()
    decoded_text, points, _ = detector.detectAndDecode(img)
    if decoded_text:
        return jsonify({"success": True, "decoded_url": decoded_text})
    else:
        return jsonify({"success": False, "error": "No QR code could be detected in the image."}), 200

@app.route("/health", methods=["GET"]) 
def health():
    return jsonify({"status": "ok", "message": "Backend is running"})

# -------------------------------------------------------
# URL Threat Analyzer – Phase 2 implementation
# -------------------------------------------------------
import re
from urllib.parse import urlparse, unquote

def _is_ip(hostname):
    # Simple IPv4 detection
    return re.fullmatch(r"(?:\d{1,3}\.){3}\d{1,3}", hostname) is not None

def _has_long_url(url):
    return len(url) > 200

def _has_at_symbol(url):
    return "@" in url

def _has_suspicious_chars(url):
    # Detect high proportion of special characters or percent‑encoding
    special = re.findall(r"[\[\]{}|\\^`<>~%]", url)
    return len(special) > 5

def _is_shortener(hostname):
    shorteners = {"bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly"}
    return hostname.lower() in shorteners

def _has_suspicious_keywords(path):
    keywords = ["login", "verify", "account", "password", "signin", "security", "update", "confirm"]
    lowered = path.lower()
    return any(k in lowered for k in keywords)


import ipaddress
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

def is_private_ip(hostname: str) -> bool:
    """Return True if hostname resolves to a private/local IP address.
    This checks literal IPs; we avoid DNS resolution for safety.
    """
    try:
        ip_obj = ipaddress.ip_address(hostname)
        return ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_reserved
    except ValueError:
        # Not an IP literal – treat as not private for our purpose (no DNS lookup performed)
        return False

def investigate_url_with_playwright(url: str) -> dict:
    """Safely investigate a URL using Playwright Chromium.
    Returns a dict with investigation metadata. Does not raise – errors are captured.
    """
    result = {
        "loaded": False,
        "final_url": None,
        "status_code": None,
        "title": None,
        "redirect_count": 0,
        "error": None,
    }
    # Basic validation
    try:
        parsed = urlparse(url)
        scheme = parsed.scheme.lower()
        hostname = parsed.hostname or ""
    except Exception:
        result["error"] = "Malformed URL"
        return result
    if scheme not in ("http", "https") or not hostname:
        result["error"] = "Unsupported scheme or missing hostname"
        return result
    # Block private/local IPs (including direct IP literals)
    if is_private_ip(hostname):
        result["error"] = "Blocked: private or local IP address"
        return result
    # Proceed with Playwright navigation
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            try:
                response = page.goto(url, timeout=10000, wait_until="load")
                result["loaded"] = True
                result["final_url"] = page.url
                result["status_code"] = response.status if response else None
                try:
                    result["title"] = page.title()
                except Exception:
                    result["title"] = None
                # Count redirects by walking back through request chain
                redirect_count = 0
                req = response.request if response else None
                while req and getattr(req, "redirected_from", None):
                    redirect_count += 1
                    req = req.redirected_from
                result["redirect_count"] = redirect_count
            except PlaywrightTimeoutError:
                result["error"] = "Navigation timeout"
            except Exception as e:
                result["error"] = f"Navigation error: {e}"
            finally:
                page.close()
                browser.close()
    except Exception as e:
        result["error"] = f"Playwright launch error: {e}"
    return result

# Insert the new function above the existing analyze_url or anywhere appropriate.

    import ipaddress
    # Initialize result components
    indicators = []
    score = 0
    redirect_info = {
        "redirect_checked": False,
        "redirect_count": 0,
        "final_url": url,
        "investigation_status": "unavailable"
    }
    try:
        parsed = urlparse(url)
        scheme = parsed.scheme.lower()
        hostname = parsed.hostname or ""
        path = parsed.path or ""
        # ---------- URL Validation ----------
        if scheme not in ("http", "https") or not hostname:
            # malformed URL – treat as high risk
            score = 100
            indicators = ["Malformed or unsupported URL scheme."]
            return {
                "success": True,
                "url": url,
                "risk_score": score,
                "risk_level": "HIGH",
                "indicators": indicators,
                "message": "URL validation failed.",
                **redirect_info,
            }
        # ---------- Private / Local IP Protection ----------
        try:
            ip_obj = ipaddress.ip_address(hostname)
            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_reserved:
                score += 30
                indicators.append("URL resolves to a private/local IP address.")
                # Mark as blocked for investigation
                redirect_info["investigation_status"] = "blocked"
                redirect_info["redirect_checked"] = True
        except ValueError:
            # hostname is not an IP literal – we do NOT perform DNS resolution to avoid hitting private IPs.
            pass
        # ---------- Existing heuristic checks ----------
        if scheme != "https":
            score += 15
            indicators.append("URL uses HTTP instead of HTTPS.")
        if _is_ip(hostname):
            score += 30
            indicators.append("URL directly uses an IP address.")
        if _has_long_url(url):
            score += 10
            indicators.append("URL is unusually long.")
        if _has_at_symbol(url):
            score += 25
            indicators.append("URL contains @ symbol which can obscure destination.")
        if _has_suspicious_chars(url):
            score += 10
            indicators.append("URL contains many suspicious/encoded characters.")
        if not hostname:
            score += 40
            indicators.append("URL missing or malformed hostname.")
        if _is_shortener(hostname):
            score += 15
            indicators.append("URL uses a known shortening service.")
        if _has_suspicious_keywords(path + " " + (parsed.query or "")):
            score += 10
            indicators.append("URL contains suspicious keyword(s).")
        # ---------- Safe redirect investigation ----------
        try:
            import requests
            max_redirects = 5
            timeout = 5
            current = url
            redirect_count = 0
            blocked = False
            while redirect_count < max_redirects:
                resp = requests.head(current, allow_redirects=False, timeout=timeout)
                if resp.is_redirect or resp.status_code in (301,302,303,307,308):
                    location = resp.headers.get('Location')
                    if not location:
                        break
                    current = requests.compat.urljoin(current, location)
                    redirect_count += 1
                    # Check private IP on each redirect target
                    p = urlparse(current)
                    h = p.hostname or ""
                    try:
                        ip_obj = ipaddress.ip_address(h)
                        if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_reserved:
                            blocked = True
                            break
                    except ValueError:
                        pass
                    continue
                else:
                    break
            redirect_info["redirect_checked"] = True
            redirect_info["redirect_count"] = redirect_count
            redirect_info["final_url"] = current
            if blocked:
                redirect_info["investigation_status"] = "blocked"
                score += 20
                indicators.append("Redirect chain leads to private/local IP address.")
            elif redirect_count > 0:
                redirect_info["investigation_status"] = "safe"
            else:
                redirect_info["investigation_status"] = "safe"
        except Exception:
            # Network inspection unavailable – keep status as unavailable
            redirect_info["investigation_status"] = "unavailable"
        # ---------- Threat Intelligence augmentation ----------
        ti_api_key = os.getenv("THREAT_INTEL_API_KEY")
        if ti_api_key and hostname:
            try:
                import requests as req_ti
                vt_url = f"https://www.virustotal.com/api/v3/domains/{hostname}"
                headers = {"x-apikey": ti_api_key}
                resp = req_ti.get(vt_url, headers=headers, timeout=5)
                if resp.status_code == 200:
                    data = resp.json()
                    malicious = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {}).get("malicious", 0)
                    if malicious:
                        score += 20
                        indicators.append("Threat Intel: domain flagged as malicious.")
                # if not 200, ignore
            except Exception:
                # Threat intel unavailable – add indicator but do not fail
                indicators.append("Threat Intel lookup failed or unavailable.")
        # ---------- End of analysis ----------
    except Exception:
        # If parsing fails, treat as very risky
        score = 100
        indicators = ["Failed to parse URL; treating as high risk."]
    # Clamp score
    if score > 100:
        score = 100
    # Determine level
    if score < 30:
        level = "LOW"
    elif score < 60:
        level = "MEDIUM"
    else:
        level = "HIGH"
    # Message
    if not indicators:
        message = "No major suspicious indicators were detected."
    else:
        message = "Detected suspicious indicators."
    result = {
        "success": True,
        "url": url,
        "risk_score": score,
        "risk_level": level,
        "indicators": indicators,
        "message": message,
    }
    # Merge redirect info (will overwrite if keys collide, which they do not)
    result.update(redirect_info)
    return result



@app.route("/api/analyze-url", methods=["POST"]) 
def api_analyze_url():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()
    if not url:
        return jsonify({"success": False, "error": "No URL provided"}), 400
    result = analyze_url(url)
    investigation = investigate_url_with_playwright(url)
    result["investigation"] = investigation
    return jsonify(result)

@app.route("/api/analyze-email", methods=["POST"]) 
def api_analyze_email():
    data = request.get_json(silent=True) or {}
    email_text = data.get("email_text", "").strip()
    if not email_text:
        return jsonify({"success": False, "error": "Email text is required."}), 400
    # Simple URL extraction regex
    import re
    url_pattern = re.compile(r"https?://[\w\-\.\?\/%=&#~+%]+")
    urls = url_pattern.findall(email_text)
    # Determine overall risk as the highest level among URLs
    results = []
    for url in urls:
        results.append(analyze_url(url))
    level_order = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
    overall = "LOW"
    for a in results:
        if level_order.get(a.get("risk_level", "LOW"), 0) > level_order.get(overall, 0):
            overall = a["risk_level"]
    return jsonify({
        "success": True,
        "urls_found": len(urls),
        "results": results,
        "overall_risk": overall,
        "message": "Email analysis completed"
    })

@app.route("/api/history", methods=["GET"]) 
def get_history():
    return jsonify(load_history())

@app.route("/api/history", methods=["POST"]) 
def post_history():
    entry = request.get_json(silent=True)
    if not entry:
        return jsonify({"success": False, "error": "Invalid JSON"}), 400
    save_history(entry)
    return jsonify({"success": True})


import json
from datetime import datetime

# Path to history file (saved in the backend directory)
HISTORY_FILE = os.path.join(os.path.dirname(__file__), "history.json")

def load_history():
    if not os.path.exists(HISTORY_FILE):
        return []
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_history(entry):
    history = load_history()
    # prepend newest entry
    history.insert(0, entry)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    # Port can be overridden via environment variable
    port = int(os.getenv("FLASK_PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)
