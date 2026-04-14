/**
 * Doce Amor Gi - Cardápio Digital
 * Script principal - animações e funcionalidades
 */

document.addEventListener('DOMContentLoaded', function() {
    /* Depois do carrinho injetar Qtd.: descrição + preço único R$ X,XX (detalhes no modal via data-produto-pedido) */
    initPadraoInfoCardsProduto();

    // Carrossel da hero section
    initHeroCarousel();

    // Carrossel de fotos em cards de produto (fade, 3s, pausa no hover)
    initProdutoThumbCarousels();
    
    // Menu mobile toggle
    initMobileMenu();

    // Instagram no header (todas as páginas)
    initInstagramHeaderLink();
    
    // Scroll suave para links âncora
    initSmoothScroll();
    
    // Animações ao scroll
    initScrollAnimations();
    
    // Header com efeito no scroll
    initHeaderScroll();
    
    // Modal "Saiba mais" do produto
    initProdutoModal();

    // Botão Voltar ao Topo
    initScrollToTop();
});

/**
 * Formata valor numérico para exibição em card (ex.: R$ 10,00)
 * @param {number} valorNum
 * @returns {string}
 */
function formatarPrecoCardBR(valorNum) {
    if (!Number.isFinite(valorNum)) return '';
    return 'R$ ' + valorNum.toFixed(2).replace('.', ',');
}

/**
 * Padroniza informações visíveis nos cards: texto curto (data-produto-descricao)
 * e apenas preço base em R$ X,XX; valores completos ficam em data-produto-pedido (modal).
 */
function initPadraoInfoCardsProduto() {
    document.querySelectorAll('article.produto-card[data-produto-nome], article.produto-card-home[data-produto-nome]').forEach(card => {
        const wrap = card.querySelector('.produto-content, .produto-content-home');
        if (!wrap) return;
        const h3 = wrap.querySelector('h3');
        if (!h3) return;

        const descDataset = (card.dataset.produtoDescricao || '').trim();
        if (!wrap.querySelector('.produto-card-linha') && descDataset && !card.hasAttribute('data-produto-descricao-so-modal')) {
            const linha = document.createElement('p');
            linha.className = 'produto-card-linha';
            linha.textContent = descDataset;
            const precoExistente = wrap.querySelector('.produto-preco:not(.produto-preco--lista)');
            if (precoExistente) precoExistente.insertAdjacentElement('beforebegin', linha);
            else h3.insertAdjacentElement('afterend', linha);
        }

        const pedidoFull = (card.dataset.produtoPedido || '').trim();
        const rawPreco = String(card.dataset.produtoPreco || '').replace(',', '.');
        const n = parseFloat(rawPreco, 10);
        const sobConsulta = /sob\s+consulta/i.test(pedidoFull);

        let textoPreco = '';
        if (sobConsulta && (!Number.isFinite(n) || n <= 0)) {
            textoPreco = 'Sob consulta';
        } else if (Number.isFinite(n) && n > 0) {
            textoPreco = formatarPrecoCardBR(n);
        } else if (pedidoFull) {
            textoPreco = 'Consulte valores';
        } else {
            textoPreco = 'Consulte valores';
        }

        const anchor = wrap.querySelector('.produto-qty-row') || wrap.querySelector('.produto-buttons');
        let elPreco = wrap.querySelector('.produto-preco:not(.produto-preco--lista)');

        if (!elPreco && anchor) {
            elPreco = document.createElement('p');
            elPreco.className = 'produto-preco';
            anchor.insertAdjacentElement('beforebegin', elPreco);
        }

        if (elPreco) {
            elPreco.textContent = textoPreco;
            if (elPreco.tagName === 'SPAN') {
                const p = document.createElement('p');
                p.className = 'produto-preco';
                p.textContent = textoPreco;
                elPreco.replaceWith(p);
            }
        }
    });
}

/**
 * Carrossel da Hero Section
 * Troca automática com fade a cada 3s, pausa no hover
 * Imagens pré-carregadas para evitar delay na troca de slides
 */
