// Glen's Lemons — playful extras: tappable mascot, lemon confetti, and a
// hidden "type lemon" easter egg. All motion respects prefers-reduced-motion.
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var PUNS = [
    "When life gives you lemons… come find Glen! 🍋",
    "Easy peasy, lemon squeezy.",
    "Squeeze the day! ☀️",
    "You're our main squeeze.",
    "Pucker up, buttercup!",
    "Zest is yet to come.",
    "Sip happens — make it lemonade.",
    "Cool, crisp, and a little tart. Just right.",
    "One in a melon… wait, wrong fruit. 🍋",
    "Fresh squeezed, never sub-par-lemon."
  ];

  function rand(n) { return Math.floor(Math.random() * n); }

  // ---- "Lemons squeezed" counter (persists across visits) ------------------
  var SQUEEZE_KEY = "glensLemonsSqueezed";
  var countEl = document.getElementById("squeeze-count");
  function readCount() {
    try { return parseInt(localStorage.getItem(SQUEEZE_KEY) || "0", 10) || 0; }
    catch (e) { return 0; }
  }
  function renderCount() { if (countEl) countEl.textContent = readCount().toLocaleString(); }
  function bumpSqueeze(el, doBurst) {
    var n = readCount() + 1;
    try { localStorage.setItem(SQUEEZE_KEY, String(n)); } catch (e) {}
    renderCount();
    if (doBurst && el) {
      var r = el.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 12);
    }
    return n;
  }
  renderCount();
  var squeezeBtn = document.getElementById("squeeze-btn");
  if (squeezeBtn) squeezeBtn.addEventListener("click", function () { bumpSqueeze(squeezeBtn, true); });

  // ---- Lemon fact of the day -----------------------------------------------
  var FACTS = [
    "A single lemon tree can produce up to 600 lemons a year!",
    "Lemons float in water because they're less dense than it.",
    "Lemons are technically berries. Berry interesting!",
    "One lemon has about a full day's worth of vitamin C.",
    "Sailors once packed lemons on long voyages to fight scurvy.",
    "Lemons only ripen on the tree — never after they're picked.",
    "Rub a lemon on a cutting board to freshen it right up.",
    "The lemon first grew in Asia thousands of years ago.",
    "Lemon + baking soda makes a fizzy little science experiment.",
    "It takes about 5 lemons to make one big glass of lemonade. 🍋",
    "The word \"lemon\" comes from the Persian word \"līmūn\".",
    "A lemon is about as acidic as vinegar — pH around 2!",
    "Meyer lemons are a sweet cross between a lemon and a mandarin.",
    "Lemon trees can flower and grow fruit at the same time.",
    "The average lemon holds about 3 tablespoons of juice.",
    "Most of a lemon's aroma lives in the oils of its zest.",
    "California and Arizona grow most of the lemons in the U.S.",
    "A squeeze of lemon keeps sliced apples from turning brown.",
    "A healthy lemon tree can keep producing for over 50 years.",
    "Menton, France throws a giant Lemon Festival every winter.",
    "Just a whiff of fresh lemon can give your mood a little lift.",
    "Roll a lemon on the counter before juicing to get more out of it.",
    "Bees love lemon blossoms — every tree helps the pollinators.",
    "Lemon trees are evergreen — they stay green all year long."
  ];
  var factEl = document.getElementById("lemon-fact");
  var factBtn = document.getElementById("lemon-fact-btn");
  if (factEl) {
    var factIdx = rand(FACTS.length);
    function showFact() { factEl.textContent = FACTS[factIdx]; }
    showFact();
    if (factBtn) factBtn.addEventListener("click", function () {
      factIdx = (factIdx + 1) % FACTS.length;
      showFact();
    });
    if (!reduce) setInterval(function () {
      factIdx = (factIdx + 1) % FACTS.length;
      showFact();
    }, 9000);
  }

  // ---- Lemon confetti burst (viewport coords) ------------------------------
  function burst(x, y, count) {
    if (reduce) return;
    count = count || 20;
    var layer = document.createElement("div");
    layer.className = "fun-confetti";
    layer.setAttribute("aria-hidden", "true");
    var pieces = ["🍋", "💛", "✨", "🍋"];
    for (var i = 0; i < count; i++) {
      var s = document.createElement("span");
      s.textContent = pieces[i % pieces.length];
      var ang = Math.random() * Math.PI * 2;
      var dist = 70 + Math.random() * 170;
      s.style.left = x + "px";
      s.style.top = y + "px";
      s.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      s.style.setProperty("--dy", Math.sin(ang) * dist - 90 + "px");
      s.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
      s.style.fontSize = 14 + Math.random() * 16 + "px";
      s.style.animationDelay = Math.random() * 0.08 + "s";
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
    setTimeout(function () { layer.remove(); }, 1500);
  }

  function celebrate() {
    burst(window.innerWidth / 2, window.innerHeight * 0.42, 30);
  }

  // ---- Lemon rain (easter egg) ---------------------------------------------
  function rain() {
    if (reduce) return;
    var layer = document.createElement("div");
    layer.className = "fun-rain";
    layer.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 28; i++) {
      var s = document.createElement("span");
      s.textContent = "🍋";
      s.style.left = Math.random() * 100 + "vw";
      s.style.fontSize = 16 + Math.random() * 22 + "px";
      s.style.animationDuration = 2 + Math.random() * 2.5 + "s";
      s.style.animationDelay = Math.random() * 0.8 + "s";
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
    setTimeout(function () { layer.remove(); }, 5000);
  }

  function toast(msg) {
    var t = document.createElement("div");
    t.className = "fun-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("show"); });
    setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () { t.remove(); }, 350);
    }, 2600);
  }

  // ---- Tappable mascot ------------------------------------------------------
  var mascot = document.querySelector(".hero__logo");
  var art = document.querySelector(".hero__art");
  if (mascot && art) {
    art.style.position = "relative";
    mascot.style.cursor = "pointer";
    mascot.setAttribute("title", "Tap me!");

    var bubble = document.createElement("div");
    bubble.className = "mascot-bubble";
    bubble.setAttribute("aria-hidden", "true");
    art.appendChild(bubble);

    var hint = document.createElement("div");
    hint.className = "mascot-hint";
    hint.textContent = "Tap me! 🍋";
    hint.setAttribute("aria-hidden", "true");
    art.appendChild(hint);

    var bubbleTimer;
    function showBubble(text) {
      bubble.textContent = text;
      bubble.classList.add("show");
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(function () { bubble.classList.remove("show"); }, 2600);
    }

    mascot.addEventListener("click", function () {
      var n = bumpSqueeze(mascot, false);
      if (hint) { hint.remove(); hint = null; }
      if (!reduce) {
        mascot.classList.remove("mascot-wiggle");
        void mascot.offsetWidth;
        mascot.classList.add("mascot-wiggle");
        var r = mascot.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height * 0.4, 16);
      }
      var msg = n % 25 === 0
        ? ("Whoa — " + n.toLocaleString() + " lemons squeezed! 🍋💛")
        : PUNS[rand(PUNS.length)];
      showBubble(msg);
    });
  }

  // ---- Easter egg: type "lemon" --------------------------------------------
  var buf = "";
  document.addEventListener("keydown", function (e) {
    var tag = (e.target && e.target.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return; // don't hijack form typing
    if (e.key && e.key.length === 1) buf = (buf + e.key.toLowerCase()).slice(-8);
    if (buf.indexOf("lemon") >= 0) {
      buf = "";
      rain();
      toast("🍋 You found the secret lemon stash! 🍋");
    }
  });

  // Expose for other scripts (e.g. the catering form celebrates on submit).
  window.GlensFun = { celebrate: celebrate, burst: burst, rain: rain, toast: toast };
})();
