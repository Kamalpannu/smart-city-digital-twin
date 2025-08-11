from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import os

# Load model
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "..", "model.joblib")
encoder_path = os.path.join(current_dir, "..", "encoder.joblib")

model = joblib.load(model_path)
encoder = joblib.load(encoder_path)

app = FastAPI()

class PredictionRequest(BaseModel):
    zone: str
    pollution: float

class PredictionResponse(BaseModel):
    predicted_traffic: float
    reroute_suggested: bool

@app.post("/predict", response_model=PredictionResponse)
async def predict(data: PredictionRequest):
    zone_encoded = encoder.transform([[data.zone]])
    input_data = np.hstack([zone_encoded, [[data.pollution]]])
    prediction = model.predict(input_data)[0]
    reroute = prediction > 0.8

    return PredictionResponse(
        predicted_traffic=round(float(prediction), 3),
        reroute_suggested=reroute
    )

@app.get("/")
async def root():
    return {"message": "AI Service is running!"}
