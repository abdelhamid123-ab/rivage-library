(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  var header = document.getElementById("header");
  var burger = document.getElementById("burger");
  var body = document.body;

  /* ---------- Sticky header ---------- */
  function onScrollHeader() {
    if (window.scrollY > 24) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  }

  function closeMenu() {
    if (body.classList.contains("menu-open")) setMenu(false);
  }

  if (burger) {
    burger.addEventListener("click", function () {
      setMenu(!body.classList.contains("menu-open"));
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 900) closeMenu();
  });

  /* ---------- Smooth anchor scrolling with sticky-header offset ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      closeMenu();

      var offset = (header ? header.offsetHeight : 64) + 16;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;

      if (prefersReducedMotion) {
        window.scrollTo(0, top);
      } else {
        window.scrollTo({ top: top, behavior: "smooth" });
      }
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 80 + "ms";
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- Scrollspy ---------- */
  var navLinks = document.querySelectorAll(".nav__link");
  var sections = [];

  navLinks.forEach(function (link) {
    var id = link.getAttribute("href");
    if (id && id !== "#") {
      var section = document.querySelector(id);
      if (section) sections.push({ link: link, section: section });
    }
  });

  function onScrollSpy() {
    var pos = window.pageYOffset + header.offsetHeight + 60;
    var currentId = null;

    sections.forEach(function (item) {
      if (pos >= item.section.offsetTop) currentId = item.section.id;
    });

    navLinks.forEach(function (link) {
      link.style.color = "";
      var id = link.getAttribute("href");
      if (id && id.slice(1) === currentId) {
        link.style.color = "var(--bordeaux)";
      }
    });
  }

  /* ---------- Subtle parallax ---------- */
  var heroMain = document.querySelector(".hero__figure--main");
  var heroNote = document.querySelector(".hero__note");
  var experienceBg = document.querySelector(".experience__bg");

  function onParallax() {
    if (prefersReducedMotion) return;
    var y = window.pageYOffset;

    if (heroMain && y < window.innerHeight * 1.2) {
      heroMain.style.transform = "translateY(" + y * 0.05 + "px)";
    }
    if (heroNote && y < window.innerHeight * 1.2) {
      heroNote.style.transform = "translateY(" + y * 0.035 + "px)";
    }

    if (experienceBg) {
      var rect = experienceBg.parentElement.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        experienceBg.style.transform =
          "translateY(" + rect.top * -0.12 + "px)";
      }
    }
  }

  /* ---------- Scroll-driven handlers ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScrollHeader();
      onScrollSpy();
      onParallax();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Counter ---------- */
  var counters = document.querySelectorAll("[data-count]");

  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;

    var duration = 1400;
    var start = null;

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString("fr-FR");
      if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window && counters.length) {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) {
      counterObserver.observe(el);
    });
  } else {
    counters.forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      if (!isNaN(target)) el.textContent = target.toLocaleString("fr-FR");
    });
  }

  /* ---------- Form ---------- */
  var contactForm = document.getElementById("contact-form");

  if (contactForm) {
    var successMsg = document.getElementById("form-success");

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var valid = true;
      var fields = contactForm.querySelectorAll("[required]");

      fields.forEach(function (field) {
        var group = field.closest(".form__group");
        var oldMsg = group.querySelector(".form__error-msg");

        field.classList.remove("form__error");
        if (oldMsg) oldMsg.remove();

        var value = field.value.trim();
        var isEmail = field.type === "email";
        var emailOk = !isEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

        if (!value || !emailOk) {
          valid = false;
          field.classList.add("form__error");

          var msg = document.createElement("p");
          msg.className = "form__error-msg";
          if (isEmail && value && !emailOk) {
            msg.textContent = "Veuillez saisir une adresse email valide.";
          } else if (field.tagName === "SELECT") {
            msg.textContent = "Veuillez choisir un sujet.";
          } else {
            msg.textContent =
              field.tagName === "TEXTAREA"
                ? "Veuillez écrire votre message."
                : "Veuillez saisir ce champ.";
          }
          group.appendChild(msg);
        }
      });

      if (!valid) {
        var firstError = contactForm.querySelector(".form__error");
        if (firstError) firstError.focus();
        return;
      }

      var btn = contactForm.querySelector(".form__submit");
      var originalText = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = "Envoi...";

      setTimeout(function () {
        btn.disabled = false;
        btn.innerHTML = originalText;
        contactForm.reset();

        if (successMsg) {
          successMsg.hidden = false;
          setTimeout(function () {
            successMsg.hidden = true;
          }, 5000);
        }
      }, 900);
    });
  }

  /* ---------- Init ---------- */
  onScrollHeader();
  onScrollSpy();
  onParallax();
})();
