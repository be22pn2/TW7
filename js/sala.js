(function () {
    'use strict';

    const JSONBIN = {
        binId: '6aae709effd5d16053191a89',
        readKey: '$2a$10$2LfXb4HLK5pXlZTiVuFBN.zV7Aa02TscYBWYoOv00FSDOJLbIWPHq'
    };

    const stage = document.getElementById('sala-stage');
    const badge = document.getElementById('sala-badge');
    const title = document.getElementById('sala-title');
    const subtitle = document.getElementById('sala-subtitle');

    function getYouTubeEmbed(url) {
        const video = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (video) {
            return 'https://www.youtube.com/embed/' + video[1] + '?autoplay=1';
        }
        const channel = url.match(/youtube\.com\/(?:c\/|channel\/|@)?([a-zA-Z0-9_@-]+)/);
        if (channel && /^[a-zA-Z0-9_-]{5,}$/.test(channel[1]) && !/@/.test(channel[1])) {
            return null;
        }
        return null;
    }

    function showOffline(text) {
        badge.classList.add('off');
        badge.textContent = text;
        title.textContent = 'TW7 Arena';
        subtitle.textContent = 'Nenhuma transmissão no momento';
    }

    async function loadStream() {
        try {
            const response = await fetch('https://api.jsonbin.io/v3/b/' + JSONBIN.binId + '/latest', {
                headers: { 'X-Access-Key': JSONBIN.readKey }
            });
            if (!response.ok) {
                throw new Error('Falha ao carregar transmissão.');
            }
            const json = await response.json();
            const stream = (json.record && json.record.stream) || { url: '', title: '', active: false };

            if (stream.active && stream.url) {
                const embed = getYouTubeEmbed(stream.url);
                stage.innerHTML = '';
                const iframe = document.createElement('iframe');
                iframe.src = embed || stream.url;
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
                iframe.allowFullscreen = true;
                stage.appendChild(iframe);

                badge.classList.remove('off');
                badge.textContent = 'AO VIVO';
                title.textContent = stream.title || 'TW7 Arena';
                subtitle.textContent = 'Acompanhe o torneio no telão';
            } else {
                showOffline('AUSENTE');
            }
        } catch (err) {
            showOffline('OFFLINE');
            console.error('Erro ao carregar transmissão:', err);
        }
    }

    loadStream();
})();