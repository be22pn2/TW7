(function () {
    'use strict';

    const EMAILJS_PUBLIC_KEY = '1fM2XnY20V-VwYVuX';

    const planPicked = document.getElementById('plan-selected');
    const planSelect = document.getElementById('member-plano');

    document.querySelectorAll('.plan-pick').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const plano = btn.dataset.plano;
            if (planSelect) {
                planSelect.value = plano;
            }
            if (planPicked) {
                planPicked.textContent = 'Plano escolhido: ' + plano + ' — preencha seus dados.';
            }
            document.getElementById('inscricao').scrollIntoView({ behavior: 'smooth' });
        });
    });

    if (planSelect) {
        planSelect.addEventListener('change', function () {
            if (planPicked) {
                planPicked.textContent = 'Plano escolhido: ' + planSelect.value + ' — preencha seus dados.';
            }
        });
    }

    const form = document.getElementById('member-form');
    const status = document.getElementById('member-status');

    if (form) {
        emailjs.init(EMAILJS_PUBLIC_KEY);

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.textContent;

            btn.disabled = true;
            btn.textContent = 'Enviando...';

            const payload = {
                nome: document.getElementById('member-nome').value.trim(),
                email: document.getElementById('member-email').value.trim(),
                tag: document.getElementById('member-tag').value.trim(),
                interesse: 'Quero ser membro - Plano ' + planSelect.value,
                mensagem: document.getElementById('member-mensagem').value.trim()
            };

            try {
                const response = await emailjs.send('service_guyqafr', 'template_detjlid', payload);

                if (response.status !== 200) {
                    throw new Error('Falha no envio.');
                }

                form.reset();
                status.textContent = 'Solicitação enviada! Retornaremos com os detalhes do plano.';
                status.className = 'form-status success';
            } catch (err) {
                status.textContent = 'Não foi possível enviar agora. Tente novamente mais tarde.';
                status.className = 'form-status error';
                console.error('Erro no envio do plano:', err);
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }
})();