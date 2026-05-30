"""Backend API tests for AELC Lamego anomaly reporting app."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://classroom-issues-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/auth/admin-login", json={"username": "admin", "password": "Admin@2026"})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def new_user(session):
    """Register a brand-new test user."""
    email = f"test_{uuid.uuid4().hex[:8]}@aelc-lamego.pt"
    password = "Teste123"
    r = session.post(f"{API}/auth/register", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    data = r.json()
    return {"email": email, "password": password, "token": data["token"], "id": data["user"]["id"]}


# ---------- Root & health ----------
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("domain") == "aelc-lamego.pt"


# ---------- Auth: register ----------
def test_register_invalid_domain(session):
    r = session.post(f"{API}/auth/register", json={"email": "x@gmail.com", "password": "abc123"})
    assert r.status_code == 422


def test_register_short_password(session):
    r = session.post(f"{API}/auth/register", json={"email": f"u_{uuid.uuid4().hex[:6]}@aelc-lamego.pt", "password": "12"})
    assert r.status_code == 422


def test_register_success(new_user):
    assert new_user["token"]
    assert new_user["id"]


def test_register_duplicate(session, new_user):
    r = session.post(f"{API}/auth/register", json={"email": new_user["email"], "password": "Teste123"})
    assert r.status_code == 400


# ---------- Auth: login ----------
def test_login_existing(session):
    r = session.post(f"{API}/auth/login", json={"email": "teste@aelc-lamego.pt", "password": "Teste123"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data
    assert data["user"]["email"] == "teste@aelc-lamego.pt"


def test_login_wrong_password(session):
    r = session.post(f"{API}/auth/login", json={"email": "teste@aelc-lamego.pt", "password": "wrongpwd"})
    assert r.status_code == 401


# ---------- Admin login ----------
def test_admin_login_success(admin_token):
    assert admin_token


def test_admin_login_invalid(session):
    r = session.post(f"{API}/auth/admin-login", json={"username": "admin", "password": "bad"})
    assert r.status_code == 401


# ---------- User type & reports flow ----------
def test_report_requires_user_type(session, new_user):
    headers = {"Authorization": f"Bearer {new_user['token']}", "Content-Type": "application/json"}
    r = requests.post(f"{API}/reports", headers=headers, json={"local": "Sala 1", "descricao": "teste"})
    assert r.status_code == 400


def test_set_user_type(session, new_user):
    headers = {"Authorization": f"Bearer {new_user['token']}"}
    r = requests.post(f"{API}/user/type", headers=headers, json={"user_type": "aluno"})
    assert r.status_code == 200
    assert r.json()["user_type"] == "aluno"


def test_create_report_and_persist(session, new_user):
    headers = {"Authorization": f"Bearer {new_user['token']}", "Content-Type": "application/json"}
    payload = {"local": "TEST_Biblioteca", "sala": "B-12", "descricao": "TEST_problema com cadeira", "info_adicional": "TEST_info"}
    r = requests.post(f"{API}/reports", headers=headers, json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    report = body["report"]
    assert report["local"] == "TEST_Biblioteca"
    assert report["user_type"] == "aluno"
    assert "_id" not in report
    # email_sent expected False in sandbox (recipient is liceuanomalias@gmail.com which should work, but the env may not - either is OK)
    assert "email_sent" in report

    # GET to confirm persistence
    r2 = requests.get(f"{API}/reports/mine", headers={"Authorization": f"Bearer {new_user['token']}"})
    assert r2.status_code == 200
    reports = r2.json()["reports"]
    assert any(rep["id"] == report["id"] for rep in reports)


def test_report_validation_missing_fields(session, new_user):
    headers = {"Authorization": f"Bearer {new_user['token']}", "Content-Type": "application/json"}
    r = requests.post(f"{API}/reports", headers=headers, json={"local": "", "descricao": ""})
    assert r.status_code == 422


def test_reports_mine_requires_auth(session):
    r = requests.get(f"{API}/reports/mine")
    assert r.status_code in (401, 403)


# ---------- Admin endpoints ----------
def test_admin_reports_requires_admin(session, new_user):
    # user token should NOT access admin
    r = requests.get(f"{API}/admin/reports", headers={"Authorization": f"Bearer {new_user['token']}"})
    assert r.status_code == 403


def test_admin_reports_list(admin_token):
    r = requests.get(f"{API}/admin/reports", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert "reports" in r.json()


def test_admin_recipients_crud(admin_token):
    h = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    # list
    r = requests.get(f"{API}/admin/recipients", headers=h)
    assert r.status_code == 200
    # create
    test_email = f"test_{uuid.uuid4().hex[:8]}@example.pt"
    r = requests.post(f"{API}/admin/recipients", headers=h, json={"email": test_email})
    assert r.status_code == 200, r.text
    rid = r.json()["recipient"]["id"]
    # duplicate
    r = requests.post(f"{API}/admin/recipients", headers=h, json={"email": test_email})
    assert r.status_code == 400
    # toggle
    r = requests.patch(f"{API}/admin/recipients/{rid}/toggle", headers=h)
    assert r.status_code == 200
    assert r.json()["active"] is False
    # delete
    r = requests.delete(f"{API}/admin/recipients/{rid}", headers=h)
    assert r.status_code == 200
    # confirm gone
    r = requests.delete(f"{API}/admin/recipients/{rid}", headers=h)
    assert r.status_code == 404


def test_admin_recipients_requires_admin(session):
    r = requests.get(f"{API}/admin/recipients")
    assert r.status_code in (401, 403)
