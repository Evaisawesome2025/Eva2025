// Glen's Lemons — catering inquiry flow (Typeform-style, one question at a time).
// No dependencies. Inquiries are emailed via FormSubmit (no account/API key);
// if that request fails, it falls back to opening the visitor's email app.
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    { id: "occasion", type: "choice", label: "What's the occasion?",
      otherOption: "✨ Something else", otherPlaceholder: "Tell us about your event…",
      options: ["🎂 Birthday party", "🎓 Graduation", "💍 Wedding", "🏢 Company event", "🎪 Community event", "✨ Something else"] },
    { id: "guests", type: "choice", label: "About how many guests?", required: true,
      options: ["Up to 50", "Up to 75", "Up to 100", "More than 100"] },
    { id: "date", type: "date", label: "When's the event?", help: "Pick the date you're planning for.", required: true },
    { id: "time", type: "choice", label: "What time works best?", help: "A rough window — we'll fine-tune together.",
      options: ["🌅 Morning (9–12)", "☀️ Early afternoon (12–3)", "🌤️ Late afternoon (3–6)", "🌇 Evening (6–9)", "🤷 Not sure yet"] },
    { id: "location", type: "text", label: "Where's the event?", placeholder: "Start typing an address or venue…",
      suggest: true, help: "Pick a suggestion or just type it.", required: true },
    { id: "notes", type: "textarea", label: "Anything else we should know?", placeholder: "Theme, timing, special requests…", help: "Optional" }
  ];
  var REVIEW = QUESTIONS.length; // the step index of the review screen

  // ---- Elements -------------------------------------------------------------
  var root = document.getElementById("inquiry");
  if (!root) return;
  var panel = root.querySelector(".inquiry__panel");
  var handle = document.getElementById("inquiry-handle");
  var stage = document.getElementById("inquiry-stage");
  var bar = document.getElementById("inquiry-bar");
  var form = document.getElementById("inquiry-form");
  var backBtn = document.getElementById("inquiry-back");
  var nextBtn = document.getElementById("inquiry-next");
  var hint = document.getElementById("inquiry-hint");

  var answers = {};
  var otherMode = {}; // per-question: "Something else" chosen → show a text box
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
    var lemon = document.getElementById("inquiry-lemon");
    if (lemon) lemon.style.left = pct + "%";
  }

  // Show a fade at the stage's bottom edge whenever more content is below.
  function updateScrollHint() {
    var more = stage.scrollHeight - stage.scrollTop - stage.clientHeight > 8;
    stage.classList.toggle("can-scroll", more);
  }
  stage.addEventListener("scroll", updateScrollHint);
  window.addEventListener("resize", updateScrollHint);

  // Re-trigger the slide-in animation each time the stage content changes.
  function animateStage() {
    stage.classList.remove("is-anim");
    void stage.offsetWidth; // reflow
    stage.classList.add("is-anim");
    stage.scrollTop = 0;
    requestAnimationFrame(updateScrollHint);
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

    var isOther = q.type === "choice" && q.otherOption && otherMode[q.id];
    var showChoices = q.type === "choice" && !isOther;

    if (showChoices) {
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
      var inputType = isOther ? "text" : q.type;
      var min = inputType === "date" ? ' min="' + todayISO() + '"' : "";
      // Autofill + mobile keyboard hints so phones can one-tap fill these.
      var attrs = "";
      if (q.id === "name") attrs = ' autocomplete="name" autocapitalize="words"';
      else if (inputType === "email") attrs = ' autocomplete="email" inputmode="email"';
      else if (inputType === "tel") attrs = ' autocomplete="tel" inputmode="tel"';
      var ph = isOther ? (q.otherPlaceholder || "") : (q.placeholder || "");
      var val = isOther && q.options && q.options.indexOf(current) >= 0 ? "" : current;
      html += '<input class="inquiry__input" id="inquiry-input" type="' + inputType + '"' + min + attrs +
        ' enterkeyhint="next" placeholder="' + esc(ph) + '" value="' + esc(val) + '" />';
      if (isOther) html += '<button type="button" class="inquiry__choices-back" id="inquiry-choices-back">← Back to the list</button>';
    }
    html += '<p class="inquiry__error" id="inquiry-error" role="alert"></p>';
    stage.innerHTML = html;
    animateStage();

    backBtn.style.visibility = step === 0 ? "hidden" : "visible";
    nextBtn.textContent = step === QUESTIONS.length - 1 ? "Review" : "Next";
    hint.style.display = showChoices ? "none" : "block";
    setProgress();

    if (showChoices) {
      Array.prototype.forEach.call(stage.querySelectorAll(".inquiry__choice"), function (b) {
        b.addEventListener("click", function () {
          pickChoice(q, b.getAttribute("data-choice"), b);
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
        if (q.suggest) attachPlaceSuggest(input);
      }
      var backToChoices = document.getElementById("inquiry-choices-back");
      if (backToChoices) backToChoices.addEventListener("click", function () {
        otherMode[q.id] = false;
        render();
      });
    }
  }

  // Choosing an option advances; choosing the "other" option opens a text box.
  function pickChoice(q, val, btn) {
    if (q.otherOption && val === q.otherOption) {
      otherMode[q.id] = true;
      render();
      return;
    }
    answers[q.id] = val;
    otherMode[q.id] = false;
    if (navigator.vibrate) navigator.vibrate(8); // tiny haptic tick (Android)
    if (reduce || !btn) { advance(); return; }
    // A quick squish so the tap feels juicy before advancing.
    btn.classList.add("is-picked");
    setTimeout(advance, 160);
  }

  // ---- Location autocomplete ------------------------------------------------
  // Google Maps Platform API key — referrer-restricted to glenslemons.com and
  // limited to Places API (New), so it is safe to ship in client code. If
  // Google is unavailable, suggestions fall back to the curated local list
  // below plus the free OpenStreetMap Photon API. Typing always works.
  var GOOGLE_PLACES_KEY = "AIzaSyDq0K6cc6HT1q1G05XJ8GtxlGrSL4uQQ3A";

  // Popular Sioux Falls event spots — matched instantly, shown first.
  var LOCAL_SPOTS = [
    "Falls Park", "Lake Lorraine", "McKennan Park", "Sherman Park",
    "Terrace Park", "Yankton Trail Park", "Sertoma Park", "Leaders Park",
    "W.H. Lyon Fairgrounds", "Washington Pavilion",
    "Sioux Falls Convention Center", "Levitt at the Falls"
  ];

  function localMatches(qtext, max) {
    var needle = qtext.toLowerCase();
    return LOCAL_SPOTS
      .filter(function (s) { return s.toLowerCase().indexOf(needle) >= 0; })
      .slice(0, max)
      .map(function (s) { return { main: s, sub: "Sioux Falls, SD" }; });
  }

  function googleSuggest(qtext, signal) {
    return fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GOOGLE_PLACES_KEY },
      body: JSON.stringify({
        input: qtext,
        regionCode: "US",
        locationBias: { circle: { center: { latitude: 43.5446, longitude: -96.7311 }, radius: 30000 } }
      }),
      signal: signal
    }).then(function (r) {
      if (!r.ok) throw new Error("places " + r.status);
      return r.json();
    }).then(function (data) {
      return (data.suggestions || []).map(function (s) {
        var p = s.placePrediction || {};
        var sf = p.structuredFormat || {};
        return {
          main: (sf.mainText || {}).text || (p.text || {}).text || "",
          sub: (sf.secondaryText || {}).text || ""
        };
      }).filter(function (x) { return x.main; });
    });
  }

  function photonSuggest(qtext, signal) {
    return fetch("https://photon.komoot.io/api/?q=" + encodeURIComponent(qtext) +
                 "&limit=4&lang=en&lat=43.5446&lon=-96.7311", signal ? { signal: signal } : {})
      .then(function (r) { return r.json(); })
      .then(function (data) {
        return (data.features || []).map(function (f) {
          var p = f.properties || {};
          return {
            main: p.name || [p.street, p.housenumber].filter(Boolean).join(" "),
            sub: [p.city || p.county, p.state].filter(Boolean).join(", ")
          };
        }).filter(function (x) { return x.main; });
      });
  }

  function attachPlaceSuggest(input) {
    var box = document.createElement("div");
    box.className = "inquiry__suggest";
    box.hidden = true;
    input.insertAdjacentElement("afterend", box);
    var timer, controller;
    function clear() { box.innerHTML = ""; box.hidden = true; }

    function show(items) {
      box.innerHTML = "";
      var seen = {};
      items.forEach(function (it) {
        var key = it.main.toLowerCase();
        if (seen[key] || box.children.length >= 5) return;
        seen[key] = true;
        var b = document.createElement("button");
        b.type = "button";
        b.className = "inquiry__suggest-item";
        b.innerHTML = '📍 <span>' + esc(it.main) + "</span>" + (it.sub ? "<small>" + esc(it.sub) + "</small>" : "");
        b.addEventListener("click", function () {
          input.value = it.main + (it.sub ? ", " + it.sub : "");
          clear();
          input.focus();
        });
        box.appendChild(b);
      });
      box.hidden = box.children.length === 0;
      updateScrollHint();
    }

    // Quick picks the moment the field is focused, before any typing.
    input.addEventListener("focus", function () {
      if (!input.value.trim()) show(localMatches("", 4));
    });

    input.addEventListener("input", function () {
      clearTimeout(timer);
      var qtext = input.value.trim();
      if (!qtext) { show(localMatches("", 4)); return; }
      var locals = localMatches(qtext, 3);
      show(locals); // instant local results while the network catches up
      if (qtext.length < 3) return;
      timer = setTimeout(function () {
        if (controller && controller.abort) controller.abort();
        controller = window.AbortController ? new AbortController() : null;
        var signal = controller ? controller.signal : undefined;
        // Google first when a key is set; if Google errors for any reason
        // (API disabled, quota, network) quietly fall back to Photon.
        var remote = GOOGLE_PLACES_KEY
          ? googleSuggest(qtext, signal).catch(function () { return photonSuggest(qtext, signal); })
          : photonSuggest(qtext, signal);
        remote
          .then(function (items) { show(locals.concat(items)); })
          .catch(function () { /* keep the local suggestions */ });
      }, 250);
    });
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
    if (q.type === "choice" && !(q.otherOption && otherMode[q.id])) {
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
      nextBtn.innerHTML = '<span class="spin-lemon" aria-hidden="true">🍋</span> Sending…';
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

  // ---- Keyboard-aware sheet (iOS overlays the keyboard over fixed sheets) ----
  // While the form is open, pad the panel's bottom by the keyboard overlap so
  // the input and Back/Next buttons always stay visible above the keyboard.
  function keyboardPad() {
    if (!panel || !window.visualViewport) return;
    var vv = window.visualViewport;
    var overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    // Only meaningful on iOS, where the keyboard overlays the layout viewport.
    // Android resizes the page itself (interactive-widget=resizes-content), so
    // overlap stays ~0 there. Ignore tiny UI-chrome wobble and cap the pad so a
    // misreported viewport can never blow the sheet up.
    if (overlap < 60) overlap = 0;
    overlap = Math.min(overlap, Math.round(window.innerHeight * 0.45));
    panel.style.paddingBottom = overlap ? overlap + "px" : "";
    updateScrollHint();
  }

  // ---- Open / close ---------------------------------------------------------
  function open() {
    lastFocused = document.activeElement;
    answers = {};
    otherMode = {};
    step = 0;
    root.hidden = false;
    document.body.style.overflow = "hidden";
    form.querySelector(".inquiry__nav").style.display = "";
    if (window.visualViewport) window.visualViewport.addEventListener("resize", keyboardPad);
    render();
  }

  function close() {
    root.hidden = true;
    document.body.style.overflow = "";
    if (window.visualViewport) window.visualViewport.removeEventListener("resize", keyboardPad);
    if (panel) { panel.style.paddingBottom = ""; panel.style.transform = ""; }
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  // ---- Swipe down on the grab handle to dismiss (native sheet gesture) ------
  if (handle && panel) {
    var dragY = null, dragCur = 0;
    handle.addEventListener("touchstart", function (e) {
      dragY = e.touches[0].clientY;
      dragCur = 0;
      panel.style.transition = "none";
    }, { passive: true });
    handle.addEventListener("touchmove", function (e) {
      if (dragY === null) return;
      dragCur = Math.max(0, e.touches[0].clientY - dragY);
      panel.style.transform = dragCur ? "translateY(" + dragCur + "px)" : "";
    }, { passive: true });
    handle.addEventListener("touchend", function () {
      panel.style.transition = "";
      if (dragCur > 90) close();
      panel.style.transform = "";
      dragY = null;
      dragCur = 0;
    });
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
    // Number keys pick an option on choice questions (not while typing "other").
    var kq = step < REVIEW ? QUESTIONS[step] : null;
    if (kq && kq.type === "choice" && !(kq.otherOption && otherMode[kq.id]) && /^[1-9]$/.test(e.key)) {
      var idx = parseInt(e.key, 10) - 1;
      if (idx < kq.options.length) pickChoice(kq, kq.options[idx], null);
    }
  });
})();
