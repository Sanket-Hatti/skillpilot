# SkillPilot

SkillPilot is a resume-to-roadmap career planning app. It helps job seekers upload a PDF resume, compare it against a target role, identify matched and missing skills, and generate a personalized learning path with progress tracking and chatbot guidance.

## What the app does

- Upload a resume in PDF format and extract skills from it.
- Choose a target role and compare the resume against the role's skill set.
- View a skill gap analysis with matched, missing, and total skills.
- Generate a personalized roadmap based on missing skills, available time, and weekly study hours.
- Explore a skill dependency graph to understand what to learn first.
- Track roadmap progress by marking resources as completed.
- Use the floating chatbot for resume and learning-path questions.
- Download a text report of the analysis.
- Review analysis history and a resume strength score.

## Website flow

1. Land on the hero section and jump into the analyzer.
2. Upload a resume PDF.
3. Select a target role.
4. Run the analysis to see the skill gap chart and summary cards.
5. Generate a roadmap from the missing skills.
6. Follow the learning path, mark resources complete, and track progress.

## Tech Stack

- Frontend: React, Tailwind CSS, Axios, react-hot-toast, Mermaid.js
- Backend: Flask, spaCy, PyMuPDF, Flask-CORS
- Styling: Tailwind utilities with custom responsive layout and dark mode support

## Project Structure

- frontend/ - React app and homepage UI
- backend/ - Flask API for analysis, roadmap generation, and chatbot responses
- backend/roadmap/ - roadmap helpers and supporting logic

## Getting Started

### Prerequisites

- Node.js
- npm
- Python 3.8 or newer

### Install

```sh
cd frontend
npm install

cd ../backend
pip install -r requirements.txt
```

### Run locally

In one terminal:

```sh
cd backend
python app.py
```

In another terminal:

```sh
cd frontend
npm start
```

The app runs at http://localhost:3000 and the API runs at http://localhost:5000.

## Main API Routes

- POST /analyze - analyze a resume against a role
- POST /roadmap - generate a personalized roadmap
- POST /chatbot - answer questions about the analysis
- GET /roles - fetch available roles

## Notes

- The frontend accepts PDF uploads only.
- If you add new skills or roles in the UI, keep the backend role/skill lists in sync.
- The homepage is the primary product surface, so keep README updates aligned with it.

## License

MIT