function initHeroCarousel() {
    const hero = document.querySelector('.hero-carousel');
    if (!hero) return;

    const slides = hero.querySelectorAll('.hero-slide');

    /* Pré-carregar imagens do carrossel */
    slides.forEach((slide) => {
        const bg = slide.querySelector('.hero-slide-bg');
        if (!bg) return;
        const style = bg.getAttribute('style') || '';
        const match = style.match(/url\(['"]?([^'")]+)['"]?\)/);
        if (match) {
            const img = new Image();
            img.src = match[1].trim();
        }
    });
    let currentIndex = 0;
    let autoPlayInterval;
    const INTERVAL_MS = 3000; // 3 segundos

    function updateSlideClasses() {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === currentIndex);
        });
    }

    function goToSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        currentIndex = index;
        updateSlideClasses();
    }

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function startAutoPlay() {
        stopAutoPlay();
        autoPlayInterval = setInterval(nextSlide, INTERVAL_MS);
    }

    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }

    hero.addEventListener('mouseenter', stopAutoPlay);
    hero.addEventListener('mouseleave', startAutoPlay);

    updateSlideClasses();
    startAutoPlay();
}

/**
 * Carrossel na área da foto de cards (ex.: lembrancinha Bem casado)
 * Transição em fade; troca a cada 3s por padrão; pausa no hover
 */
function initProdutoThumbCarousels() {
    document.querySelectorAll('.produto-thumb-carousel').forEach(wrap => {
        const slides = wrap.querySelectorAll('.produto-thumb-carousel-slide');
        if (slides.length < 2) return;

        const raw = wrap.getAttribute('data-autoplay-ms');
        const INTERVAL_MS = Math.max(1500, parseInt(raw || '3000', 10) || 3000);

        slides.forEach((slide) => {
            const src = slide.getAttribute('src');
            if (src) {
                const pre = new Image();
                pre.src = src;
            }
        });

        let currentIndex = 0;
        let timer = null;

        function applyActive() {
            slides.forEach((slide, i) => {
                slide.classList.toggle('is-active', i === currentIndex);
            });
        }

        function nextSlide() {
            currentIndex = (currentIndex + 1) % slides.length;
            applyActive();
        }

        function start() {
            stop();
            timer = setInterval(nextSlide, INTERVAL_MS);
        }

        function stop() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }

        wrap.addEventListener('mouseenter', stop);
        wrap.addEventListener('mouseleave', start);

        applyActive();
        start();
    });
}

/** URL do Instagram (fallback se config.js não carregar) */
function getInstagramUrl() {
    return typeof CONFIG !== 'undefined' && CONFIG.instagramUrl
        ? CONFIG.instagramUrl
        : 'https://www.instagram.com/doceamorgi/';
}

var INSTAGRAM_SVG_ICON =
    '<svg class="instagram-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>';

/**
 * Link estratégico Instagram no header (antes do menu hambúrguer)
 */
function initInstagramHeaderLink() {
    const nav = document.querySelector('.nav');
    const toggle = document.querySelector('.nav-toggle');
    if (!nav || !toggle || nav.querySelector('.nav-instagram')) return;

    const a = document.createElement('a');
    a.className = 'nav-instagram';
    a.href = getInstagramUrl();
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', 'Instagram Doce Amor Gi — perfil @doceamorgi');
    a.innerHTML = INSTAGRAM_SVG_ICON + '<span class="nav-instagram-handle">@doceamorgi</span>';
    toggle.before(a);
}

