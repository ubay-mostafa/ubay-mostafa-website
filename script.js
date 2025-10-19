document.addEventListener('DOMContentLoaded', function () {
    const body = document.body;
    // Consolidate menu icons: search broadly, pick the first visible one, and hide others accessibly.
    const selectors = ['.menu-btn', '.fa-bars', '.menu-toggle', '.menu-icon', '.hamburger', '.burger', '[data-menu-btn]'];
    const rawMenuEls = Array.from(document.querySelectorAll(selectors.join(',')));
    // choose first visible element (fall back to first found)
    const menuBtn = rawMenuEls.find(el => {
        try { return el.offsetParent !== null || getComputedStyle(el).display !== 'none'; } catch (e) { return false; }
    }) || (rawMenuEls.length ? rawMenuEls[0] : null);
    rawMenuEls.forEach(el => {
        if (el !== menuBtn) {
            // hide duplicates but keep semantic info for assistive tech
            el.style.display = 'none';
            el.setAttribute('aria-hidden', 'true');
            el.tabIndex = -1;
        }
    });
    // remove only literal '+' or '-' characters from text nodes within menu elements
    function stripPlusMinus(el) {
        if (!el) return;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) textNodes.push(node);
        textNodes.forEach(t => {
            const trimmed = t.textContent.trim();
            if (trimmed === '+' || trimmed === '-') {
                t.parentNode.removeChild(t);
            } else {
                const replaced = t.textContent.replace(/[+\-]/g, '');
                if (replaced !== t.textContent) t.textContent = replaced;
            }
        });
    }
    rawMenuEls.forEach(stripPlusMinus);
    // ensure the retained menu button is keyboard accessible and announced as a button
    if (menuBtn) {
        if (!menuBtn.hasAttribute('role')) menuBtn.setAttribute('role', 'button');
        if (!menuBtn.hasAttribute('tabindex')) menuBtn.tabIndex = 0;
        menuBtn.removeAttribute('aria-hidden');
    }

    // remove any standalone text nodes that are exactly "+" or "-" anywhere on the page
    function removeStandalonePlusMinusGlobal(root = document.body) {
        if (!root) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        const nodes = [];
        let n;
        while ((n = walker.nextNode())) {
            if (n.textContent && n.textContent.trim().length === 1 && (n.textContent.trim() === '+' || n.textContent.trim() === '-')) {
                nodes.push(n);
            }
        }
        nodes.forEach(t => t.parentNode && t.parentNode.removeChild(t));
    }
    removeStandalonePlusMinusGlobal();

    // remove duplicate logo images that are NOT linked to "home"
    function removeNonHomeLogos() {
        const imgs = Array.from(document.querySelectorAll('img[src$="logo.jpg"], .logo img, img[alt*="logo"]'));
        if (imgs.length <= 1) return;
        // logos whose closest anchor points to home
        const homeImgs = imgs.filter(img => {
            const a = img.closest('a');
            if (!a) return false;
            const href = (a.getAttribute('href') || '').trim();
            return href === '#top' || href === '/' || href.endsWith('index.html') || href === '' || href === './';
        });
        if (homeImgs.length) {
            const keep = new Set(homeImgs);
            imgs.forEach(img => {
                if (!keep.has(img) && img.parentNode) img.parentNode.removeChild(img);
            });
        } else {
            // no explicit home-linked logo found — keep the first and remove the rest
            imgs.slice(1).forEach(img => img.parentNode && img.parentNode.removeChild(img));
        }
    }
    removeNonHomeLogos();

    // trigger hero animations: slide coder image and intro text in from left/right
    (function triggerHeroAnimations() {
        const coder = document.querySelector('.coder');
        const intro = document.querySelector('.intro');
        if (!coder && !intro) return;
        // slight delay so everything is painted before animating
        setTimeout(() => {
            if (coder) coder.classList.add('animate-in');
            if (intro) intro.classList.add('animate-in');
        }, 120);
    })();

    /* smooth scrolling for internal anchors and close menu on click */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // close menu if open
                if (body.classList.contains('menu-open')) {
                    body.classList.remove('menu-open');
                    const backdrop = document.getElementById('menuBackdrop');
                    if (backdrop) backdrop.hidden = true;
                    const side = document.getElementById('sideMenu');
                    if (side) side.setAttribute('aria-hidden', 'true');
                }
            }
        });
    });

    /* Project modal logic */
    const projectCards = Array.from(document.querySelectorAll('.project-card'));
    const modal = document.getElementById('projectModal');
    const modalImg = modal && modal.querySelector('.modal-img');
    const modalTitle = modal && modal.querySelector('.modal-title');
    const modalDesc = modal && modal.querySelector('.modal-desc');
    const modalClose = modal && modal.querySelector('.modal-close');

    document.querySelectorAll('.view-project').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.project-card');
            if (!card || !modal) return;
            const title = card.dataset.title || card.querySelector('h3')?.textContent || '';
            const desc = card.dataset.desc || card.querySelector('p')?.textContent || '';
            // always use the project's visible image for the modal (no embedding)
            const imgSrc = card.querySelector('img')?.getAttribute('src') || card.dataset.img || '';
            if (modalImg) {
                modalImg.hidden = false;
                modalImg.alt = title;
                modalImg.src = imgSrc;
            }
             if (modalTitle) modalTitle.textContent = title;
             if (modalDesc) modalDesc.textContent = desc;
             modal.hidden = false;
             modal.removeAttribute('aria-hidden');
             document.body.style.overflow = 'hidden';
         });
     });
    if (modalClose) modalClose.addEventListener('click', () => {
        if (!modal) return;
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    });
    if (modal) modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    });

    /* Contact form handling - construct mailto: with form values */
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const name = (form.querySelector('[name="name"]')?.value || '').trim();
            const email = (form.querySelector('[name="email"]')?.value || '').trim();
            const message = (form.querySelector('[name="message"]')?.value || '').trim();
            if (!name || !email || !message) {
                if (formStatus) formStatus.textContent = 'Please fill all fields.';
                return;
            }
            // forward to portfolio email
            const to = 'ubay.mostafa24@gmail.com';
            const subject = encodeURIComponent(`Website message from ${name}`);
            const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
            const mailto = `mailto:${to}?subject=${subject}&body=${body}`;
            // open default mail client
            window.location.href = mailto;
            if (formStatus) formStatus.textContent = 'Opening mail client...';
            setTimeout(() => { if (formStatus) formStatus.textContent = 'If your mail client did not open, please email: uban@example.com'; }, 2500);
        });
    }

    const closeBtn = document.getElementById('closeMenu');
    const backdrop = document.getElementById('menuBackdrop');

    function openMenu() {
        body.classList.add('menu-open');
        if (backdrop) backdrop.hidden = false;
        const side = document.getElementById('sideMenu');
        if (side) side.setAttribute('aria-hidden', 'false');
    }
    function closeMenu() {
        body.classList.remove('menu-open');
        if (backdrop) backdrop.hidden = true;
        const side = document.getElementById('sideMenu');
        if (side) side.setAttribute('aria-hidden', 'true');
    }

    if (menuBtn) {
        menuBtn.addEventListener('click', openMenu);
        menuBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMenu(); } });
    }
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (backdrop) {
        backdrop.addEventListener('click', closeMenu);
    }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

    // add image fallbacks so missing files don't leave empty/broken boxes
    function svgPlaceholderDataUrl(label = 'Image', w = 640, h = 360, bg = '#0b1220', fg = '#9ed79e') {
        const safe = String(label).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const svg =
            `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
                <rect width="100%" height="100%" fill="${bg}"/>
                <text x="50%" y="50%" fill="${fg}" font-family="Arial,Helvetica,sans-serif" font-size="${Math.max(14, Math.min(36, w/20))}" dominant-baseline="middle" text-anchor="middle">${safe}</text>
            </svg>`;
        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }

    function applyImageFallbacks() {
        const imgs = Array.from(document.querySelectorAll('.project-card img, .skill-card img, .coder, .logo img'));
        imgs.forEach(img => {
            // ensure it's an HTMLImageElement
            if (!(img instanceof HTMLImageElement)) return;
            // if already has a valid src, keep but attach onerror to swap if it fails to load
            img.addEventListener('error', function onErr() {
                img.removeEventListener('error', onErr);
                const label = img.getAttribute('alt') || img.dataset.title || 'Image';
                img.src = svgPlaceholderDataUrl(label);
                img.classList.add('img-placeholder');
            }, { once: true });
            // also handle case where src is empty or not set
            if (!img.src || img.src.trim() === '') {
                const label = img.getAttribute('alt') || img.dataset.title || 'Image';
                img.src = svgPlaceholderDataUrl(label);
                img.classList.add('img-placeholder');
            }
        });
        // ensure modal image has fallback too (when modal image src gets set later)
        const modalImg = document.querySelector('.modal-img');
        if (modalImg) {
            modalImg.addEventListener('error', function onErr() {
                modalImg.removeEventListener('error', onErr);
                const label = modalImg.getAttribute('alt') || 'Project image';
                modalImg.src = svgPlaceholderDataUrl(label, 520, 320);
            }, { once: true });
        }
    }

    // call after DOM is ready and after other cleanup
    applyImageFallbacks();

    // Contact slider: reveal email when slider reaches max
    (function contactSliderSetup() {
        const slider = document.getElementById('revealSlider');
        const reveal = document.getElementById('contactReveal');
        const resetBtn = document.getElementById('revealReset');
        if (!slider || !reveal) return;
        const max = Number(slider.max) || 100;
        const threshold = Math.round(max * 0.95); // reveal at 95%
        // update slider background fill
        function setFill(v) {
            const pct = Math.round((v / max) * 100);
            slider.style.background = `linear-gradient(90deg, rgba(34,197,94,0.95) ${pct}%, #2a2a2a ${pct}%)`;
        }
        function updateReveal() {
            const v = Number(slider.value);
            setFill(v);
            if (v >= threshold) {
                reveal.classList.add('visible');
                reveal.setAttribute('aria-hidden', 'false');
            } else {
                reveal.classList.remove('visible');
                reveal.setAttribute('aria-hidden', 'true');
            }
        }
        // initial fill
        setFill(Number(slider.value || 0));
        slider.addEventListener('input', (e) => {
            // visual thumb "pop"
            slider.classList.add('active');
            updateReveal();
        });
        slider.addEventListener('change', () => {
            slider.classList.remove('active');
            updateReveal();
        });
         if (resetBtn) resetBtn.addEventListener('click', () => {
             slider.value = slider.min || 0;
             setFill(Number(slider.value || 0));
             updateReveal();
             slider.focus();
         });
     })();
});

