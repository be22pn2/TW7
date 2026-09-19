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

    /* ===== Agenda (jsonbin) ===== */
    const JSONBIN = {
        binId: '6aae709effd5d16053191a89',
        readKey: '$2a$10$2LfXb4HLK5pXlZTiVuFBN.zV7Aa02TscYBWYoOv00FSDOJLbIWPHq'
    };

    let adminKey = null;

    function formatDate(value) {
        if (!value) return '';
        const parts = String(value).split('-');
        if (parts.length !== 3) return value;
        return parts[2] + '/' + parts[1] + '/' + parts[0];
    }

    function sortEvents(events) {
        return events
            .slice()
            .sort(function (a, b) {
                return String(a.date).localeCompare(String(b.date));
            });
    }

    function normalizeRecord(record) {
        const pay = record.pay && typeof record.pay === 'object' ? record.pay : {};
        return {
            events: Array.isArray(record.events) ? record.events : [],
            stream: record.stream && typeof record.stream === 'object'
                ? {
                    url: String(record.stream.url || ''),
                    title: String(record.stream.title || ''),
                    active: !!record.stream.active
                }
                : { url: '', title: '', active: false },
            pay: {
                pixKey: String(pay.pixKey || ''),
                pixName: String(pay.pixName || ''),
                pixCity: String(pay.pixCity || ''),
                linkIniciante: String(pay.linkIniciante || ''),
                linkApoiador: String(pay.linkApoiador || ''),
                linkElite: String(pay.linkElite || '')
            }
        };
    }

    async function fetchRecord(keyHeader) {
        const headers = {};
        headers['X-' + keyHeader + '-Key'] = keyHeader === 'Master' ? adminKey : JSONBIN.readKey;
        const url = 'https://api.jsonbin.io/v3/b/' + JSONBIN.binId + '/latest';
        const response = await fetch(url, { headers: headers });
        if (!response.ok) {
            throw new Error('Falha ao ler agenda.');
        }
        const json = await response.json();
        return normalizeRecord(json.record || {});
    }

    async function fetchEvents(keyHeader) {
        const record = await fetchRecord(keyHeader);
        return record.events;
    }

    async function saveRecord(record) {
        const url = 'https://api.jsonbin.io/v3/b/' + JSONBIN.binId;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'X-Master-Key': adminKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(record)
        });
        if (!response.ok) {
            throw new Error('Falha ao salvar.');
        }
    }

    async function saveEvents(events) {
        const record = await fetchRecord('Master');
        record.events = events;
        await saveRecord(record);
    }

    const scheduleList = document.getElementById('schedule-list');

    async function renderPublicSchedule() {
        try {
            const events = sortEvents(await fetchEvents('Access'));
            if (!events.length) {
                scheduleList.innerHTML = '<p class="schedule-empty">Nenhuma partida agendada no momento.</p>';
                return;
            }
            scheduleList.innerHTML = '';
            events.forEach(function (event) {
                const item = document.createElement('div');
                item.className = 'schedule-item';
                item.innerHTML =
                    '<span class="schedule-date">' + formatDate(event.date) + '</span>' +
                    '<span class="schedule-match"><strong>TW7</strong> ' + escapeHtmlField(event.match) + '</span>' +
                    '<span class="schedule-tournament">' + escapeHtmlField(event.tournament) + '</span>';
                scheduleList.appendChild(item);
            });
        } catch (err) {
            scheduleList.innerHTML = '<p class="schedule-empty">Não foi possível carregar a agenda.</p>';
            console.error('Erro ao carregar agenda:', err);
        }
    }

    function escapeHtmlField(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /* ===== Área do time ===== */
    const adminFab = document.getElementById('admin-fab');
    const adminModal = document.getElementById('admin-modal');
    const modalClose = document.getElementById('modal-close');
    const adminLocked = document.getElementById('admin-locked');
    const adminPanel = document.getElementById('admin-panel');
    const adminStatus = document.getElementById('admin-status');
    const adminUnlock = document.getElementById('admin-unlock');
    const adminKeyInput = document.getElementById('admin-key');
    const adminEventForm = document.getElementById('admin-event-form');
    const adminEventsList = document.getElementById('admin-events-list');

    function setAdminStatus(text, isError) {
        if (adminStatus) {
            adminStatus.textContent = text;
            adminStatus.className = 'form-status ' + (isError ? 'error' : 'success');
        }
    }

    function openModal() {
        adminModal.classList.add('open');
        adminModal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        adminModal.classList.remove('open');
        adminModal.setAttribute('aria-hidden', 'true');
    }

    adminFab.addEventListener('click', openModal);
    modalClose.addEventListener('click', closeModal);
    adminModal.addEventListener('click', function (e) {
        if (e.target === adminModal) {
            closeModal();
        }
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    adminUnlock.addEventListener('click', unlockAdmin);
    adminKeyInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            unlockAdmin();
        }
    });

    async function unlockAdmin() {
        const key = adminKeyInput.value.trim();
        if (!key) {
            setAdminStatus('Digite a chave de acesso.', true);
            return;
        }
        adminUnlock.disabled = true;
        adminUnlock.textContent = 'Verificando...';
        setAdminStatus('');

        try {
            adminKey = key;
            await fetchEvents('Master');
            adminLocked.hidden = true;
            adminPanel.hidden = false;
            setAdminStatus('');
            await Promise.all([loadAdminEvents(), loadAdminStream(), loadAdminPay()]);
        } catch (err) {
            adminKey = null;
            setAdminStatus('Chave inválida.', true);
        } finally {
            adminUnlock.disabled = false;
            adminUnlock.textContent = 'Entrar';
        }
    }

    async function loadAdminEvents() {
        try {
            const events = sortEvents(await fetchEvents('Master'));
            adminEventsList.innerHTML = '';
            if (!events.length) {
                adminEventsList.innerHTML = '<p class="modal-hint">Sem eventos cadastrados.</p>';
                return;
            }
            events.forEach(function (event, index) {
                const row = document.createElement('div');
                row.className = 'admin-event';
                row.innerHTML =
                    '<div class="admin-event-info">' +
                        '<strong>' + formatDate(event.date) + ' — ' + escapeHtmlField(event.match) + '</strong>' +
                        '<span>' + escapeHtmlField(event.tournament) + '</span>' +
                    '</div>' +
                    '<button class="admin-delete" data-index="' + index + '">Excluir</button>';
                adminEventsList.appendChild(row);
            });

            adminEventsList.querySelectorAll('.admin-delete').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    deleteEvent(parseInt(btn.dataset.index, 10));
                });
            });
        } catch (err) {
            setAdminStatus('Não foi possível carregar os eventos.', true);
        }
    }

    adminEventForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const date = document.getElementById('admin-date').value;
        const match = document.getElementById('admin-match').value.trim();
        const tournament = document.getElementById('admin-tournament').value.trim() || 'Campeonato';

        const btn = adminEventForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        try {
            const events = await fetchEvents('Master');
            events.push({ date: date, match: match, tournament: tournament });
            await saveEvents(events);
            adminEventForm.reset();
            setAdminStatus('Evento adicionado!');
            await Promise.all([loadAdminEvents(), renderPublicSchedule()]);
        } catch (err) {
            setAdminStatus('Erro ao salvar o evento.', true);
            console.error(err);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Adicionar evento';
        }
    });

    async function deleteEvent(index) {
        try {
            const events = await fetchEvents('Master');
            events.splice(index, 1);
            await saveEvents(events);
            setAdminStatus('Evento excluído.');
            await Promise.all([loadAdminEvents(), renderPublicSchedule()]);
        } catch (err) {
            setAdminStatus('Erro ao excluir o evento.', true);
            console.error(err);
        }
    }

    /* ===== Transmissão (admin) ===== */
    const adminStreamForm = document.getElementById('admin-stream-form');
    const adminStreamOff = document.getElementById('admin-stream-off');

    async function loadAdminStream() {
        try {
            const record = await fetchRecord('Master');
            document.getElementById('admin-stream-url').value = record.stream.url;
            document.getElementById('admin-stream-title').value = record.stream.title;
        } catch (err) {
            console.error('Erro ao carregar transmissão:', err);
        }
    }

    if (adminStreamForm) {
        adminStreamForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const url = document.getElementById('admin-stream-url').value.trim();
            const title = document.getElementById('admin-stream-title').value.trim() || 'TW7 Arena';

            if (!url) {
                setAdminStatus('Informe um link para ativar a transmissão.', true);
                return;
            }

            const btn = adminStreamForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Ativando...';
            try {
                const record = await fetchRecord('Master');
                record.stream = { url: url, title: title, active: true };
                await saveRecord(record);
                setAdminStatus('Transmissão ativada no telão!');
            } catch (err) {
                setAdminStatus('Erro ao ativar a transmissão.', true);
                console.error(err);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Ativar no telão';
            }
        });

        adminStreamOff.addEventListener('click', async function () {
            try {
                const record = await fetchRecord('Master');
                record.stream.active = false;
                await saveRecord(record);
                setAdminStatus('Live encerrada no telão.');
            } catch (err) {
                setAdminStatus('Erro ao encerrar a live.', true);
                console.error(err);
            }
        });
    }

    /* ===== Pagamentos (admin) ===== */
    const adminPayForm = document.getElementById('admin-pay-form');

    async function loadAdminPay() {
        try {
            const record = await fetchRecord('Master');
            document.getElementById('admin-pix-key').value = record.pay.pixKey;
            document.getElementById('admin-pix-name').value = record.pay.pixName;
            document.getElementById('admin-pix-city').value = record.pay.pixCity;
            document.getElementById('admin-link-iniciante').value = record.pay.linkIniciante;
            document.getElementById('admin-link-apoiador').value = record.pay.linkApoiador;
            document.getElementById('admin-link-elite').value = record.pay.linkElite;
        } catch (err) {
            console.error('Erro ao carregar pagamentos:', err);
        }
    }

    if (adminPayForm) {
        adminPayForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const btn = adminPayForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Salvando...';
            try {
                const record = await fetchRecord('Master');
                record.pay = {
                    pixKey: document.getElementById('admin-pix-key').value.trim(),
                    pixName: document.getElementById('admin-pix-name').value.trim(),
                    pixCity: document.getElementById('admin-pix-city').value.trim(),
                    linkIniciante: document.getElementById('admin-link-iniciante').value.trim(),
                    linkApoiador: document.getElementById('admin-link-apoiador').value.trim(),
                    linkElite: document.getElementById('admin-link-elite').value.trim()
                };
                await saveRecord(record);
                setAdminStatus('Pagamentos salvos!');
            } catch (err) {
                setAdminStatus('Erro ao salvar pagamentos.', true);
                console.error(err);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Salvar pagamentos';
            }
        });
    }

    renderPublicSchedule();
})();