/**
 * Menu mobile - toggle e overlay
 * Dropdown: hover no desktop, clique no mobile
 */
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const dropdownTrigger = document.querySelector('.nav-dropdown-trigger');
    const navDropdown = document.querySelector('.nav-dropdown');

    if (!navToggle || !navMenu) return;

    /* Cabeçalho do drawer mobile: marca + fechar (CSS oculta no desktop) */
    if (!navMenu.querySelector('.nav-drawer-brand')) {
        const igUrl = getInstagramUrl();
        const brand = document.createElement('div');
        brand.className = 'nav-drawer-brand';
        brand.innerHTML =
            '<div class="nav-drawer-brand-text">' +
            '<span class="nav-drawer-brand-title">Doce Amor Gi</span>' +
            '<span class="nav-drawer-brand-tagline">Doces finos · Sob encomenda</span>' +
            '<a class="nav-drawer-instagram" href="' +
            igUrl +
            '" target="_blank" rel="noopener noreferrer" aria-label="Abrir Instagram @doceamorgi">' +
            INSTAGRAM_SVG_ICON +
            '</a>' +
            '</div>';
        navMenu.insertBefore(brand, navMenu.firstChild);
    }

    function closeMenu() {
        navToggle.classList.remove('ativo');
        navMenu.classList.remove('ativo');
        document.body.style.overflow = '';
        if (navDropdown) navDropdown.classList.remove('expanded');
        if (dropdownTrigger) dropdownTrigger.setAttribute('aria-expanded', 'false');
        const overlay = document.querySelector('.nav-overlay');
        if (overlay) overlay.remove();
    }

    navToggle.addEventListener('click', function() {
        const isOpening = !navMenu.classList.contains('ativo');
        navToggle.classList.toggle('ativo');
        navMenu.classList.toggle('ativo');
        document.body.style.overflow = navMenu.classList.contains('ativo') ? 'hidden' : '';
        if (navDropdown) navDropdown.classList.remove('expanded');
        if (dropdownTrigger) dropdownTrigger.setAttribute('aria-expanded', 'false');

        if (isOpening && window.innerWidth <= 992) {
            const overlay = document.createElement('div');
            overlay.className = 'nav-overlay';
            overlay.setAttribute('aria-hidden', 'true');
            document.body.appendChild(overlay);
            overlay.addEventListener('click', closeMenu);
        } else {
            const overlay = document.querySelector('.nav-overlay');
            if (overlay) overlay.remove();
        }
    });

    // Fechar ao clicar em um link (inclui links do dropdown).
    // setTimeout(0): evita que iOS/WebView cancele a navegação ao alterar DOM/overlay no mesmo tick do clique.
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
            setTimeout(closeMenu, 0);
        });
    });

    // Dropdown: clique para expandir no mobile
    if (dropdownTrigger && navDropdown) {
        dropdownTrigger.addEventListener('click', function(e) {
            if (window.innerWidth <= 992) {
                e.preventDefault();
                e.stopPropagation();
                navDropdown.classList.toggle('expanded');
                dropdownTrigger.setAttribute(
                    'aria-expanded',
                    navDropdown.classList.contains('expanded') ? 'true' : 'false'
                );
            }
        });
    }
}

/**
 * Scroll suave para âncoras
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Animações de entrada ao scroll
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
        '.categoria-card, .galeria-item, .avaliacao-card, .produto-card, .produto-card-home, .showcase-doces-card, .section-story-block, .sobre-mim-conteudo, .sobre-mim-galeria, .info-encomendas-intro, .info-encomendas-card'
    );

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 80);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    const style = document.createElement('style');
    style.textContent = `
        .categoria-card.visible,
        .galeria-item.visible,
        .avaliacao-card.visible,
        .produto-card.visible,
        .produto-card-home.visible,
        .showcase-doces-card.visible,
        .section-story-block.visible,
        .sobre-mim-conteudo.visible,
        .sobre-mim-galeria.visible,
        .info-encomendas-intro.visible,
        .info-encomendas-card.visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    animatedElements.forEach(el => observer.observe(el));
}

/**
 * Modal Produto - Saiba mais
 * Abre modal com dados do produto via data attributes
 */
