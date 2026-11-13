/**
 * ==========================================================================
 * MIS XV AÑOS — CONFIGURACIÓN, CORTINA MÁGICA, GSAP, PARTÍCULAS, AUDIO Y RSVP
 * ==========================================================================
 * IMPORTANTE: Introduce aquí los números telefónicos reales en formato
 * internacional (código de país + número, sin espacios, guiones ni signo '+').
 * Ejemplo para Guatemala: "50212345678" (reemplazar únicamente con el número real).
 */
const WHATSAPP_CONFIG = Object.freeze({
  emily: {
    phone: "", // <-- Colocar aquí el número telefónico real de Emily
    message:
      "¡Hola Emily! Con mucha alegría confirmo mi asistencia a la celebración de tus XV Años el sábado 13 de diciembre a las 6:30 p. m. ¡Muchas gracias por la invitación!"
  },
  mama: {
    phone: "", // <-- Colocar aquí el número telefónico real de Mamá
    message:
      "¡Hola! Con mucho gusto confirmo mi asistencia a los XV Años de Emily el sábado 13 de diciembre a las 6:30 p. m. ¡Muchas gracias por la invitación!"
  }
});

const AUDIO_CONFIG = Object.freeze({
  src: "sonido.mp3",
  targetVolume: 0.65
});

const GUESTS_STORAGE_KEY = "quince_emily_invitados_v1";

