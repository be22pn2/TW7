(function () {
    'use strict';

    const EMAILJS_PUBLIC_KEY = '1fM2XnY20V-VwYVuX';
    const JSONBIN = {
        binId: '6aae709effd5d16053191a89',
        readKey: '$2a$10$2LfXb4HLK5pXlZTiVuFBN.zV7Aa02TscYBWYoOv00FSDOJLbIWPHq'
    };

    const planPicked = document.getElementById('plan-selected');
    const planSelect = document.getElementById('member-plano');

    const payArea = document.getElementById('pay-area');
    const payPlanInfo = document.getElementById('pay-plan-info');
    const payPix = document.getElementById('pay-pix');
    const payPixBox = document.getElementById('pay-pix');
    const pixAmount = document.getElementById('pix-amount');
    const pixCopyInput = document.getElementById('pix-copy');
    const pixCopyBtn = document.getElementById('pix-copy-btn');
    const payLinkArea = document.getElementById('pay-link-area');
    const payLinkBtn = document.getElementById('pay-link-btn');

    let payConfig = { pixKey: '', pixName: '', pixCity: '', linkIniciante: '', linkApoiador: '', linkElite: '' };
    let currentPayload = '';
    let currentPlan = null;

    const PLAN_LINK_FIELD = {
        Iniciante: 'linkIniciante',
        Apoiador: 'linkApoiador',
        Elite: 'linkElite'
    };

    async function loadPayConfig() {
        try {
            const response = await fetch('https://api.jsonbin.io/v3/b/' + JSONBIN.binId + '/latest', {
                headers: { 'X-Access-Key': JSONBIN.readKey }
            });
            if (!response.ok) {
                throw new Error('Falha ao ler configurações.');
            }
            const json = await response.json();
            const pay = (json.record && json.record.pay) || {};
            payConfig = {
                pixKey: String(pay.pixKey || ''),
                pixName: String(pay.pixName || ''),
                pixCity: String(pay.pixCity || ''),
                linkIniciante: String(pay.linkIniciante || ''),
                linkApoiador: String(pay.linkApoiador || ''),
                linkElite: String(pay.linkElite || '')
            };
        } catch (err) {
            console.error('Erro ao carregar pagamentos:', err);
        }
    }

    function showPayForPlan(plano, amount) {
        currentPlan = plano;
        if (!payArea) return;

        payArea.hidden = false;
        const hasPix = !!payConfig.pixKey;
        const link = payConfig[PLAN_LINK_FIELD[plano]];

        payPixBox.hidden = !hasPix;
        payLinkArea.hidden = !link;

        payPlanInfo.textContent = 'Plano ' + plano + ' — ' +
            (hasPix ? 'Pix' : '') +
            (hasPix && link ? ' e ' : '') +
            (link ? 'link de cartão/boleto/PayPal' : '') +
            '.';

        if (hasPix) {
            pixAmount.textContent = 'Valor: R$ ' + Number(amount).toFixed(2).replace('.', ',');
            currentPayload = window.TW7Pix.buildPayload(payConfig.pixKey, payConfig.pixName, payConfig.pixCity, amount);
            pixCopyInput.value = currentPayload;
            window.TW7Pix.renderQR(document.getElementById('pix-qr'), currentPayload, 200);
        }

        if (link) {
            payLinkBtn.href = link;
        }

        document.getElementById('pagamento').scrollIntoView({ behavior: 'smooth' });
    }

    document.querySelectorAll('.plan-pick').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const plano = btn.dataset.plano;
            const amount = btn.dataset.amount;
            if (planSelect) {
                planSelect.value = plano;
            }
            if (planPicked) {
                planPicked.textContent = 'Plano escolhido: ' + plano + ' — preencha seus dados.';
            }
            showPayForPlan(plano, amount);
        });
    });

    if (planSelect) {
        planSelect.addEventListener('change', function () {
            if (planPicked) {
                planPicked.textContent = 'Plano escolhido: ' + planSelect.value + ' — preencha seus dados.';
            }
        });
    }

    if (pixCopyBtn && pixCopyInput) {
        pixCopyBtn.addEventListener('click', function () {
            const text = pixCopyInput.value;
            function copyOk() {
                pixCopyBtn.textContent = 'Copiado!';
                setTimeout(function () {
                    pixCopyBtn.textContent = 'Copiar código Pix';
                }, 2000);
            }
            function fallback() {
                pixCopyInput.select();
                pixCopyInput.setSelectionRange(0, text.length);
                try {
                    document.execCommand('copy');
                    copyOk();
                } catch (err) {
                    console.error(err);
                }
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(copyOk).catch(fallback);
            } else {
                fallback();
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

            const obs = document.getElementById('member-mensagem').value.trim();
            const comprovante = document.getElementById('member-comprovante').value.trim();
            const pagamento = document.getElementById('member-pagamento').value;
            const lines = [
                'Método de pagamento: ' + pagamento,
                comprovante ? 'Comprovante: ' + comprovante : '',
                obs ? 'Observações: ' + obs : ''
            ].filter(Boolean);

            const payload = {
                nome: document.getElementById('member-nome').value.trim(),
                email: document.getElementById('member-email').value.trim(),
                tag: document.getElementById('member-tag').value.trim(),
                interesse: 'Quero ser membro - Plano ' + planSelect.value,
                mensagem: lines.join('\n')
            };

            try {
                const response = await emailjs.send('service_guyqafr', 'template_detjlid', payload);

                if (response.status !== 200) {
                    throw new Error('Falha no envio.');
                }

                form.reset();
                status.textContent = 'Solicitação enviada! Aguarde a confirmação do pagamento.';
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

    loadPayConfig();
})();