function initProdutoModal() {
    const modal = document.getElementById('produtoModal');
    if (!modal) return;

    const modalFoto = modal.querySelector('.modal-produto-foto');
    const modalNome = modal.querySelector('.modal-produto-nome');
    const modalDescricao = modal.querySelector('.modal-produto-descricao');
    const modalPreco = modal.querySelector('.modal-produto-preco');
    const modalPrecoWrap = modal.querySelector('.modal-produto-preco-wrap');
    const modalWhatsapp = modal.querySelector('.modal-produto-whatsapp');
    const btnClose = modal.querySelector('.modal-close');

    function getImagemFromCard(card) {
        const carousel = card.querySelector('.produto-thumb-carousel');
        if (carousel) {
            const active = carousel.querySelector('.produto-thumb-carousel-slide.is-active');
            if (active && active.getAttribute('src')) return active.getAttribute('src').trim();
            const first = carousel.querySelector('.produto-thumb-carousel-slide');
            if (first && first.getAttribute('src')) return first.getAttribute('src').trim();
        }
        if (card.dataset.produtoImagem) return String(card.dataset.produtoImagem).trim();
        const thumb = card.querySelector('.produto-thumb-img');
        if (thumb && thumb.getAttribute('src')) return thumb.getAttribute('src').trim();
        const imgDiv = card.querySelector('.produto-img, .produto-img-home');
        if (!imgDiv) return '';
        const style = imgDiv.getAttribute('style') || '';
        const match = style.match(/url\(['"]?([^'")]+)['"]?\)/);
        return match ? match[1].trim() : '';
    }

    function openModal(card) {
        const imagem = getImagemFromCard(card);
        const nome = card.dataset.produtoNome || (card.querySelector('h3')?.textContent || '');
        const descricao = (card.dataset.produtoDescricao || '').trim()
            || card.querySelector('.produto-card-linha')?.textContent?.trim()
            || '';
        const pedido = card.dataset.produtoPedido || card.querySelector('.produto-preco')?.textContent || '';
        const whatsapp = card.dataset.produtoWhatsapp || card.querySelector('a[href*="wa.me"]')?.getAttribute('href') || 'https://wa.me/5515996451801';

        if (modalFoto) {
            modalFoto.src = imagem || '';
            modalFoto.alt = nome ? String(nome) : '';
        }
        modalNome.textContent = nome || 'Produto';
        modalDescricao.textContent = descricao;
        modalDescricao.style.display = descricao ? '' : 'none';
        if (modalPreco) modalPreco.textContent = pedido || '';
        if (modalPrecoWrap) modalPrecoWrap.style.display = pedido ? '' : 'none';
        modalWhatsapp.href = whatsapp;

        modal.classList.add('ativo');
        document.body.style.overflow = 'hidden';
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        modal.classList.remove('ativo');
        document.body.style.overflow = '';
        modal.setAttribute('aria-hidden', 'true');
        if (modalFoto) {
            modalFoto.src = '';
            modalFoto.alt = '';
        }
    }

    document.querySelectorAll('.btn-saiba-mais').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.produto-card, .produto-card-home');
            if (card) openModal(card);
        });
    });

    if (btnClose) btnClose.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('ativo')) closeModal();
    });
}

/**
 * Header - mudança de estilo no scroll
 */
function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.style.boxShadow = '0 4px 25px rgba(92, 64, 51, 0.15)';
        } else {
            header.style.boxShadow = '0 2px 20px rgba(92, 64, 51, 0.1)';
        }

        lastScroll = currentScroll;
    });
}

/**
 * Botão Voltar ao Topo
 * Exibe quando o usuário rola a página e permite voltar suavemente ao topo
 */
function initScrollToTop() {
    const btn = document.querySelector('.scroll-to-top');
    if (!btn) return;

    const SHOW_THRESHOLD = 300; // px roladados para exibir o botão

    function toggleVisibility() {
        if (window.pageYOffset > SHOW_THRESHOLD) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }

    function scrollToTop(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    btn.addEventListener('click', scrollToTop);

    // Estado inicial
    toggleVisibility();
}
