# backend/roadmap/generator.py

def generate_roadmap(goal, skills, duration):
    # Dummy logic – you’ll improve this later with AI
    roadmap = []

    if "frontend" in goal.lower():
        roadmap = [
            {"week": 1, "learn": "HTML, CSS", "project": "Portfolio site"},
            {"week": 2, "learn": "JavaScript basics", "project": "To-do App"},
            {"week": 3, "learn": "React", "project": "Weather App"},
            {"week": 4, "learn": "Tailwind CSS + Git", "project": "Blog frontend"},
        ]
    elif "ml" in goal.lower():
        roadmap = [
            {"week": 1, "learn": "Python + Numpy", "project": "Linear Regression"},
            {"week": 2, "learn": "Pandas + EDA", "project": "Titanic dataset"},
            {"week": 3, "learn": "Scikit-learn", "project": "Classification model"},
            {"week": 4, "learn": "Deployment", "project": "ML Web App"},
        ]
    
    return roadmap[:int(duration)]
