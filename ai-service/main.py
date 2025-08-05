# ai-service/main.py
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class PredictionRequest(BaseModel):
    zone: str
    recent_traffic: list[float]  # recent traffic readings

class PredictionResponse(BaseModel):
    predicted_traffic: float
    reroute_suggested: bool

@app.post("/predict", response_model=PredictionResponse)
async def predict(data: PredictionRequest):
    # For now, do a simple dummy prediction: average + 0.1 bump
    avg_traffic = sum(data.recent_traffic) / len(data.recent_traffic) if data.recent_traffic else 0
    predicted = min(avg_traffic + 0.1, 1.0)
    reroute = predicted > 0.8
    return PredictionResponse(predicted_traffic=predicted, reroute_suggested=reroute)
