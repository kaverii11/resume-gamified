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
        'full-stack, ML and GenAI: from a RAG-powered support platform and a regulatory knowledge-graph ' +
        'agent to a geospatial planning tool that placed 2nd nationally at the AMD Slingshot Challenge.',

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
            name: 'OptiSolve + OptiSolve-Docs',
            tech: 'Python, FastAPI, React, ChromaDB, Groq',
            link: 'https://github.com/kaverii11/optisolve-docs',
            highlights: [
                'RAG support-ticket platform that scores confidence from knowledge-base match strength and LLM sentiment analysis: Tier 1 auto-resolves, Tier 2 goes to human-in-the-loop review, Tier 3 escalates',
                'Self-learning loop saves every human correction back into the knowledge base, so similar tickets later auto-resolve; it adapts to any platform in any sector',
                'Document-parsing pipeline (PDF/DOCX/TXT) and a cross-encoder reranker; evaluated on a held-out set with zero wrong auto-resolves on 27 near-topic and off-topic questions, backed by 19 unit tests',
            ],
        },
        {
            name: 'SEBI Knowledge Graph Agent',
            tech: 'Python, LangGraph, OpenAI, Neo4j, Streamlit',
            link: 'https://github.com/kaverii11/Knowledge-Graph-Agent-',
            highlights: [
                'Turns unstructured SEBI regulatory circulars (PDFs) into a Neo4j knowledge graph of circulars, clauses, and the acts they reference or modify',
                'LangGraph pipeline: regex catches standard circular IDs, GPT-4o-mini extracts the rest as Pydantic-validated structured output, and anything below 0.7 confidence is re-routed to GPT-4o',
                'Text-to-Cypher Q&A using the live graph inventory, read-only queries, embedding-based entity merging, and a precision/recall/F1 eval script',
            ],
        },
        {
            name: 'HeartGuard AI (Capstone, journal paper in preparation)',
            tech: 'Scikit-learn, XGBoost, Kitware Pulse, Docker, BigQuery',
            link: 'https://github.com/Mrunmayi019/M2K-HF-PULSE/commits?author=kaverii11',
            highlights: [
                'Personalized digital twin that flags early heart-failure decline from daily vitals in a continuous day-to-day loop and runs forward projection',
                'Random Forest classifier sorts each day into 5 clinical scenarios at 91.3% held-out accuracy; the Pulse physiology engine simulates the patient\'s heart to give a risk score and a 4-stage NYHA class (I–IV)',
                'Pulled 11,837 MIMIC-IV hospital admissions with BigQuery; fixed a scoring bug that was inflating severity error, cutting MAE 34x (0.271 down to 0.008)',
            ],
        },
        {
            name: 'Aymora (AI Matchmaking App)',
            tech: 'TypeScript, Fastify, PostgreSQL/pgvector, Redis, Gemini',
            link: 'https://github.com/kaverii11/aymora',
            highlights: [
                'Gemini turns questionnaire answers into a structured profile and an embedding; users are matched by pgvector cosine similarity plus rule-based re-ranking',
                'Matching runs as BullMQ background jobs on Redis with retries and exponential backoff',
                'Razorpay payments with HMAC-SHA256 webhook verification, rate limiting, moderation and data deletion; deployed on Render + Supabase',
            ],
        },
        {
            name: 'CityOS (Spatial Logistics Engine)',
            tech: 'Python, React, NetworkX, OpenStreetMap, Sentinel-2',
            link: 'https://github.com/kaverii11/Spatial-Engine',
            highlights: [
                'Decides where a city should build its next facility (school, hospital, fire station or logistics hub) by finding neighborhoods outside every existing facility\'s coverage radius',
                'Geocodes any city in the world and runs Dijkstra shortest-path routing on its real OpenStreetMap street network',
                'Mapped neighborhoods from Sentinel-2 imagery via NDVI (vegetation) and NDBI (built-up) indices plus a Random Forest',
            ],
        },
        {
            name: 'Computer Vision Projects',
            tech: 'PyTorch, TensorFlow/Keras, OpenCV',
            link: 'https://github.com/kaverii11/marine-debris_cnn',
            highlights: [
                'Marine debris detection: ResNet-18 adapted to 11-band Sentinel-2 satellite images, 87% test accuracy (vs a 72% baseline) and debris F1 0.78; Grad-CAM shows it focuses on the debris',
                'Fire detection: a pretrained MobileNetV2 reaches 97% test accuracy and a CNN built from scratch 94% (vs a 75% baseline)',
                'Inventory counting (Stanford paper replication): SVMs on HOG/blob/PCA features vs fine-tuned ResNet-18/34 on Amazon bin photos',
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
            title: 'Finalist (1 of 5 teams), Atos SRiJAN Hackathon',
            date: 'Sep 2026',
            detail: "1 of only 5 finalist teams for OptiSolve (2 university teams, rest startups). Pitched to Atos's UKI & India leadership, who showed interest in adoption and internship consideration.",
        },
    ],

    skills: {
        'Languages': ['Python', 'C++', 'Java', 'SQL', 'JavaScript', 'TypeScript'],
        'Data & ML': ['PyTorch/Keras', 'TensorFlow', 'OpenCV', 'Scikit-learn', 'XGBoost', 'Pandas', 'NumPy'],
        'Full Stack': ['Next.js', 'React', 'FastAPI', 'Fastify', 'Node.js', 'REST APIs'],
        'Tools & Databases': ['PostgreSQL/pgvector', 'Neo4j', 'Redis', 'MySQL', 'Firebase Firestore', 'Git/GitHub', 'Docker'],
        'GenAI & NLP': ['LLMs', 'RAG', 'LangGraph', 'Embeddings', 'NLP', 'Prompt Engineering'],
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
