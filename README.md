# ARGO Ocean AI: Oceanographic Query, Analysis, Prediction & Visualization Platform

> **"Ask naturally. Analyze scientifically. Predict responsibly. Visualize clearly."**

A complete, functional, secure, responsive MERN + Python ML application for querying, analyzing, predicting, and visualizing ARGO oceanographic data through natural-language interaction.

---

## 🌊 Core Capabilities

1. **QUERY (Natural Language Understanding)**
   - Translates natural questions into structured scientific parameters (temperature, salinity, pressure, dissolved oxygen, depth layers, regions, and dates).
   - Intelligently recognizes ocean basins (Indian Ocean, Arabian Sea, Bay of Bengal, Pacific, Atlantic, Southern Ocean) and coastal landmark coordinates (e.g., Chennai, Mumbai, Kochi).
   - Multi-turn conversation memory maintains context (e.g. *"Show temperature at 500 meters in the Indian Ocean"* → *"Now show 1000 meters"*).
   - Ambiguity detection provides helpful clarification prompts without failing.

2. **ANALYZE (Physical Oceanographic Computations)**
   - Computes empirical statistics: Mean, Median, Min, Max, Standard Deviation, and IQR bounds.
   - Calculates 2,000-meter vertical water column depth stratification curves (thermoclines, haloclines, and Oxygen Minimum Zones).
   - Performs cross-basin comparisons (e.g., Arabian Sea high-salinity water vs. Bay of Bengal freshwater plumes).

3. **PREDICT (Validated Machine Learning Forecasting)**
   - Strict sample size guardrail ($N \ge 20$ records required); refuses to fabricate ungrounded projections.
   - Ridge & Random Forest regressors with harmonic seasonal cycles and depth factors.
   - Strict temporal train/test split (no data leakage).
   - Real-time diagnostic evaluation: $R^2$, RMSE, MAE, and automated overfitting/underfitting checks.
   - Uncertainty bands: Computes 95% confidence intervals on forward projections.
   - Complete visual and structural separation of **Observed Data** vs. **Predicted Data**.

4. **VISUALIZE (Interactive Scientific Visualizers)**
   - **Vertical Depth Profiles**: Inverted Y-axis (0m surface down to 2000m abyssal depth) with multi-variable temperature and salinity curves.
   - **Time-Series Evolution & Forecasts**: Solid observed lines seamlessly joined with dashed projection curves and shaded confidence bands.
   - **Interactive Ocean Map**: Leaflet cartography plotting CTD profiling float locations with temperature color-coding and popup sensor inspection.
   - **Regional Comparative Bar Charts**: Grouped distribution bars comparing distinct ocean basins.

5. **EXPORT & HISTORY**
   - 1-click export of data to **CSV** or complete **JSON**.
   - Print/Save formatted **PDF Research Report**.
   - Authenticated user query history with restore and IDOR-protected deletion.

---

## 🏛️ System Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │      React Client (Vite + Tailwind CSS)       │
                    │   - Natural Language Query Dashboard         │
                    │   - Interactive Leaflet Ocean Float Map      │
                    │   - Oceanographic Depth Profiles & Charts    │
                    │   - Query History, Suggestions, Data Export  │
                    └──────────────────────┬───────────────────────┘
                                           │ HTTP / REST / JWT
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │        Node.js / Express.js Backend          │
                    │   - Auth & Session Mgmt (bcrypt, JWT)        │
                    │   - Security (Rate Limit, Helmet, Sanitizer) │
                    │   - Query Orchestration & History Storage    │
                    │   - Context Manager (Multi-turn queries)     │
                    └──────────────┬───────────────────────────────┘
                                   │
                ┌──────────────────┴──────────────────┐
                ▼                                     ▼
