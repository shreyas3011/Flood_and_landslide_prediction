# Antigravity Prompt — Prepare FastAPI for Render Deployment

---

## WHAT IS THIS PROJECT

This is a FastAPI Python backend for a Flood and Landslide Prediction System.
It loads a trained ML model and exposes a /predict endpoint.
We are preparing this backend to be deployed on Render.com (free cloud hosting).

Right now it only runs on my computer (localhost:8000).
After these changes, it will run on the internet at a public URL.

---

## WHAT YOU NEED TO DO

### TASK 1 — Add CORS middleware to main.py

Open the main FastAPI file (main.py or app.py — whichever exists).

Find the line that says:
    app = FastAPI()

Add these lines DIRECTLY AFTER IT (not before, not at the end — right after):

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

WHY: Without CORS, the React frontend hosted on Vercel cannot
talk to this FastAPI backend. The browser will block every request.
This is the #1 cause of deployment failures.

---

### TASK 2 — Add a /health endpoint to main.py

Add this simple endpoint anywhere in main.py:

```python
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Flood prediction API is running"}
```

WHY: This lets us verify the deployment is working by visiting
https://your-app.onrender.com/health in a browser.
Also helps Render know the app is alive.

---

### TASK 3 — Check how the ML model is loaded

Find where the ML model is loaded in main.py. It probably looks like:

```python
model = joblib.load("model.pkl")
# or
model = pickle.load(open("model.pkl", "rb"))
# or
model = joblib.load("../models/flood_model.pkl")
```

Make sure the file path is RELATIVE to where main.py is.
If the model file is in the same folder as main.py, use just:
    joblib.load("model.pkl")

If it's in a subfolder called "models":
    joblib.load("models/flood_model.pkl")

Do NOT use absolute paths like C:/Users/... — those only work on your computer.

---

### TASK 4 — Create requirements.txt

In the terminal, go to the backend folder and run:

```bash
pip freeze > requirements.txt
```

Then open requirements.txt and verify it contains at minimum:
- fastapi
- uvicorn
- scikit-learn (or xgboost, lightgbm — whatever ML library is used)
- pandas
- numpy
- joblib (if used for model loading)
- python-multipart (needed for FastAPI form handling)

If any are missing, add them manually.

---

### TASK 5 — Verify the final main.py structure

After the changes, the top of main.py should look like this:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# ... your other imports ...

app = FastAPI(
    title="Flood & Landslide Prediction API",
    description="ML-powered flood and landslide risk prediction for India",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ML model
model = joblib.load("model.pkl")  # adjust path as needed

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Flood prediction API is running"}

@app.post("/predict")
def predict(data: YourInputModel):
    # ... existing prediction code ...
```

---

### TASK 6 — Test locally before deploying

Run this command in the backend folder to make sure everything still works:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Then open http://localhost:8000/docs in browser.
If you see the FastAPI Swagger UI with /predict and /health — it's ready.
If you see errors — fix them before deploying.

---

### TASK 7 — Commit and push to GitHub

After all changes are working:

```bash
git add .
git commit -m "prepare backend for Render deployment: cors, health endpoint, requirements"
git push
```

---

## RENDER DEPLOYMENT SETTINGS (for reference — done manually on website)

After pushing to GitHub, go to render.com and use these settings:

| Setting        | Value                                              |
|----------------|----------------------------------------------------|
| Service type   | Web Service                                        |
| Runtime        | Python 3                                           |
| Build command  | pip install -r requirements.txt                    |
| Start command  | uvicorn main:app --host 0.0.0.0 --port $PORT      |
| Plan           | Free                                               |
| Root directory | backend (or blank if main.py is in repo root)      |

IMPORTANT: The $PORT in the start command is NOT a typo.
Render sets the port automatically via environment variable.
Do not hardcode port 8000 in the start command.

---

## WHAT SUCCESS LOOKS LIKE

After deploying on Render, opening this URL should show the API docs:
  https://flood-prediction-api.onrender.com/docs

And opening this should return JSON:
  https://flood-prediction-api.onrender.com/health
  → {"status": "ok", "message": "Flood prediction API is running"}

---

## COMMON ERRORS

ERROR: "No module named 'fastapi'" in Render build logs
FIX: fastapi is missing from requirements.txt — add it manually

ERROR: "FileNotFoundError: model.pkl not found"
FIX: The model file path is wrong OR the model file was not committed to GitHub
     Check with: git ls-files | grep .pkl

ERROR: "Address already in use"
FIX: You have another uvicorn running — kill it with Ctrl+C

ERROR: CORS error in browser after deployment
FIX: The CORSMiddleware block was not added, or was added in the wrong place
     It MUST come right after app = FastAPI()