(function initInvitationPage() {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ==========================================================================
   * 1. MOTOR DE PARTÍCULAS MÁGICAS ESTILO DISNEY (POLVO DE HADAS Y ESTRELLAS)
   * ========================================================================== */
  function createDisneyParticleEngine(canvasId, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      return {
        burstAtPoint() {},
        burstOnElement() {},
        stop() {},
        start() {}
      };
    }

    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let running = true;
    let rafId = null;

    const ambientCount = prefersReducedMotion.matches
      ? Math.min(options.ambientCount || 24, 14)
      : options.ambientCount || 58;

    const palette = [
      { core: "#FFFFFF", mid: "#FFF3B0", glow: "rgba(255, 230, 128, 0.88)" }, // Oro champán brillante
      { core: "#FFFDF2", mid: "#F6C95E", glow: "rgba(246, 201, 94, 0.85)" },  // Oro real Disney
      { core: "#FFFFFF", mid: "#FFE082", glow: "rgba(255, 213, 79, 0.82)" },  // Polvo de hadas cálido
      { core: "#FFF7F8", mid: "#FFB8C6", glow: "rgba(255, 142, 168, 0.78)" }  // Destello rosa encantada
    ];

    const ambientParticles = [];
    const burstParticles = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    function pickColor() {
      const r = Math.random();
      if (r < 0.86) {
        return palette[Math.floor(Math.random() * 3)];
      }
      return palette[3];
    }

    function createAmbientParticle(initialRandomY = true) {
      const typeRoll = Math.random();
      const type =
        typeRoll < 0.44 ? "star4" : typeRoll < 0.68 ? "pixie" : typeRoll < 0.9 ? "star8" : "petal";
      const color = pickColor();

      return {
        x: randomBetween(0, width || window.innerWidth),
        y: initialRandomY
          ? randomBetween(0, height || window.innerHeight)
          : (height || window.innerHeight) + randomBetween(10, 80),
        vx: randomBetween(-0.28, 0.28),
        vy: randomBetween(-0.62, -0.18),
        size:
          type === "star4"
            ? randomBetween(4.5, 10.5)
            : type === "star8"
              ? randomBetween(5.5, 11.5)
              : type === "petal"
                ? randomBetween(4, 7.2)
                : randomBetween(2.2, 5.2),
        alpha: randomBetween(0.25, 0.95),
        twinkleSpeed: randomBetween(0.018, 0.052),
        twinklePhase: randomBetween(0, Math.PI * 2),
        swayAmp: randomBetween(0.25, 0.9),
        swaySpeed: randomBetween(0.008, 0.024),
        swayPhase: randomBetween(0, Math.PI * 2),
        rotation: randomBetween(0, Math.PI * 2),
        rotationSpeed: randomBetween(-0.018, 0.018),
        type,
        color
      };
    }

    function initAmbient() {
      ambientParticles.length = 0;
      for (let i = 0; i < ambientCount; i++) {
        ambientParticles.push(createAmbientParticle(true));
      }
    }

    function spawnBurstParticle(x, y, optionsBurst = {}) {
      const angle = randomBetween(0, Math.PI * 2);
      const speed = randomBetween(optionsBurst.minSpeed || 0.9, optionsBurst.maxSpeed || 5.4);
      const typeRoll = Math.random();
      const type = typeRoll < 0.52 ? "star4" : typeRoll < 0.8 ? "star8" : "pixie";
      const color = pickColor();

      burstParticles.push({
        x: x + randomBetween(-16, 16),
        y: y + randomBetween(-12, 12),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - randomBetween(0.4, 1.6),
        gravity: 0.026,
        friction: 0.978,
        size: randomBetween(optionsBurst.minSize || 4.5, optionsBurst.maxSize || 12.5),
        life: 1,
        decay: randomBetween(0.011, 0.024),
        twinklePhase: randomBetween(0, Math.PI * 2),
        twinkleSpeed: randomBetween(0.08, 0.16),
        rotation: randomBetween(0, Math.PI * 2),
        rotationSpeed: randomBetween(-0.04, 0.04),
        type,
        color
      });
    }

    function burstAtPoint(x, y, count = 36, opts = {}) {
      if (prefersReducedMotion.matches) return;
      const safeCount = Math.min(count, 130);
      for (let i = 0; i < safeCount; i++) {
        spawnBurstParticle(x, y, opts);
      }
    }

    function burstOnElement(element, count = 42) {
      if (!element || prefersReducedMotion.matches) return;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const points = Math.max(8, Math.min(count, 80));
      for (let i = 0; i < points; i++) {
        const px = rect.left + rect.width * randomBetween(0.12, 0.88);
        const py = rect.top + rect.height * randomBetween(0.15, 0.85);
        spawnBurstParticle(px, py, {
          minSpeed: 0.6,
          maxSpeed: 3.6,
          minSize: 4.5,
          maxSize: 11.5
        });
      }
    }

    function drawFourPointStar(p, alpha) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 1.6);
      grad.addColorStop(0, p.color.core);
      grad.addColorStop(0.35, p.color.mid);
      grad.addColorStop(1, "rgba(255, 215, 100, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 1.6, 0, Math.PI * 2);
      ctx.fill();

      const outer = p.size * 1.45;
      const inner = p.size * 0.22;
      ctx.fillStyle = p.color.core;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        const nextAng = ang + Math.PI / 4;
        ctx.lineTo(Math.cos(ang) * outer, Math.sin(ang) * outer);
        ctx.lineTo(Math.cos(nextAng) * inner, Math.sin(nextAng) * inner);
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    function drawEightPointStar(p, alpha) {
      drawFourPointStar(p, alpha);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation + Math.PI / 4);
      ctx.globalAlpha = alpha * 0.72;

      const outer = p.size * 0.92;
      const inner = p.size * 0.16;
      ctx.fillStyle = p.color.mid;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        const nextAng = ang + Math.PI / 4;
        ctx.lineTo(Math.cos(ang) * outer, Math.sin(ang) * outer);
        ctx.lineTo(Math.cos(nextAng) * inner, Math.sin(nextAng) * inner);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawPixieOrb(p, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      const radius = p.size * 1.9;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      grad.addColorStop(0, p.color.core);
      grad.addColorStop(0.42, p.color.mid);
      grad.addColorStop(1, "rgba(255, 215, 110, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawMagicalPetal(p, alpha) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha * 0.82;
      const grad = ctx.createLinearGradient(-p.size, -p.size, p.size, p.size);
      grad.addColorStop(0, "#D91C38");
      grad.addColorStop(0.65, "#8E081C");
      grad.addColorStop(1, "#F7D983");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 1.1, -p.size * 0.5, p.size * 0.9, p.size * 0.9, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.9, p.size * 0.9, -p.size * 1.1, -p.size * 0.5, 0, -p.size);
      ctx.fill();
      ctx.restore();
    }

    function renderParticle(p, alpha) {
      if (alpha <= 0.01) return;
      if (p.type === "star4") {
        drawFourPointStar(p, alpha);
      } else if (p.type === "star8") {
        drawEightPointStar(p, alpha);
      } else if (p.type === "petal") {
        drawMagicalPetal(p, alpha);
      } else {
        drawPixieOrb(p, alpha);
      }
    }

    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < ambientParticles.length; i++) {
        const p = ambientParticles[i];
        p.twinklePhase += p.twinkleSpeed;
        p.swayPhase += p.swaySpeed;
        p.rotation += p.rotationSpeed;

        p.x += p.vx + Math.sin(p.swayPhase) * p.swayAmp;
        p.y += p.vy;

        if (p.y < -30) {
          p.y = height + 24;
          p.x = randomBetween(0, width);
        }
        if (p.x < -30) p.x = width + 25;
        if (p.x > width + 30) p.x = -25;

        const twinkle = 0.45 + 0.55 * Math.sin(p.twinklePhase);
        renderParticle(p, p.alpha * twinkle);
      }

      for (let i = burstParticles.length - 1; i >= 0; i--) {
        const b = burstParticles[i];
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= b.friction;
        b.vy = b.vy * b.friction + b.gravity;
        b.life -= b.decay;
        b.twinklePhase += b.twinkleSpeed;
        b.rotation += b.rotationSpeed;

        if (b.life <= 0) {
          burstParticles.splice(i, 1);
          continue;
        }

        const twinkle = 0.55 + 0.45 * Math.sin(b.twinklePhase);
        renderParticle(b, Math.max(0, b.life * twinkle));
      }

      rafId = window.requestAnimationFrame(tick);
    }

    resize();
    initAmbient();
    window.addEventListener("resize", resize);
    rafId = window.requestAnimationFrame(tick);

    return {
      burstAtPoint,
      burstOnElement,
      stop() {
        running = false;
        if (rafId) window.cancelAnimationFrame(rafId);
      },
      start() {
        if (!running) {
          running = true;
          rafId = window.requestAnimationFrame(tick);
        }
      }
    };
  }

  const curtainParticles = createDisneyParticleEngine("curtainParticlesCanvas", {
    ambientCount: 68
  });

  const pageParticles = createDisneyParticleEngine("magicParticlesCanvas", {
    ambientCount: 54
  });

  let lastTrailTime = 0;
  window.addEventListener(
    "pointermove",
    (event) => {
      if (prefersReducedMotion.matches) return;
      const now = performance.now();
      if (now - lastTrailTime < 52) return;
      lastTrailTime = now;

      const curtainEl = document.getElementById("magicCurtain");
      const targetEngine =
        curtainEl && !curtainEl.classList.contains("is-hidden")
          ? curtainParticles
          : pageParticles;

      targetEngine.burstAtPoint(event.clientX, event.clientY, 2, {
        minSpeed: 0.25,
        maxSpeed: 1.35,
        minSize: 3.2,
        maxSize: 7.5
      });
    },
    { passive: true }
  );

  /* ==========================================================================
   * 2. CONTROLADOR DE AUDIO DE FONDO (sonido.mp3)
   * ========================================================================== */
  const bgMusic = document.getElementById("bgMusic");
  const musicToggleBtn = document.getElementById("musicToggleBtn");
  const musicToggleLabel = document.getElementById("musicToggleLabel");

  if (bgMusic) {
    bgMusic.volume = AUDIO_CONFIG.targetVolume;
  }

  function updateMusicButtonUI(playing) {
    if (!musicToggleBtn) return;

    musicToggleBtn.classList.toggle("is-playing", playing);
    musicToggleBtn.setAttribute("aria-pressed", String(playing));
    musicToggleBtn.setAttribute(
      "aria-label",
      playing ? "Pausar música de fondo" : "Reproducir música de fondo"
    );
    if (musicToggleLabel) {
      musicToggleLabel.textContent = "Música";
    }
  }

  function startBackgroundMusicWithFade() {
    if (!bgMusic) return Promise.resolve(false);

    bgMusic.volume = 0.08;
    const playPromise = bgMusic.play();

    if (playPromise && typeof playPromise.then === "function") {
      return playPromise
        .then(() => {
          updateMusicButtonUI(true);
          if (window.gsap) {
            window.gsap.to(bgMusic, {
              volume: AUDIO_CONFIG.targetVolume,
              duration: 1.8,
              ease: "power2.out"
            });
          } else {
            bgMusic.volume = AUDIO_CONFIG.targetVolume;
          }
          return true;
        })
        .catch(() => {
          updateMusicButtonUI(false);
          return false;
        });
    }

    updateMusicButtonUI(!bgMusic.paused);
    return Promise.resolve(!bgMusic.paused);
  }

  function toggleBackgroundMusic() {
    if (!bgMusic) return;

    if (bgMusic.paused) {
      startBackgroundMusicWithFade();
      if (musicToggleBtn) {
        pageParticles.burstOnElement(musicToggleBtn, 18);
      }
    } else {
      bgMusic.pause();
      updateMusicButtonUI(false);
    }
  }

  if (musicToggleBtn) {
    musicToggleBtn.addEventListener("click", toggleBackgroundMusic);
  }

  if (bgMusic) {
    bgMusic.addEventListener("play", () => updateMusicButtonUI(true));
    bgMusic.addEventListener("pause", () => updateMusicButtonUI(false));
  }

  /* ==========================================================================
   * 3. CORTINA MÁGICA Y ANIMACIONES GSAP DE PRESENTACIÓN (SIN OCULTAR SECCIONES)
   * ========================================================================== */
  const magicCurtain = document.getElementById("magicCurtain");
  const openCurtainBtn = document.getElementById("openCurtainBtn");
  const curtainSeal = document.getElementById("curtainSeal");
  let curtainOpened = false;

  // Garantizar que todos los bloques sean 100% visibles en todo momento (evitando huecos en blanco)
  document.querySelectorAll(".reveal-item").forEach((el) => {
    el.classList.add("is-visible");
  });

  function setupScrollPresentationAnimations() {
    if (!window.gsap || prefersReducedMotion.matches) {
      return;
    }

    const gsap = window.gsap;

    // 1. Flotación continua encantada para la rosa bajo cúpula y pétalos del Hero
    gsap.to(".enchanted-rose-wrap", {
      y: -8,
      duration: 3.1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.utils.toArray(".hero-petals .petal").forEach((petal, idx) => {
      gsap.to(petal, {
        y: -5 - (idx % 2) * 3,
        x: idx % 2 === 0 ? 4 : -4,
        rotation: idx % 2 === 0 ? 8 : -8,
        duration: 2.3 + idx * 0.35,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    });

    if (!("IntersectionObserver" in window)) return;

    // Usamos IntersectionObserver con gsap.fromTo(immediateRender: false)
    // para que ningún bloque quede jamás en opacity: 0 antes de hacer scroll
    const animatedSections = new WeakSet();

    const sectionObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target;
          if (animatedSections.has(target)) return;
          animatedSections.add(target);
          observer.unobserve(target);

          if (target.id === "evento") {
            const banner = target.querySelector(".velvet-banner");
            const rose = target.querySelector(".enchanted-rose-wrap");
            const frame = target.querySelector(".rococo-date-frame");
            const princess = target.querySelector(".princess-wrap");

            pageParticles.burstOnElement(banner, 42);
            pageParticles.burstOnElement(rose, 46);

            if (banner) {
              gsap.fromTo(
                banner,
                { y: -24, scaleY: 0.9, opacity: 0.25 },
                {
                  y: 0,
                  scaleY: 1,
                  opacity: 1,
                  transformOrigin: "top center",
                  duration: 1.05,
                  ease: "power3.out",
                  clearProps: "transform,opacity"
                }
              );
            }
            if (frame) {
              gsap.fromTo(
                frame,
                { scale: 0.88, y: 20, opacity: 0.2 },
                {
                  scale: 1,
                  y: 0,
                  opacity: 1,
                  duration: 0.9,
                  delay: 0.12,
                  ease: "back.out(1.5)",
                  clearProps: "transform,opacity"
                }
              );
            }
            if (princess) {
              gsap.fromTo(
                princess,
                { x: 32, opacity: 0.25 },
                {
                  x: 0,
                  opacity: 1,
                  duration: 1.05,
                  delay: 0.18,
                  ease: "power3.out",
                  clearProps: "transform,opacity"
                }
              );
            }
          } else if (target.classList.contains("parchment-card")) {
            const plaque = target.querySelector(".card-plaque");
            pageParticles.burstOnElement(plaque || target, 44);

            gsap.fromTo(
              target,
              { y: 34, scale: 0.95, opacity: 0.25 },
              {
                y: 0,
                scale: 1,
                opacity: 1,
                duration: 0.95,
                ease: "power3.out",
                clearProps: "transform,opacity"
              }
            );

            if (plaque) {
              gsap.fromTo(
                plaque,
                { scale: 0.86, y: -12 },
                {
                  scale: 1,
                  y: 0,
                  duration: 0.82,
                  delay: 0.1,
                  ease: "back.out(1.6)",
                  clearProps: "transform"
                }
              );
            }
          } else if (target.classList.contains("transition-banner-section")) {
            const wrap = target.querySelector(".transition-banner-wrap");
            pageParticles.burstOnElement(wrap || target, 52);
            if (wrap) {
              gsap.fromTo(
                wrap,
                { scale: 0.94, y: 26, opacity: 0.3 },
                {
                  scale: 1,
                  y: 0,
                  opacity: 1,
                  duration: 1.1,
                  ease: "power3.out",
                  clearProps: "transform,opacity"
                }
              );
            }
          } else if (target.id === "confirmacion") {
            const heading = target.querySelector(".confirmacion-heading-wrap");
            const formCard = target.querySelector(".rsvp-form-card");
            const btns = target.querySelectorAll(".btn-gold--rsvp");

            pageParticles.burstOnElement(heading || target, 48);

            if (heading) {
              gsap.fromTo(
                heading,
                { scale: 0.9, y: 20, opacity: 0.25 },
                {
                  scale: 1,
                  y: 0,
                  opacity: 1,
                  duration: 0.88,
                  ease: "back.out(1.5)",
                  clearProps: "transform,opacity"
                }
              );
            }
            if (formCard) {
              gsap.fromTo(
                formCard,
                { y: 24, scale: 0.96, opacity: 0.25 },
                {
                  y: 0,
                  scale: 1,
                  opacity: 1,
                  duration: 0.92,
                  delay: 0.14,
                  ease: "power3.out",
                  clearProps: "transform,opacity"
                }
              );
            }
            if (btns.length > 0) {
              gsap.fromTo(
                btns,
                { scale: 0.86, y: 18 },
                {
                  scale: 1,
                  y: 0,
                  duration: 0.78,
                  delay: 0.24,
                  stagger: 0.12,
                  ease: "back.out(1.6)",
                  clearProps: "transform"
                }
              );
            }
          }
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.12
      }
    );

    document
      .querySelectorAll("#evento, .parchment-card, .transition-banner-section, #confirmacion")
      .forEach((sec) => sectionObserver.observe(sec));
  }

  function playHeroGrandEntrance() {
    const heroSection = document.getElementById("inicio");
    if (!window.gsap || prefersReducedMotion.matches || !heroSection) {
      setupScrollPresentationAnimations();
      return;
    }

    const gsap = window.gsap;
    const heroTl = gsap.timeline();

    heroTl
      .fromTo(
        ".site-header",
        { yPercent: -100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.85, ease: "power3.out", clearProps: "transform,opacity" },
        0
      )
      .fromTo(
        ".hero-backdrop",
        { scale: 1.1 },
        { scale: 1, duration: 2.0, ease: "power2.out", clearProps: "transform" },
        0
      )
      .fromTo(
        ".hero-portrait",
        { y: 34, scale: 0.95, opacity: 0.2 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 1.25,
          ease: "power3.out",
          clearProps: "transform,opacity",
          onStart: () => {
            pageParticles.burstOnElement(document.querySelector(".hero-portrait"), 46);
          }
        },
        0.12
      )
      .fromTo(
        ".hero-cartouche",
        { scale: 0.84, y: 24, opacity: 0.2 },
        {
          scale: 1,
          y: 0,
          opacity: 1,
          duration: 1.0,
          ease: "back.out(1.55)",
          clearProps: "transform,opacity",
          onStart: () => {
            pageParticles.burstOnElement(document.querySelector(".hero-cartouche"), 54);
          }
        },
        0.24
      )
      .fromTo(
        ".hero-message, .hero-date-box, .btn-burgundy-cta, .hero-corner-rose",
        { y: 22, opacity: 0.2 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          clearProps: "transform,opacity"
        },
        0.42
      );

    setupScrollPresentationAnimations();
  }

  let sealIdleTween = null;
  if (window.gsap && curtainSeal && !prefersReducedMotion.matches) {
    sealIdleTween = window.gsap.to(curtainSeal, {
      y: -7,
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }

  function openMagicCurtain() {
    if (curtainOpened) return;
    curtainOpened = true;

    startBackgroundMusicWithFade();

    curtainParticles.burstAtPoint(
      window.innerWidth / 2,
      window.innerHeight / 2,
      110,
      {
        minSpeed: 1.2,
        maxSpeed: 7.2,
        minSize: 5.5,
        maxSize: 14
      }
    );

    if (!magicCurtain) {
      document.body.classList.remove("is-curtain-locked");
      playHeroGrandEntrance();
      return;
    }

    if (!window.gsap || prefersReducedMotion.matches) {
      document.body.classList.remove("is-curtain-locked");
      magicCurtain.classList.add("is-hidden");
      curtainParticles.stop();
      playHeroGrandEntrance();
      return;
    }

    if (sealIdleTween) {
      sealIdleTween.kill();
    }

    const gsap = window.gsap;
    const openTl = gsap.timeline({
      onComplete: () => {
        magicCurtain.classList.add("is-hidden");
        curtainParticles.stop();
      }
    });

    openTl
      .to(
        "#curtainSeal",
        {
          scale: 1.08,
          y: -28,
          opacity: 0,
          duration: 0.62,
          ease: "back.in(1.4)"
        },
        0
      )
      .to(
        "#curtainLightFlare",
        {
          opacity: 0.92,
          duration: 0.48,
          ease: "power2.out"
        },
        0.18
      )
      .to(
        "#curtainLightFlare",
        {
          opacity: 0,
          duration: 0.95,
          ease: "power2.inOut"
        },
        0.66
      )
      .to(
        ".curtain-valance",
        {
          yPercent: -115,
          duration: 1.35,
          ease: "power3.inOut"
        },
        0.25
      )
      .to(
        ".curtain-panel--left",
        {
          xPercent: -106,
          rotationZ: -2.2,
          scaleX: 0.9,
          duration: 1.75,
          ease: "power3.inOut"
        },
        0.2
      )
      .to(
        ".curtain-panel--right",
        {
          xPercent: 106,
          rotationZ: 2.2,
          scaleX: 0.9,
          duration: 1.75,
          ease: "power3.inOut"
        },
        0.2
      )
      .add(() => {
        document.body.classList.remove("is-curtain-locked");
        playHeroGrandEntrance();
      }, 0.58)
      .to(
        "#magicCurtain",
        {
          opacity: 0,
          duration: 0.45,
          ease: "power1.out"
        },
        1.55
      );
  }

  if (openCurtainBtn) {
    openCurtainBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      openMagicCurtain();
    });
  }

  if (curtainSeal) {
    curtainSeal.addEventListener("click", openMagicCurtain);
  }

  /* ==========================================================================
   * 4. FORMULARIO RÁPIDO DE CONFIRMACIÓN (invitados.txt) Y MODAL MÁGICO
   * ========================================================================== */
  const rsvpForm = document.getElementById("rsvpForm");
  const guestNameInput = document.getElementById("guestNameInput");
  const submitRsvpBtn = document.getElementById("submitRsvpBtn");
  const submitRsvpLabel = document.getElementById("submitRsvpLabel");
  const rsvpFormFeedback = document.getElementById("rsvpFormFeedback");

  const thankYouModal = document.getElementById("thankYouModal");
  const modalGuestName = document.getElementById("modalGuestName");
  const modalSpeechName = document.getElementById("modalSpeechName");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const closeModalTopBtn = document.getElementById("closeModalTopBtn");
  const magicModalBackdrop = document.getElementById("magicModalBackdrop");

  function saveGuestLocally(entry) {
    try {
      const current = JSON.parse(localStorage.getItem(GUESTS_STORAGE_KEY) || "[]");
      const list = Array.isArray(current) ? current : [];
      list.push(entry);
      localStorage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      // Ignorar si localStorage está restringido
    }
  }

  function formatLocalDateTime(date = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    let hours = date.getHours();
    const ampm = hours >= 12 ? "p. m." : "a. m.";
    hours = hours % 12 || 12;
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(hours)}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${ampm}`;
  }

  function openThankYouModal(guestName) {
    if (!thankYouModal) return;

    if (modalGuestName) modalGuestName.textContent = guestName;
    if (modalSpeechName) modalSpeechName.textContent = guestName;

    thankYouModal.classList.add("is-open");
    thankYouModal.setAttribute("aria-hidden", "false");

    // Explosión mágica de estrellas estilo Disney alrededor del modal
    pageParticles.burstAtPoint(window.innerWidth / 2, window.innerHeight / 2, 95, {
      minSpeed: 1.1,
      maxSpeed: 6.4,
      minSize: 5,
      maxSize: 13
    });

    const modalCard = thankYouModal.querySelector(".magic-modal__card");
    if (window.gsap && modalCard && !prefersReducedMotion.matches) {
      window.gsap.fromTo(
        modalCard,
        { scale: 0.82, y: 32, opacity: 0 },
        {
          scale: 1,
          y: 0,
          opacity: 1,
          duration: 0.72,
          ease: "back.out(1.55)",
          clearProps: "transform,opacity"
        }
      );
    }

    if (closeModalBtn) {
      window.setTimeout(() => closeModalBtn.focus(), 120);
    }
  }

  function closeThankYouModal() {
    if (!thankYouModal || !thankYouModal.classList.contains("is-open")) return;
    thankYouModal.classList.remove("is-open");
    thankYouModal.setAttribute("aria-hidden", "true");
  }

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeThankYouModal);
  if (closeModalTopBtn) closeModalTopBtn.addEventListener("click", closeThankYouModal);
  if (magicModalBackdrop) magicModalBackdrop.addEventListener("click", closeThankYouModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && thankYouModal && thankYouModal.classList.contains("is-open")) {
      closeThankYouModal();
    }
  });

  if (rsvpForm && guestNameInput) {
    rsvpForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const cleanName = String(guestNameInput.value || "")
        .replace(/\s+/g, " ")
        .trim();

      if (!cleanName) {
        if (rsvpFormFeedback) {
          rsvpFormFeedback.textContent = "Por favor, escribe tu nombre y apellido para confirmar.";
          rsvpFormFeedback.className = "rsvp-form-feedback is-error";
        }
        guestNameInput.focus();
        return;
      }

      if (submitRsvpBtn) submitRsvpBtn.disabled = true;
      if (submitRsvpLabel) submitRsvpLabel.textContent = "Guardando...";
      if (rsvpFormFeedback) {
        rsvpFormFeedback.textContent = "";
        rsvpFormFeedback.className = "rsvp-form-feedback";
      }

      let savedEntry = {
        nombre: cleanName,
        estado: "Asistencia confirmada",
        fecha: formatLocalDateTime(new Date())
      };

      try {
        const response = await fetch("/api/invitados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: cleanName,
            estado: "Asistencia confirmada"
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.entry) {
            savedEntry = data.entry;
          }
        }
      } catch (err) {
        // Si se abre sin servidor Node, se respalda en localStorage
      }

      saveGuestLocally(savedEntry);

      guestNameInput.value = "";
      if (submitRsvpBtn) submitRsvpBtn.disabled = false;
      if (submitRsvpLabel) submitRsvpLabel.textContent = "Confirmar asistencia";

      if (rsvpFormFeedback) {
        rsvpFormFeedback.textContent = `✦ ¡Asistencia registrada para ${cleanName}! ✦`;
        rsvpFormFeedback.className = "rsvp-form-feedback is-success";
      }

      openThankYouModal(cleanName);
    });
  }

  /* ==========================================================================
   * 5. MENÚ MÓVIL ACCESIBLE Y NAVEGACIÓN SUAVE
   * ========================================================================== */
  const navToggle = document.getElementById("navToggle");
  const primaryNav = document.getElementById("primaryNav");
  const navLinks = document.querySelectorAll(".nav-link");

  function setMenuState(isOpen) {
    if (!navToggle || !primaryNav) return;
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute(
      "aria-label",
      isOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"
    );
    primaryNav.classList.toggle("is-open", isOpen);
  }

  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      setMenuState(!expanded);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && primaryNav.classList.contains("is-open")) {
        setMenuState(false);
        navToggle.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (
        primaryNav.classList.contains("is-open") &&
        !primaryNav.contains(event.target) &&
        !navToggle.contains(event.target)
      ) {
        setMenuState(false);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 767 && primaryNav.classList.contains("is-open")) {
        setMenuState(false);
      }
    });
  }

  const internalLinks = document.querySelectorAll('a[href^="#"]');

  internalLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (link.hasAttribute("data-contact")) return;

      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      event.preventDefault();
      setMenuState(false);

      pageParticles.burstOnElement(link, 22);

      targetEl.scrollIntoView({
        behavior: prefersReducedMotion.matches ? "auto" : "smooth",
        block: "start"
      });

      if (history.pushState) {
        history.pushState(null, "", targetId);
      }
    });
  });

  /* ==========================================================================
   * 6. INDICADOR DE SECCIÓN ACTIVA EN NAVBAR
   * ========================================================================== */
  const observedTargets = ["inicio", "evento", "vestimenta", "regalos", "confirmacion"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  function highlightNavLink(activeId) {
    navLinks.forEach((link) => {
      const matches = link.getAttribute("href") === `#${activeId}`;
      link.classList.toggle("is-active", matches);
      if (matches) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  if ("IntersectionObserver" in window && observedTargets.length > 0) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          highlightNavLink(visible[0].target.id);
        }
      },
      {
        rootMargin: "-22% 0px -55% 0px",
        threshold: [0.1, 0.35, 0.6]
      }
    );

    observedTargets.forEach((section) => navObserver.observe(section));
  }

  /* ==========================================================================
   * 7. BOTONES DE CONFIRMACIÓN POR WHATSAPP
   * ========================================================================== */
  function buildWhatsAppHref(contactConfig) {
    const cleanDigits = String(contactConfig.phone || "").replace(/\D/g, "");
    const encodedText = encodeURIComponent(contactConfig.message || "");

    if (cleanDigits.length > 0) {
      return `https://wa.me/${cleanDigits}?text=${encodedText}`;
    }
    return `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  const rsvpButtons = document.querySelectorAll("[data-contact]");

  rsvpButtons.forEach((btn) => {
    const key = btn.getAttribute("data-contact");
    const config = WHATSAPP_CONFIG[key];
    if (!config) return;

    btn.setAttribute("href", buildWhatsAppHref(config));
    btn.setAttribute("target", "_blank");
    btn.setAttribute("rel", "noopener noreferrer");

    btn.addEventListener("mouseenter", () => {
      pageParticles.burstOnElement(btn, 16);
    });
  });
})();
