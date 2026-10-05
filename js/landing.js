/**
 * landing.js
 * ----------
 * Landing page functionality:
 * - Typing animation in the hero section
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