/* --- small modal image fix: prefer actual <img src> first --- */
(function patchModalImageSelection() {
    const originalOpenButtons = document.querySelectorAll('.view-project');
    // nothing to change if no modal on page
    const modal = document.getElementById('projectModal');
    const modalImg = modal && modal.querySelector('.modal-img');
    if (!modal || !modalImg) return;
    // intercept existing button behavior: delegate to same handlers but ensure src chosen from <img> first
    originalOpenButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.project-card');
            if (!card) return;
            const title = card.dataset.title || card.querySelector('h3')?.textContent || '';
            const desc = card.dataset.desc || card.querySelector('p')?.textContent || '';
            // prefer the rendered img src (so modal shows the same image that's visible in the card)
            const img = card.querySelector('img')?.getAttribute('src') || card.dataset.img || '';
            if (modalImg) {
                modalImg.alt = title;
                modalImg.src = img;
                // ensure fallback if image path is broken (uses svgPlaceholderDataUrl if available)
                modalImg.addEventListener('error', function onErr() {
                    modalImg.removeEventListener('error', onErr);
                    try {
                        if (typeof svgPlaceholderDataUrl === 'function') {
                            modalImg.src = svgPlaceholderDataUrl(title, 520, 320);
                        }
                    } catch (e) { /* ignore */ }
                }, { once: true });
            }
            if (modalTitle) modalTitle.textContent = title;
            if (modalDesc) modalDesc.textContent = desc;
            modal.hidden = false;
            modal.removeAttribute('aria-hidden');
            document.body.style.overflow = 'hidden';
        });
    });
})();