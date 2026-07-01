// Glen's Lemons — catering inquiry flow (Typeform-style, one question at a time).
// No dependencies. Inquiries are emailed via FormSubmit (no account/API key);
// if that request fails, it falls back to opening the visitor's email app.
(function () {
  "use strict";

  // ---- Config ---------------------------------------------------------------
  var EMAIL = "glenandrea2007@gmail.com"; // where inquiries are sent
  // Inquiries are delivered server-side via FormSubmit (no account/API key).
  // The first submission triggers a one-time confirmation email to EMAIL —
  // click that link once and every future inquiry arrives automatically.
  // If the request ever fails, we fall back to opening the visitor's email app.
  var SUBMIT_ENDPOINT = "https://formsubmit.co/ajax/" + EMAIL;

  // Guest count → matching catering package (mirrors the Catering section).
  var PACKAGES = {
    "Up to 50": { name: "The Get-Together", price: "$375", detail: "up to 50 guests · 2 hours" },
    "Up to 75": { name: "The Block Party", price: "$495", detail: "up to 75 guests · 2 hours" },
    "Up to 100": { name: "The Big Bash", price: "$650", detail: "up to 100 guests · 3 hours" },
    "More than 100": { name: "Custom event", price: "Custom quote", detail: "we'll price it just for you" }
  };

  // ---- Questions ------------------------------------------------------------
  var QUESTIONS = [
    { id: "name", type: "text", label: "First things first — who are we pouring for?", placeholder: "Your name", required: true },
    { id: "email", type: "email", label: "What's the best email to reach you?", placeholder: "you@example.com", required: true },
    { id: "phone", type: "tel", label: "A phone number, in case it's easier?", placeholder: "(605) 555-0123", help: "Optional" },
    { id: "occasion", type: "text", label: "What's the occasion?", placeholder: "Birthday, wedding, grad party, company picnic…" },
    { id: "guests", type: "choice", label: "About how many guests?", required: true,
      options: ["Up to 50", "Up to 75", "Up to 100", "More than 100"] },
    { id: "date", type: "date", label: "When's the event?", help: "Pick the date you're planning for.", required: true },
    { id: "time", type: "text", label: "What time should we set up?", placeholder: "e.g. 2:00 PM – 4:00 PM", help: "A rough window is fine." },
    { id: "location", type: "text", label: "Where's the event?", placeholder: "Venue or address around Sioux Falls", required: true },
    { id: "notes", type: "textarea", label: "Anything else we should know?", placeholder: "Theme, timing, special requests…", help: "Optional" }
  ];
  var REVIEW = QUESTIONS.length; // the step index of the review screen

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

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function setProgress() {
    var pct = Math.round((step / (QUESTIONS.length + 1)) * 100);
    bar.style.width = pct + "%";
  }

  // Re-trigger the slide-in animation each time the stage content changes.
  function animateStage() {
    stage.classList.remove("is-anim");
    void stage.offsetWidth; // reflow
    stage.classList.add("is-anim");
  }

  function render() {
    if (step >= REVIEW) return renderReview();
    renderQuestion();
  }

  function renderQuestion() {
    var q = QUESTIONS[step];
    var current = answers[q.id] || "";
    var html = '<p class="inquiry__step">Question ' + (step + 1) + " of " + QUESTIONS.length + "</p>";
    html += '<label class="inquiry__label" for="inquiry-input">' + q.label + "</label>";
    if (q.help) html += '<p class="inquiry__help">' + q.help + "</p>";

    if (q.type === "choice") {
      html += '<div class="inquiry__choices">';
      q.options.forEach(function (opt, i) {
        var sel = current === opt ? " is-selected" : "";
        html += '<button type="button" class="inquiry__choice' + sel + '" data-choice="' + esc(opt) + '">' +
          '<span class="inquiry__choice-key">' + (i + 1) + "</span>" + esc(opt) + "</button>";
      });
      html += "</div>";
    } else if (q.type === "textarea") {
      html += '<textarea class="inquiry__input" id="inquiry-input" rows="3" placeholder="' + esc(q.placeholder || "") + '">' + esc(current) + "</textarea>";
    } else {
      var min = q.type === "date" ? ' min="' + todayISO() + '"' : "";
      html += '<input class="inquiry__input" id="inquiry-input" type="' + q.type + '"' + min +
        ' placeholder="' + esc(q.placeholder || "") + '" value="' + esc(current) + '" />';
    }
    html += '<p class="inquiry__error" id="inquiry-error" role="alert"></p>';
    stage.innerHTML = html;
    animateStage();

    backBtn.style.visibility = step === 0 ? "hidden" : "visible";
    nextBtn.textContent = step === QUESTIONS.length - 1 ? "Review" : "Next";
    hint.style.display = q.type === "choice" ? "none" : "block";
    setProgress();

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
        setTimeout(function () { input.focus(); }, 60);
        input.addEventListener("input", function () {
          var err = document.getElementById("inquiry-error");
          if (err) err.textContent = "";
        });
      }
    }
  }

  function renderReview() {
    var pkg = PACKAGES[answers.guests];
    var fields = [
      ["Name", answers.name], ["Email", answers.email], ["Phone", answers.phone],
      ["Occasion", answers.occasion], ["Guests", answers.guests],
      ["Date", answers.date], ["Setup time", answers.time],
      ["Location", answers.location], ["Notes", answers.notes]
    ];
    var rows = "";
    fields.forEach(function (f) {
      if (f[1]) rows += '<div class="inquiry__review-row"><span class="k">' + f[0] + '</span><span class="v">' + esc(f[1]) + "</span></div>";
    });
    var pkgHtml = pkg
      ? '<div class="inquiry__pkg"><span class="inquiry__pkg-tag">Best fit</span>' +
        '<span class="inquiry__pkg-name">' + pkg.name + "</span>" +
        '<span class="inquiry__pkg-price">' + pkg.price + "</span>" +
        '<span class="inquiry__pkg-detail">' + pkg.detail + "</span></div>"
      : "";

    stage.innerHTML =
      '<p class="inquiry__step">Almost there — quick review</p>' +
      '<label class="inquiry__label">Does everything look right?</label>' +
      pkgHtml +
      '<div class="inquiry__review">' + rows + "</div>";
    animateStage();

    backBtn.style.visibility = "visible";
    nextBtn.textContent = "Send inquiry 🍋";
    hint.style.display = "none";
    setProgress();
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
    if (step < REVIEW) { step++; render(); }
  }

  function buildSummary() {
    var lines = ["Glen's Lemons — Catering Inquiry", ""];
    QUESTIONS.forEach(function (q) {
      var v = answers[q.id];
      if (v) lines.push(q.label.replace(/[—🍋]/g, "").trim() + "\n  " + v + "\n");
    });
    return lines.join("\n");
  }

  // Readable payload for FormSubmit. A lowercase "email" field makes the
  // confirmation email reply straight to the customer.
  function buildPayload() {
    var pkg = PACKAGES[answers.guests];
    return {
      Name: answers.name || "",
      email: answers.email || "",
      Phone: answers.phone || "",
      Occasion: answers.occasion || "",
      Guests: answers.guests || "",
      "Suggested package": pkg ? pkg.name + " (" + pkg.price + ")" : "",
      "Event date": answers.date || "",
      "Setup time": answers.time || "",
      Location: answers.location || "",
      Notes: answers.notes || "",
      _subject: "New catering inquiry" + (answers.occasion ? " — " + answers.occasion : ""),
      _template: "table",
      _captcha: "false"
    };
  }

  function showThanks(viaMailto) {
    bar.style.width = "100%";
    var first = answers.name ? answers.name.split(" ")[0] : "friend";
    var recap = [];
    if (answers.occasion) recap.push(answers.occasion);
    if (answers.guests) recap.push(answers.guests.toLowerCase() + " guests");
    if (answers.date) recap.push("on " + answers.date);
    var recapLine = recap.length ? '<p class="inquiry__help">Your request — ' + esc(recap.join(" · ")) + " — is on its way.</p>" : "";
    var reply = answers.email
      ? "<p>We'll reply to <strong>" + esc(answers.email) + "</strong> soon to get the lemonade flowing. 🍋</p>"
      : "<p>We'll be in touch soon to get the lemonade flowing. 🍋</p>";
    var extra = viaMailto
      ? '<p class="inquiry__help">If your email app didn\'t open, send your note to <a href="mailto:' + EMAIL + '">' + EMAIL + "</a>.</p>"
      : "";
    stage.innerHTML =
      '<div class="inquiry__done"><div class="inquiry__done-icon">🍋</div>' +
      "<h3>Thanks, " + esc(first) + "!</h3>" + recapLine + reply + extra + "</div>";
    animateStage();
    form.querySelector(".inquiry__nav").style.display = "none";
    hint.style.display = "none";
    if (window.GlensFun && window.GlensFun.celebrate) window.GlensFun.celebrate();
  }

  function submit() {
    if (SUBMIT_ENDPOINT) {
      nextBtn.disabled = true;
      nextBtn.textContent = "Sending…";
      fetch(SUBMIT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(buildPayload())
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Bad response");
          showThanks(false);
        })
        .catch(function () {
          sendMailto();
          showThanks(true);
        })
        .then(function () {
          nextBtn.disabled = false;
          nextBtn.textContent = "Send inquiry 🍋";
        });
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
    if (step >= REVIEW) { submit(); return; }
    if (validateCurrent()) advance();
  });

  backBtn.addEventListener("click", function () {
    if (step > 0) { step--; render(); }
  });

  document.addEventListener("keydown", function (e) {
    if (root.hidden) return;
    if (e.key === "Escape") { close(); return; }
    // Number keys pick an option on choice questions.
    if (step < REVIEW && QUESTIONS[step].type === "choice" && /^[1-9]$/.test(e.key)) {
      var opts = QUESTIONS[step].options;
      var idx = parseInt(e.key, 10) - 1;
      if (idx < opts.length) {
        answers[QUESTIONS[step].id] = opts[idx];
        advance();
      }
    }
  });
})();
