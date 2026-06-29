// Glen's Lemons — catering inquiry flow (Typeform-style, one question at a time).
// No dependencies. Submits via mailto by default; set FORMSPREE_ENDPOINT to a
// Formspree (or similar) URL to collect inquiries without the visitor's email app.
(function () {
  "use strict";

  // ---- Config ---------------------------------------------------------------
  var EMAIL = "hello@glenslemons.com"; // TODO: replace with the real inbox
  var FORMSPREE_ENDPOINT = ""; // e.g. "https://formspree.io/f/xxxxxxx" — leave "" to use mailto

  // ---- Questions ------------------------------------------------------------
  var QUESTIONS = [
    { id: "name", type: "text", label: "First things first — who are we pouring for?", placeholder: "Your name", required: true },
    { id: "email", type: "email", label: "What's the best email to reach you?", placeholder: "you@example.com", required: true },
    { id: "phone", type: "tel", label: "A phone number, in case it's easier?", placeholder: "(605) 555-0123", help: "Optional" },
    { id: "occasion", type: "text", label: "What's the occasion?", placeholder: "Birthday, wedding, grad party, company picnic…" },
    { id: "guests", type: "choice", label: "About how many guests?", required: true,
      options: ["Up to 50", "Up to 75", "Up to 100", "More than 100"] },
    { id: "date", type: "date", label: "When's the big day?", help: "Optional — a rough date is fine" },
    { id: "location", type: "text", label: "Where's the event?", placeholder: "Park, venue, or address around Sioux Falls" },
    { id: "notes", type: "textarea", label: "Anything else we should know?", placeholder: "Theme, timing, special requests…", help: "Optional" }
  ];

  // ---- Elements -------------------------------------------------------------
  var root = document.getElementById("inquiry");
  if (!root) return;
  var stage = document.getElementById("inquiry-stage");
  var bar = document.getElementById("inquiry-bar");
  var form = document.getElementById("inquiry-form");
  var backBtn = document.getElementById("inquiry-back");
  var nextBtn = document.getElementById("inquiry-next");
  var hint = document.getElementById("inquiry-hint");

  var answers = {};
  var step = 0;
  var lastFocused = null;

  // ---- Helpers --------------------------------------------------------------
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function setProgress() {
    var pct = Math.round((step / QUESTIONS.length) * 100);
    bar.style.width = pct + "%";
  }

  function render() {
    var q = QUESTIONS[step];
    var current = answers[q.id] || "";
    var html = '<p class="inquiry__step">Question ' + (step + 1) + " of " + QUESTIONS.length + "</p>";
    html += '<label class="inquiry__label" for="inquiry-input">' + q.label + "</label>";
    if (q.help) html += '<p class="inquiry__help">' + q.help + "</p>";

    if (q.type === "choice") {
      html += '<div class="inquiry__choices">';
      q.options.forEach(function (opt) {
        var sel = current === opt ? " is-selected" : "";
        html += '<button type="button" class="inquiry__choice' + sel + '" data-choice="' + opt + '">' + opt + "</button>";
      });
      html += "</div>";
    } else if (q.type === "textarea") {
      html += '<textarea class="inquiry__input" id="inquiry-input" rows="3" placeholder="' + (q.placeholder || "") + '">' + current + "</textarea>";
    } else {
      html += '<input class="inquiry__input" id="inquiry-input" type="' + q.type + '" placeholder="' + (q.placeholder || "") + '" value="' + current.replace(/"/g, "&quot;") + '" />';
    }
    html += '<p class="inquiry__error" id="inquiry-error" role="alert"></p>';
    stage.innerHTML = html;

    // Nav state
    backBtn.style.visibility = step === 0 ? "hidden" : "visible";
    nextBtn.textContent = step === QUESTIONS.length - 1 ? "Send inquiry 🍋" : "Next";
    hint.style.display = q.type === "choice" ? "none" : "block";
    setProgress();

    // Choice buttons advance on click
    if (q.type === "choice") {
      Array.prototype.forEach.call(stage.querySelectorAll(".inquiry__choice"), function (b) {
        b.addEventListener("click", function () {
          answers[q.id] = b.getAttribute("data-choice");
          advance();
        });
      });
    } else {
      var input = document.getElementById("inquiry-input");
      if (input) {
        setTimeout(function () { input.focus(); }, 50);
        input.addEventListener("input", function () {
          var err = document.getElementById("inquiry-error");
          if (err) err.textContent = "";
        });
      }
    }
  }

  function validateCurrent() {
    var q = QUESTIONS[step];
    var err = document.getElementById("inquiry-error");
    if (q.type === "choice") {
      if (q.required && !answers[q.id]) { if (err) err.textContent = "Please pick one."; return false; }
      return true;
    }
    var input = document.getElementById("inquiry-input");
    var val = input ? input.value.trim() : "";
    answers[q.id] = val;
    if (q.required && !val) { if (err) err.textContent = "This one's required 🙂"; return false; }
    if (q.type === "email" && val && !isValidEmail(val)) { if (err) err.textContent = "Hmm, that email looks off."; return false; }
    return true;
  }

  function advance() {
    if (step < QUESTIONS.length - 1) {
      step++;
      render();
    } else {
      submit();
    }
  }

  function buildSummary() {
    var lines = ["Glen's Lemons — Catering Inquiry", ""];
    QUESTIONS.forEach(function (q) {
      var v = answers[q.id];
      if (v) lines.push(q.label.replace(/[—🍋]/g, "").trim() + "\n  " + v + "\n");
    });
    return lines.join("\n");
  }

  function showThanks(viaMailto) {
    bar.style.width = "100%";
    var extra = viaMailto
      ? "<p class=\"inquiry__help\">If your email app didn't pop open, just send your note to <a href=\"mailto:" + EMAIL + "\">" + EMAIL + "</a>.</p>"
      : "";
    stage.innerHTML =
      '<div class="inquiry__done">' +
      '<div class="inquiry__done-icon">🍋</div>' +
      "<h3>Thanks, " + (answers.name ? answers.name.split(" ")[0] : "friend") + "!</h3>" +
      "<p>Your catering inquiry is on its way. We'll be in touch soon to get the lemonade flowing.</p>" +
      extra +
      "</div>";
    form.querySelector(".inquiry__nav").style.display = "none";
    hint.style.display = "none";
  }

  function submit() {
    if (FORMSPREE_ENDPOINT) {
      nextBtn.disabled = true;
      nextBtn.textContent = "Sending…";
      fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(answers)
      })
        .then(function () { showThanks(false); })
        .catch(function () { sendMailto(); showThanks(true); })
        .then(function () { nextBtn.disabled = false; });
    } else {
      sendMailto();
      showThanks(true);
    }
  }

  function sendMailto() {
    var subject = "Catering inquiry" + (answers.occasion ? " — " + answers.occasion : "");
    var url = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(buildSummary());
    window.location.href = url;
  }

  // ---- Open / close ---------------------------------------------------------
  function open() {
    lastFocused = document.activeElement;
    answers = {};
    step = 0;
    root.hidden = false;
    document.body.style.overflow = "hidden";
    form.querySelector(".inquiry__nav").style.display = "";
    render();
  }

  function close() {
    root.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  // ---- Wire up --------------------------------------------------------------
  Array.prototype.forEach.call(document.querySelectorAll("[data-inquiry]"), function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      open();
    });
  });

  Array.prototype.forEach.call(root.querySelectorAll("[data-inquiry-close]"), function (el) {
    el.addEventListener("click", close);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (validateCurrent()) advance();
  });

  backBtn.addEventListener("click", function () {
    if (step > 0) { step--; render(); }
  });

  document.addEventListener("keydown", function (e) {
    if (root.hidden) return;
    if (e.key === "Escape") close();
  });
})();