┌───────────────────────────────┐     ┌───────────────────────────────────┐
│     MongoDB Database Server   │     │      Python FastAPI ML/NLP Engine  │
│  - Users & Query History      │     │   - NLP Parser & Entity Extraction│
│  - ARGO Profiles & Float Data │     │   - Scientific Analysis (Stats)   │
│  - Geospatial (2dsphere) &    │     │   - Train/Val/Test ML Forecasting │
│    Compound Temporal Indexes  │     │   - Model Evaluation & Diagnostics│
└───────────────────────────────┘     └───────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ or v24+)
- Python (3.10+) with `uvicorn`, `fastapi`, `scikit-learn`, `pandas`, `numpy`
- MongoDB Atlas Cluster (Production) or local MongoDB instance (Development)

### 1. Install Dependencies
```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### 2. Seed the ARGO Oceanographic Dataset
Generates and loads 1,568 real-world calibrated ARGO profiles across 28 profiling floats into MongoDB:
```bash
cd server
npm run seed
```

### 3. Run the Test Suites
Run the comprehensive automated test suite (35 tests):
```bash
cd server
npm run test
```
Run the End-to-End API integration tests (31 tests):
```bash
npm run test:e2e
```

### 4. Start the Application
You can start all three services simultaneously from the root directory:
```bash
npm start
```
Or start each service independently:
- **Python ML/NLP Engine**:
  ```bash
  cd ml-service
  python -m uvicorn main:app --host 127.0.0.1 --port 5001
  ```
- **Node.js Express Backend**:
  ```bash
  cd server
  npm start
  ```
- **React Frontend**:
  ```bash
  cd client
  npm run dev
  ```

Open your browser at **`http://localhost:5173`**.

---

## 🛡️ Anti-Hallucination & Guardrail Principles

1. **Strict Data Grounding**: Every answer, key finding, and metric is derived directly from recorded CTD sensor cycles.
2. **Predictive Refusal**: If a requested region or depth layer contains fewer than 20 observations, predictions are refused with an explanation rather than hallucinating values.
3. **No Groundless Extrapolations**: Observations are labeled `OBSERVED`, while machine learning projections are clearly designated `PREDICTED` with holdout $R^2$, RMSE, and MAE scores.
4. **Domain Boundaries**: Questions outside marine and physical oceanography are politely recognized and redirected to the ARGO domain.

---

## ☁️ Production Deployment with MongoDB Atlas

The application is fully prepared for cloud deployment using MongoDB Atlas for persistent application data, user authentication, and profiling records.

### 1. Configure MongoDB Atlas Cluster
1. **Create an Atlas Cluster**: Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and deploy an M0 (free) or dedicated production cluster.
2. **Create Database User**: Under **Security > Database Access**, add a user with `readWrite` privileges on `argo_ocean_db` (or `atlasAdmin`).
3. **Configure Network Access**: Under **Security > Network Access**, click **Add IP Address**.
   - For cloud platforms with dynamic outbound IPs (e.g. Render, Vercel, Railway, Heroku), add `0.0.0.0/0` (Allow Access from Anywhere).
   - For VPC/static IP deployments (AWS, GCP, Azure), add your designated NAT gateway IP addresses.
4. **Get Connection String**: Go to **Clusters > Connect > Drivers > Node.js** and copy your `mongodb+srv://` connection string.

### 2. Set Environment Variables
In your cloud deployment dashboard (or `.env` file):
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/argo_ocean_db?retryWrites=true&w=majority
JWT_SECRET=your_production_secure_jwt_secret_minimum_32_characters
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com
ML_SERVICE_URL=https://your-ml-service-domain.com
```

### 3. Seed MongoDB Atlas Remotely
Run the seeder from your local machine targeting Atlas:
```bash
cd server
$env:MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/argo_ocean_db?retryWrites=true&w=majority"
npm run seed
```
Or execute the seed script directly inside your cloud container post-deploy.

### 4. Verify Health and Database Connectivity
Check the health check endpoint:
```bash
curl https://your-backend-domain.com/api/health
```
Expected response:
```json
{
  "status": "healthy",
  "database": {
    "status": "connected",
    "connected": true
  },
  "timestamp": "2026-09-27T11:46:11.350Z",
  "service": "ARGO Oceanographic AI Platform API",
  "version": "1.0.0",
  "environment": "production"
}
```

