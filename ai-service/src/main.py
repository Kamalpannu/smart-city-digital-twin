from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import joblib, numpy as np, os
from dotenv import load_dotenv

# LLM bits
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
import pandas as pd

load_dotenv()

# Load model & encoder
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "..", "model.joblib")
encoder_path = os.path.join(current_dir, "..", "encoder.joblib")

model = joblib.load(model_path)
encoder = joblib.load(encoder_path)

app = FastAPI()

# ---- Request & Response Models ----
class PredictionRequest(BaseModel):
    zone: str
    pollution: float

class PredictionResponse(BaseModel):
    predicted_traffic: float
    reroute_suggested: bool

class ScenarioRequest(BaseModel):
    zone: str
    pollution: float
    closure_event: bool = False

class ScenarioResponse(BaseModel):
    predicted_traffic: float
    reroute_suggested: bool
    analysis: str

# Bulk models
class ZoneData(BaseModel):
    id: str
    pollution: float
    traffic: Optional[float] = None
    event: Optional[Dict[str, Any]] = None
    weather: Optional[Dict[str, Any]] = None
    traffic_api: Optional[Dict[str, Any]] = None

class MultiScenarioRequest(BaseModel):
    zones: List[ZoneData]

class MultiScenarioZoneOut(BaseModel):
    id: str
    predicted_traffic: float
    reroute_suggested: bool
    analysis: str

class MultiScenarioResponse(BaseModel):
    zones: List[MultiScenarioZoneOut]

# ---- LLM setup ----
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.3,
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

# ---- Prediction function ----
def predict_traffic(zone: str, pollution: float) -> float:
    # Fix: pass DataFrame with same column name as encoder
    zone_encoded = encoder.transform(pd.DataFrame({"zone": [zone]}))
    input_data = np.hstack([zone_encoded, [[pollution]]])
    prediction = model.predict(input_data)[0]
    return round(float(prediction), 3)

# ---- Endpoints ----
@app.post("/predict", response_model=PredictionResponse)
async def predict(data: PredictionRequest):
    prediction = predict_traffic(data.zone, data.pollution)
    reroute = prediction > 0.8
    return PredictionResponse(predicted_traffic=prediction, reroute_suggested=reroute)

@app.post("/scenario", response_model=ScenarioResponse)
async def scenario(data: ScenarioRequest):
    prediction = predict_traffic(data.zone, data.pollution)
    reroute = prediction > 0.8

    prompt = ChatPromptTemplate.from_template("""
    You are an AI traffic analyst.
    Given:
    - Zone: {zone}
    - Pollution level: {pollution}
    - Road closure event: {closure_event}
    - Predicted traffic load: {predicted_traffic}%

    Provide a short, actionable human-readable summary.
    """)
    chain = prompt | llm
    ai_response = chain.invoke({
        "zone": data.zone,
        "pollution": data.pollution,
        "closure_event": data.closure_event,
        "predicted_traffic": prediction * 100
    })

    return ScenarioResponse(
        predicted_traffic=prediction,
        reroute_suggested=reroute,
        analysis=ai_response.content
    )

@app.post("/scenario-bulk", response_model=MultiScenarioResponse)
async def scenario_bulk(data: MultiScenarioRequest):
    out: List[MultiScenarioZoneOut] = []
    for z in data.zones:
        pred = predict_traffic(z.id, z.pollution)
        reroute = pred > 0.8

        prompt = ChatPromptTemplate.from_template("""
        You are an AI traffic analyst.
        Context per zone:
        - Zone: {zone}
        - Pollution: {pollution}
        - Traffic (reported): {traffic}
        - Event: {event}
        - Weather: {weather}
        - Traffic API: {traffic_api}
        - Predicted traffic load: {predicted_traffic}%

        In 2 sentences max, explain what's likely happening and whether rerouting is warranted.
        """)
        chain = prompt | llm
        ai = chain.invoke({
            "zone": z.id,
            "pollution": z.pollution,
            "traffic": z.traffic,
            "event": z.event,
            "weather": z.weather,
            "traffic_api": z.traffic_api,
            "predicted_traffic": pred * 100
        })

        out.append(MultiScenarioZoneOut(
            id=z.id,
            predicted_traffic=pred,
            reroute_suggested=reroute,
            analysis=ai.content
        ))
    return MultiScenarioResponse(zones=out)

@app.get("/")
async def root():
    return {"message": "AI Service is running!"}
