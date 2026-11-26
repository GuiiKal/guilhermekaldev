document.addEventListener('DOMContentLoaded', () => {
    // ─── Theme Toggle ──────────────────────────────────────────
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon   = document.getElementById('theme-icon');
    const html        = document.documentElement;

    function applyTheme(theme) {
        html.classList.remove('dark', 'light');
        html.classList.add(theme);
        if (themeIcon) themeIcon.innerHTML = theme === 'dark'
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>`;
        localStorage.setItem('theme', theme);
    }

    themeToggle?.addEventListener('click', () => {
        applyTheme(html.classList.contains('dark') ? 'light' : 'dark');
    });

    // Apply persisted theme (inline script in <head> also does this to prevent FOUC)
    applyTheme(localStorage.getItem('theme') || 'dark');


    // ─── GSAP ScrollTrigger — Apple-style immersive scroll ─────
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    const sections = document.querySelectorAll('.snap-section');
    const dots     = document.querySelectorAll('.nav-dot');
    const isMobile = window.innerWidth < 768;

    // ─── Scroll progress bar ─────────────────────────────────
    gsap.to('#scroll-progress', {
        width: '100%',
        ease: 'none',
        scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.3,
        }
    });

    // ─── Helper: scroll-triggered reveals (play once, no reverse) ─
    function buildSectionReveals(section) {
        const reveals  = section.querySelectorAll('.reveal');
        const staggers = section.querySelectorAll('.stagger');
        const blobs    = section.querySelectorAll('.ambient-blob');

        // Set initial hidden state
        gsap.set(reveals, { y: 50, opacity: 0, scale: 0.97 });
        staggers.forEach(group => gsap.set(group.children, { y: 30, opacity: 0 }));

        // Reveal on scroll — plays once, never reverses
        ScrollTrigger.create({
            trigger: section,
            start: 'top 75%',
            once: true,
            onEnter: () => {
                const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

                tl.to(reveals, {
                    y: 0, opacity: 1, scale: 1,
                    duration: 0.7, stagger: 0.1,
                });

                // Check for counters
                reveals.forEach(el => {
                    if (el.classList.contains('stats-row')) {
                        tl.call(() => startCounters(), null, 0.3);
                    }
                });

                staggers.forEach((group, gi) => {
                    tl.to(group.children, {
                        y: 0, opacity: 1,
                        duration: 0.5, stagger: 0.08,
                    }, gi * 0.1 + 0.2);
                });
            }
        });

        // Blobs float with parallax
        if (blobs.length && !isMobile) {
            gsap.to(blobs, {
                yPercent: -30,
                ease: 'none',
                scrollTrigger: {
                    trigger: section,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 0.5,
                }
            });
        }
    }

    // ─── HERO — special entrance + scroll-away ───────────────
    if (!isMobile) {
        const hero = document.getElementById('hero');
        if (hero) {
            // Entrance animation (time-based, plays once)
            const heroReveals = hero.querySelectorAll('.reveal');
            const entryTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            entryTl
                .fromTo(hero, { scale: 1.1, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2 })
                .fromTo(heroReveals,
                    { y: 50, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 },
                    '-=0.6'
                );

            heroReveals.forEach(el => el.classList.add('visible'));

            // Scroll-away: hero shrinks and fades as you leave
            gsap.timeline({
                scrollTrigger: {
                    trigger: hero,
                    start: 'top top',
                    end: '+=60%',
                    pin: true,
                    scrub: 1,
                    pinSpacing: true,
                }
            })
            .to(hero.querySelector('.relative.z-10') || hero, {
                scale: 0.88,
                opacity: 0,
                y: -60,
                filter: 'blur(8px)',
                duration: 1,
                ease: 'power2.in',
            })
            .to(hero.querySelectorAll('.blob-purple, .blob-blue, .ambient-blob'), {
                scale: 1.4,
                opacity: 0,
                duration: 1,
                ease: 'power2.in',
            }, 0);
        }
    }

    // ─── Mobile hero reveal ──────────────────────────────────
    if (isMobile) {
        const hero = document.getElementById('hero');
        if (hero) {
            const heroReveals = hero.querySelectorAll('.reveal');
            heroReveals.forEach(el => el.classList.add('visible'));
        }
    }

    // ─── Remaining sections — scroll-triggered reveals ─────────
    sections.forEach((section, i) => {
        if (section.id === 'hero') return; // hero handled above

        if (isMobile) {
            // Mobile: simple intersection-based reveals
            const obs = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        obs.unobserve(entry.target);
                        if (entry.target.classList.contains('stats-row')) startCounters();
                    }
                });
            }, { threshold: 0.15 });
            section.querySelectorAll('.reveal, .stagger').forEach(el => obs.observe(el));
            return;
        }

        // Desktop: scroll-triggered reveals (play once, no pin)
        buildSectionReveals(section);
    });

    // ─── Navigation Dots ─────────────────────────────────────
    sections.forEach(section => {
        ScrollTrigger.create({
            trigger: section,
            start: 'top 60%',
            end: 'bottom 40%',
            onToggle: (self) => {
                if (!self.isActive) return;
                const id = section.id;
                dots.forEach(dot => {
                    const isActive = dot.dataset.section === id;
                    dot.classList.toggle('active', isActive);
                    dot.style.background = isActive ? 'var(--accent)' : 'rgba(255,255,255,0.2)';
                    dot.style.height = isActive ? '20px' : '8px';
                });
            }
        });
    });

    // ─── Smooth Scroll for anchor links ──────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            let target;
            try {
                target = document.querySelector(link.getAttribute('href'));
            } catch (_) {
                return;
            }
            if (!target) return;
            e.preventDefault();

            // Force-reveal the target section's content immediately
            const reveals = target.querySelectorAll('.reveal');
            const staggers = target.querySelectorAll('.stagger');
            gsap.set(reveals, { y: 0, opacity: 1, scale: 1 });
            staggers.forEach(g => gsap.set(g.children, { y: 0, opacity: 1 }));

            gsap.to(window, {
                duration: 1.2,
                scrollTo: { y: target, offsetY: 0, autoKill: true },
                ease: 'power3.inOut',
            });
        });
    });


    // ─── Service Modals ───────────────────────────────────────
    function openModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.documentElement.style.overflow = 'hidden';
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.documentElement.style.overflow = '';
    }

    document.querySelectorAll('[data-offcanvas]').forEach(trigger => {
        trigger.addEventListener('click', () => openModal(trigger.dataset.offcanvas));
        trigger.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal(trigger.dataset.offcanvas);
            }
        });
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.dataset.target);
            if (btn.dataset.message) {
                const textarea = document.getElementById('message');
                if (textarea) textarea.value = btn.dataset.message;
            }
        });
    });

    // Fechar ao clicar no backdrop (fora do modal-box)
    document.querySelectorAll('.service-modal').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) closeModal(modal.id);
        });
    });

    // Fechar com Escape
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        document.querySelectorAll('.service-modal.active').forEach(modal => closeModal(modal.id));
    });


    // ─── Contact Form — Google Forms + validações ─────────────
    const contactForm = document.getElementById('contact-form');
    const submitBtn   = document.getElementById('contact-submit');
    const formSuccess = document.getElementById('form-success');
    const formError   = document.getElementById('form-error');
    const FORMS_URL   = 'https://docs.google.com/forms/d/e/1FAIpQLSeBU11bDvaCiVWdA9v3aFWG2QYFufCZ4OkqK45t-B0jSvcIiA/formResponse';

    // Registra quando o form ficou visível (anti-bot: tempo mínimo)
    const formLoadedAt = Date.now();

    // ── Helpers de validação ──
    const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    const PHONE_RE = /^\(?\d{2}\)?\s?\d{4,5}[\s\-]?\d{4}$/;

    function markInvalid(el, msg) {
        el.style.borderColor = 'rgba(239,68,68,0.6)';
        el.style.boxShadow   = '0 0 0 3px rgba(239,68,68,0.12)';
        let hint = el.parentElement.querySelector('.field-hint');
        if (!hint) {
            hint = document.createElement('p');
            hint.className = 'field-hint';
            hint.style.cssText = 'margin-top:4px;font-size:11px;color:#fca5a5;';
            el.parentElement.appendChild(hint);
        }
        hint.textContent = msg;
    }

    function clearInvalid(el) {
        el.style.borderColor = 'var(--border)';
        el.style.boxShadow   = '';
        const hint = el.parentElement.querySelector('.field-hint');
        if (hint) hint.textContent = '';
    }

    // ── Rate limiting (localStorage) ──
    const RATE_KEY     = 'gk_last_submit';
    const RATE_LIMIT   = 60 * 1000; // 1 min entre envios

    function isRateLimited() {
        const last = parseInt(localStorage.getItem(RATE_KEY) || '0', 10);
        return Date.now() - last < RATE_LIMIT;
    }

    function setRateStamp() {
        localStorage.setItem(RATE_KEY, String(Date.now()));
    }

    // ── Limpeza de borda ao digitar ──
    contactForm?.querySelectorAll('input, textarea').forEach(el => {
        el.addEventListener('input', () => clearInvalid(el));
    });

    // ── Submit ──
    contactForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Honeypot — bot preencheu campo oculto
        const honeypot = contactForm.querySelector('#_trap_field');
        if (honeypot?.value) return;

        // 2. Tempo mínimo — bot preencheu < 3s
        if (Date.now() - formLoadedAt < 3000) return;

        // 3. Rate limit
        if (isRateLimited()) {
            showMsg(formError, 'Aguarde 1 minuto antes de enviar novamente.');
            return;
        }

        // 4. reCAPTCHA
        const recaptchaRes = grecaptcha?.getResponse();
        if (!recaptchaRes) {
            showMsg(formError, 'Confirme que você não é um robô.');
            return;
        }

        // 5. Campos
        const fName    = contactForm.querySelector('[name="entry.1039809518"]');
        const fEmail   = contactForm.querySelector('[name="entry.2004470234"]');
        const fPhone   = contactForm.querySelector('[name="entry.753548826"]');
        const fMessage = contactForm.querySelector('[name="entry.1534861189"]');

        let valid = true;

        if (!fName.value.trim()) {
            markInvalid(fName, 'Nome é obrigatório.');
            valid = false;
        }

        if (!EMAIL_RE.test(fEmail.value.trim())) {
            markInvalid(fEmail, 'Informe um e-mail válido.');
            valid = false;
        }

        if (fPhone.value.trim() && !PHONE_RE.test(fPhone.value.trim())) {
            markInvalid(fPhone, 'Formato: (11) 99999-9999');
            valid = false;
        }

        if (fMessage.value.trim().length < 10) {
            markInvalid(fMessage, 'Mensagem muito curta (mín. 10 caracteres).');
            valid = false;
        }

        if (!valid) return;

        // 6. Envio
        submitBtn.disabled    = true;
        submitBtn.textContent = 'Enviando…';
        submitBtn.style.opacity = '0.7';
        formSuccess.classList.add('hidden');
        formError.classList.add('hidden');

        const body = new FormData(contactForm);

        try {
            await fetch(FORMS_URL, { method: 'POST', body, mode: 'no-cors' });
            setRateStamp();
            contactForm.reset();
            grecaptcha?.reset();
            showMsg(formSuccess, '✓ Mensagem enviada! Responderei em breve.');
        } catch {
            showMsg(formError, 'Erro ao enviar. Tente novamente.');
        } finally {
            submitBtn.disabled    = false;
            submitBtn.textContent = 'Enviar mensagem';
            submitBtn.style.opacity = '1';
        }
    });

    function showMsg(el, text) {
        if (text) el.textContent = text;
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 6000);
    }

    // ─── Flash message auto-dismiss ────────────────────────────
    const flash = document.getElementById('flash-success');
    if (flash) {
        setTimeout(() => {
            flash.style.transition = 'opacity 0.5s ease';
            flash.style.opacity    = '0';
            setTimeout(() => flash.remove(), 500);
        }, 4000);
    }


    // ─── Input focus glow ─────────────────────────────────────
    document.addEventListener('focus', e => {
        if (e.target.matches('input, textarea')) {
            e.target.style.borderColor = 'var(--accent)';
            e.target.style.boxShadow   = '0 0 0 3px rgba(124,58,237,0.15)';
        }
    }, true);

    document.addEventListener('blur', e => {
        if (e.target.matches('input, textarea')) {
            e.target.style.borderColor = 'var(--border)';
            e.target.style.boxShadow   = '';
        }
    }, true);

    // ─── Typing Effect — Hero subtitle ────────────────────────
    function startTyping() {
        const target = document.getElementById('typing-target');
        if (!target) return;

        const words = ['Web', 'PHP', 'Laravel', 'Full Stack'];
        let wordIndex = 0;
        let charIndex  = 0;
        let deleting   = false;

        const TYPE_SPEED   = 80;
        const DELETE_SPEED = 40;
        const PAUSE_AFTER  = 1500;
        const PAUSE_BEFORE = 300;

        function tick() {
            const current = words[wordIndex];
            if (!deleting) {
                charIndex++;
                target.textContent = current.slice(0, charIndex);
                if (charIndex === current.length) {
                    deleting = true;
                    setTimeout(tick, PAUSE_AFTER);
                    return;
                }
                setTimeout(tick, TYPE_SPEED);
            } else {
                charIndex--;
                target.textContent = current.slice(0, charIndex);
                if (charIndex === 0) {
                    deleting = false;
                    wordIndex = (wordIndex + 1) % words.length;
                    setTimeout(tick, PAUSE_BEFORE);
                    return;
                }
                setTimeout(tick, DELETE_SPEED);
            }
        }

        tick();
    }

    startTyping();


    // ─── Animated Counters — Sobre section ────────────────────
    function startCounters() {
        const items = document.querySelectorAll('.stat-num');
        const DURATION = 1200;

        function easeOutQuart(t) {
            return 1 - Math.pow(1 - t, 4);
        }

        items.forEach(el => {
            const targetVal = parseInt(el.dataset.target, 10);
            const suffix    = el.dataset.suffix || '';
            const start     = performance.now();

            function frame(now) {
                const elapsed  = now - start;
                const progress = Math.min(elapsed / DURATION, 1);
                const value    = Math.round(easeOutQuart(progress) * targetVal);
                el.textContent = value + suffix;
                if (progress < 1) requestAnimationFrame(frame);
            }

            requestAnimationFrame(frame);
        });
    }


    // ─── Custom Cursor ─────────────────────────────────────────
    function initCursor() {
        if (!window.matchMedia('(pointer: fine)').matches) return;

        const dot  = document.getElementById('cursor-dot');
        const ring = document.getElementById('cursor-ring');
        if (!dot || !ring) return;

        let mouseX = 0, mouseY = 0;
        let ringX  = 0, ringY  = 0;
        const LERP = 0.12;

        document.addEventListener('mousemove', e => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            dot.style.transform = `translate(calc(-50% + ${mouseX}px), calc(-50% + ${mouseY}px))`;
        });

        function animateRing() {
            ringX += (mouseX - ringX) * LERP;
            ringY += (mouseY - ringY) * LERP;
            ring.style.transform = `translate(calc(-50% + ${ringX}px), calc(-50% + ${ringY}px))`;
            requestAnimationFrame(animateRing);
        }
        animateRing();

        const interactiveSelector = 'a, button, [role="button"], .service-card, .nav-dot';

        document.addEventListener('mouseover', e => {
            if (e.target.closest(interactiveSelector)) ring.classList.add('expanded');
        });
        document.addEventListener('mouseout', e => {
            if (e.target.closest(interactiveSelector)) ring.classList.remove('expanded');
        });

        document.addEventListener('mousedown', () => dot.classList.add('clicked'));
        document.addEventListener('mouseup',   () => dot.classList.remove('clicked'));

        document.addEventListener('mouseleave', () => {
            dot.style.opacity  = '0';
            ring.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
            dot.style.opacity  = '1';
            ring.style.opacity = '1';
        });
    }

    initCursor();


    // ─── Ambient blobs — background sections ──────────────────
    function initAmbientBlobs() {
        const PURPLE = (o) => `radial-gradient(circle, rgba(124,58,237,${o}), transparent 70%)`;
        const BLUE   = (o) => `radial-gradient(circle, rgba(59,130,246,${o}), transparent 70%)`;

        const configs = {
            sobre: [
                { top: '-80px',  right: '-60px',  size: 360, bg: PURPLE(0.18), anim: 'blob-drift-a', dur: '9s',  delay: '0s'  },
                { bottom: '-100px', left: '-80px', size: 300, bg: BLUE(0.11),   anim: 'blob-drift-b', dur: '11s', delay: '-4s' }
            ],
            tecnologias: [
                { top: '15%',    left: '-100px',  size: 400, bg: PURPLE(0.13), anim: 'blob-drift-c', dur: '10s', delay: '-2s' },
                { bottom: '-60px', right: '-70px', size: 280, bg: BLUE(0.10),  anim: 'blob-drift-a', dur: '8s',  delay: '-5s' }
            ],
            portfolio: [
                { top: '-60px',  left: '35%',     size: 320, bg: PURPLE(0.15), anim: 'blob-drift-b', dur: '12s', delay: '-1s' },
                { bottom: '-80px', right: '-40px', size: 260, bg: BLUE(0.12),  anim: 'blob-drift-c', dur: '9s',  delay: '-6s' }
            ],
            servicos: [
                { top: '-70px',  right: '8%',     size: 380, bg: PURPLE(0.16), anim: 'blob-drift-a', dur: '11s', delay: '-3s' },
                { bottom: '-90px', left: '-50px',  size: 300, bg: BLUE(0.10),  anim: 'blob-drift-b', dur: '8s',  delay: '-7s' }
            ],
            contato: [
                { top: '-60px',  left: '-70px',   size: 340, bg: PURPLE(0.17), anim: 'blob-drift-c', dur: '10s', delay: '-2s' },
                { bottom: '-70px', right: '-50px', size: 290, bg: BLUE(0.12),  anim: 'blob-drift-a', dur: '9s',  delay: '-5s' }
            ]
        };

        Object.entries(configs).forEach(([id, blobs]) => {
            const section = document.getElementById(id);
            if (!section) return;
            blobs.forEach(cfg => {
                const blob = document.createElement('div');
                blob.className = 'ambient-blob';
                const pos = [
                    cfg.top    ? `top:${cfg.top};`    : '',
                    cfg.bottom ? `bottom:${cfg.bottom};` : '',
                    cfg.left   ? `left:${cfg.left};`  : '',
                    cfg.right  ? `right:${cfg.right};` : ''
                ].join('');
                blob.style.cssText = `${pos}width:${cfg.size}px;height:${cfg.size}px;background:${cfg.bg};animation:${cfg.anim} ${cfg.dur} ease-in-out infinite;animation-delay:${cfg.delay};`;
                section.prepend(blob);
            });
        });
    }

    initAmbientBlobs();


    // ─── Recalc after all content loaded ──────────────────────
    window.addEventListener('load', () => {
        ScrollTrigger.refresh();
    });


});
