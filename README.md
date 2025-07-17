# SkillPilot

SkillPilot is an intelligent career assistant that helps users analyze their resumes, identify missing skills for a chosen role, generate a personalized learning roadmap, and get instant guidance through an integrated chatbot.

## Features

- **Resume Analysis:**  
  Upload your resume and select your desired role. SkillPilot analyzes your current skills and compares them to the requirements for the selected role.

- **Skill Gap Visualization:**  
  Instantly see a chart showing which skills you already have and which ones you’re missing for your target role.

- **Personalized Roadmap Generation:**  
  Create a step-by-step learning roadmap to acquire the missing skills. The roadmap includes:
  - A dependency graph if certain skills must be learned before others.
  - Time-based distribution of skills to help you plan your learning journey.
  - Curated links and resources for each skill, provided directly in the roadmap.

- **Progress Tracking:**  
  Mark skills as completed as you learn them. Watch your progress bar fill up as you move closer to your goal.

- **Integrated Chatbot:**  
  Get instant answers to your career, learning, or project-related questions. The chatbot provides guidance, tips, and support throughout your journey.

## How It Works

1. **Upload Resume:**  
   Start by uploading your resume to SkillPilot.

2. **Select Role:**  
   Choose the job role you are aiming for (e.g., Data Scientist, Frontend Developer).

3. **Analyze:**  
   Click "Analyze" to see a visual breakdown of your current skills versus the skills required for your chosen role.

4. **Generate Roadmap:**  
   Create a personalized learning roadmap for the missing skills, complete with dependencies and recommended resources.

5. **Use the Chatbot:**  
   Ask questions or seek advice at any step. The chatbot is always available to help you with learning resources, career tips, or project guidance.

6. **Track Progress:**  
   As you complete each skill, mark it as done. Your progress bar will update to reflect your achievements.

## Tech Stack

- **Frontend:** React, Tailwind CSS
- **Backend:** Flask (Python)
- **Visualization:** Mermaid.js (for charts and dependency graphs)
- **Chatbot:** Integrated AI-powered assistant

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.x and pip

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/Sanket-Hatti/skillpilot.git
   cd skillpilot
   ```

2. **Install frontend dependencies:**
   ```sh
   cd frontend
   npm install
   ```

3. **Install backend dependencies:**
   ```sh
   cd ../backend
   pip install -r requirements.txt
   ```

### Running the App

- **Start the backend (Flask):**
  ```sh
  cd backend
  python app.py
  ```

- **Start the frontend (React):**
  ```sh
  cd frontend
  npm start
  ```

The frontend will run on [http://localhost:3000](http://localhost:3000) and the backend on [http://localhost:5000](http://localhost:5000) by default.

## Folder Structure

```
skillpilot/
  backend/      # Flask backend (API, resume analysis, roadmap generation, chatbot)
  frontend/     # React frontend (UI, charts, chatbot, progress tracking)
```

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)

---

**Made with ❤️ using React & Flask by Sanket Hatti** 