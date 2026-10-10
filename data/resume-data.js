// Resume content shown in the game. Edit this file to update the site.
// (Loaded as a plain script rather than fetched JSON so the game also works
// when index.html is opened straight from disk.)
window.RESUME_DATA = {
    personal: {
        name: 'Kaveri Sharma',
        title: 'B.Tech Computer Science, PES University',
        location: 'Bengaluru, Karnataka',
        email: 'kaveri05sharma@gmail.com',
        github: 'https://github.com/kaverii11',
        linkedin: 'https://www.linkedin.com/in/kaveri-sharma-aiml/',
        portfolio: 'https://portfolio-kaverii11.vercel.app/',
    },

    summary:
        'Final-year Computer Science student at PES University (graduating 2027) who builds across ' +
        'full-stack, ML and GenAI: from a RAG-powered support platform to GPU-accelerated ' +
        'geospatial routing that placed 2nd nationally at the AMD Slingshot Challenge.',

    education: [
        {
            degree: 'Bachelor of Technology in Computer Science',
            institution: 'PES University, Bengaluru',
            duration: 'Expected 2027',
            highlights: [
                'Relevant coursework: Data Science, ML & Database Systems, Data Structures & Algorithms, Web Development',
            ],
        },
    ],

    experience: [
        {
            title: 'Data & Analytics Engineering Intern',
            company: 'National Capital Region Transport Corporation (NCRTC)',
            duration: 'Jun 2025 – Aug 2025 · New Delhi (On-site)',
            description: [
                'Built and deployed a real-time transport analytics dashboard for the PM e-Bus Sewa initiative, unifying 3+ heterogeneous fleet/ridership sources into a single CMS-integrated UI for NCR stakeholders',
                'Translated government policy KPIs into interactive visualization workflows, cutting stakeholder time-to-insight from hours to minutes and removing analyst dependency for daily reviews',
            ],
            tech: 'Data Visualization, Web Development, CMS Integration',
        },
    ],

    projects: [
        {
            name: 'OptiSolve',
            tech: 'React, FastAPI, ChromaDB, Groq/SambaNova',
            link: 'https://github.com/kaverii11/Optisolve',
            highlights: [
                '3-tier customer support orchestration platform routing tickets across auto-resolve, AI-assisted and escalate tiers based on AI confidence scores and real-time sentiment analysis',
                'RAG pipeline (ChromaDB, Groq Llama 3.3 for drafts, SambaNova/Llama 3.1 for sentiment scoring) with a human-in-the-loop engine updating the knowledge base from agent corrections, giving a 30–40% reduction in MTTR',
                'Pre-submission "Gatekeeper" layer that analyzes drafts in real time and suggests fixes before ticket creation, achieving 20–30% ticket deflection',
            ],
        },
        {
            name: 'CityOS (Spatial Logistics Engine)',
            tech: 'Python, React, AMD ROCm, Sentinel-2, OSM',
            link: 'https://github.com/kaverii11/Spatial-Engine',
            highlights: [
                'GovTech spatial logistics engine using AMD-accelerated graph routing across 300,000+ street nodes to minimize urban inequality (Spatial Gini Coefficient), accelerating computations 4,064x (14 hrs down to 12 sec) on AMD ROCm GPUs',
                'Replaced outdated census data with Sentinel-2 satellite imagery and OpenStreetMap to map informal settlements using true walkable street distances',
                'React live dashboard with 5-second GPU-accelerated re-optimization (8.5x faster than CPU), generalized to healthcare, fire stations and warehouse siting across any searchable city',
            ],
        },
        {
            name: 'Personalized Digital Twin for Heart Failure Prediction',
            tech: 'Kitware Pulse, Docker, XGBoost',
            link: 'https://github.com/Mrunmayi019/M2K-HF-PULSE/commits?author=kaverii11',
            highlights: [
                'Heart-failure decompensation monitoring system integrating the Kitware Pulse physiology engine in a Dockerized pipeline, translating patient vitals (HR, SpO2, BP, RR) into simulated trajectories via a rule-based clinical triage layer',
                'Interpretable HF staging and risk-scoring model (LOW/MODERATE/HIGH across NYHA stages A–D) with 7/14/30-day risk trajectory forecasting',
                'Currently authoring a research paper formalizing this interpretable risk-scoring methodology for peer-reviewed publication',
            ],
        },
    ],

    achievements: [
        {
            title: 'National 2nd Place, AMD Slingshot Challenge',
            date: 'May 2026',
            detail: 'Won INR 3,00,000, ranking 2nd among 40,000+ registrations and 4,000+ competing prototypes for CityOS, a scalable geospatial AI solution.',
        },
        {
            title: 'Shortlisted, Atos SRiJAN Hackathon',
            date: 'May 2026',
            detail: "1 of only 5 finalist teams for OptiSolve (2 university teams, rest startups). Presented to Atos's UKI & India leadership.",
        },
    ],

    skills: {
        'Languages': ['Python', 'C++', 'Java', 'SQL', 'JavaScript', 'TypeScript'],
        'Data & ML': ['PyTorch/Keras', 'TensorFlow', 'Pandas', 'NumPy', 'Scikit-learn'],
        'Full Stack': ['Next.js', 'React', 'REST APIs', 'JSON', 'Data Visualization'],
        'Tools & Databases': ['MySQL', 'Firebase Firestore', 'Git/GitHub', 'Docker'],
        'GenAI & NLP': ['LLMs', 'RAG', 'NLP', 'Prompt Engineering', 'Hugging Face'],
    },

    leadership: [
        {
            role: 'Web Development Domain Head',
            org: 'Encode AI',
            duration: 'Oct 2024 – Present',
            detail: 'Organized workshops on emerging AI tech and rapid development frameworks for 100+ students.',
        },
        {
            role: 'Research and Content Domain Head',
            org: 'ACM-W',
            duration: 'Oct 2024 – Present',
            detail: 'Researched trending topics, designed challenge formats for hackathons, and curated messaging and speeches for club events.',
        },
    ],
};
