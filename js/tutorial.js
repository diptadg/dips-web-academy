/**
 * tutorial.js
 * -----------
 * Handles interactivity for the Tutorial page.
 *
 * HTML Demos: Heading Hierarchy, Text Formatting, Lists, Live Form, Live Editor
 * CSS Demos:  CSS On/Off, Box Model, Flexbox, Positioning, Live Editor
 * JS Demos:   Grade Calculator, DOM Playground, JS Sandbox
 *
 * Dependencies: jQuery 3.x, highlight.js (both loaded via CDN)
 */

$(document).ready(function () {

  // ==========================================
  // 1. SECTION TAB SWITCHING
  // Clicking a tab shows the matching section.
  // ==========================================

  $('.section-tab').on('click', function () {
    var sectionId = $(this).data('section');
    $('.section-tab').removeClass('active').attr('aria-selected', 'false');
    $(this).addClass('active').attr('aria-selected', 'true');
    $('.tutorial-section').removeClass('visible');
    $('#' + sectionId).addClass('visible');
    triggerFadeIns();
  });

  // ==========================================
  // 2. HTML: HEADING HIERARCHY BUILDER
  // Dropdown picks h1–h6, text input fills
  // content, button appends it to the preview.
  // ==========================================

  var headingStarted = false;

  $('#addHeadingBtn').on('click', function () {
    if (!headingStarted) { $('#headingDemoPreview').html(''); headingStarted = true; }
    var level = $('#headingLevelSelect').val();
    var text = $('#headingTextInput').val() || 'Heading';
    var sizes = { '1': '2rem', '2': '1.5rem', '3': '1.25rem', '4': '1rem', '5': '0.875rem', '6': '0.75rem' };
    var $h = $('<div></div>')
      .css({
        'font-size': sizes[level], 'font-weight': level <= 2 ? '700' : '600',
        'margin': '4px 0', 'padding-left': ((level - 1) * 16) + 'px',
        'color': 'var(--md-sys-color-on-surface)',
        'border-left': '3px solid var(--md-sys-color-primary)',
        'padding-top': '4px', 'padding-bottom': '4px'
      })
      .html('<span style="color:var(--md-sys-color-primary); font-size:0.7rem; margin-right:8px;">&lt;h' + level + '&gt;</span>' + $('<span>').text(text).html());
    $('#headingDemoPreview').append($h);
  });

  $('#clearHeadingsBtn').on('click', function () {
    headingStarted = false;
    $('#headingDemoPreview').html('<span style="color:var(--md-sys-color-outline); font-style:italic;">Add headings above to build a hierarchy…</span>');
  });

  // ==========================================
  // 3. HTML: TEXT FORMATTING PREVIEW
  // Click a tag button to wrap the input text
  // in that tag. Shows rendered + code output.
  // ==========================================

  $('[data-fmt]').on('click', function () {
    var tag = $(this).data('fmt');
    var text = $('#formatTextInput').val() || 'Sample text';
    var html = '<' + tag + '>' + $('<span>').text(text).html() + '</' + tag + '>';
    $('#formatDemoPreview').append('<span style="margin-right:12px;">' + html + '</span>');
    var codeText = ($('#formatDemoCode').text() ? $('#formatDemoCode').text() + '\n' : '') +
      '&lt;' + tag + '&gt;' + $('<span>').text(text).html() + '&lt;/' + tag + '&gt;';
    $('#formatDemoCode').html(codeText);
  });

  // ==========================================
  // 4. HTML: LIST TYPE COMPARISON
  // Buttons switch between <ul>, <ol>, <dl>,
  // and nested list previews with code output.
  // ==========================================

  var listItems = ['HTML - structure', 'CSS - style', 'JavaScript - interactivity', 'jQuery - utilities'];

  function renderListDemo(type) {
    var html = '', code = '';
    $('.list-type-btn').removeClass('btn--filled active').addClass('btn--outlined');
    $('[data-list="' + type + '"]').removeClass('btn--outlined').addClass('btn--filled active');

    if (type === 'ul') {
      html = '<ul style="padding-left:20px;">' + listItems.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>';
      code = '&lt;ul&gt;\n' + listItems.map(function (i) { return '  &lt;li&gt;' + i + '&lt;/li&gt;'; }).join('\n') + '\n&lt;/ul&gt;';
    } else if (type === 'ol') {
      html = '<ol style="padding-left:20px;">' + listItems.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ol>';
      code = '&lt;ol&gt;\n' + listItems.map(function (i) { return '  &lt;li&gt;' + i + '&lt;/li&gt;'; }).join('\n') + '\n&lt;/ol&gt;';
    } else if (type === 'dl') {
      var terms = [['HTML', 'HyperText Markup Language - structures content.'], ['CSS', 'Cascading Style Sheets - controls presentation.'], ['JS', 'JavaScript - adds interactivity.']];
      html = '<dl>' + terms.map(function (t) { return '<dt style="font-weight:600;">' + t[0] + '</dt><dd style="margin:0 0 8px 20px; color:var(--md-sys-color-on-surface-variant);">' + t[1] + '</dd>'; }).join('') + '</dl>';
      code = '&lt;dl&gt;\n' + terms.map(function (t) { return '  &lt;dt&gt;' + t[0] + '&lt;/dt&gt;\n  &lt;dd&gt;' + t[1] + '&lt;/dd&gt;'; }).join('\n') + '\n&lt;/dl&gt;';
    } else {
      html = '<ul style="padding-left:20px;"><li>Front-end<ul><li>HTML</li><li>CSS</li><li>JavaScript</li></ul></li><li>Back-end<ul><li>Node.js</li><li>Python</li></ul></li></ul>';
      code = '&lt;ul&gt;\n  &lt;li&gt;Front-end\n    &lt;ul&gt;\n      &lt;li&gt;HTML&lt;/li&gt;\n      &lt;li&gt;CSS&lt;/li&gt;\n    &lt;/ul&gt;\n  &lt;/li&gt;\n  &lt;li&gt;Back-end\n    &lt;ul&gt;\n      &lt;li&gt;Node.js&lt;/li&gt;\n    &lt;/ul&gt;\n  &lt;/li&gt;\n&lt;/ul&gt;';
    }
    $('#listDemoPreview').html(html);
    $('#listDemoCode').html(code);
  }

  $('.list-type-btn').on('click', function () { renderListDemo($(this).data('list')); });
  renderListDemo('ul');

  // ==========================================
  // 5. HTML: BLOCK VS INLINE FLOW PLAYGROUND
  // Add block, inline, and inline-block elements
  // to see how they flow differently on the page.
  // ==========================================

  var flowCounter = 0;

  function addFlowElement(display, label) {
    flowCounter++;
    var colors = {
      'block': { bg: 'var(--md-sys-color-primary-container)', border: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary-container)' },
      'inline': { bg: 'var(--md-sys-color-secondary-container)', border: 'var(--md-sys-color-secondary)', color: 'var(--md-sys-color-on-secondary-container)' },
      'inline-block': { bg: 'var(--md-sys-color-tertiary-container)', border: 'var(--md-sys-color-tertiary)', color: 'var(--md-sys-color-on-tertiary-container)' }
    };
    var c = colors[display];
    var $el = $('<' + (display === 'inline' ? 'span' : 'div') + '></' + (display === 'inline' ? 'span' : 'div') + '>')
      .css({
        'display': display,
        'padding': '8px 14px',
        'margin': '4px',
        'border-radius': 'var(--md-sys-shape-corner-sm)',
        'background': c.bg,
        'border': '1px solid ' + c.border,
        'color': c.color,
        'font-size': '0.8125rem',
        'font-weight': '600',
        'animation': 'fadeSlideIn 0.3s ease'
      })
      .text(label + ' ' + flowCounter);

    if (display === 'inline-block') {
      $el.css({ 'width': '120px', 'text-align': 'center' });
    }

    $('#flowDemoContainer').append($el);
    $('#flowDemoCount').text(flowCounter + ' element(s) - block elements stack vertically, inline elements sit side-by-side.');
  }

  $('#addBlockBtn').on('click', function () { addFlowElement('block', 'Block'); });
  $('#addInlineBtn').on('click', function () { addFlowElement('inline', 'Inline'); });
  $('#addInlineBlockBtn').on('click', function () { addFlowElement('inline-block', 'Inline-Block'); });
  $('#clearFlowBtn').on('click', function () {
    flowCounter = 0;
    $('#flowDemoContainer').html('');
    $('#flowDemoCount').text('');
  });

  // ==========================================
  // 6. HTML: LIVE FORM WITH VALIDATION
  // HTML5 required/type attributes handle the
  // validation. JS reads the native validity
  // API and shows feedback text.
  // ==========================================

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function validateFormField(inputId, feedbackId) {
    var $input = $(inputId);
    var $fb = $(feedbackId);
    var el = $input[0];
    if (!el || !el.validity) return;
    if ($input.val() === '') {
      $fb.html('').css('color', '');
    } else if (el.validity.valid) {
      $fb.html('✓ Valid').css('color', 'var(--md-sys-color-primary)');
    } else {
      $fb.html('✗ ' + (el.validationMessage || 'Invalid')).css('color', 'var(--md-sys-color-error)');
    }
  }

  $('#formDemoName').on('input', function () { validateFormField('#formDemoName', '#formDemoNameFb'); });
  $('#formDemoEmail').on('input', function () { validateFormField('#formDemoEmail', '#formDemoEmailFb'); });
  $('#formDemoPass').on('input', function () { validateFormField('#formDemoPass', '#formDemoPassFb'); });

  $('#formDemoSubmitBtn').on('click', function () {
    validateFormField('#formDemoName', '#formDemoNameFb');
    validateFormField('#formDemoEmail', '#formDemoEmailFb');
    validateFormField('#formDemoPass', '#formDemoPassFb');

    var name = $('#formDemoName').val().trim();
    var email = $('#formDemoEmail').val().trim();
    var pass = $('#formDemoPass').val();
    var lang = $('#formDemoLang').val();

    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || pass.length < 8) {
      $('#formDemoResult').html('<span style="color:var(--md-sys-color-error); font-weight:600;">Please fix the errors above.</span>');
      return;
    }

    $('#formDemoResult').html(
      '<div style="background:var(--md-sys-color-primary-container); color:var(--md-sys-color-on-primary-container); padding:14px 18px; border-radius:var(--md-sys-shape-corner-sm);">' +
      '<strong>Submitted!</strong> Name: ' + escapeHtml(name) + ', Email: ' + escapeHtml(email) +
      ', Password: ' + '•'.repeat(pass.length) + ', Language: ' + (lang || 'None') + '</div>'
    );
    showSnackbar('Form submitted!');
  });

  // ==========================================
  // 7. HTML: LIVE HTML EDITOR
  // Textarea + iframe. Click Run to render
  // the textarea content inside iframe.srcdoc.
  // ==========================================

  var htmlEditorDefault = $('#htmlEditor').val();

  $('#runHtmlBtn').on('click', function () {
    var code = $('#htmlEditor').val();
    var iframe = $('#htmlPreview')[0];
    iframe.srcdoc = code;
  });

  $('#resetHtmlBtn').on('click', function () {
    $('#htmlEditor').val(htmlEditorDefault);
    $('#htmlPreview')[0].srcdoc = '';
  });

  // ==========================================
  // 8. CSS: CSS ON/OFF TOGGLE
  // Two HTML strings - one styled, one raw.
  // Buttons swap which one goes into .html().
  // ==========================================

  var cssOnHtml = '<div style="font-family:Outfit,sans-serif; max-width:320px; margin:0 auto;">' +
    '<div style="background:linear-gradient(135deg,#003844,#520035); padding:20px; border-radius:16px; margin-bottom:12px;">' +
    '<h3 style="color:#80f0ff; margin:0 0 8px;">Welcome Back!</h3>' +
    '<p style="color:#e0e4ec; font-size:0.875rem; margin:0; line-height:1.6;">Your dashboard is ready. You have <strong>3 new notifications</strong>.</p></div>' +
    '<div style="display:flex; gap:8px;">' +
    '<button style="flex:1; padding:10px; background:#00e5ff; color:#fff; border:none; border-radius:24px; font-weight:600; font-size:0.875rem;">View</button>' +
    '<button style="flex:1; padding:10px; background:transparent; color:#00e5ff; border:2px solid #00e5ff; border-radius:24px; font-weight:600; font-size:0.875rem;">Dismiss</button>' +
    '</div></div>';

  var cssOffHtml = '<div><h3>Welcome Back!</h3><p>Your dashboard is ready. You have <b>3 new notifications</b>.</p>' +
    '<button>View</button> <button>Dismiss</button></div>';

  $('#cssOnBtn').on('click', function () {
    $('#cssToggleDemoPreview').html(cssOnHtml);
    $('#cssOnBtn').removeClass('btn--outlined').addClass('btn--filled');
    $('#cssOffBtn').removeClass('btn--filled').addClass('btn--outlined');
  });
  $('#cssOffBtn').on('click', function () {
    $('#cssToggleDemoPreview').html(cssOffHtml);
    $('#cssOffBtn').removeClass('btn--outlined').addClass('btn--filled');
    $('#cssOnBtn').removeClass('btn--filled').addClass('btn--outlined');
  });
  $('#cssOnBtn').trigger('click');

  // ==========================================
  // 9. CSS: BOX MODEL VISUALISER
  // +/− buttons change padding/margin values.
  // jQuery .css() updates the visual box.
  // ==========================================

  var bmPadding = 20, bmMargin = 16;

  function updateBoxModel() {
    $('#boxModelVisual').css({ 'padding': bmPadding + 'px', 'margin': bmMargin + 'px' });
    $('#boxModelInfo').text('padding: ' + bmPadding + 'px;  margin: ' + bmMargin + 'px;');
  }

  $('#bmPaddingPlus').on('click', function ()  { bmPadding = Math.min(80, bmPadding + 10); updateBoxModel(); });
  $('#bmPaddingMinus').on('click', function () { bmPadding = Math.max(0, bmPadding - 10);  updateBoxModel(); });
  $('#bmMarginPlus').on('click', function ()   { bmMargin = Math.min(60, bmMargin + 10);   updateBoxModel(); });
  $('#bmMarginMinus').on('click', function ()  { bmMargin = Math.max(0, bmMargin - 10);    updateBoxModel(); });
  $('#bmReset').on('click', function ()        { bmPadding = 20; bmMargin = 16;            updateBoxModel(); });

  // ==========================================
  // 10. CSS: FLEXBOX PLAYGROUND
  // Dropdowns set flex-direction, justify-content,
  // align-items, gap. Container re-renders.
  // ==========================================

  function updateFlexDemo() {
    var dir = $('#flexDirSelect').val();
    var justify = $('#flexJustifySelect').val();
    var align = $('#flexAlignSelect').val();
    var gap = $('#flexGapSelect').val();

    $('#flexDemoContainer').css({ 'flex-direction': dir, 'justify-content': justify, 'align-items': align, 'gap': gap });
    $('#flexDemoCode').text(
      '.container {\n  display: flex;\n  flex-direction: ' + dir +
      ';\n  justify-content: ' + justify + ';\n  align-items: ' + align +
      ';\n  gap: ' + gap + ';\n}'
    );
  }

  $('#flexDirSelect, #flexJustifySelect, #flexAlignSelect, #flexGapSelect').on('change', updateFlexDemo);
  updateFlexDemo();

  // ==========================================
  // 11. CSS: POSITION PLAYGROUND
  // Dropdown picks position mode, sliders set
  // top/left offsets. Box moves in real time.
  // Fixed is simulated as absolute to avoid
  // breaking the page layout.
  // ==========================================

  function updatePositionDemo() {
    var mode = $('#positionModeSelect').val();
    var top = $('#posTopRange').val();
    var left = $('#posLeftRange').val();

    $('#posTopVal').text(top);
    $('#posLeftVal').text(left);

    var $box = $('#positionDemoBox');

    // For fixed, don't actually apply it (would break the page)
    var appliedMode = mode === 'fixed' ? 'absolute' : mode;
    $box.css({
      'position': appliedMode,
      'top': (mode === 'static') ? 'auto' : top + 'px',
      'left': (mode === 'static') ? 'auto' : left + 'px'
    });

    var codeTop = (mode === 'static') ? '  /* top/left ignored on static */' : '  top: ' + top + 'px;\n  left: ' + left + 'px;';
    var note = (mode === 'fixed') ? '\n  /* (shown as absolute to avoid breaking the page) */' : '';
    $('#positionDemoCode').text(
      '.target {\n' +
      '  position: ' + mode + ';\n' +
      codeTop + note + '\n' +
      '}'
    );
  }

  $('#positionModeSelect').on('change', updatePositionDemo);
  $('#posTopRange, #posLeftRange').on('input', updatePositionDemo);
  updatePositionDemo();

  // ==========================================
  // 12. CSS: LIVE CSS EDITOR
  // Textarea for CSS + iframe with fixed HTML.
  // Click Run to inject the CSS into the iframe.
  // ==========================================

  var cssEditorDefault = $('#cssEditor').val();
  var cssPreviewHtml = '<h1>Hello World</h1><p>This is a paragraph with a <span class="highlight">highlighted</span> word.</p><ul><li>First item</li><li>Second item</li><li>Third item</li></ul><p class="note">This paragraph has class <strong>note</strong>.</p><a href="#">A sample link</a>';

  // Show the HTML structure so users know what CSS selectors to target
  $('#cssHtmlRef').text(
    '<h1>Hello World</h1>\n' +
    '<p>...a <span class="highlight">highlighted</span> word.</p>\n' +
    '<ul>\n  <li>First item</li>\n  <li>Second item</li>\n</ul>\n' +
    '<p class="note">...has class "note".</p>\n' +
    '<a href="#">A sample link</a>'
  );

  $('#runCssBtn').on('click', function () {
    var css = $('#cssEditor').val();
    var iframe = $('#cssPreview')[0];
    iframe.srcdoc = '<style>' + css + '</style>' + cssPreviewHtml;
  });

  $('#resetCssBtn').on('click', function () {
    $('#cssEditor').val(cssEditorDefault);
    $('#cssPreview')[0].srcdoc = '';
  });

  // ==========================================
  // 13. JS: GRADE CALCULATOR (if/else)
  // Type 0–100, click Calculate. An if/else
  // chain assigns a letter grade. Code trace
  // shows which branch executed.
  // ==========================================

  $('#gradeCalcBtn').on('click', function () {
    var score = parseInt($('#gradeInput').val(), 10);
    if (isNaN(score) || score < 0 || score > 100) {
      $('#gradeResultDisplay').html('<span style="color:var(--md-sys-color-error);">Enter a number 0–100.</span>')
        .css('background', 'var(--md-sys-color-error-container)');
      $('#gradeCodeTrace').text('');
      return;
    }

    var grade, color, bg;
    var isLight = document.documentElement.classList.contains('light');
    if (isLight) {
      if (score >= 90)      { grade = 'A'; color = '#0097a7'; bg = '#d6f7ff'; }
      else if (score >= 80) { grade = 'B'; color = '#00838f'; bg = '#e0f7fa'; }
      else if (score >= 70) { grade = 'C'; color = '#558b2f'; bg = '#e4ffcc'; }
      else if (score >= 60) { grade = 'D'; color = '#e65100'; bg = '#fff3e0'; }
      else                  { grade = 'F'; color = '#d32f2f'; bg = '#ffdad6'; }
    } else {
      if (score >= 90)      { grade = 'A'; color = '#00e5ff'; bg = '#003844'; }
      else if (score >= 80) { grade = 'B'; color = '#80f0ff'; bg = '#0a1a2a'; }
      else if (score >= 70) { grade = 'C'; color = '#b8ff00'; bg = '#1a2000'; }
      else if (score >= 60) { grade = 'D'; color = '#ff9800'; bg = '#2a1500'; }
      else                  { grade = 'F'; color = '#ff4455'; bg = '#5c0010'; }
    }

    var status = score >= 60 ? 'Pass' : 'Fail';

    $('#gradeResultDisplay')
      .html('<span style="font-size:2rem; font-weight:700; color:' + color + ';">' + grade + '</span>' +
            '<span style="margin-left:12px; font-weight:600; color:' + color + ';">' + status + ' (' + score + '/100)</span>')
      .css('background', bg);

    $('#gradeCodeTrace').text(
      'if (score >= 90)       → ' + (score >= 90 ? 'true ✓' : 'false') + '\n' +
      'else if (score >= 80)  → ' + (score >= 80 && score < 90 ? 'true ✓' : (score >= 90 ? 'skipped' : 'false')) + '\n' +
      'else if (score >= 70)  → ' + (score >= 70 && score < 80 ? 'true ✓' : (score >= 80 ? 'skipped' : 'false')) + '\n' +
      'else if (score >= 60)  → ' + (score >= 60 && score < 70 ? 'true ✓' : (score >= 70 ? 'skipped' : 'false')) + '\n' +
      'else                   → ' + (score < 60 ? 'executed ✓' : 'skipped')
    );
  });

  $('#gradeCalcBtn').trigger('click');

  // ==========================================
  // 14. JS: DOM MANIPULATION PLAYGROUND
  // Four buttons: Add appends a new element,
  // Style changes the last element's colour,
  // Text changes its content, Remove deletes it.
  // ==========================================

  var domCounter = 0;
  var domColors = ['var(--md-sys-color-primary-container)', 'var(--md-sys-color-secondary-container)',
                   'var(--md-sys-color-tertiary-container)', 'var(--md-sys-color-error-container)'];

  function domLog(msg) {
    var existing = $('#domDemoLog').text();
    $('#domDemoLog').text(existing ? existing + '\n' + msg : msg);
  }

  $('#domAddBtn').on('click', function () {
    domCounter++;
    var $el = $('<div></div>')
      .css({
        'padding': '10px 16px', 'border-radius': 'var(--md-sys-shape-corner-sm)',
        'background': domColors[(domCounter - 1) % domColors.length],
        'color': 'var(--md-sys-color-on-surface)', 'font-size': '0.875rem',
        'animation': 'fadeSlideIn 0.3s ease'
      })
      .text('Element ' + domCounter);
    $('#domPlayground').append($el);
    domLog('→ container.appendChild("Element ' + domCounter + '")');
  });

  $('#domStyleBtn').on('click', function () {
    var $last = $('#domPlayground').children().last();
    if (!$last.length) { domLog('→ No elements to style.'); return; }
    $last.css({ 'background': 'var(--md-sys-color-primary)', 'color': 'var(--md-sys-color-on-primary)', 'font-weight': '700', 'border-color': 'var(--md-sys-color-primary)' });
    domLog('→ lastChild.style.background = "primary"');
  });

  $('#domTextBtn').on('click', function () {
    var $last = $('#domPlayground').children().last();
    if (!$last.length) { domLog('→ No elements to rename.'); return; }
    $last.text('Modified! (' + new Date().toLocaleTimeString() + ')');
    domLog('→ lastChild.textContent = "Modified!"');
  });

  $('#domRemoveBtn').on('click', function () {
    var $last = $('#domPlayground').children().last();
    if (!$last.length) { domLog('→ No elements to remove.'); return; }
    $last.remove();
    domLog('→ container.removeChild(lastChild)');
  });

  $('#domResetBtn').on('click', function () {
    domCounter = 0;
    $('#domPlayground').html('');
    $('#domDemoLog').text('');
  });

  // ==========================================
  // 15. JS: JAVASCRIPT SANDBOX
  // Textarea + output panel. Click Run to
  // execute the code. output() function prints
  // results to the panel instead of console.
  // ==========================================

  var jsEditorDefault = $('#jsEditor').val();

  $('#runJsBtn').on('click', function () {
    var code = $('#jsEditor').val();
    var $out = $('#jsPreview');
    $out.html('');

    // Create an output() function the user's code can call
    var lines = [];
    var outputFn = function (val) { lines.push(String(val)); };

    try {
      var fn = new Function('output', code);
      fn(outputFn);
      $out.text(lines.join('\n') || '(no output)');
    } catch (err) {
      $out.html('<span style="color:var(--md-sys-color-error); font-weight:600;">' + err.name + ':</span> ' + err.message);
    }
  });

  $('#resetJsBtn').on('click', function () {
    $('#jsEditor').val(jsEditorDefault);
    $('#jsPreview').html('');
  });

}); // end $(document).ready
