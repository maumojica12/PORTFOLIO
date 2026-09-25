(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------------------
     1. Theme toggle
     ------------------------------------------------------------------ */
  (function theme() {
    var button = document.getElementById("theme-toggle");
    var themeColor = document.getElementById("theme-color");
    var systemDark = window.matchMedia("(prefers-color-scheme: dark)");

    // A saved choice wins, otherwise the system setting.
    function currentTheme() {
      return root.dataset.theme || (systemDark.matches ? "dark" : "light");
    }

    function syncUI() {
      var t = currentTheme();
      button.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
      if (themeColor) themeColor.setAttribute("content", t === "dark" ? "#000000" : "#ffffff");
    }

    function setTheme(t) {
      root.dataset.theme = t;
      try { localStorage.setItem("theme", t); } catch (e) { /* storage may be blocked */ }
      syncUI();
    }

    button.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";

      if (!document.startViewTransition || reduceMotion.matches) {
        setTheme(next);
        return;
      }

      // Circular wipe that grows from the button.
      var rect = button.getBoundingClientRect();
      var x = rect.left + rect.width / 2;
      var y = rect.top + rect.height / 2;
      var radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      var transition = document.startViewTransition(function () { setTheme(next); });
      transition.ready.then(function () {
        root.animate(
          { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + radius + "px at " + x + "px " + y + "px)"] },
          { duration: 650, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      });
    });

    systemDark.addEventListener("change", syncUI);
    syncUI();
  })();

  /* ------------------------------------------------------------------
     2. Hero spotlight (mouse and pen only)
     The headline dims and a soft circle of full contrast follows the pointer.
     ------------------------------------------------------------------ */
  (function spotlight() {
    var hero = document.querySelector(".hero");
    var h1 = document.querySelector(".hero h1");
    var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!hero || !h1 || !canHover || reduceMotion.matches) return;

    var FAR = 4000;   // radius that lights the whole headline
    var NEAR = 260;   // radius of the spotlight
    var pos = { x: 0, y: 0 };
    var client = { x: 0, y: 0 };
    var r = FAR;
    var targetR = FAR;
    var ar = -100;   // radius of the accent-coloured core; negative keeps it hidden
    var raf = null;

    h1.classList.add("spot");

    function frame() {
      var box = h1.getBoundingClientRect();
      var tx = client.x - box.left;
      var ty = client.y - box.top;

      pos.x += (tx - pos.x) * 0.2;
      pos.y += (ty - pos.y) * 0.2;
      r += (targetR - r) * 0.12;
      var targetAr = targetR === FAR ? -100 : 70;
      ar += (targetAr - ar) * 0.12;

      h1.style.setProperty("--sx", pos.x + "px");
      h1.style.setProperty("--sy", pos.y + "px");
      h1.style.setProperty("--r", r + "px");
      h1.style.setProperty("--ar", ar + "px");

      var moving = Math.abs(tx - pos.x) > 0.5 || Math.abs(ty - pos.y) > 0.5 || Math.abs(targetR - r) > 1 || Math.abs(targetAr - ar) > 0.5;
      raf = moving ? requestAnimationFrame(frame) : null;
    }

    function kick() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    hero.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      client.x = e.clientX;
      client.y = e.clientY;
      if (targetR === FAR) {
        // First move in: start the circle at the pointer instead of sliding in from the corner.
        var box = h1.getBoundingClientRect();
        pos.x = e.clientX - box.left;
        pos.y = e.clientY - box.top;
      }
      targetR = NEAR;
      kick();
    });

    hero.addEventListener("pointerleave", function () {
      targetR = FAR;
      kick();
    });

    // Keep the circle under a stationary pointer while the page scrolls.
    window.addEventListener("scroll", function () {
      if (targetR !== FAR) kick();
    }, { passive: true });
  })();

  /* ------------------------------------------------------------------
     3. Project rows: click to open details, one open at a time
     ------------------------------------------------------------------ */
  (function projects() {
    var rows = Array.prototype.slice.call(document.querySelectorAll(".project"));

    function setOpen(row, open) {
      row.classList.toggle("is-open", open);
      row.querySelector(".project-toggle").setAttribute("aria-expanded", open ? "true" : "false");
    }

    rows.forEach(function (row) {
      row.querySelector(".project-toggle").addEventListener("click", function () {
        var willOpen = !row.classList.contains("is-open");
        rows.forEach(function (other) { setOpen(other, false); });
        if (willOpen) setOpen(row, true);
      });
    });
  })();

  /* ------------------------------------------------------------------
     3b. Service cards, and the About description box (mouse and pen only)
     The glow and the lit border follow the pointer across each one; the service
     cards' artwork also drifts a little with it.
     ------------------------------------------------------------------ */
  (function glowBoxes() {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".service, .prose"));
    var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!cards.length || !canHover || reduceMotion.matches) return;

    cards.forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var box = card.getBoundingClientRect();
        var x = e.clientX - box.left;
        var y = e.clientY - box.top;
        card.style.setProperty("--mx", x + "px");
        card.style.setProperty("--my", y + "px");
        card.style.setProperty("--px", (x / box.width).toFixed(3));
        card.style.setProperty("--py", (y / box.height).toFixed(3));
      });

      // Pointer leaves: the artwork eases back to the middle.
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--px", "0.5");
        card.style.setProperty("--py", "0.5");
      });
    });
  })();

  /* ------------------------------------------------------------------
     3c. About photos: a small stack that reshuffles itself, one photo at a time,
     via the arrows, the dots, the left / right arrow keys, or a swipe. It advances
     on its own too, unless the pointer is over it, it's scrolled out of view, or
     reduced motion is on -- and a photo file that doesn't exist yet (about-1.jpg
     etc. not added) is dropped, along with its dot, instead of leaving a gap.
     ------------------------------------------------------------------ */
  (function aboutPhotos() {
    var box = document.querySelector(".about-art");
    if (!box) return;

    var dotEls = box.querySelectorAll(".about-dot");
    var pairs = Array.prototype.slice.call(box.querySelectorAll(".about-photo")).map(function (photo, i) {
      return { photo: photo, dot: dotEls[i] || null };
    });
    if (!pairs.length) return;

    var controls = box.querySelector(".about-controls");
    var prevBtn = box.querySelector(".about-arrow--prev");
    var nextBtn = box.querySelector(".about-arrow--next");
    var countNow = box.querySelector(".about-count .now");
    var countTotal = box.querySelector(".about-count .total");

    var DELAY = 4500;
    var timer = null;
    var inView = true;
    var hovering = false;

    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }

    function currentIndex() {
      for (var i = 0; i < pairs.length; i++) {
        if (pairs[i].photo.classList.contains("is-active")) return i;
      }
      return 0;
    }

    function show(i) {
      if (!pairs.length) return;
      var idx = ((i % pairs.length) + pairs.length) % pairs.length;
      pairs.forEach(function (pair, j) {
        pair.photo.classList.toggle("is-active", j === idx);
        if (pair.dot) pair.dot.classList.toggle("is-active", j === idx);
      });
      if (countNow) countNow.textContent = pad(idx + 1);
    }

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    function start() {
      stop();
      timer = setInterval(function () { show(currentIndex() + 1); }, DELAY);
    }

    // Whichever of hovering / off-screen / reduced motion applies, the slideshow stops;
    // otherwise it runs. Safe to call as often as needed.
    function sync() {
      if (inView && !hovering && !reduceMotion.matches && pairs.length > 1) start();
      else stop();
    }

    // A manual move (arrow, dot, key, swipe) shows the photo and restarts the timer,
    // so the next automatic move is a full DELAY away rather than arriving right after.
    function goTo(i) {
      show(i);
      sync();
    }

    function step(dir) {
      goTo(currentIndex() + dir);
    }

    function showControls() {
      if (!controls) return;
      controls.hidden = pairs.length < 2;
    }

    pairs.slice().forEach(function (pair) {
      pair.photo.addEventListener("error", function () {
        var wasActive = pair.photo.classList.contains("is-active");
        var at = pairs.indexOf(pair);
        if (at === -1) return;
        pairs.splice(at, 1);
        pair.photo.remove();
        if (pair.dot) pair.dot.remove();
        if (countTotal) countTotal.textContent = pad(pairs.length);
        showControls();
        if (!pairs.length) { stop(); return; }
        show(wasActive ? at % pairs.length : currentIndex());
        sync();
      }, { once: true });

      if (pair.dot) {
        pair.dot.addEventListener("click", function () { goTo(pairs.indexOf(pair)); });
      }
    });

    if (prevBtn) prevBtn.addEventListener("click", function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { step(1); });

    box.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      step(e.key === "ArrowRight" ? 1 : -1);
    });

    // Swipe: a sideways drag of more than 50px. Clicking a dot or arrow moves the
    // pointer only a few pixels, so it never counts as a swipe too.
    var startX = null;
    box.addEventListener("pointerdown", function (e) { startX = e.clientX; });
    box.addEventListener("pointerup", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    });
    box.addEventListener("pointercancel", function () { startX = null; });

    box.addEventListener("pointerenter", function () { hovering = true; sync(); });
    box.addEventListener("pointerleave", function () { hovering = false; sync(); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        sync();
      }, { threshold: 0.2 }).observe(box);
    }

    showControls();
    show(0);
    sync();
  })();

  /* ------------------------------------------------------------------
     4. Reading progress line and current-section link in the nav
     ------------------------------------------------------------------ */
  (function scrollUI() {
    var bar = document.querySelector(".progress");
    var ticking = false;

    function update() {
      var max = root.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (bar) bar.style.setProperty("--p", p.toFixed(4));
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();

    // Which nav link is current for each section. Services and Experience count as part of About.
    var linkFor = {
      work: "#work",
      certifications: "#certifications",
      services: "#about",
      about: "#about",
      experience: "#about",
      contact: "#contact"
    };
    var links = {};
    Array.prototype.forEach.call(document.querySelectorAll(".nav-list a"), function (a) {
      links[a.getAttribute("href")] = a;
    });

    function mark(href) {
      Object.keys(links).forEach(function (key) {
        if (key === href) links[key].setAttribute("aria-current", "true");
        else links[key].removeAttribute("aria-current");
      });
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) mark(linkFor[entry.target.id]);
        });
      }, { rootMargin: "-45% 0px -50% 0px" });

      Object.keys(linkFor).forEach(function (id) {
        var section = document.getElementById(id);
        if (section) observer.observe(section);
      });

      // Back in the hero: Home is current.
      var hero = document.getElementById("top");
      if (hero) {
        new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) mark("#main");
        }, { rootMargin: "-45% 0px -50% 0px" }).observe(hero);
      }
    }
  })();

  /* ------------------------------------------------------------------
     4b. Certifications slider: the bars underneath, the arrow buttons,
     the left / right arrow keys, and swiping
     ------------------------------------------------------------------ */
  (function certifications() {
    var box = document.querySelector(".carousel");
    var quotes = Array.prototype.slice.call(document.querySelectorAll(".quote"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".quote-dot"));
    if (!quotes.length) return;

    function show(i) {
      quotes.forEach(function (q, j) { q.classList.toggle("is-active", i === j); });
      dots.forEach(function (d, j) { d.setAttribute("aria-pressed", i === j ? "true" : "false"); });
    }

    function current() {
      for (var i = 0; i < quotes.length; i++) {
        if (quotes[i].classList.contains("is-active")) return i;
      }
      return 0;
    }

    // Step forward (1) or back (-1), and wrap around at either end.
    function go(step) {
      show((current() + step + quotes.length) % quotes.length);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { show(i); });
    });

    var prev = box && box.querySelector(".carousel-arrow--prev");
    var next = box && box.querySelector(".carousel-arrow--next");
    var stage = box && box.querySelector(".quotes");
    if (!prev || !next || !stage || quotes.length < 2) return;

    // (stopImmediatePropagation: if an older inline copy of this slider is still in index.html,
    // this keeps it from reacting a second time. That copy can be deleted.)
    prev.addEventListener("click", function (e) { e.stopImmediatePropagation(); go(-1); });
    next.addEventListener("click", function (e) { e.stopImmediatePropagation(); go(1); });

    box.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      go(e.key === "ArrowRight" ? 1 : -1);
    });

    // Swipe: a sideways drag of more than 50px across the card.
    var startX = null;
    stage.addEventListener("pointerdown", function (e) { startX = e.clientX; });
    stage.addEventListener("pointerup", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) {
        e.stopImmediatePropagation();
        go(dx < 0 ? 1 : -1);
      }
    });
    stage.addEventListener("pointercancel", function () { startX = null; });
  })();

  /* ------------------------------------------------------------------
     4c. Certification details pop-up: fills the shared <dialog> from
     whichever card's "See details" button was clicked, using that
     card's own photo/title/text plus the button's own longer write-up.
     ------------------------------------------------------------------ */
    (function certModal() {
    var dialog = document.getElementById("cert-modal");
    var triggers = Array.prototype.slice.call(document.querySelectorAll(".cert-link"));
    if (!dialog || !triggers.length) return;
 
    var imgEl = dialog.querySelector(".cert-modal-img");
    var typeEl = dialog.querySelector(".cert-modal-type");
    var titleEl = dialog.querySelector(".cert-modal-title");
    var metaEl = dialog.querySelector(".cert-modal-meta");
    var descEl = dialog.querySelector(".cert-modal-desc");
    var detailEl = dialog.querySelector(".cert-modal-detail");
    var closeBtn = dialog.querySelector(".cert-modal-close");
 
    function setText(el, text) {
      if (el) el.textContent = text || "";
    }
 
    // If the photo file is missing, hide the <img> so the gradient placeholder shows instead.
    if (imgEl) {
      imgEl.addEventListener("error", function () {
        imgEl.hidden = true;
      });
    }
 
    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var card = trigger.closest(".cert");
        if (!card) return;
 
        var type = card.querySelector(".cert-type");
        var title = card.querySelector("h3");
        var meta = card.querySelector(".cert-meta");
        var desc = card.querySelector(".cert-desc");
        setText(typeEl, type && type.textContent);
        setText(titleEl, title && title.textContent);
        setText(metaEl, meta && meta.textContent);
        setText(descEl, desc && desc.textContent);
 
        // Pop-up photo: its own file, set on the button with data-cert-image.
        var src = trigger.getAttribute("data-cert-image");
        if (imgEl) {
          if (src) {
            imgEl.alt = trigger.getAttribute("data-cert-image-alt") ||
              ((title && title.textContent) ? title.textContent + " certificate" : "");
            imgEl.hidden = false;
            imgEl.src = src;
          } else {
            imgEl.hidden = true;
            imgEl.removeAttribute("src");
            imgEl.alt = "";
          }
        }
 
          var detail = trigger.getAttribute("data-cert-detail");
        if (detailEl) {
          detailEl.innerHTML = detail || "";
          detailEl.hidden = !detail;
        }

        dialog.showModal();
      });
    });
 
    // Moving gradient: the glow and lit border in the description box follow the pointer
    // (mouse and pen only, and not with reduced motion).
    var textBox = dialog.querySelector(".cert-modal-text");
    var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (textBox && canHover && !reduceMotion.matches) {
      textBox.addEventListener("pointermove", function (e) {
        var box = textBox.getBoundingClientRect();
        textBox.style.setProperty("--mx", (e.clientX - box.left) + "px");
        textBox.style.setProperty("--my", (e.clientY - box.top) + "px");
      });
    }
 
    if (closeBtn) {
      closeBtn.addEventListener("click", function () { dialog.close(); });
    }
 
    // Clicking the backdrop (the dialog element itself, outside its content) closes it
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
    });
  })();
 

  /* ------------------------------------------------------------------
     5. Copy email address
     ------------------------------------------------------------------ */
  (function copyEmail() {
    var button = document.getElementById("copy-email");
    var link = document.getElementById("email");
    var status = document.getElementById("copy-status");
    if (!button || !link) return;

    var address = link.textContent.trim();
    var timer = null;

    function done(ok) {
      status.textContent = ok ? "Copied to clipboard" : "Couldn't copy. Select the address and copy it manually.";
      clearTimeout(timer);
      timer = setTimeout(function () { status.textContent = ""; }, 2200);
    }

    function fallback() {
      var field = document.createElement("textarea");
      field.value = address;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(field);
      done(ok);
    }

    button.addEventListener("click", function () {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(address).then(function () { done(true); }, fallback);
      } else {
        fallback();
      }
    });
  })();

  /* ------------------------------------------------------------------
     6. Footer year
     ------------------------------------------------------------------ */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();