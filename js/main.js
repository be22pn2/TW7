(function () {
    'use strict';

    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function () {
            navToggle.classList.toggle('open');
            navLinks.classList.toggle('open');
        });

        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navToggle.classList.remove('open');
                navLinks.classList.remove('open');
            });
        });
    }

    window.addEventListener('scroll', function () {
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 40);
        }
    }, { passive: true });

    const sections = document.querySelectorAll('section[id]');
    const menuAnchors = document.querySelectorAll('.nav-links a');

    function highlightActive() {
        let current = '';
        sections.forEach(function (section) {
            const top = window.scrollY + 120;
            if (top >= section.offsetTop) {
                current = section.getAttribute('id');
            }
        });
        menuAnchors.forEach(function (anchor) {
            anchor.classList.toggle('active', anchor.getAttribute('href') === '#' + current);
        });
    }

    window.addEventListener('scroll', highlightActive, { passive: true });
    highlightActive();

    function animateCounter(el) {
        const target = parseInt(el.dataset.target, 10);
        const duration = 1400;
        const start = performance.now();

        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased);
            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        }

        requestAnimationFrame(tick);
    }

    const revealables = document.querySelectorAll('.section');
    const counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('.stat-number').forEach(animateCounter);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.25 });

    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        counterObserver.observe(statsSection);
    }

    const revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    revealables.forEach(function (section) {
        section.classList.add('reveal');
        revealObserver.observe(section);
    });

    const form = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    const EMAILJS_PUBLIC_KEY = '1fM2XnY20V-VwYVuX';

    if (form) {
        emailjs.init(EMAILJS_PUBLIC_KEY);

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.textContent;

            btn.disabled = true;
            btn.textContent = 'Enviando...';

            const payload = {
                nome: document.getElementById('nome').value.trim(),
                email: document.getElementById('email').value.trim(),
                tag: document.getElementById('tag').value.trim(),
                interesse: document.getElementById('interesse').value,
                mensagem: document.getElementById('mensagem').value.trim()
            };

            try {
                const response = await emailjs.send('service_guyqafr', 'template_detjlid', payload);

                if (response.status !== 200) {
                    throw new Error('Falha no envio.');
                }

                form.reset();
                if (formStatus) {
                    formStatus.textContent = 'Solicitação enviada! Recebemos seus dados e retornaremos em breve.';
                    formStatus.className = 'form-status success';
                }
            } catch (err) {
                if (formStatus) {
                    formStatus.textContent = 'Não foi possível enviar agora. Tente novamente mais tarde.';
                    formStatus.className = 'form-status error';
                }
                console.error('Erro no envio do formulário:', err);
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }
})();