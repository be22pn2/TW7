(function (window) {
    'use strict';

    function pad(str, width) {
        return String(str).padStart(width, '0');
    }

    function field(id, value) {
        const v = String(value);
        return id + pad(v.length, 2) + v;
    }

    function crc16CCITT(str) {
        let crc = 0xFFFF;
        for (let i = 0; i < str.length; i++) {
            crc ^= str.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
                crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
                crc &= 0xFFFF;
            }
        }
        return pad(crc.toString(16).toUpperCase(), 4);
    }

    function sanitize(value, max) {
        const cleaned = String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9 .-]/g, '')
            .trim();
        return cleaned.substring(0, max);
    }

    function buildPixPayload(key, name, city, amount) {
        const amt = Number(amount).toFixed(2);
        const mcc = '0014BR.GOV.BCB.PIX' + '01' + pad(String(key).length, 2) + String(key);
        const parts = [
            field('00', '01'),
            field('26', mcc),
            field('52', '0000'),
            field('53', '986'),
            field('54', amt),
            field('58', 'BR'),
            field('59', sanitize(name, 25) || 'TW7'),
            field('60', sanitize(city, 15) || 'BRASIL'),
            field('62', field('05', '***'))
        ];
        const target = parts.join('') + '6304';
        return target + crc16CCITT(target);
    }

    function renderQR(element, payload, size) {
        let qrCode = element._tw7qr;
        if (qrCode) {
            qrCode.clear();
            qrCode.makeCode(payload);
        } else if (window.QRCode) {
            qrCode = new QRCode(element, { text: payload, width: size, height: size });
            element._tw7qr = qrCode;
        }
    }

    window.TW7Pix = {
        buildPayload: buildPixPayload,
        renderQR: renderQR
    };
})(window);