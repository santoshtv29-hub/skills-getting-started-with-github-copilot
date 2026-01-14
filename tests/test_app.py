import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]

def test_signup_for_activity_success():
    email = "testuser@mergington.edu"
    response = client.post("/activities/Chess Club/signup", params={"email": email})
    assert response.status_code == 200
    assert f"Signed up {email} for Chess Club" in response.json().get("message", "")
    # Try signing up again, should fail
    response2 = client.post("/activities/Chess Club/signup", params={"email": email})
    assert response2.status_code == 400
    assert "already signed up" in response2.json().get("detail", "")

def test_signup_for_nonexistent_activity():
    response = client.post("/activities/Nonexistent/signup", params={"email": "foo@bar.com"})
    assert response.status_code == 404
    assert "Activity not found" in response.json().get("detail", "")
