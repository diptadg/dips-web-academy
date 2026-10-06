# Dip's Web Academy - Multi-Page Interactive Web Application

**Live demo:** https://diptadg.github.io/dips-web-academy/

## Overview

A two-page interactive web application demonstrating HTML, CSS, and JavaScript fundamentals. Built with a unified Material Design 3 theme, responsive layout, and accessible design.

## Pages

| Page | File | Description |
|------|------|-------------|
| **Tutorial** | `index.html` | Interactive tutorial covering HTML, CSS, and JavaScript with 14 live demos, cheatsheets, and code examples |
| **Quiz** | `quiz.html` | Dynamic quiz with AJAX-loaded questions, randomisation, scoring, public API reward, and localStorage history |

## How to Run

This project uses AJAX to load quiz questions from a local JSON file. **You must serve it from a local web server** - opening `index.html` directly via `file://` will cause AJAX requests to fail due to browser security restrictions.

### Get the code

```bash
git clone https://github.com/diptadg/dips-web-academy.git
cd dips-web-academy
```

### Quick Start (choose one), from inside `dips-web-academy/`:

```bash
# Option 1: VS Code Live Server extension (recommended)
# Install "Live Server" extension, right-click index.html → "Open with Live Server"

# Option 2: Python
python -m http.server 8000
# Then open http://localhost:8000

# Option 3: Node.js
npx serve .
# Then open the URL shown in terminal

# Option 4: PHP
php -S localhost:8000
```

## Folder Structure

```
dips-web-academy/
├── index.html              # Landing page + Interactive tutorial
├── quiz.html               # Quiz page
├── favicon.svg             # Site favicon
├── css/
│   ├── style.css           # Shared Material Design 3 stylesheet
│   ├── landing.css         # Landing page hero, cards, animations
│   └── quiz.css            # Quiz page styles
├── js/
│   ├── shared.js           # Shared: dark mode toggle, back-to-top, mobile nav
│   ├── landing.js          # Landing: typing animation, scroll reveal, syntax highlighting
│   ├── tutorial.js         # Tutorial: 14 interactive demo handlers
│   └── quiz.js             # Quiz: AJAX, scoring, timer, reward, localStorage
├── data/
│   └── questions.json      # Quiz questions (loaded via AJAX at runtime)
└── README.md               # This file
```

## Key Features

- **Material Design 3** theming with light/dark mode (system preference + manual toggle)
- **14 interactive demos** across HTML, CSS, and JavaScript tutorials
- **AJAX** quiz loading from local JSON file with Fisher-Yates randomisation
- **jQuery** for DOM manipulation, event handling, and AJAX calls
- **localStorage** for quiz attempt history with try/catch for private browsing
- **Public API integration** (DummyJSON Quotes API for quiz reward quotes)
- **Responsive design** with mobile navigation drawer (tested 320px–1440px)
- **Accessibility**: skip-to-content link, ARIA attributes, semantic HTML, keyboard navigation
- **Quiz demo mode** for instructor demonstrations (simulate pass/fail results)
- **Quiz timer** (count-up, non-enforced, saved to history)
- **Skeleton loading** placeholders with shimmer animation
- **Matrix-inspired code rain** canvas animation behind the landing hero (theme-aware, pauses when scrolled away, off when the OS requests reduced motion)

## Technologies Used

| Technology | Purpose |
|------------|---------|
| HTML5 | Semantic page structure |
| CSS3 | MD3 theming, custom properties, Flexbox, Grid, animations |
| JavaScript (ES5/6) | Interactivity, DOM manipulation, async operations |
| jQuery 3.7.1 | DOM queries, event handling, AJAX (loaded via CDN) |
| Google Fonts | Outfit (body) + Source Code Pro (code) |
| Material Symbols | Icon font (loaded via CDN) |
| DummyJSON Quotes API | Public API for motivational quote on quiz pass |

## Browser Compatibility

Tested and verified on:
- Google Chrome (latest)
- Mozilla Firefox (latest)
- Microsoft Edge (latest)
- Safari (latest)

## Validation

- HTML validated with [W3C Markup Validation Service](https://validator.w3.org/)
- CSS validated with [W3C CSS Validation Service](https://jigsaw.w3.org/css-validator/)
- JavaScript syntax verified with Node.js `--check` flag
- All ampersands properly escaped in HTML text and attributes
- No inline event handlers (all event binding via jQuery `.on()`)
- Zero global JavaScript variables

## AI Usage

AI tools (Claude, ChatGPT) were used as development assistants.

## Author

Dipta Datta Gupta  
Master of Information Technology - University of Western Australia  
2026
