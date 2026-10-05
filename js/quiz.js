/**
 * quiz.js
 * -------
 * Handles all Quiz page functionality:
 *
 *  1.  AJAX: Load questions from local JSON file (data/questions.json)
 *  2.  Randomisation: Shuffle question order on every load
 *  3.  Dynamic rendering: Build all question cards via DOM manipulation
 *  4.  Progress tracking: Update progress bar as user answers
 *  5.  beforeunload: Warn user if they try to leave after answering
 *  6.  Submission validation: Block submit if any question unanswered
 *  7.  Score calculation: Compute score, percentage, pass/fail
 *  8.  Answer review: Show correct/incorrect after submission
 *  9.  Reward API: Fetch congratulatory content from a public API on pass
 *  10. localStorage: Save attempt history with score, %, date, pass/fail
 *  11. History display: Render previous attempts in a table
 *  12. Clear history: Button to wipe saved attempts
 *
 * Dependencies: jQuery 3.x (loaded via CDN)
 */

$(document).ready(function () {

  /* ===========================================================
     CONSTANTS & STATE
     =========================================================== */

  var PASS_THRESHOLD = 70;                 // Percentage required to pass
  var STORAGE_KEY_BASE = 'webdev_quiz_history'; // localStorage key prefix (per-user suffix added at runtime)
  var questions      = [];                 // Loaded from JSON via AJAX
  var hasAnswered    = false;              // Track if any answer selected
  var quizSubmitted  = false;              // Track if quiz was submitted
  var timerInterval  = null;               // Quiz timer interval ID
  var timerSeconds   = 0;                  // Elapsed seconds

  /**
   * getHistoryKey – Returns the localStorage key for the current
   * user's quiz history. Each user's attempts are stored under a
   * separate key so the history switches when the name changes.
   * If no name is set, falls back to a "_guest" key.
   *
   * @return {string} - Per-user history key.
   */
  function getHistoryKey() {
    var name = getUsername();
    if (!name) return STORAGE_KEY_BASE + '_guest';
    // Sanitise the name into a safe key suffix (lowercase alphanumerics + underscore)
    var safe = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return STORAGE_KEY_BASE + '_' + safe;
  }

  /* ===========================================================
     QUIZ TIMER
     -----------------------------------------------------------
     Counts up from 00:00 while the quiz is in progress.
     Not enforced - purely informational. Displays elapsed time
     and includes it in the results and localStorage history.
     =========================================================== */

  /** Format seconds as MM:SS */
  function formatTime(secs) {
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  /** Start the quiz timer */
  function startTimer() {
    timerSeconds = 0;
    $('#quizTimerDisplay').text('00:00');
    timerInterval = setInterval(function () {
      timerSeconds++;
      $('#quizTimerDisplay').text(formatTime(timerSeconds));
    }, 1000);
  }

  /** Stop the quiz timer and return elapsed time string */
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    return formatTime(timerSeconds);
  }

  /* Mobile drawer and theme toggle handled by shared.js */

  /* Error retry button */
  $('#quizRetryBtn').on('click', function () {
    location.reload();
  });

  /* ===========================================================
     USER PROFILE
     -----------------------------------------------------------
     Stores the user's name in localStorage and computes stats
     (attempts, best, average, trophy counts) from the existing
     attempt history.
     =========================================================== */

  var NAME_KEY = 'webdev_quiz_username';

  /** Get the saved name from localStorage (or empty string) */
  function getUsername() {
    try { return localStorage.getItem(NAME_KEY) || ''; } catch (e) { return ''; }
  }

  /** Save the name to localStorage */
  function setUsername(name) {
    try { localStorage.setItem(NAME_KEY, name); } catch (e) {}
  }

  /** Convert a percentage to a trophy tier name */
  function percentageToTrophy(pct) {
    if (pct >= 90) return 'gold';
    if (pct >= 80) return 'silver';
    if (pct >= 70) return 'bronze';
    return null;
  }

  /** Update the profile display based on current state */
  function renderProfile() {
    var name = getUsername();

    if (!name) {
      // No name set: show input form
      $('#profileGreeting').text('Welcome!');
      $('#nameInputArea').show();
      $('#profileStats').hide();
      return;
    }

    // Name is set: show stats
    $('#profileGreeting').text('Welcome back, ' + name + '!');
    $('#nameInputArea').hide();
    $('#profileStats').show();

    // Calculate stats from attempt history
    var attempts = loadHistory();
    var totalAttempts = attempts.length;
    var best = 0;
    var sum = 0;
    var gold = 0, silver = 0, bronze = 0;

    attempts.forEach(function (a) {
      if (a.percentage > best) best = a.percentage;
      sum += a.percentage;
      var trophy = percentageToTrophy(a.percentage);
      if (trophy === 'gold') gold++;
      else if (trophy === 'silver') silver++;
      else if (trophy === 'bronze') bronze++;
    });

    var avg = totalAttempts > 0 ? Math.round(sum / totalAttempts) : 0;
    var totalTrophies = gold + silver + bronze;

    $('#statAttempts').text(totalAttempts);
    $('#statBest').text(totalAttempts > 0 ? best + '%' : ' - ');
    $('#statAvg').text(totalAttempts > 0 ? avg + '%' : ' - ');
    $('#statTrophies').text(totalTrophies);
    $('#trophyGold').text(gold);
    $('#trophySilver').text(silver);
    $('#trophyBronze').text(bronze);
  }

  /* Save name button */
  $('#saveNameBtn').on('click', function () {
    var name = $('#nameInput').val().trim();
    if (name) {
      setUsername(name);
      renderProfile();
      renderHistory(); // Switch the visible history table to this user's namespace
      showSnackbar('Welcome, ' + name + '!');
    }
  });

  /* Allow Enter key to save name */
  $('#nameInput').on('keypress', function (e) {
    if (e.which === 13) $('#saveNameBtn').click();
  });

  /* Change name button - clear name and reset the quiz */
  $('#changeNameBtn').on('click', function () {
    // If they're mid-quiz, confirm before discarding progress
    if (hasAnswered && !quizSubmitted) {
      if (!confirm('Changing your name will reset the current quiz attempt. Continue?')) {
        return;
      }
    }
    // Clear the saved username
    setUsername('');
    // Bypass the beforeunload warning so reload doesn't prompt twice
    quizSubmitted = true;
    // Reload the page - this gives a fresh quiz, fresh timer, fresh state
    location.reload();
  });

  // Initialise profile on page load
  renderProfile();

  /* ===========================================================
     1. AJAX: LOAD QUESTIONS FROM LOCAL JSON FILE
     -----------------------------------------------------------
     Questions are stored in data/questions.json and fetched at
     runtime via jQuery $.ajax(). They are NOT present in any
     HTML or JS source file - this satisfies the rubric
     requirement for AJAX loading from a local data file.
     =========================================================== */

  $.ajax({
    url: 'data/questions.json',
    method: 'GET',
    dataType: 'json',
    cache: false,

    /**
     * Success handler - questions loaded successfully.
     * Shuffles the array and renders the quiz.
     *
     * @param {Array} data - Array of question objects from the JSON file.
     */
    success: function (data) {
      // Validate that data is a non-empty array
      if (!Array.isArray(data) || data.length === 0) {
        showQuizError('The questions file is empty or has an invalid format.');
        return;
      }

      // 2. RANDOMISE: Pick a balanced 15 questions from the pool of 30
      // (5 from each topic, then shuffle the combined set)
      questions = pickQuestions(data, 5);

      // Hide loading, show quiz container
      $('#quizLoading').hide();
      $('#quizContainer').css('display', 'block');

      // 3. RENDER: Build question cards dynamically
      renderQuestions();

      // Start the quiz timer
      startTimer();
      // Load and display attempt history from localStorage
      renderHistory();

      // Trigger fade-in animations
      triggerFadeIns();
    },

    /**
     * Error handler - AJAX request failed.
     * Shows a user-friendly error message.
     *
     * @param {Object} xhr   - The XMLHttpRequest object.
     * @param {string} status - Error status string.
     * @param {string} err   - Error description.
     */
    error: function (xhr, status, err) {
      console.error('Failed to load questions:', status, err);

      var title = 'Failed to Load Questions';
      var msg = '';

      if (xhr.status === 404) {
        title = 'File Not Found';
        msg = 'The questions file (data/questions.json) could not be found. Make sure the file exists in the data/ folder.';
      } else if (xhr.status === 0 && status === 'error') {
        msg = 'The browser blocked the request. This usually happens when opening the page directly as a file. ' +
          'Run a local web server (e.g. npx serve . or VS Code Live Server) and open the URL it provides.';
      } else if (status === 'timeout') {
        title = 'Request Timed Out';
        msg = 'The questions file took too long to load. Check your connection and try again.';
      } else if (status === 'parsererror') {
        title = 'Invalid JSON';
        msg = 'The questions file was found but contains invalid JSON. The file may be corrupted.';
      } else {
        msg = 'Could not load questions (HTTP ' + (xhr.status || 'unknown') + ', ' + status + '). ' +
          'Make sure data/questions.json exists and is valid JSON.';
      }

      $('#quizErrorTitle').text(title);
      showQuizError(msg);
    }
  });

  /**
   * showQuizError – Displays the error state UI.
   *
   * @param {string} msg - The error message to display.
   */
  function showQuizError(msg) {
    $('#quizLoading').hide();
    $('#profileCard').hide();
    $('#quizErrorMsg').html(msg);
    $('#quizError').css('display', 'block');
  }

  /* ===========================================================
     2. RANDOMISATION: Fisher-Yates Shuffle
     -----------------------------------------------------------
     Produces a new random order on every page load so the quiz
     experience is different each time.
     =========================================================== */

  /**
   * shuffleArray – Randomises array order in-place using
   * the Fisher-Yates (Durstenfeld) algorithm.
   *
   * @param  {Array} arr - The array to shuffle.
   * @return {Array}    - The same array, now shuffled.
   */
  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }

  /**
   * pickQuestions – Picks N questions from each topic and returns
   * a shuffled combined set. Ensures every quiz has a balanced mix
   * of HTML, CSS, and JavaScript questions, even though the pool
   * contains 30 questions in total.
   *
   * @param  {Array}  pool         - Full question pool from JSON.
   * @param  {number} perTopic     - How many to pick from each topic.
   * @return {Array}               - Combined and shuffled questions.
   */
  function pickQuestions(pool, perTopic) {
    var topics = ['HTML', 'CSS', 'JavaScript'];
    var picked = [];

    topics.forEach(function (topic) {
      // Filter pool to questions of this topic, then copy and shuffle
      var subset = pool.filter(function (q) { return q.topic === topic; }).slice();
      shuffleArray(subset);
      // Take the first N from the shuffled subset
      picked = picked.concat(subset.slice(0, perTopic));
    });

    // Shuffle the combined 15 so topics are interleaved
    return shuffleArray(picked);
  }

  /* ===========================================================
     3. DYNAMIC RENDERING
     -----------------------------------------------------------
     Questions are rendered ENTIRELY via DOM manipulation - 
     no question content exists in the HTML source. Each question
     card includes radio buttons for options and a hidden
     validation warning.
     =========================================================== */

  /**
   * renderQuestions – Builds all question cards and appends them
   * to the #questionsWrapper container.
   */
  function renderQuestions() {
    var $wrapper = $('#questionsWrapper');
    $wrapper.empty(); // Clear any existing content

    questions.forEach(function (q, index) {
      var qNum = index + 1;

      // Determine topic chip class
      var topicClass = 'html';
      if (q.topic === 'CSS') topicClass = 'css';
      else if (q.topic === 'JavaScript') topicClass = 'js';

      // Build the question card element
      var $card = $('<div></div>')
        .addClass('quiz-question fade-in')
        .attr('id', 'question-' + q.id)
        .attr('data-question-id', q.id);

      // Question number + topic chip
      var $number = $('<div class="quiz-question__number"></div>')
        .html('Question ' + qNum +
          '<span class="quiz-question__topic quiz-question__topic--' +
          topicClass + '">' + q.topic + '</span>');

      // Question text
      var $text = $('<p class="quiz-question__text"></p>').text(q.question);

      // Options container
      var $options = $('<div class="quiz-options"></div>');

      // Build each option as a clickable label with a radio button
      q.options.forEach(function (optText, optIndex) {
        var optionId = 'q' + q.id + '_opt' + optIndex;

        var $label = $('<label class="quiz-option"></label>')
          .attr('for', optionId)
          .attr('data-option-index', optIndex);

        var $radio = $('<input type="radio">')
          .attr({ type: 'radio', name: 'question_' + q.id, id: optionId, value: optIndex });

        var $optionText = $('<span></span>').text(optText);

        $label.append($radio).append($optionText);
        $options.append($label);
      });

      // Validation warning (hidden by default)
      var $warning = $('<div class="quiz-question__warning"></div>')
        .attr('id', 'warning-' + q.id)
        .html('<span class="material-symbols-outlined" style="font-size:16px;">warning</span> Please select an answer.');

      // Assemble the card
      $card.append($number).append($text).append($options).append($warning);
      $wrapper.append($card);
    });

    // Update initial progress
    updateProgress();
  }

  /* ===========================================================
     4. PROGRESS TRACKING
     -----------------------------------------------------------
     Updates the progress bar and text as the user answers
     questions. Also handles the "selected" styling on options.
     =========================================================== */

  /**
   * Delegated click handler for option labels.
   * Uses event delegation on #questionsWrapper so it works
   * with dynamically rendered content.
   */
  $('#questionsWrapper').on('change', 'input[type="radio"]', function () {
    var $option = $(this).closest('.quiz-option');
    var $card = $(this).closest('.quiz-question');

    // Mark as answered (for beforeunload)
    hasAnswered = true;

    // Update selected styling
    $card.find('.quiz-option').removeClass('selected');
    $option.addClass('selected');

    // Clear any validation warning on this question
    $card.removeClass('unanswered-highlight');
    $card.find('.quiz-question__warning').removeClass('visible');

    // Update progress bar
    updateProgress();
  });

  /**
   * updateProgress – Counts answered questions and updates
   * the progress bar width and text.
   */
  function updateProgress() {
    var total = questions.length;
    var answered = $('input[type="radio"]:checked').length;
    var percent = total > 0 ? Math.round((answered / total) * 100) : 0;

    $('#progressFill').css('width', percent + '%');
    $('#progressText').text(answered + ' / ' + total + ' answered');
  }

  /* ===========================================================
     5. BEFOREUNLOAD WARNING
     -----------------------------------------------------------
     Fires a browser-native warning if the user tries to leave
     or refresh the page AFTER selecting at least one answer.
     The warning is cleared after successful submission.
     =========================================================== */

  $(window).on('beforeunload', function (e) {
    // Only warn if user has started answering but hasn't submitted
    if (hasAnswered && !quizSubmitted) {
      var msg = 'You have unsaved quiz answers. Are you sure you want to leave?';
      e.originalEvent.returnValue = msg; // Standard
      return msg; // For older browsers
    }
  });

  /* ===========================================================
     6. SUBMISSION VALIDATION
     -----------------------------------------------------------
     Blocks submission if any question is unanswered. Scrolls to
     the first unanswered question and highlights it with a
     red border and warning message.
     =========================================================== */

  $('#submitQuizBtn').on('click', function () {
    // Collect unanswered questions
    var unanswered = [];

    questions.forEach(function (q) {
      var selected = $('input[name="question_' + q.id + '"]:checked').val();
      if (selected === undefined) {
        unanswered.push(q.id);
      }
    });

    // If there are unanswered questions, highlight them and block submit
    if (unanswered.length > 0) {
      // Show global validation message
      $('#quizValidationMsg').css('display', 'block');

      // Clear all previous highlights first
      $('.quiz-question').removeClass('unanswered-highlight');
      $('.quiz-question__warning').removeClass('visible');

      // Highlight each unanswered question
      unanswered.forEach(function (qId) {
        $('#question-' + qId).addClass('unanswered-highlight');
        $('#warning-' + qId).addClass('visible');
      });

      // Scroll to the first unanswered question
      var $first = $('#question-' + unanswered[0]);
      if ($first.length) {
        $('html, body').animate({
          scrollTop: $first.offset().top - 80
        }, 400);
      }

      showSnackbar(unanswered.length + ' question(s) still need an answer.');
      return; // Block submission
    }

    // All questions answered - proceed to grading
    $('#quizValidationMsg').css('display', 'none');
    gradeQuiz();
  });

  /* ===========================================================
     7. SCORE CALCULATION & DISPLAY
     -----------------------------------------------------------
     Computes the score, percentage, and pass/fail status.
     Displays the result card without a page reload.
     =========================================================== */

  /**
   * gradeQuiz – Calculates the score, renders results, triggers
   * the reward API (on pass), and saves the attempt to localStorage.
   */
  function gradeQuiz() {
    var total = questions.length;
    var correct = 0;

    // Stop the timer and get elapsed time
    var elapsedTime = stopTimer();

    // Calculate score
    questions.forEach(function (q) {
      var selected = parseInt($('input[name="question_' + q.id + '"]:checked').val(), 10);
      if (selected === q.answer) {
        correct++;
      }
    });

    var percentage = Math.round((correct / total) * 100);
    var passed = percentage >= PASS_THRESHOLD;

    // Mark quiz as submitted (clears beforeunload warning)
    quizSubmitted = true;

    // Disable all radio buttons to prevent changes
    $('input[type="radio"]').prop('disabled', true);

    // Hide the quiz form, show results
    $('#quizContainer').hide();
    $('#resultsSection').css('display', 'block');

    // Render the score card (includes time)
    renderResultCard(correct, total, percentage, passed, elapsedTime);

    // Render answer review
    renderReview();

    // Show achievement trophy (pass fetches quote from public API, fail shows static trophy)
    showTrophy(correct, total, percentage, passed);

    // Save attempt to localStorage (includes time)
    saveAttempt(correct, total, percentage, passed, elapsedTime);

    // Re-render history table
    renderHistory();
    renderProfile();

    // Scroll to top of results
    $('html, body').animate({ scrollTop: $('#resultsSection').offset().top - 80 }, 400);

    // Trigger fade-in animations for new elements
    triggerFadeIns();

    showSnackbar(passed ? 'Congratulations - you passed!' : 'Keep studying and try again!');
  }

  /**
   * renderResultCard – Builds the visual score display.
   *
   * @param {number}  correct   - Number of correct answers.
   * @param {number}  total     - Total number of questions.
   * @param {number}  percentage - Score as a percentage.
   * @param {boolean} passed    - Whether the user passed.
   */
  function renderResultCard(correct, total, percentage, passed, elapsedTime) {
    var statusClass = passed ? 'pass' : 'fail';
    var statusIcon  = passed ? 'check_circle' : 'cancel';
    var statusText  = passed ? 'PASSED' : 'FAILED';
    var timeStr = elapsedTime || ' - ';

    var html =
      '<div class="result-card__score">' + correct + ' / ' + total + '</div>' +
      '<div class="result-card__percentage">' + percentage + '%</div>' +
      '<div class="result-card__status result-card__status--' + statusClass + '">' +
        '<span class="material-symbols-outlined" style="font-size:18px;">' + statusIcon + '</span> ' +
        statusText +
      '</div>' +
      '<p class="body-medium" style="margin-top:16px; opacity:0.8;">Pass threshold: ' + PASS_THRESHOLD + '% &nbsp;|&nbsp; Time: ' + timeStr + '</p>';

    $('#resultCard')
      .removeClass('result-card--pass result-card--fail')
      .addClass('result-card--' + statusClass)
      .html(html);
  }

  /* ===========================================================
     8. ANSWER REVIEW
     -----------------------------------------------------------
     After submission, shows each question with the user's answer
     marked as correct (green) or incorrect (red), plus the
     correct answer highlighted.
     =========================================================== */

  /**
   * renderReview – Re-renders questions in review mode with
   * correct/incorrect indicators.
   */
  function renderReview() {
    var $wrapper = $('#reviewWrapper');
    $wrapper.empty();

    questions.forEach(function (q, index) {
      var selected = parseInt($('input[name="question_' + q.id + '"]:checked').val(), 10);
      var isCorrect = selected === q.answer;

      var $block = $('<div style="margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid var(--md-sys-color-outline-variant);"></div>');

      // Question text
      var $qText = $('<p class="body-large" style="font-weight:500; margin-bottom:10px;"></p>')
        .text((index + 1) + '. ' + q.question);

      $block.append($qText);

      // Options in review mode
      q.options.forEach(function (optText, optIndex) {
        var $opt = $('<div style="padding:8px 14px; margin:4px 0; border-radius:8px; font-size:0.875rem; display:flex; align-items:center; gap:8px;"></div>');

        if (optIndex === q.answer) {
          // This is the correct answer - always show green
          $opt.css({ 'background': 'var(--md-sys-color-primary-container)', 'color': 'var(--md-sys-color-on-primary-container)', 'font-weight': '600' });
          $opt.append('<span class="material-symbols-outlined" style="font-size:18px;">check_circle</span>');
          $opt.append($('<span></span>').text(optText));
        } else if (optIndex === selected && !isCorrect) {
          // This is the user's wrong answer
          $opt.css({ 'background': 'var(--md-sys-color-error-container)', 'color': 'var(--md-sys-color-on-error-container)' });
          $opt.append('<span class="material-symbols-outlined" style="font-size:18px;">cancel</span>');
          $opt.append($('<span></span>').text(optText));
        } else {
          $opt.css({ 'color': 'var(--md-sys-color-on-surface-variant)' });
          $opt.text(optText);
        }

        $block.append($opt);
      });

      $wrapper.append($block);
    });
  }

  /* ===========================================================
     9. REWARD: ACHIEVEMENT TROPHY VIA PUBLIC API
     -----------------------------------------------------------
     On completion, displays a tiered achievement trophy
     (gold/silver/bronze) based on the user's percentage score.
     On pass: fetches a motivational quote from the DummyJSON
     public API (https://dummyjson.com/docs/quotes). The
     API response is validated (quote + author strings) before
     being inserted into the DOM.
     On fail: shows a static "try again" trophy (no API call).
     =========================================================== */

  /**
   * getTrophyTier – Determines trophy tier (gold/silver/bronze)
   * based on the percentage score.
   *
   * @param {number} percentage - Score as a percentage.
   * @return {Object} - Tier configuration object.
   */
  function getTrophyTier(percentage) {
    var isLight = document.documentElement.classList.contains('light');
    if (isLight) {
      if (percentage === 100) return { name: 'Gold Trophy',   color: '#bf8700', bg: '#fff8e1', icon: 'emoji_events', message: 'Flawless - every single question correct!' };
      if (percentage >= 90)  return { name: 'Gold Trophy',   color: '#bf8700', bg: '#fff8e1', icon: 'emoji_events', message: 'Outstanding performance!' };
      if (percentage >= 80)  return { name: 'Silver Trophy', color: '#616161', bg: '#f0f0f4', icon: 'emoji_events', message: 'Solid understanding of the fundamentals.' };
      if (percentage >= 70)  return { name: 'Bronze Trophy', color: '#a0622a', bg: '#fff3e0', icon: 'emoji_events', message: 'You passed - keep building on this foundation.' };
      return                        { name: 'Keep Going',    color: '#d32f2f', bg: '#ffdad6', icon: 'replay',       message: 'Review the tutorial and try again!' };
    }
    if (percentage === 100) return { name: 'Gold Trophy',   color: '#f9a825', bg: '#2a2000', icon: 'emoji_events', message: 'Flawless - every single question correct!' };
    if (percentage >= 90)  return { name: 'Gold Trophy',   color: '#f9a825', bg: '#2a2000', icon: 'emoji_events', message: 'Outstanding performance!' };
    if (percentage >= 80)  return { name: 'Silver Trophy', color: '#c0c0c0', bg: '#1a1a22', icon: 'emoji_events', message: 'Solid understanding of the fundamentals.' };
    if (percentage >= 70)  return { name: 'Bronze Trophy', color: '#cd7f32', bg: '#2a1800', icon: 'emoji_events', message: 'You passed - keep building on this foundation.' };
    return                        { name: 'Keep Going',    color: '#ff4455', bg: '#5c0010', icon: 'replay',       message: 'Review the tutorial and try again!' };
  }

  /**
   * showTrophy – Renders the achievement trophy.
   * On pass: fetches a motivational quote from a public API.
   * On fail: renders trophy without API call.
   *
   * @param {number} correct   - Number of correct answers.
   * @param {number} total     - Total number of questions.
   * @param {number} percentage - Score as a percentage.
   * @param {boolean} passed   - Whether the user passed.
   */
  function showTrophy(correct, total, percentage, passed) {
    var tier = getTrophyTier(percentage);

    // Always show the reward card
    $('#rewardCard').css('display', 'block');

    if (passed) {
      // Fetch a motivational quote from a public REST API
      $.ajax({
        url: 'https://dummyjson.com/quotes/random',
        method: 'GET',
        dataType: 'json',
        timeout: 8000,

        success: function (data) {
          // Validate response shape before using it
          // DummyJSON returns: { id, quote, author }
          if (data && typeof data.quote === 'string' && typeof data.author === 'string') {
            renderTrophy(tier, correct, total, percentage, data);
          } else {
            renderTrophy(tier, correct, total, percentage, null);
          }
        },

        error: function () {
          // API failed - render trophy without quote
          renderTrophy(tier, correct, total, percentage, null);
        }
      });
    } else {
      // Failed - show trophy without API call
      renderTrophy(tier, correct, total, percentage, null);
    }
  }

  /**
   * renderTrophy - Builds the trophy HTML and inserts it.
   *
   * @param {Object}      tier      - Trophy tier config.
   * @param {number}      correct   - Correct answers.
   * @param {number}      total     - Total questions.
   * @param {number}      percentage - Score percentage.
   * @param {Object|null} quote     - {quote, author} from DummyJSON API or null.
   */
  function renderTrophy(tier, correct, total, percentage, quote) {
    var html =
      '<div class="reward-trophy">' +
        '<div class="reward-trophy__icon-wrap" style="background:' + tier.bg + '; border-color:' + tier.color + ';">' +
          '<span class="material-symbols-outlined reward-trophy__icon" style="color:' + tier.color + ';">' + tier.icon + '</span>' +
        '</div>' +
        '<div class="reward-trophy__ribbon" style="background:' + tier.color + ';">' +
          tier.name +
        '</div>' +
      '</div>' +
      '<h3 class="reward-trophy__title">Achievement Unlocked!</h3>' +
      '<p class="reward-trophy__score">' +
        'You scored <strong style="color:' + tier.color + ';">' + correct + '/' + total + ' (' + percentage + '%)</strong>' +
      '</p>' +
      '<p class="reward-trophy__message">' + tier.message + '</p>';

    if (quote) {
      html += '<blockquote class="reward-trophy__quote">' +
        '<p>&ldquo;' + quote.quote + '&rdquo;</p>' +
        '<cite> - ' + quote.author + '</cite>' +
      '</blockquote>' +
      '<p class="reward-trophy__api-note">' +
        'Motivational quote fetched live from the ' +
        '<a href="https://dummyjson.com/docs/quotes" target="_blank" rel="noopener noreferrer">DummyJSON Quotes API</a>.' +
      '</p>';
    }

    $('#rewardContent').html(html);
  }

  /* ===========================================================
     10. LOCAL STORAGE: SAVE ATTEMPT HISTORY
     -----------------------------------------------------------
     Each attempt is saved with: score, total, percentage,
     pass/fail status, and a timestamp. All storage operations
     are wrapped in try/catch to handle private browsing mode
     and quota errors gracefully.
     =========================================================== */

  /**
   * saveAttempt – Saves the current quiz attempt to localStorage.
   *
   * @param {number}  correct   - Number of correct answers.
   * @param {number}  total     - Total questions.
   * @param {number}  percentage - Score percentage.
   * @param {boolean} passed    - Whether the user passed.
   */
  function saveAttempt(correct, total, percentage, passed, elapsedTime) {
    try {
      var history = loadHistory();

      var attempt = {
        score: correct,
        total: total,
        percentage: percentage,
        passed: passed,
        time: elapsedTime || ' - ',
        date: new Date().toISOString()
      };

      history.push(attempt);
      localStorage.setItem(getHistoryKey(), JSON.stringify(history));
    } catch (err) {
      console.warn('Could not save quiz attempt to localStorage:', err.message);
      showSnackbar('Could not save attempt - storage unavailable.');
    }
  }

  /**
   * loadHistory – Reads and parses attempt history from localStorage.
   * Handles malformed or missing data gracefully.
   *
   * @return {Array} - Array of attempt objects, or empty array if none/invalid.
   */
  function loadHistory() {
    try {
      var raw = localStorage.getItem(getHistoryKey());

      // No data stored yet
      if (!raw) return [];

      var parsed = JSON.parse(raw);

      // Validate that it's an array
      if (!Array.isArray(parsed)) {
        console.warn('Quiz history data is malformed - resetting.');
        localStorage.removeItem(getHistoryKey());
        return [];
      }

      // Filter out any malformed entries
      return parsed.filter(function (entry) {
        return entry &&
               typeof entry.score === 'number' &&
               typeof entry.total === 'number' &&
               typeof entry.percentage === 'number' &&
               typeof entry.passed === 'boolean' &&
               typeof entry.date === 'string';
      });

    } catch (err) {
      // JSON parsing failed or localStorage unavailable
      console.warn('Could not read quiz history:', err.message);
      return [];
    }
  }

  /* ===========================================================
     11. HISTORY DISPLAY
     -----------------------------------------------------------
     Renders all previous attempts in a table alongside the
     current result. Includes attempt number, score, percentage,
     date/time, and pass/fail badge.
     =========================================================== */

  /**
   * renderHistory – Builds the attempt history table from
   * localStorage data and inserts it into #historyContent.
   */
  function renderHistory() {
    var history = loadHistory();

    if (history.length === 0) {
      $('#historyContent').html(
        '<p class="body-medium" style="color:var(--md-sys-color-outline); font-style:italic;">No attempts yet. Complete the quiz to see your history here.</p>'
      );
      $('#clearHistoryBtn').hide();
      return;
    }

    // Build the table
    var html = '<table class="history-table">' +
      '<thead><tr>' +
        '<th>#</th>' +
        '<th>Score</th>' +
        '<th>Percentage</th>' +
        '<th>Time</th>' +
        '<th>Date &amp; Time</th>' +
        '<th>Result</th>' +
      '</tr></thead><tbody>';

    // Render in reverse chronological order (newest first)
    for (var i = history.length - 1; i >= 0; i--) {
      var a = history[i];
      var attemptNum = i + 1;
      var badgeClass = a.passed ? 'pass' : 'fail';
      var badgeText  = a.passed ? 'Pass' : 'Fail';
      var timeStr = a.time || ' - ';

      // Format the date
      var dateStr = '';
      try {
        var d = new Date(a.date);
        dateStr = d.toLocaleDateString('en-AU', {
          day: 'numeric', month: 'short', year: 'numeric'
        }) + ' ' + d.toLocaleTimeString('en-AU', {
          hour: '2-digit', minute: '2-digit'
        });
      } catch (e) {
        dateStr = a.date;
      }

      // Highlight the most recent attempt
      var rowStyle = (i === history.length - 1) ? ' style="background:var(--md-sys-color-surface-container-high);"' : '';

      html += '<tr' + rowStyle + '>' +
        '<td>' + attemptNum + '</td>' +
        '<td>' + a.score + ' / ' + a.total + '</td>' +
        '<td>' + a.percentage + '%</td>' +
        '<td>' + timeStr + '</td>' +
        '<td>' + dateStr + '</td>' +
        '<td><span class="history-badge history-badge--' + badgeClass + '">' + badgeText + '</span></td>' +
      '</tr>';
    }

    html += '</tbody></table>';

    $('#historyContent').html(html);
    $('#clearHistoryBtn').show();
  }

  /* ===========================================================
     12. CLEAR HISTORY
     -----------------------------------------------------------
     Removes all saved attempts from localStorage after
     confirmation.
     =========================================================== */

  $('#clearHistoryBtn').on('click', function () {
    if (!confirm('Are you sure you want to clear all quiz history? This cannot be undone.')) {
      return;
    }

    try {
      localStorage.removeItem(getHistoryKey());
    } catch (err) {
      console.warn('Could not clear localStorage:', err.message);
    }

    renderHistory();
    renderProfile();
    showSnackbar('Quiz history cleared.');
  });

  /* ===========================================================
     DEMO MODE - INSTRUCTOR SIMULATION
     -----------------------------------------------------------
     Allows the instructor to instantly see pass/fail results,
     reward API, answer review, and localStorage history without
     answering all 15 questions manually. The demo panel is
     hidden by default behind a small toggle button.
     =========================================================== */

  /** Toggle demo panel visibility */
  $('#demoToggleBtn').on('click', function () {
    var $panel = $('#demoPanel');
    var isVisible = $panel.css('display') !== 'none';
    $panel.css('display', isVisible ? 'none' : 'block');
    $(this).css('opacity', isVisible ? '0.5' : '1');
  });

  /** Simulate a quiz result with a predetermined score */
  $('#demoSimulateBtn').on('click', function () {
    var selectedPercent = parseInt($('#demoScoreSelect').val(), 10);
    var total = questions.length;
    var correct = Math.round((selectedPercent / 100) * total);
    var percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    var passed = percentage >= PASS_THRESHOLD;

    // Stop the timer
    var elapsedTime = stopTimer();

    // Mark quiz as submitted (clears beforeunload warning)
    quizSubmitted = true;

    // Programmatically set radio buttons to simulate answers.
    questions.forEach(function (q, index) {
      var chosenIndex;
      if (index < correct) {
        chosenIndex = q.answer;
      } else {
        chosenIndex = q.answer === 0 ? 1 : 0;
      }
      $('input[name="question_' + q.id + '"][value="' + chosenIndex + '"]')
        .prop('checked', true)
        .closest('.quiz-option').addClass('selected');
    });

    // Disable all radio buttons
    $('input[type="radio"]').prop('disabled', true);

    // Hide quiz container, show results
    $('#quizContainer').hide();
    $('#resultsSection').css('display', 'block');

    // Render results using existing functions (with time)
    renderResultCard(correct, total, percentage, passed, elapsedTime);
    renderReview();

    // Show achievement trophy
    showTrophy(correct, total, percentage, passed);

    // Save to localStorage (with time) and re-render history
    saveAttempt(correct, total, percentage, passed, elapsedTime);
    renderHistory();
    renderProfile();

    // Scroll to results
    $('html, body').animate({ scrollTop: $('#resultsSection').offset().top - 80 }, 400);

    triggerFadeIns();

    showSnackbar('Demo: Simulated ' + percentage + '% (' + (passed ? 'PASS' : 'FAIL') + ')');
  });

  /* ===========================================================
     RETAKE QUIZ
     -----------------------------------------------------------
     Reloads the page to get a fresh set of randomised questions.
     =========================================================== */

  $('#retakeBtn').on('click', function () {
    // Clear the beforeunload flag so it doesn't fire on retake
    quizSubmitted = true;
    // Prevent browser from restoring scroll position after reload
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    location.reload();
  });

  /* triggerFadeIns and showSnackbar handled by shared.js */

}); // ===== end $(document).ready =====
