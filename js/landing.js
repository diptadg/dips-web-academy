/**
 * landing.js
 * ----------
 * Landing page functionality:
 * - Typing animation in the hero section
 * - Code rain animation behind the hero
 * - Scroll-reveal animations
 * - Topic card click → tab switching
 * - Syntax highlighting of tutorial code blocks
 *
 * Dependencies: jQuery 3.x, highlight.js, shared.js
 */

  $(document).ready(function () {

    // ==========================================
    // TYPING ANIMATION
    // Cycles through phrases, typing one character
    // at a time, then deleting and moving to the next.
    // ==========================================

    var phrases = ['the Modern Web.', 'with HTML.', 'with CSS.', 'with JavaScript.'];
    var phraseIndex = 0;      // Which phrase we're on
    var charIndex = 0;        // How many characters are showing
    var isDeleting = false;   // Are we deleting or typing?
    var $target = $('#typeTarget');

    function typeNextChar() {
      var currentPhrase = phrases[phraseIndex];

      if (!isDeleting) {
        // TYPE: show one more character
        charIndex++;
        $target.text(currentPhrase.substring(0, charIndex));

        if (charIndex === currentPhrase.length) {
          // Finished typing - wait, then start deleting
          isDeleting = true;
          setTimeout(typeNextChar, 2200);
        } else {
          setTimeout(typeNextChar, 70);
        }
      } else {
        // DELETE: remove one character
        charIndex--;
        $target.text(currentPhrase.substring(0, charIndex));

        if (charIndex === 0) {
          // Finished deleting - move to next phrase
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          setTimeout(typeNextChar, 400);
        } else {
          setTimeout(typeNextChar, 30);
        }
      }
    }

    typeNextChar(); // Start the animation

    // ==========================================
    // CODE RAIN (inspired by The Matrix)
    // Columns of characters fall down the hero.
    // Each column has one falling "drop". Every
    // frame we draw a random character at each
    // drop in a bright colour (the "head"), turn
    // the previous head into the trail colour,
    // then move the drop down one row. Older
    // characters are slowly erased, which leaves
    // a fading trail behind each head.
    // ==========================================

    function startCodeRain() {
      var canvas = document.getElementById('codeRain');
      if (!canvas) return;
      var ctx = canvas.getContext('2d');

      // Code symbols mixed with half-width katakana, as in the film
      var letters = '<>/{}[]();=+*#$:01ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎ'.split('');
      var fontSize = 16;     // Size of one cell, in pixels
      var drops = [];        // drops[i] = current row of column i
      var lastLetters = [];  // lastLetters[i] = current head character of column i

      // A random row above the top edge, so the columns don't all arrive at once
      function randomStartRow() {
        return Math.floor(Math.random() * -50);
      }

      // Match the canvas to the hero's size. Columns that already exist
      // keep falling; we only add or remove columns at the right edge.
      // (Mobile browsers fire 'resize' when the address bar slides away,
      // so starting every column over each time would look jumpy.)
      function resizeRain() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        var columns = Math.floor(canvas.width / fontSize);
        while (drops.length < columns) {
          drops.push(randomStartRow());
          lastLetters.push('');
        }
        drops = drops.slice(0, columns);
        lastLetters = lastLetters.slice(0, columns);
      }
      resizeRain();
      $(window).on('resize', resizeRain);

      function drawRain() {
        // 0. PAUSE: nothing to animate once the hero is scrolled out of view
        if ($(window).scrollTop() > canvas.offsetHeight) return;

        // 1. FADE: erase 10% of everything already drawn.
        //    'destination-out' means "erase" instead of "paint",
        //    so the hero's gradient still shows through.
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';

        // 2. COLOURS: a trail colour and a brighter head colour for each theme
        var isLight = document.documentElement.classList.contains('light');
        var trailColour = isLight ? '#00788c' : '#00e5ff';
        var headColour = isLight ? '#002b33' : '#e0fcff';
        ctx.font = fontSize + 'px "Source Code Pro", monospace';
        ctx.textBaseline = 'top'; // y is the top of the cell, so cells line up with rows

        for (var i = 0; i < drops.length; i++) {
          var x = i * fontSize;
          var y = drops[i] * fontSize;

          // 3. TRAIL: repaint last frame's head (one row up) in the trail colour
          if (lastLetters[i]) {
            ctx.clearRect(x, y - fontSize, fontSize, fontSize);
            ctx.fillStyle = trailColour;
            ctx.fillText(lastLetters[i], x, y - fontSize);
          }

          // 4. HEAD: draw a new random character in the bright colour
          var letter = letters[Math.floor(Math.random() * letters.length)];
          ctx.fillStyle = headColour;
          ctx.fillText(letter, x, y);
          lastLetters[i] = letter;

          // 5. MOVE: the drop goes down one row
          drops[i]++;

          // Past the bottom? Send it back to the top - but only
          // sometimes, so the columns stay out of step
          if (y > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
            lastLetters[i] = '';
          }
        }
      }

      setInterval(drawRain, 50); // About 20 frames per second
    }

    // Skip the animation for users who asked their OS for less motion
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      startCodeRain();
    }

    // ==========================================
    // SCROLL REVEAL
    // Elements get 'revealed' class when they
    // scroll into view (triggers CSS transitions).
    // ==========================================

    function reveal() {
      $('.landing-section, .topic-card, .stat').each(function () {
        if (this.getBoundingClientRect().top < window.innerHeight * 0.9) {
          $(this).addClass('revealed');
        }
      });
    }
    $(window).on('scroll resize', reveal);
    reveal();

    // ==========================================
    // TOPIC CARD CLICK → SWITCH TAB
    // Clicking an overview card scrolls to the
    // tutorial and activates the matching tab.
    // ==========================================

    $('.topic-card[data-tab]').on('click', function () {
      var tabId = $(this).data('tab');
      // Activate the matching tab button
      $('.section-tab').removeClass('active').attr('aria-selected', 'false');
      $('.section-tab[data-section="' + tabId + '"]').addClass('active').attr('aria-selected', 'true');
      // Show the matching section
      $('.tutorial-section').removeClass('visible');
      $('#' + tabId).addClass('visible');
    });

    // ==========================================
    // SYNTAX HIGHLIGHTING
    // Colours every <pre><code> block in the
    // tutorial using highlight.js.
    // ==========================================

    if (window.hljs) {
      $('pre code').each(function () { hljs.highlightElement(this); });
    }
  });
