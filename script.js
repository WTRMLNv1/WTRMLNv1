(function () {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ===== HOBBY: TRADING (canvas candlestick ticker) =====
    function initTradingCard(card) {
        const canvas = card.querySelector('canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let raf = null;
        let data = null;
        let head = 0;        // index in `data` of the leftmost visible candle
        let dpr = 1;
        let fadeTimer = null;
        const FADE_MS = 500; // must match the canvas opacity transition

        function resize() {
            dpr = window.devicePixelRatio || 1;
            const r = canvas.getBoundingClientRect();
            canvas.width = r.width * dpr;
            canvas.height = r.height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function generateData() {
            const n = 80;
            const arr = [];
            let price = 50 + Math.random() * 20;
            for (let i = 0; i < n; i++) {
                const open = price;
                const change = (Math.random() - 0.48) * 6;
                const close = Math.max(8, open + change);
                const high = Math.max(open, close) + Math.random() * 3;
                const low = Math.min(open, close) - Math.random() * 3;
                arr.push({ open, close, high, low });
                price = close;
            }
            return arr;
        }

        // Compute min/max across the full dataset so y-scale doesn't jitter
        // as new candles scroll into view.
        function getScale() {
            let minV = Infinity, maxV = -Infinity;
            for (const c of data) {
                if (c.low < minV) minV = c.low;
                if (c.high > maxV) maxV = c.high;
            }
            return { minV, maxV, range: Math.max(1, maxV - minV) };
        }

        function draw() {
            const r = canvas.getBoundingClientRect();
            const w = r.width, h = r.height;
            if (!data) return;
            ctx.clearRect(0, 0, w, h);

            const padX = 12, padY = 16;
            const innerW = w - padX * 2;
            const innerH = h - padY * 2;

            // Candle width: fit enough candles to fill the visible area
            // regardless of how many we have. Drawing 1.2x the visible
            // count means we always have one offscreen to scroll in.
            const visibleCount = Math.max(8, Math.floor(innerW / 14));
            const candleW = innerW / visibleCount;

            const { minV, range } = getScale();

            // `head` is fractional: the integer part picks the leftmost
            // candle, the fraction becomes a sub-candle pixel offset so
            // the scroll is smooth instead of stepping.
            const baseIdx = Math.floor(head);
            const frac = head - baseIdx;

            ctx.save();
            // Clip to the plot area so partially-scrolled candles don't
            // bleed into the padding on either side.
            ctx.beginPath();
            ctx.rect(padX, 0, innerW, h);
            ctx.clip();
            ctx.translate(padX - frac * candleW, 0);
            ctx.strokeStyle = 'rgba(139, 30, 63, 0.35)';
            ctx.fillStyle = 'rgba(139, 30, 63, 0.25)';
            ctx.lineWidth = 1;

            for (let i = 0; i <= visibleCount + 1; i++) {
                const dataIdx = (baseIdx + i) % data.length;
                const c = data[dataIdx];
                const x = i * candleW + candleW * 0.2;
                const wickX = i * candleW + candleW * 0.5;
                const yo = padY + innerH - ((c.open - minV) / range) * innerH;
                const yc = padY + innerH - ((c.close - minV) / range) * innerH;
                const yh = padY + innerH - ((c.high - minV) / range) * innerH;
                const yl = padY + innerH - ((c.low - minV) / range) * innerH;
                const bodyTop = Math.min(yo, yc);
                const bodyH = Math.max(2, Math.abs(yo - yc));

                ctx.beginPath();
                ctx.moveTo(wickX, yh);
                ctx.lineTo(wickX, yl);
                ctx.stroke();

                ctx.fillRect(x, bodyTop, candleW * 0.6, bodyH);
                ctx.strokeRect(x, bodyTop, candleW * 0.6, bodyH);
            }
            ctx.restore();
        }

        // Advance by less than one candle per frame for smooth scroll.
        // After ~4 frames we've scrolled in one fresh candle.
        function loop() {
            draw();
            head = (head + 0.25) % data.length;
            raf = requestAnimationFrame(loop);
        }

        function start() {
            if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = null; }
            canvas.classList.remove('fx-out');
            if (raf) return;              // already running, just un-faded
            resize();
            // Only reroll the series on a genuinely fresh hover, so
            // re-entering during the fade-out doesn't jump to new data.
            if (!data) { data = generateData(); head = 0; }
            if (reduced) {
                head = 0;
                draw();                   // single static frame, no loop
                return;
            }
            raf = requestAnimationFrame(loop);
        }

        // Fade the chart out on leave rather than freezing or clearing
        // it instantly. The loop keeps running through the fade so the
        // candles are still scrolling as they disappear.
        function stop() {
            canvas.classList.add('fx-out');
            if (fadeTimer) clearTimeout(fadeTimer);
            fadeTimer = setTimeout(() => {
                fadeTimer = null;
                cancelAnimationFrame(raf);
                raf = null;
                const r = canvas.getBoundingClientRect();
                ctx.clearRect(0, 0, r.width, r.height);
                data = null;              // next hover gets a fresh series
            }, FADE_MS);
        }

        // Use mouseenter/leave (not pointerenter/leave) because pointer
        // events fire when the cursor crosses a child node, which would
        // stop the loop mid-hover. mouseenter/leave only fire on the
        // card's own edge. A 60ms debounce on leave smooths over a
        // brief cursor wobble at the card boundary.
        let leaveTimer = null;
        card.addEventListener('mouseenter', () => {
            if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
            start();
        });
        card.addEventListener('mouseleave', () => {
            leaveTimer = setTimeout(() => {
                leaveTimer = null;
                stop();
            }, 60);
        });
        // Resizing the canvas clears it, so redraw the last frame even
        // when the animation is paused.
        window.addEventListener('resize', () => {
            if (!data) return;
            resize();
            if (!raf) draw();
        });
    }

    // ===== HOBBY: GLYPH (math + physics) =====
    const MATH_GLYPHS = ['∑', 'π', '∞', '√', '∫', 'Δ', 'θ', '≠', 'ⁿ', 'λ', 'φ', 'Ω', '∂', '≈', '±', 'ℝ'];
    const PHYSICS_GLYPHS = ['⚛', 'λ', '~', 'E=mc²', '∮', 'v', 'Δt', 'θ', '∞', 'F=ma', 'ħ', 'q', 'τ', 'Ω', 'c'];

    function initGlyphCard(card, glyphs) {
        const layer = card.querySelector('.hobby-glyph-layer');
        if (!layer) return;
        let active = 0;
        let timers = [];
        let clearTimer = null;

        function spawn() {
            if (reduced) {
                // Static frame: place a handful of glyphs at low opacity
                if (layer.children.length) return;
                const r = layer.getBoundingClientRect();
                for (let i = 0; i < 6; i++) {
                    const el = document.createElement('span');
                    el.className = 'hobby-glyph';
                    el.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
                    const size = 1.4 + Math.random() * 1.2;
                    el.style.fontSize = size + 'rem';
                    el.style.left = (Math.random() * 100) + '%';
                    el.style.top = (Math.random() * 100) + '%';
                    el.style.opacity = '0.25';
                    el.style.animation = 'none';
                    layer.appendChild(el);
                }
                return;
            }
            const el = document.createElement('span');
            el.className = 'hobby-glyph';
            el.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
            const size = 1.1 + Math.random() * 1.6;
            el.style.fontSize = size + 'rem';
            el.style.left = (Math.random() * 100) + '%';
            el.style.top = (60 + Math.random() * 40) + '%';
            el.style.setProperty('--drift-x', ((Math.random() - 0.5) * 120) + 'px');
            el.style.setProperty('--drift-y', (-(80 + Math.random() * 160)) + 'px');
            el.style.setProperty('--rot', ((Math.random() - 0.5) * 60) + 'deg');
            el.style.animationDuration = (2.6 + Math.random() * 1.8) + 's';
            layer.appendChild(el);
            setTimeout(() => el.remove(), 5000);
        }

        function start() {
            if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
            layer.classList.remove('fx-out');
            if (active) return;
            active = 1;
            spawn();
            timers.push(setInterval(spawn, 280));
        }

        // Stop spawning and fade the whole layer out, so in-flight
        // glyphs dissolve with it instead of being yanked from the DOM
        // mid-float.
        function stop() {
            active = 0;
            timers.forEach(clearInterval);
            timers = [];
            layer.classList.add('fx-out');
            if (clearTimer) clearTimeout(clearTimer);
            clearTimer = setTimeout(() => {
                clearTimer = null;
                if (!active) layer.innerHTML = '';
            }, 600);
        }

        card.addEventListener('mouseenter', start);
        card.addEventListener('mouseleave', stop);
    }

    // ===== HOBBY: MINECRAFT (pixel grid pop-in) =====
    function initMinecraftCard(card) {
        const layer = card.querySelector('.hobby-pixel-layer');
        if (!layer) return;
        let active = 0;
        let timers = [];
        let clearTimer = null;

        // Block colors inspired by grass/dirt/stone — no Mojang textures
        const blocks = [
            '#5b8c3a', '#6ea648', '#4a7a2d', // grass top variants
            '#7a5a3a', '#6b4d31', '#8a6a44', // dirt
            '#8a8a8a', '#7a7a7a', '#9a9a9a'  // stone
        ];

        function spawn() {
            if (reduced) {
                if (layer.children.length) return;
                const r = layer.getBoundingClientRect();
                const cols = Math.floor(r.width / 16);
                const rows = Math.floor(r.height / 16);
                for (let i = 0; i < 18; i++) {
                    const el = document.createElement('div');
                    el.className = 'hobby-pixel';
                    el.style.background = blocks[Math.floor(Math.random() * blocks.length)];
                    el.style.left = (Math.floor(Math.random() * cols) * 16) + 'px';
                    el.style.top = (Math.floor(Math.random() * rows) * 16) + 'px';
                    el.style.opacity = '0.6';
                    el.style.animation = 'none';
                    layer.appendChild(el);
                }
                return;
            }
            const r = layer.getBoundingClientRect();
            const cols = Math.floor(r.width / 16);
            const rows = Math.floor(r.height / 16);
            if (cols < 1 || rows < 1) return;

            const el = document.createElement('div');
            el.className = 'hobby-pixel';
            el.style.background = blocks[Math.floor(Math.random() * blocks.length)];
            el.style.left = (Math.floor(Math.random() * cols) * 16) + 'px';
            el.style.top = (Math.floor(Math.random() * rows) * 16) + 'px';
            layer.appendChild(el);
            setTimeout(() => el.remove(), 2400);
        }

        function start() {
            if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
            layer.classList.remove('fx-out');
            if (active) return;
            active = 1;
            spawn(); spawn(); spawn();
            timers.push(setInterval(spawn, 180));
        }

        // Fade the layer out so the remaining blocks dissolve together
        // instead of vanishing the instant the cursor leaves.
        function stop() {
            active = 0;
            timers.forEach(clearInterval);
            timers = [];
            layer.classList.add('fx-out');
            if (clearTimer) clearTimeout(clearTimer);
            clearTimer = setTimeout(() => {
                clearTimer = null;
                if (!active) layer.innerHTML = '';
            }, 600);
        }

        card.addEventListener('mouseenter', start);
        card.addEventListener('mouseleave', stop);
    }

    // Wire up cards
    document.querySelectorAll('[data-hobby="trading"]').forEach(initTradingCard);
    document.querySelectorAll('[data-hobby="math"]').forEach(c => initGlyphCard(c, MATH_GLYPHS));
    document.querySelectorAll('[data-hobby="physics"]').forEach(c => initGlyphCard(c, PHYSICS_GLYPHS));
    document.querySelectorAll('[data-hobby="minecraft"]').forEach(initMinecraftCard);

    // ===== CONTACT: copy to clipboard =====
    document.querySelectorAll('.contact-item[data-copy]').forEach(item => {
        const btn = item.querySelector('.copy-btn');
        if (!btn) return;
        const originalHTML = btn.innerHTML;
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const text = item.getAttribute('data-copy');
            try {
                await navigator.clipboard.writeText(text);
            } catch (_) {
                // Fallback: temporary input
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                try { document.execCommand('copy'); } catch (e2) {}
                document.body.removeChild(ta);
            }
            btn.classList.add('copied');
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg> Copied';
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.innerHTML = originalHTML;
            }, 1400);
        });
    });
})();
