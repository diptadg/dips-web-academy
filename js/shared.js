/**
 * shared.js - Runs on every page.
 *
 * What it does:
 *  1. Dark/light mode toggle (saved to localStorage)
 *  2. Back-to-top floating button
 *  3. Mobile hamburger menu open/close
 *  4. Scroll-based fade-in animations
 *  5. Snackbar toast notifications
 */

$(document).ready(function () {

  // Tell CSS that JavaScript loaded successfully
  document.documentElement.classList.add('js-loaded');

  // ==========================================
  // STARFIELD BACKGROUND ANIMATION
  // Creates a canvas behind all content with
  // small dots that drift slowly downward.
  // When a star goes off screen, it restarts
  // at the top at a random x position.
  // ==========================================

  var canvas = document.createElement('canvas');
  canvas.id = 'starfield';
  document.body.prepend(canvas);
  var ctx = canvas.getContext('2d');
  var stars = [];
  var STAR_COUNT = 1000;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  $(window).on('resize', resizeCanvas);

  // Create stars with random positions, sizes, and speeds
  for (var i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,       // radius 0.5–2px
      speed: Math.random() * 0.3 + 0.1,    // drift speed
      opacity: Math.random() * 0.5 + 0.2   // 0.2–0.7
    });
  }

  function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pick star colour based on current theme
    var isDarkMode = document.documentElement.classList.contains('dark') ||
      (!document.documentElement.classList.contains('light') &&
       window.matchMedia('(prefers-color-scheme: dark)').matches);
    var isLightMode = document.documentElement.classList.contains('light');
    var baseColor = isLightMode ? '0, 120, 140' : (isDarkMode ? '0, 200, 220' : '0, 180, 200');

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + baseColor + ', ' + s.opacity + ')';
      ctx.fill();

      // Move star downward
      s.y += s.speed;

      // Reset to top when it drifts off screen
      if (s.y > canvas.height + 5) {
        s.y = -5;
        s.x = Math.random() * canvas.width;
      }
    }
    requestAnimationFrame(drawStars);
  }
  drawStars();

  // ==========================================
  // 1. DARK MODE TOGGLE
  // Click the moon/sun button to switch themes.
  // Uses .dark or .light class on <html> to override
  // the system preference. Saved to localStorage.
  // ==========================================

  // Detect what the page is currently showing (system preference)
  var systemPrefersDark = window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Load saved preference, or fall back to system preference
  var isDark = systemPrefersDark;
  try {
    var saved = localStorage.getItem('dark_mode');
    if (saved !== null) isDark = (saved === 'true');
  } catch (e) {}

  // Apply the theme on page load
  function applyTheme() {
    $('html').removeClass('dark light');
    $('html').addClass(isDark ? 'dark' : 'light');
    $('#themeToggleIcon').text(isDark ? 'light_mode' : 'dark_mode');
  }
  applyTheme();

  // Toggle between dark and light when button is clicked
  $('#themeToggleBtn').on('click', function () {
    isDark = !isDark;
    applyTheme();
    try { localStorage.setItem('dark_mode', isDark); } catch (e) {}
  });

  // ==========================================
  // 2. BACK-TO-TOP BUTTON
  // Shows after scrolling 400px, scrolls to top on click.
  // ==========================================

  $(window).on('scroll', function () {
    if ($(window).scrollTop() > 400) {
      $('#backToTopBtn').addClass('visible');
    } else {
      $('#backToTopBtn').removeClass('visible');
    }
  });

  $('#backToTopBtn').on('click', function () {
    $('html, body').animate({ scrollTop: 0 }, 500);
  });

  // ==========================================
  // 3. MOBILE NAVIGATION DRAWER
  // Opens on hamburger click, closes on overlay click.
  // ==========================================

  $('#menuToggleBtn').on('click', function () {
    $('#mobileDrawer').addClass('open');
    $('#drawerOverlay').css('display', 'block');
    setTimeout(function () { $('#drawerOverlay').addClass('open'); }, 10);
  });

  $('#drawerOverlay').on('click', function () {
    $('#mobileDrawer').removeClass('open');
    $('#drawerOverlay').removeClass('open');
    setTimeout(function () { $('#drawerOverlay').css('display', 'none'); }, 400);
  });

  // ==========================================
  // 4. SCROLL FADE-IN ANIMATIONS
  // Elements with class "fade-in" get "in-view" when
  // they scroll into the viewport.
  // ==========================================

  function triggerFadeIns() {
    $('.fade-in').each(function () {
      if (this.getBoundingClientRect().top < window.innerHeight * 0.92) {
        $(this).addClass('in-view');
      }
    });
  }

  $(window).on('scroll resize', triggerFadeIns);
  triggerFadeIns();
  window.triggerFadeIns = triggerFadeIns;

  // ==========================================
  // 5. SNACKBAR (TOAST NOTIFICATION)
  // Shows a message at the bottom for 2.5 seconds.
  // ==========================================

  var snackbarTimer = null;

  function showSnackbar(message) {
    var $bar = $('#snackbar');
    $bar.text(message);
    if (snackbarTimer) clearTimeout(snackbarTimer);
    $bar.addClass('show');
    snackbarTimer = setTimeout(function () { $bar.removeClass('show'); }, 2500);
  }

  window.showSnackbar = showSnackbar;

});
