from fastapi.testclient import TestClient
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

from main import app

client = TestClient(app)

def test_root():
    r = client.get("/")
    assert r.status_code == 200

def test_predict():
    payload = {"zone":"A","pollution":0.3}
    r = client.post("/predict", json=payload)
    assert r.status_code == 200
    assert "predicted_traffic" in r.json()
