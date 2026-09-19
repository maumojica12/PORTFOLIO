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

    // The Experience section counts as part of About in the nav.
    var linkFor = { work: "#work", about: "#about", experience: "#about", contact: "#contact" };
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

      // Back in the hero: nothing is current.
      var hero = document.getElementById("top");
      if (hero) {
        new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) mark(null);
        }, { rootMargin: "-45% 0px -50% 0px" }).observe(hero);
      }
    }
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