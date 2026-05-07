from flask import Flask, request, jsonify
import re
from werkzeug.security import generate_password_hash, check_password_hash

try:
    import spacy
except ImportError:
    spacy = None

try:
    from flask_cors import CORS
except ImportError:
    CORS = None

try:
    nlp = spacy.load("en_core_web_sm") if spacy is not None else None
except OSError:
    nlp = None

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

# Remove OpenAI imports and API key

app = Flask(__name__)
if CORS is not None:
    CORS(app)  # allow cross-origin requests

# Predefined job role skills
JOB_ROLE_SKILLS = {
    "Frontend Developer": ["HTML", "CSS", "JavaScript", "React", "Tailwind", "Git"],
    "Backend Developer": ["Python", "Django", "Flask", "SQL", "APIs", "Git"],
    "Full Stack Developer": ["HTML", "CSS", "JavaScript", "React", "Node.js", "MongoDB", "SQL", "Git"],
    "Data Scientist": ["Python", "R", "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "Data Visualization", "Statistics", "SQL"],
    "DevOps Engineer": ["Linux", "Docker", "Kubernetes", "CI/CD", "AWS", "Terraform", "Jenkins", "Git"],
    "UI/UX Designer": ["Figma", "Sketch", "Adobe XD", "Wireframing", "Prototyping", "User Research", "Usability Testing", "Design Systems"],
    "Machine Learning Engineer": ["Python", "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "ML", "Deep Learning"],
    "Cybersecurity Analyst": ["Network Security", "Penetration Testing", "Vulnerability Assessment", "Firewalls", "SIEM", "Incident Response", "Python", "Encryption"]
}

CUSTOM_JOB_ROLE_SKILLS = {}

LEARNING_RESOURCES = {
    # Frontend
    "HTML": [
        {"label": "HTML Crash Course (Traversy Media, 1hr)", "url": "https://www.youtube.com/watch?v=UB1O30fR-EE", "type": "Quick Start", "minutes": 60},
        {"label": "MDN HTML Guide", "url": "https://developer.mozilla.org/en-US/docs/Web/HTML", "type": "Docs", "minutes": 120}
    ],
    "CSS": [
        {"label": "CSS Crash Course (Traversy Media, 1hr)", "url": "https://www.youtube.com/watch?v=yfoY53QXEnI", "type": "Quick Start", "minutes": 60},
        {"label": "MDN CSS Guide", "url": "https://developer.mozilla.org/en-US/docs/Web/CSS", "type": "Docs", "minutes": 120}
    ],
    "JavaScript": [
        {"label": "JavaScript Crash Course (Traversy Media, 1.5hr)", "url": "https://www.youtube.com/watch?v=hdI2bqOjy3c", "type": "Quick Start", "minutes": 90},
        {"label": "JavaScript Full Course (freeCodeCamp, 8hr)", "url": "https://www.youtube.com/watch?v=jS4aFq5-91M", "type": "Video", "minutes": 480},
        {"label": "MDN JavaScript Guide", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", "type": "Docs", "minutes": 180}
    ],
    "React": [
        {"label": "React Crash Course (Traversy Media, 1.5hr)", "url": "https://www.youtube.com/watch?v=w7ejDZ8SWv8", "type": "Quick Start", "minutes": 90},
        {"label": "React Full Course (freeCodeCamp, 5hr)", "url": "https://www.youtube.com/watch?v=bMknfKXIFA8", "type": "Video", "minutes": 300},
        {"label": "React Official Docs", "url": "https://react.dev/learn", "type": "Docs", "minutes": 180}
    ],
    "Tailwind": [
        {"label": "Tailwind CSS Crash Course (Traversy Media, 1hr)", "url": "https://www.youtube.com/watch?v=UBOj6rqRUME", "type": "Quick Start", "minutes": 60},
        {"label": "Tailwind Docs", "url": "https://tailwindcss.com/docs/installation", "type": "Docs", "minutes": 60}
    ],
    "Git": [
        {"label": "Git & GitHub Crash Course (freeCodeCamp, 1hr)", "url": "https://www.youtube.com/watch?v=RGOj5yH7evk", "type": "Quick Start", "minutes": 60},
        {"label": "Git Handbook", "url": "https://guides.github.com/introduction/git-handbook/", "type": "Docs", "minutes": 60}
    ],
    # Backend
    "Python": [
        {"label": "Python Crash Course (1hr)", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "type": "Quick Start", "minutes": 60},
        {"label": "Python for Beginners (freeCodeCamp, 4hr)", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "type": "Video", "minutes": 240},
        {"label": "Python Full Course (Programming with Mosh, 6hr)", "url": "https://www.youtube.com/watch?v=_uQrJ0TkZlc", "type": "Video", "minutes": 360},
        {"label": "LearnPython.org", "url": "https://www.learnpython.org/", "type": "Docs", "minutes": 90},
        {"label": "Python Docs", "url": "https://docs.python.org/3/tutorial/", "type": "Docs", "minutes": 180}
    ],
    "Django": [
        {"label": "Django Crash Course (Traversy Media, 1hr)", "url": "https://www.youtube.com/watch?v=F5mRW0jo-U4", "type": "Quick Start", "minutes": 60},
        {"label": "Django Official Docs", "url": "https://docs.djangoproject.com/en/4.0/", "type": "Docs", "minutes": 120}
    ],
    "Flask": [
        {"label": "Flask Crash Course (Traversy Media, 1hr)", "url": "https://www.youtube.com/watch?v=Z1RJmh_OqeA", "type": "Quick Start", "minutes": 60},
        {"label": "Flask Official Docs", "url": "https://flask.palletsprojects.com/en/2.2.x/", "type": "Docs", "minutes": 90}
    ],
    "SQL": [
        {"label": "SQL Full Course (freeCodeCamp, 4hr)", "url": "https://www.youtube.com/watch?v=HXV3zeQKqGY", "type": "Video", "minutes": 240},
        {"label": "SQLBolt (1hr)", "url": "https://www.sqlbolt.com/", "type": "Quick Start", "minutes": 60},
        {"label": "W3Schools SQL Tutorial", "url": "https://www.w3schools.com/sql/", "type": "Docs", "minutes": 120}
    ],
    "APIs": [
        {"label": "REST API Crash Course (Traversy Media, 1hr)", "url": "https://www.youtube.com/watch?v=Q-BpqyOT3a8", "type": "Quick Start", "minutes": 60}
    ],
    "Node.js": [
        {"label": "Node.js Crash Course (Traversy Media, 1hr)", "url": "https://www.youtube.com/watch?v=fBNz5xF-Kx4", "type": "Quick Start", "minutes": 60},
        {"label": "Node.js Full Course (freeCodeCamp, 8hr)", "url": "https://www.youtube.com/watch?v=Oe421EPjeBE", "type": "Video", "minutes": 480},
        {"label": "Node.js Official Docs", "url": "https://nodejs.org/en/docs", "type": "Docs", "minutes": 180}
    ],
    "MongoDB": [
        {"label": "MongoDB Crash Course (Academind, 1hr)", "url": "https://www.youtube.com/watch?v=9e_FpQb2YbI", "type": "Quick Start", "minutes": 60},
        {"label": "MongoDB University", "url": "https://university.mongodb.com/", "type": "Docs", "minutes": 120}
    ],
    # Data Science / ML
    "R": [
        {"label": "R Programming Tutorial (freeCodeCamp, 3hr)", "url": "https://www.youtube.com/watch?v=_V8eKsto3Ug", "type": "Video", "minutes": 180}
    ],
    "Pandas": [
        {"label": "Pandas Tutorial (Corey Schafer, 1.5hr)", "url": "https://www.youtube.com/watch?v=vmEHCJofslg", "type": "Quick Start", "minutes": 90}
    ],
    "NumPy": [
        {"label": "NumPy Tutorial (freeCodeCamp, 1.5hr)", "url": "https://www.youtube.com/watch?v=QUT1VHiLmmI", "type": "Quick Start", "minutes": 90}
    ],
    "Scikit-learn": [
        {"label": "Scikit-learn Crash Course (freeCodeCamp, 1hr)", "url": "https://www.youtube.com/watch?v=0Lt9w-BxKFQ", "type": "Quick Start", "minutes": 60}
    ],
    "TensorFlow": [
        {"label": "TensorFlow Full Course (freeCodeCamp, 6hr)", "url": "https://www.youtube.com/watch?v=tPYj3fFJGjk", "type": "Video", "minutes": 360}
    ],
    "Data Visualization": [
        {"label": "Data Visualization with Python (freeCodeCamp, 4hr)", "url": "https://www.youtube.com/watch?v=9Ml2b8RPuGU", "type": "Video", "minutes": 240}
    ],
    "Statistics": [
        {"label": "Statistics for Data Science (freeCodeCamp, 2hr)", "url": "https://www.youtube.com/watch?v=xxpc-HPKN28", "type": "Video", "minutes": 120}
    ],
    # DevOps
    "Linux": [
        {"label": "Linux for Beginners (freeCodeCamp, 2hr)", "url": "https://www.youtube.com/watch?v=iv8rSLsi1xo", "type": "Video", "minutes": 120}
    ],
    "Docker": [
        {"label": "Docker Crash Course (TechWorld with Nana, 1hr)", "url": "https://www.youtube.com/watch?v=3c-iBn73dDE", "type": "Quick Start", "minutes": 60}
    ],
    "Kubernetes": [
        {"label": "Kubernetes Crash Course (TechWorld with Nana, 1hr)", "url": "https://www.youtube.com/watch?v=X48VuDVv0do", "type": "Quick Start", "minutes": 60}
    ],
    "CI/CD": [
        {"label": "CI/CD Explained (Academind, 30min)", "url": "https://www.youtube.com/watch?v=1hHMwLxN6EM", "type": "Quick Start", "minutes": 30}
    ],
    "AWS": [
        {"label": "AWS Full Course (freeCodeCamp, 10hr)", "url": "https://www.youtube.com/watch?v=ulprqHHWlng", "type": "Video", "minutes": 600}
    ],
    "Terraform": [
        {"label": "Terraform Crash Course (freeCodeCamp, 2hr)", "url": "https://www.youtube.com/watch?v=7xngnjfIlK4", "type": "Quick Start", "minutes": 120}
    ],
    "Jenkins": [
        {"label": "Jenkins Crash Course (TechWorld with Nana, 1hr)", "url": "https://www.youtube.com/watch?v=FxkS3A4bGdo", "type": "Quick Start", "minutes": 60}
    ],
    # UI/UX
    "Figma": [
        {"label": "Figma Tutorial (freeCodeCamp, 2hr)", "url": "https://www.youtube.com/watch?v=jwCmIBJ8Jtc", "type": "Video", "minutes": 120}
    ],
    "Sketch": [
        {"label": "Sketch App Tutorial (Envato Tuts+, 1hr)", "url": "https://www.youtube.com/watch?v=6cT4ZHlJt5M", "type": "Quick Start", "minutes": 60},
        {"label": "Sketch Official Documentation", "url": "https://www.sketch.com/docs/", "type": "Docs", "minutes": 120}
    ],
    "Adobe XD": [
        {"label": "Adobe XD Tutorial (Envato Tuts+, 1hr)", "url": "https://www.youtube.com/watch?v=68w2VwalD5w", "type": "Quick Start", "minutes": 60},
        {"label": "Adobe XD Official Documentation", "url": "https://helpx.adobe.com/xd/tutorials.html", "type": "Docs", "minutes": 120}
    ],
    "Wireframing": [
        {"label": "Wireframing in Figma (CharliMarieTV, 30min)", "url": "https://www.youtube.com/watch?v=QH6RypFa5aA", "type": "Quick Start", "minutes": 30}
    ],
    "Prototyping": [
        {"label": "Prototyping in Figma (Figma, 20min)", "url": "https://www.youtube.com/watch?v=FTFaQWZBqQ8", "type": "Quick Start", "minutes": 20}
    ],
    "User Research": [
        {"label": "User Research Basics (NNgroup, 10min)", "url": "https://www.youtube.com/watch?v=Q5GgA0dQz3E", "type": "Quick Start", "minutes": 10}
    ],
    "Usability Testing": [
        {"label": "Usability Testing (NNgroup, 10min)", "url": "https://www.youtube.com/watch?v=9BdtGjoIN4E", "type": "Quick Start", "minutes": 10}
    ],
    "Design Systems": [
        {"label": "Design Systems (Figma, 30min)", "url": "https://www.youtube.com/watch?v=Z7v8K5lHn9s", "type": "Quick Start", "minutes": 30}
    ],
    # Cybersecurity
    "Network Security": [
        {"label": "Network Security Full Course (freeCodeCamp, 8hr)", "url": "https://www.youtube.com/watch?v=3QhU9jd03a0", "type": "Video", "minutes": 480}
    ],
    "Penetration Testing": [
        {"label": "Penetration Testing Crash Course (The Cyber Mentor, 2hr)", "url": "https://www.youtube.com/watch?v=3Kq1MIfTWCE", "type": "Quick Start", "minutes": 120}
    ],
    "Vulnerability Assessment": [
        {"label": "Vulnerability Assessment (Practical Networking, 30min)", "url": "https://www.youtube.com/watch?v=8g9hP6d7ZbE", "type": "Quick Start", "minutes": 30}
    ],
    "Firewalls": [
        {"label": "Firewalls Explained (PowerCert, 20min)", "url": "https://www.youtube.com/watch?v=3QhU9jd03a0", "type": "Quick Start", "minutes": 20}
    ],
    "SIEM": [
        {"label": "SIEM Explained (HackerSploit, 30min)", "url": "https://www.youtube.com/watch?v=Qw1r1C2b8gI", "type": "Quick Start", "minutes": 30}
    ],
    "Incident Response": [
        {"label": "Incident Response (Practical Networking, 30min)", "url": "https://www.youtube.com/watch?v=8g9hP6d7ZbE", "type": "Quick Start", "minutes": 30}
    ],
    "Encryption": [
        {"label": "Encryption Explained (Computerphile, 20min)", "url": "https://www.youtube.com/watch?v=AQDCe585Lnc", "type": "Quick Start", "minutes": 20}
    ]
}

LEARNING_TIME_ESTIMATES = {
    "Python": 10, "React": 12, "SQL": 8, "JavaScript": 10, "HTML": 4, "CSS": 6, "Git": 4, "Docker": 8, "Linux": 8, "AWS": 12, "Figma": 6,
    "Node.js": 6, "MongoDB": 6, "Django": 10, "Flask": 6, "Tailwind": 4, "Pandas": 6, "NumPy": 5, "Scikit-learn": 8, "TensorFlow": 12, "Kubernetes": 10,
    "CI/CD": 6, "Azure": 10, "GCP": 10, "Terraform": 8, "Jenkins": 6, "Kotlin": 8, "Swift": 8, "Objective-C": 8, "Flutter": 8, "React Native": 8,
    "Android": 8, "iOS": 8, "Dart": 6, "R": 8, "Data Visualization": 6, "Statistics": 6, "Linux": 8, "CloudFormation": 6, "Manual Testing": 4,
    "Automated Testing": 6, "Selenium": 6, "Cypress": 6, "Test Cases": 4, "Bug Tracking": 4, "Jest": 4, "Mocha": 4, "Figma": 6, "Sketch": 6,
    "Adobe XD": 6, "Wireframing": 4, "Prototyping": 4, "User Research": 4, "Usability Testing": 4, "Design Systems": 4, "Network Security": 8,
    "Penetration Testing": 8, "Vulnerability Assessment": 6, "Firewalls": 6, "SIEM": 6, "Incident Response": 6, "Encryption": 6, "Requirements Gathering": 4,
    "Process Mapping": 4, "Stakeholder Management": 4, "UML": 4, "Documentation": 4, "Presentation Skills": 4, "ETL": 6, "Spark": 8, "Hadoop": 8,
    "Data Warehousing": 6, "Airflow": 6, "BigQuery": 6, "Kafka": 6, "Windows Server": 6, "Bash": 4, "PowerShell": 4, "Networking": 6, "Active Directory": 4,
    "Virtualization": 6, "Monitoring": 4, "Backups": 4, "SEO": 4, "Content Marketing": 4, "Google Analytics": 4, "Social Media": 4, "Email Marketing": 4,
    "Copywriting": 4, "Ad Campaigns": 4, "Branding": 4, "Blogging": 4, "Editing": 4, "Research": 4, "WordPress": 4, "Storytelling": 4, "Proofreading": 4,
    "Solidity": 8, "Ethereum": 8, "Smart Contracts": 8, "Web3.js": 6, "Truffle": 6, "Cryptography": 6, "DApps": 6, "Unity": 8, "C#": 8, "Unreal Engine": 8,
    "C++": 8, "Game Design": 6, "3D Modeling": 6, "Animation": 6, "Physics": 6, "Troubleshooting": 4, "Windows": 4, "MacOS": 4, "Customer Service": 4,
    "Ticketing Systems": 4, "Hardware": 4, "Software Installation": 4, "Cloud Architecture": 8, "System Design": 8, "Microservices": 8, "DevOps": 8,
    "Security": 8, "Cisco": 6, "Routing": 6, "Switching": 6, "VPN": 4, "Wireshark": 4
}

# Utility: extract text from PDF
def extract_text_from_pdf(file):
    if fitz is None:
        raise RuntimeError("PyMuPDF is not installed. Install the backend requirements to analyze PDF resumes.")
    text = ""
    with fitz.open(stream=file.read(), filetype="pdf") as doc:
        for page in doc:
            text += page.get_text()
    return text

# Utility: extract keywords from resume text (simplified)

def extract_skills(text):
    all_skills = {skill.lower(): skill for skills in JOB_ROLE_SKILLS.values() for skill in skills}
    found_skills = set()

    if nlp is not None:
        doc = nlp(text)

        # Extract noun chunks and entities when spaCy is available
        for chunk in doc.noun_chunks:
            chunk_text = chunk.text.lower().strip()
            if chunk_text in all_skills:
                found_skills.add(all_skills[chunk_text])

        for ent in doc.ents:
            ent_text = ent.text.lower().strip()
            if ent_text in all_skills:
                found_skills.add(all_skills[ent_text])

    # Also check for direct word matches (fallback)
    for skill in all_skills:
        if skill in text.lower():
            found_skills.add(all_skills[skill])

    return list(found_skills)


@app.route('/add_role', methods=['POST'])
def add_role():
    data = request.get_json()
    role = data.get('role')
    skills = data.get('skills')
    if not role or not skills or not isinstance(skills, list):
        return jsonify({'error': 'Role and skills (list) are required.'}), 400
    CUSTOM_JOB_ROLE_SKILLS[role] = skills
    return jsonify({'message': f'Role {role} added successfully.', 'role': role, 'skills': skills})

# Update /roles to include custom roles
def get_all_roles():
    return list(JOB_ROLE_SKILLS.keys()) + list(CUSTOM_JOB_ROLE_SKILLS.keys())

@app.route('/roles', methods=['GET'])
def get_roles():
    return jsonify({'roles': get_all_roles()})


@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        file = request.files.get('resume')
        role = request.form.get('role')

        print("Resume file received:", file)
        print("Job role received:", role)

        if not file or not role:
            return jsonify({'error': 'Missing file or role'}), 400

        resume_text = extract_text_from_pdf(file)
        print("Extracted resume text:", resume_text[:300])  # Just first 300 chars

        resume_skills = extract_skills(resume_text)
        # Merge both dictionaries for lookup
        all_roles = {**JOB_ROLE_SKILLS, **CUSTOM_JOB_ROLE_SKILLS}
        job_skills = all_roles.get(role, [])

        # Matched and missing skills
        matched_skills = [skill for skill in job_skills if skill.lower() in [s.lower() for s in resume_skills]]
        missing_skills = [skill for skill in job_skills if skill.lower() not in [s.lower() for s in resume_skills]]

        # Curated learning resources for missing skills
        learning_resources = {}
        for skill in missing_skills:
            links = LEARNING_RESOURCES.get(skill, None)
            if links:
                learning_resources[skill] = links
            else:
                # Fallback to Google search
                learning_resources[skill] = [{
                    "label": "Google Search",
                    "url": f'https://www.google.com/search?q=learn+{skill.replace(" ", "+")}'
                }]

        return jsonify({
            'resumeSkills': resume_skills,
            'jobSkills': job_skills,
            'matchedSkills': matched_skills,
            'missingSkills': missing_skills,
            'learningResources': learning_resources
        })

    except Exception as e:
        if str(e).startswith("PyMuPDF is not installed"):
            return jsonify({'error': str(e)}), 500
        print("Error in /analyze:", str(e))
        return jsonify({'error': 'Something went wrong on server'}), 500


SKILL_DEPENDENCIES = {
    # Frontend
    "React": ["JavaScript", "HTML", "CSS"],
    "Tailwind": ["CSS"],
    # Backend
    "Django": ["Python"],
    "Flask": ["Python"],
    "Node.js": ["JavaScript"],
    "MongoDB": ["Node.js"],
    # Data Science / ML
    "Pandas": ["Python"],
    "NumPy": ["Python"],
    "Scikit-learn": ["Python", "NumPy", "Pandas"],
    "TensorFlow": ["Python", "NumPy"],
    "Data Visualization": ["Python"],
    "Statistics": [],
    # DevOps
    "Docker": ["Linux"],
    "Kubernetes": ["Docker"],
    "CI/CD": [],
    "AWS": [],
    "Terraform": ["AWS"],
    "Jenkins": ["CI/CD"],
    # UI/UX
    "Figma": [],
    "Sketch": [],
    "Adobe XD": [],
    "Wireframing": [],
    "Prototyping": ["Wireframing"],
    "User Research": [],
    "Usability Testing": ["User Research"],
    "Design Systems": ["Figma"],
    # Cybersecurity
    "Penetration Testing": ["Network Security"],
    "Vulnerability Assessment": ["Network Security"],
    "Firewalls": ["Network Security"],
    "SIEM": ["Network Security"],
    "Incident Response": ["Network Security"],
    "Encryption": ["Network Security"],
}

def topo_sort_skills(skills, dependencies):
    from collections import defaultdict, deque
    graph = defaultdict(list)
    indegree = defaultdict(int)
    for skill in skills:
        for dep in dependencies.get(skill, []):
            if dep in skills:
                graph[dep].append(skill)
                indegree[skill] += 1
    queue = deque([s for s in skills if indegree[s] == 0])
    ordered = []
    while queue:
        s = queue.popleft()
        ordered.append(s)
        for neighbor in graph[s]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)
    # If there are cycles, just append the rest
    for s in skills:
        if s not in ordered:
            ordered.append(s)
    return ordered

@app.route('/roadmap', methods=['POST'])
def roadmap():
    data = request.get_json()
    missing_skills = data.get('missing_skills', [])
    total_weeks = int(data.get('total_weeks', 4))  # default to 4 weeks
    hours_per_week = int(data.get('hours_per_week', 5))  # default to 5 hours/week
    if not missing_skills or not isinstance(missing_skills, list):
        return jsonify({'error': 'Missing skills required'}), 400

    # Adaptive ordering: prerequisites first
    ordered_skills = topo_sort_skills(missing_skills, SKILL_DEPENDENCIES)

    # Calculate total available hours
    total_hours = total_weeks * hours_per_week
    # Gather time estimates for each skill
    skills_with_time = []
    for skill in ordered_skills:
        est = LEARNING_TIME_ESTIMATES.get(skill, 6)  # default 6 hours if unknown
        skills_with_time.append({'skill': skill, 'hours': est})

    # Warn if plan exceeds available time
    total_skill_hours = sum(item['hours'] for item in skills_with_time)
    warning = None
    if total_skill_hours > total_hours:
        warning = f"Your plan requires {total_skill_hours} hours, but you only have {total_hours} hours. Consider increasing your weeks or hours per week."

    # Sort by estimated time descending
    skills_with_time.sort(key=lambda x: -x['hours'])

    # Distribute skills across weeks, splitting large skills if needed
    plan = [[] for _ in range(total_weeks)]
    week_hours = [0] * total_weeks
    for item in skills_with_time:
        hours_left = item['hours']
        skill_name = item['skill']
        while hours_left > 0:
            idx = week_hours.index(min(week_hours))
            available = hours_per_week - week_hours[idx]
            if available <= 0:
                available = hours_left
            assign_hours = min(hours_left, available)
            plan[idx].append({'skill': skill_name, 'hours': assign_hours, 'total_hours': item['hours']})
            week_hours[idx] += assign_hours
            hours_left -= assign_hours

    # Attach resources for each skill, selecting by available time
    roadmap = []
    for i, week_skills in enumerate(plan):
        if not week_skills:
            continue  # skip empty weeks
        week_plan = []
        for skill_obj in week_skills:
            skill = skill_obj['skill']
            available_minutes = skill_obj['hours'] * 60
            resources = LEARNING_RESOURCES.get(skill, [
                {"label": "Google Search", "url": f'https://www.google.com/search?q=learn+{skill.replace(" ", "+")}', "type": "Search", "minutes": 30 }
            ])
            # Select resources to fit available_minutes, prioritize Quick Start, then Docs, then In-Depth
            selected = []
            total = 0
            for t in ["Quick Start", "Video", "Docs", "In-Depth"]:
                for res in resources:
                    if res["type"] == t and res not in selected and total + res["minutes"] <= available_minutes:
                        selected.append(res)
                        total += res["minutes"]
            # If nothing fits, just add the shortest resource
            if not selected and resources:
                selected = [min(resources, key=lambda r: r["minutes"])]
            week_plan.append({
                'skill': skill,
                'hours': skill_obj['hours'],
                'total_hours': skill_obj['total_hours'],
                'resources': selected
            })
        roadmap.append({
            'week': i + 1,
            'skills': week_plan
        })

    return jsonify({'roadmap': roadmap, 'total_weeks': total_weeks, 'hours_per_week': hours_per_week, 'warning': warning})

@app.route('/chatbot', methods=['POST'])
def chatbot():
    data = request.get_json()
    question = data.get('question', '').lower()
    matched_skills = data.get('matchedSkills', [])
    missing_skills = data.get('missingSkills', [])
    # Expanded rule-based responses
    if not question:
        return jsonify({'answer': "Please ask a question about your roadmap, skills, or learning resources."})
    if "what skills" in question and ("do i have" in question or "my skills" in question or "matched" in question):
        if matched_skills:
            return jsonify({'answer': f"You have these skills: {', '.join(matched_skills)}."})
        else:
            return jsonify({'answer': "No matched skills found yet. Please analyze your resume first."})
    if ("what skills" in question and ("am i missing" in question or "missing" in question)) or ("missing skills" in question):
        if missing_skills:
            return jsonify({'answer': f"You are missing these skills: {', '.join(missing_skills)}."})
        else:
            return jsonify({'answer': "No missing skills found!"})
    if "tailwind" in question:
        return jsonify({'answer': "To learn Tailwind CSS, start with the official docs (https://tailwindcss.com/docs/installation), try a crash course video, and practice by building small UI components. Focus on utility classes and responsive design!"})
    if "roadmap" in question:
        return jsonify({'answer': "Your roadmap is a week-by-week plan to learn your missing skills. Each week, focus on the listed skills and use the recommended resources. Adjust the time and order as needed for your schedule."})
    if "skill gap" in question:
        return jsonify({'answer': "A skill gap is the difference between the skills you have (from your resume) and the skills required for your target job. The app helps you identify and close these gaps."})
    if "how do i use" in question or "how to use" in question:
        return jsonify({'answer': "Upload your resume, select a target role, and click Analyze. Then, review your missing skills and generate a personalized roadmap to guide your learning!"})
    if "resource" in question or "learn" in question:
        return jsonify({'answer': "For each missing skill, use the recommended resources (videos, docs, tutorials) provided in your roadmap. Start with 'Quick Start' if you have limited time."})
    if "resume" in question:
        return jsonify({'answer': "For a strong resume: keep it concise, highlight relevant skills and achievements, use action verbs, and tailor it to the job description. Proofread for errors!"})
    if "interview" in question:
        return jsonify({'answer': "For interviews: research the company, practice common questions, be ready to discuss your projects, and prepare questions to ask the interviewer. Stay calm and be yourself!"})
    if "motivation" in question or "stay motivated" in question:
        return jsonify({'answer': "Set small, achievable goals, track your progress, celebrate wins, and remember why you started. Learning is a journey—stay curious and persistent!"})
    if "react" in question:
        return jsonify({'answer': "React is a popular JavaScript library for building user interfaces. Start with the official docs (https://react.dev/learn) and try a crash course video. Practice by building small apps!"})
    if "python" in question:
        return jsonify({'answer': "Python is a versatile language. Start with a crash course video or interactive site like https://www.learnpython.org/. Practice by solving problems and building projects!"})
    if "sql" in question:
        return jsonify({'answer': "SQL is used for managing databases. Try SQLBolt (https://www.sqlbolt.com/) or the freeCodeCamp SQL video. Practice writing queries on sample databases!"})
    if "node" in question:
        return jsonify({'answer': "Node.js lets you run JavaScript on the server. Start with a crash course video (Traversy Media or freeCodeCamp) and build a simple API or CLI tool."})
    if "stuck" in question or "trouble" in question or "problem" in question:
        return jsonify({'answer': "If you're stuck, break the problem down, search for solutions, ask for help, and take breaks. Learning is about persistence!"})
    # Default fallback
    return jsonify({'answer': "I'm not sure how to answer that. Try asking about your skills, missing skills, learning resources, how to use the app, resume tips, or motivation!"})

USERS = {}

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')  # NEW
    password = data.get('password')
    if not username or not password or not email:
        return jsonify({'error': 'Username, email, and password required.'}), 400
    if username in USERS:
        return jsonify({'error': 'Username already exists.'}), 400
    USERS[username] = {
        'password': generate_password_hash(password),
        'email': email
    }
    return jsonify({'message': 'Signup successful.'})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password required.'}), 400
    user_hash = USERS.get(username)
    if not user_hash or not check_password_hash(user_hash, password):
        return jsonify({'error': 'Invalid credentials.'}), 401
    return jsonify({'message': 'Login successful.'})

@app.route('/profile', methods=['POST'])
def profile():
    data = request.get_json()
    username = data.get('username')
    user = USERS.get(username)
    if not user:
        return jsonify({'error': 'User not found.'}), 404
    return jsonify({'username': username, 'email': user.get('email', '')})

# Run app
if __name__ == '__main__':
    app.run(debug=True)
