/**
 * Doce Amor Gi - Cardápio Digital
 * Script principal - animações e funcionalidades
 */

document.addEventListener('DOMContentLoaded', function() {
    // Carrossel da hero section
    initHeroCarousel();
    
    // Menu mobile toggle
    initMobileMenu();
    
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
 * Menu mobile - toggle e overlay
 * Dropdown: hover no desktop, clique no mobile
 */
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const dropdownTrigger = document.querySelector('.nav-dropdown-trigger');
    const navDropdown = document.querySelector('.nav-dropdown');

    if (!navToggle || !navMenu) return;

    function closeMenu() {
        navToggle.classList.remove('ativo');
        navMenu.classList.remove('ativo');
        document.body.style.overflow = '';
        if (navDropdown) navDropdown.classList.remove('expanded');
        const overlay = document.querySelector('.nav-overlay');
        if (overlay) overlay.remove();
    }

    navToggle.addEventListener('click', function() {
        const isOpening = !navMenu.classList.contains('ativo');
        navToggle.classList.toggle('ativo');
        navMenu.classList.toggle('ativo');
        document.body.style.overflow = navMenu.classList.contains('ativo') ? 'hidden' : '';
        if (navDropdown) navDropdown.classList.remove('expanded');

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
    const modalIngredientes = modal.querySelector('.modal-produto-ingredientes');
    const ingredientesWrap = modal.querySelector('.modal-produto-ingredientes-wrap');
    const modalPreco = modal.querySelector('.modal-produto-preco');
    const modalPrecoWrap = modal.querySelector('.modal-produto-preco-wrap');
    const modalWhatsapp = modal.querySelector('.modal-produto-whatsapp');
    const btnClose = modal.querySelector('.modal-close');

    function getImagemFromCard(card) {
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
        const descricao = card.dataset.produtoDescricao || card.querySelector('.produto-content p, .produto-content-home p')?.textContent || '';
        const ingredientesStr = card.dataset.produtoIngredientes || '';
        const pedido = card.dataset.produtoPedido || card.querySelector('.produto-preco')?.textContent || '';
        const whatsapp = card.dataset.produtoWhatsapp || card.querySelector('a[href*="wa.me"]')?.getAttribute('href') || 'https://wa.me/5547999999999';

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

        if (modalIngredientes) {
            modalIngredientes.innerHTML = '';
            if (ingredientesStr) {
                const itens = ingredientesStr.split(/[,|]/).map(s => s.trim()).filter(Boolean);
                itens.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    modalIngredientes.appendChild(li);
                });
            }
            ingredientesWrap.classList.toggle('no-ingredientes', !ingredientesStr.trim());
        }

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
