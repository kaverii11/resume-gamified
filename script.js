// Game Configuration
const CONFIG = {
    tileSize: 32,
    playerSpeed: 3,
    canvasWidth: 1200,
    canvasHeight: 800,
    interactionDistance: 50
};

// Game State
const gameState = {
    player: {
        x: 400,
        y: 400,
        width: 32,
        height: 32,
        speed: CONFIG.playerSpeed,
        direction: 'down',
        isMoving: false,
        frame: 0,
        frameCounter: 0
    },
    keys: {},
    mobileKeys: {},
    camera: { x: 0, y: 0 },
    hotspots: [],
    resumeData: null,
    isMuted: false,
    nearestHotspot: null
};

// Canvas Setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.canvasWidth;
canvas.height = CONFIG.canvasHeight;

// Load Resume Data
async function loadResumeData() {
    try {
        const response = await fetch('data/resume-data.json');
        gameState.resumeData = await response.json();
        initializeHotspots();
    } catch (error) {
        console.error('Failed to load resume data:', error);
        // Fallback data
        gameState.resumeData = getFallbackData();
        initializeHotspots();
    }
}

function getFallbackData() {
    return {
        personal: {
            name: "Kaveri Sharma",
            title: "Computer Science Student",
            email: "kaveri@example.com"
        },
        summary: "Passionate developer and problem solver",
        experience: [],
        education: [],
        projects: [],
        skills: { languages: [], frameworks: [], tools: [] },
        funFacts: []
    };
}

// Initialize Hotspots (Interactive Buildings/Objects)
function initializeHotspots() {
    gameState.hotspots = [
        {
            id: 'about',
            x: 300,
            y: 200,
            width: 100,
            height: 120,
            label: 'ABOUT ME',
            icon: '👤',
            color: '#ff006e',
            type: 'building'
        },
        {
            id: 'experience',
            x: 600,
            y: 180,
            width: 120,
            height: 150,
            label: 'EXPERIENCE',
            icon: '💼',
            color: '#00f5ff',
            type: 'building'
        },
        {
            id: 'projects',
            x: 900,
            y: 200,
            width: 110,
            height: 130,
            label: 'PROJECTS',
            icon: '💻',
            color: '#b967ff',
            type: 'building'
        },
        {
            id: 'skills',
            x: 250,
            y: 450,
            width: 90,
            height: 80,
            label: 'SKILLS',
            icon: '🛠️',
            color: '#ffea00',
            type: 'object'
        },
        {
            id: 'education',
            x: 700,
            y: 500,
            width: 130,
            height: 100,
            label: 'EDUCATION',
            icon: '🎓',
            color: '#ff006e',
            type: 'building'
        },
        {
            id: 'contact',
            x: 500,
            y: 600,
            width: 60,
            height: 70,
            label: 'CONTACT',
            icon: '📧',
            color: '#00f5ff',
            type: 'object'
        },
        {
            id: 'fun',
            x: 1000,
            y: 550,
            width: 70,
            height: 60,
            label: 'FUN FACTS',
            icon: '⭐',
            color: '#ffea00',
            type: 'object'
        }
    ];
}

// Input Handling
function setupInputHandlers() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
            e.preventDefault();
            gameState.keys[key] = true;

            if (key === ' ' || key === 'enter') {
                handleInteraction();
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        gameState.keys[key] = false;
    });

    // Mobile Controls
    document.querySelectorAll('.dpad-btn, .action-btn').forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const key = btn.dataset.key;
            gameState.mobileKeys[key] = true;

            if (key === 'space') {
                handleInteraction();
            }
        });

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            const key = btn.dataset.key;
            gameState.mobileKeys[key] = false;
        });
    });

    // Modal Controls
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') {
            closeModal();
        }
    });

    // Mute Button
    document.getElementById('mute-btn').addEventListener('click', toggleMute);
}

