from fastapi.testclient import TestClient
from src import app as app_module

client = TestClient(app_module.app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "newstudent@example.com"

    # Ensure clean state
    if email in app_module.activities[activity]["participants"]:
        app_module.activities[activity]["participants"].remove(email)

    # Sign up
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert email in app_module.activities[activity]["participants"]

    # Unregister
    res2 = client.post(f"/activities/{activity}/unregister?email={email}")
    assert res2.status_code == 200
    assert email not in app_module.activities[activity]["participants"]


def test_signup_duplicate_returns_400():
    activity = "Programming Class"
    # Use an existing participant
    email = app_module.activities[activity]["participants"][0]
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 400


def test_unregister_nonexistent_returns_404():
    activity = "Chess Club"
    email = "definitely-not-registered@example.com"
    # Ensure not present
    if email in app_module.activities[activity]["participants"]:
        app_module.activities[activity]["participants"].remove(email)

    res = client.post(f"/activities/{activity}/unregister?email={email}")
    assert res.status_code == 404
