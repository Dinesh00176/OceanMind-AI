"""
FastAPI Server for ARGO ML, NLP, and Scientific Analysis Microservice
Listens on port 5001. Provides endpoints for the Node.js MERN backend.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from nlp_engine import nlp_engine
from analysis_engine import analysis_engine
from prediction_engine import prediction_engine
from rag_engine import rag_engine

app = FastAPI(title="ARGO Oceanographic AI ML/NLP Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NLPRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None

class RagQueryRequest(BaseModel):
    query: str
    top_k: int = 4

class AnalysisRequest(BaseModel):
    operation: str
    parameter: str = "temperature"
    profiles: Optional[List[Dict[str, Any]]] = None
    values: Optional[List[float]] = None
    region_data: Optional[Dict[str, Any]] = None
    time_series_records: Optional[List[Dict[str, Any]]] = None
    trend_data: Optional[List[Dict[str, Any]]] = None

class ForecastRequest(BaseModel):
    records: List[Dict[str, Any]]
    parameter: str = "temperature"
    horizon_months: int = 12

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ARGO Oceanographic AI Engine"}

@app.post("/nlp/parse")
def parse_nlp(req: NLPRequest):
    try:
        parsed = nlp_engine.parse_query(req.query, req.context)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag/query")
def rag_query(req: RagQueryRequest):
    try:
        result = rag_engine.query_knowledge(req.query, top_k=req.top_k)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rag/catalog")
def rag_catalog():
    try:
        return {"catalog": rag_engine.get_document_catalog()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analysis/compute")
def compute_analysis(req: AnalysisRequest):
    try:
        op = req.operation
        if op == "depth_profile":
            return analysis_engine.compute_depth_profile(req.profiles or [])
        elif op == "statistics":
            return analysis_engine.compute_statistics(req.values or [], req.parameter)
        elif op == "ts_diagram":
            return analysis_engine.compute_ts_diagram(req.profiles or [])
        elif op == "regional_comparison":
            return analysis_engine.compute_regional_comparison(req.region_data or {}, req.parameter)
        elif op == "temporal_trend":
            return analysis_engine.compute_temporal_trend(req.time_series_records or [], req.parameter)
        elif op == "trend_summary":
            return analysis_engine.compute_trend_summary(req.trend_data or [], req.parameter)
        else:
            return {"error": f"Unknown operation: {op}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/prediction/forecast")
def compute_forecast(req: ForecastRequest):
    try:
        result = prediction_engine.forecast_trend(
            req.records, 
            param_name=req.parameter, 
            horizon_months=req.horizon_months
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=5001, reload=False)