// Player Movement
function updatePlayer() {
    const prevX = gameState.player.x;
    const prevY = gameState.player.y;
    let moving = false;

    // Combine keyboard and mobile inputs
    const keys = { ...gameState.keys, ...gameState.mobileKeys };

    if (keys['w'] || keys['arrowup'] || keys['up']) {
        gameState.player.y -= gameState.player.speed;
        gameState.player.direction = 'up';
        moving = true;
    }
    if (keys['s'] || keys['arrowdown'] || keys['down']) {
        gameState.player.y += gameState.player.speed;
        gameState.player.direction = 'down';
        moving = true;
    }
    if (keys['a'] || keys['arrowleft'] || keys['left']) {
        gameState.player.x -= gameState.player.speed;
        gameState.player.direction = 'left';
        moving = true;
    }
    if (keys['d'] || keys['arrowright'] || keys['right']) {
        gameState.player.x += gameState.player.speed;
        gameState.player.direction = 'right';
        moving = true;
    }

    // Collision Detection
    if (checkCollision()) {
        gameState.player.x = prevX;
        gameState.player.y = prevY;
    }

    // Boundary Checking
    gameState.player.x = Math.max(0, Math.min(gameState.player.x, 1200 - gameState.player.width));
    gameState.player.y = Math.max(0, Math.min(gameState.player.y, 800 - gameState.player.height));

    // Animation
    gameState.player.isMoving = moving;
    if (moving) {
        gameState.player.frameCounter++;
        if (gameState.player.frameCounter > 10) {
            gameState.player.frame = (gameState.player.frame + 1) % 4;
            gameState.player.frameCounter = 0;
        }
    } else {
        gameState.player.frame = 0;
    }

    // Check for nearby hotspots
    checkNearbyHotspots();
}

function checkCollision() {
    const player = gameState.player;

    for (const hotspot of gameState.hotspots) {
        if (hotspot.type === 'building') {
            if (player.x < hotspot.x + hotspot.width &&
                player.x + player.width > hotspot.x &&
                player.y < hotspot.y + hotspot.height &&
                player.y + player.height > hotspot.y) {
                return true;
            }
        }
    }
    return false;
}

function checkNearbyHotspots() {
    const player = gameState.player;
    let nearest = null;
    let minDistance = CONFIG.interactionDistance;

    for (const hotspot of gameState.hotspots) {
        const centerX = hotspot.x + hotspot.width / 2;
        const centerY = hotspot.y + hotspot.height / 2;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        const distance = Math.sqrt(
            Math.pow(centerX - playerCenterX, 2) +
            Math.pow(centerY - playerCenterY, 2)
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearest = hotspot;
        }
    }

    gameState.nearestHotspot = nearest;

    // Show/hide interaction prompt
    const prompt = document.getElementById('interaction-prompt');
    if (nearest) {
        prompt.classList.remove('hidden');
    } else {
        prompt.classList.add('hidden');
    }
}

function handleInteraction() {
    if (gameState.nearestHotspot) {
        openModal(gameState.nearestHotspot.id);
    }
}

