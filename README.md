# 🎮 Pixel-Art City Resume

An interactive, nostalgic pixel-art city exploration game that serves as a unique web resume. Walk around a cyberpunk city at night, interact with neon-lit buildings to explore different sections of the resume.

## 🌟 Features

- **Retro 16-bit Aesthetic**: Cyberpunk city with neon lights, inspired by Game Boy Advance / SNES era
- **Interactive Gameplay**: Use arrow keys or WASD to move your character around the city
- **7 Interactive Hotspots**: Each building/object reveals different resume sections
- **Responsive Design**: Works on desktop and mobile with touch controls
- **Smooth Animations**: Character movement, neon glow effects, and modal transitions
- **Modal System**: Clean, pixel-art styled pop-ups for resume content

## 🎯 Interactive Sections

1. **About Me** - Personal bio and summary
2. **Experience** - Work history and achievements
3. **Projects** - Featured portfolio projects
4. **Skills** - Technical skills and tools
5. **Education** - Academic background and certifications
6. **Contact** - Get in touch information
7. **Fun Facts** - Hobbies and interests

## 🚀 Quick Start

### Option 1: Open Directly
Simply open `index.html` in a modern web browser.

### Option 2: Local Server (Recommended)
```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

## 🎮 Controls

### Desktop
- **Arrow Keys** or **WASD**: Move character
- **SPACE** or **ENTER**: Interact with nearby buildings/objects
- **ESC** or **Click X**: Close modals

### Mobile
- **Virtual D-Pad**: Move character
- **INTERACT Button**: Open nearby sections
- **Touch**: Tap outside modal to close

## 📁 Project Structure

```
pixel-city-resume/
├── index.html          # Main HTML structure
├── style.css           # Cyberpunk pixel-art styling
├── script.js           # Game engine and logic
├── data/
│   └── resume-data.json  # Resume content (EDIT THIS!)
├── assets/
│   ├── city-tileset.png  # Generated city assets
│   └── ui-elements.png   # UI components
└── README.md
```

## ✏️ Customization

### Update Resume Content
Edit `data/resume-data.json` with your own information:
- Personal details (name, email, links)
- Work experience
- Projects
- Skills
- Education
- Fun facts

### Modify Hotspot Positions
In `script.js`, find the `initializeHotspots()` function and adjust x, y coordinates.

### Change Color Scheme
In `style.css`, modify CSS variables:
```css
:root {
    --neon-pink: #ff006e;
    --neon-cyan: #00f5ff;
    --neon-yellow: #ffea00;
    --neon-purple: #b967ff;
}
```

## 🌐 Deployment

### Vercel
```bash
npm i -g vercel
vercel
```

### Netlify
Drag and drop the entire folder to [Netlify Drop](https://app.netlify.com/drop)

### GitHub Pages
1. Push to GitHub repository
2. Go to Settings → Pages
3. Select branch and root folder
4. Your site will be live at `https://username.github.io/repo-name`

## 🛠️ Technologies

- **Pure HTML5** - Structure
- **CSS3** - Styling with cyberpunk aesthetics
- **Vanilla JavaScript** - Game engine and interactions
- **HTML5 Canvas** - Rendering and animations
- **Google Fonts** - Press Start 2P pixel font

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🎨 Design Inspiration

- Retro 16-bit games (Pokémon, Zelda)
- Cyberpunk aesthetics
- Neon-lit cityscapes
- Interactive portfolio experiences

## 📝 License

Free to use and modify for personal portfolios.

## 🤝 Credits

Created with AI assistance for an interactive resume experience.

---

**Enjoy exploring the city! 🌃**