// Modal System
function openModal(sectionId) {
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-content');

    const hotspot = gameState.hotspots.find(h => h.id === sectionId);
    if (!hotspot) return;

    title.textContent = hotspot.label;
    content.innerHTML = generateModalContent(sectionId);

    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

function generateModalContent(sectionId) {
    const data = gameState.resumeData;
    let html = '';

    switch (sectionId) {
        case 'about':
            html = `
                <h3>${data.personal.name}</h3>
                <p>${data.personal.title}</p>
                <p style="margin-top: 15px;">${data.summary}</p>
            `;
            break;

        case 'experience':
            html = '<h3>Work Experience</h3>';
            data.experience.forEach(exp => {
                html += `
                    <div style="margin-bottom: 20px;">
                        <p style="color: #ff006e;"><strong>${exp.title}</strong></p>
                        <p>${exp.company} | ${exp.duration}</p>
                        <ul>
                            ${exp.description.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                `;
            });
            break;

        case 'projects':
            html = '<h3>Featured Projects</h3>';
            data.projects.forEach(proj => {
                html += `
                    <div style="margin-bottom: 20px;">
                        <p style="color: #b967ff;"><strong>${proj.name}</strong></p>
                        <p><em>${proj.tech}</em></p>
                        <p>${proj.description}</p>
                        <ul>
                            ${proj.highlights.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                `;
            });
            break;

        case 'skills':
            html = '<h3>Technical Skills</h3>';
            html += `
                <div style="margin-bottom: 15px;">
                    <p><strong>Languages:</strong></p>
                    <div>
                        ${data.skills.languages.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                    </div>
                </div>
                <div style="margin-bottom: 15px;">
                    <p><strong>Frameworks:</strong></p>
                    <div>
                        ${data.skills.frameworks.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                    </div>
                </div>
                <div style="margin-bottom: 15px;">
                    <p><strong>Tools:</strong></p>
                    <div>
                        ${data.skills.tools.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                    </div>
                </div>
                <div>
                    <p><strong>Concepts:</strong></p>
                    <div>
                        ${data.skills.concepts.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                    </div>
                </div>
            `;
            break;

        case 'education':
            html = '<h3>Education</h3>';
            data.education.forEach(edu => {
                html += `
                    <div style="margin-bottom: 20px;">
                        <p style="color: #ff006e;"><strong>${edu.degree}</strong></p>
                        <p>${edu.institution} | ${edu.duration}</p>
                        <p>GPA: ${edu.gpa}</p>
                        <ul>
                            ${edu.highlights.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                `;
            });
            if (data.certifications && data.certifications.length > 0) {
                html += '<h3 style="margin-top: 20px;">Certifications</h3><ul>';
                data.certifications.forEach(cert => {
                    html += `<li>${cert}</li>`;
                });
                html += '</ul>';
            }
            break;

        case 'contact':
            html = `
                <h3>Get In Touch</h3>
                <p><strong>Email:</strong> ${data.personal.email}</p>
                <p><strong>Phone:</strong> ${data.personal.phone}</p>
                <p><strong>Location:</strong> ${data.personal.location}</p>
                <p style="margin-top: 15px;"><strong>LinkedIn:</strong> ${data.personal.linkedin}</p>
                <p><strong>GitHub:</strong> ${data.personal.github}</p>
            `;
            break;

        case 'fun':
            html = '<h3>Fun Facts & Hobbies</h3><ul>';
            data.funFacts.forEach(fact => {
                html += `<li>${fact}</li>`;
            });
            html += '</ul>';
            break;
    }

    return html;
}

function toggleMute() {
    gameState.isMuted = !gameState.isMuted;
    const btn = document.getElementById('mute-btn');
    btn.textContent = gameState.isMuted ? '🔇' : '🔊';
}

// Rendering
function drawCity() {
    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0e27');
    gradient.addColorStop(1, '#1a1f3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 100; i++) {
        const x = (i * 137) % canvas.width;
        const y = (i * 211) % canvas.height;
        ctx.fillRect(x, y, 2, 2);
    }

    // Grid (optional cyberpunk effect)
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Roads
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 350, canvas.width, 80);
    ctx.fillRect(450, 0, 80, canvas.height);

    // Road lines
    ctx.strokeStyle = '#ffea00';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(0, 390);
    ctx.lineTo(canvas.width, 390);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(490, 0);
    ctx.lineTo(490, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawHotspots() {
    gameState.hotspots.forEach(hotspot => {
        // Building/Object
        ctx.fillStyle = hotspot.color;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(hotspot.x, hotspot.y, hotspot.width, hotspot.height);
        ctx.globalAlpha = 1;

        // Border
        ctx.strokeStyle = hotspot.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(hotspot.x, hotspot.y, hotspot.width, hotspot.height);

        // Glow effect
        if (gameState.nearestHotspot === hotspot) {
            ctx.shadowColor = hotspot.color;
            ctx.shadowBlur = 20;
            ctx.strokeRect(hotspot.x, hotspot.y, hotspot.width, hotspot.height);
            ctx.shadowBlur = 0;
        }

        // Icon
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(
            hotspot.icon,
            hotspot.x + hotspot.width / 2,
            hotspot.y + hotspot.height / 2
        );

        // Label
        ctx.font = '10px "Press Start 2P"';
        ctx.fillStyle = hotspot.color;
        ctx.fillText(
            hotspot.label,
            hotspot.x + hotspot.width / 2,
            hotspot.y - 10
        );
    });
}

function drawPlayer() {
    const p = gameState.player;

    // Simple character representation (colored square with direction indicator)
    ctx.fillStyle = '#00f5ff';
    ctx.fillRect(p.x, p.y, p.width, p.height);

    // Border
    ctx.strokeStyle = '#ff006e';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.width, p.height);

    // Direction indicator
    ctx.fillStyle = '#ffea00';
    const centerX = p.x + p.width / 2;
    const centerY = p.y + p.height / 2;

    switch (p.direction) {
        case 'up':
            ctx.fillRect(centerX - 4, p.y + 5, 8, 8);
            break;
        case 'down':
            ctx.fillRect(centerX - 4, p.y + p.height - 13, 8, 8);
            break;
        case 'left':
            ctx.fillRect(p.x + 5, centerY - 4, 8, 8);
            break;
        case 'right':
            ctx.fillRect(p.x + p.width - 13, centerY - 4, 8, 8);
            break;
    }

    // Glow effect
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 10;
    ctx.strokeRect(p.x, p.y, p.width, p.height);
    ctx.shadowBlur = 0;
}

// Game Loop
function gameLoop() {
    updatePlayer();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCity();
    drawHotspots();
    drawPlayer();

    requestAnimationFrame(gameLoop);
}

// Initialize Game
async function init() {
    await loadResumeData();
    setupInputHandlers();

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 1000);

    gameLoop();
}

// Start the game
init();
