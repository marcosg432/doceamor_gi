/**
 * carrinho.js - Lógica do carrinho de compras
 * Sistema de pedidos reutilizável para cardápios digitais
 */

/** @typedef {{ nome: string, preco: number, quantidade: number, qtdMinima?: number }} ItemCarrinho */

/** @type {ItemCarrinho[]} */
let carrinho = [];

const QTD_MAX_PRODUTO = 999;
const QTD_MAX_CARRINHO_ITEM = 999;

/**
 * Chave alinhada ao servidor: nome|preco normalizado
 * @param {string} nome
 * @param {number|string} preco
 * @returns {string}
 */
function chaveCatalogoCliente(nome, preco) {
    const n = typeof preco === 'number' ? preco : parseFloat(String(preco).replace(',', '.'));
    return `${String(nome).trim()}|${Number.isFinite(n) ? String(n) : '0'}`;
}

/**
 * @param {Element|null} card
 * @returns {number}
 */
function lerQtdMinimaDoCard(card) {
    if (!card) return 1;
    const raw =
        card.dataset.produtoQtdMinima || card.getAttribute('data-produto-qtd-minima') || '';
    const n = parseInt(String(raw).trim(), 10);
    if (!Number.isFinite(n) || n < 1) return 1;
    return n;
}

/**
 * @param {unknown} val
 * @param {number} min
 * @returns {number}
 */
function sanitizarQuantidadeProduto(val, min) {
    const m = Math.max(1, min | 0);
    const n = parseInt(String(val).trim(), 10);
    if (!Number.isFinite(n)) return m;
    return Math.min(Math.max(n, m), QTD_MAX_PRODUTO);
}

/**
 * @param {unknown} val
 * @param {number} min
 * @returns {number}
 */
function sanitizarQuantidadeCarrinho(val, min) {
    const m = Math.max(1, min | 0);
    const n = parseInt(String(val).trim(), 10);
    if (!Number.isFinite(n)) return m;
    return Math.min(Math.max(n, m), QTD_MAX_CARRINHO_ITEM);
}

function filtrarDigitosCarrinhoQty(input) {
    const apenasDigitos = input.value.replace(/\D/g, '');
    if (apenasDigitos !== input.value) input.value = apenasDigitos;
}

/**
 * @param {Element|null} card
 * @returns {number}
 */
function lerQuantidadeBrutaDoCard(card) {
    const input = card?.querySelector('.produto-qty-input');
    const n = parseInt(String(input?.value ?? '').trim(), 10);
    return Number.isFinite(n) ? n : NaN;
}

/**
 * @param {number} min
 */
function mensagemPedidoMinimo(min) {
    if (min <= 1) return 'Este produto permite 1 unidade.';
    return `O pedido mínimo deste produto é ${min} unidades. Ajuste a quantidade e tente novamente.`;
}

/**
 * @param {Element|null} card
 */
function resetarQuantidadeCard(card) {
    const min = lerQtdMinimaDoCard(card);
    const input = card?.querySelector('.produto-qty-input');
    if (input) input.value = String(min);
}

/**
 * @param {number} min
 * @param {string} labelText
 * @returns {HTMLDivElement}
 */
function criarLinhaQuantidadeProduto(min, labelText) {
    const row = document.createElement('div');
    row.className = 'produto-qty-row';
    const minSeguro = Math.max(1, min | 0);
    row.dataset.qtdMinima = String(minSeguro);
    const lbl =
        labelText != null && String(labelText).trim() !== '' ? String(labelText).trim() : 'Qtd.';
    const hintUnid = minSeguro === 1 ? '1 unidade' : minSeguro + ' unidades';
    row.innerHTML = `
        <p class="produto-qty-min-hint">Pedido mínimo: <strong>${hintUnid}</strong></p>
        <label class="produto-qty-label">
            <span class="produto-qty-label-text"></span>
            <input type="text" class="produto-qty-input" inputmode="numeric" pattern="[0-9]*" autocomplete="off" spellcheck="false" aria-label="Quantidade deste item" value="${minSeguro}" />
        </label>
    `;
    row.querySelector('.produto-qty-label-text').textContent = lbl;
    return row;
}

function filtrarDigitosQuantidade(input) {
    const apenasDigitos = input.value.replace(/\D/g, '');
    if (apenasDigitos !== input.value) {
        input.value = apenasDigitos;
    }
}

/**
 * @param {HTMLDivElement} row
 * @param {number} min
 */
function vincularInputQuantidadeProduto(row, min) {
    const input = row.querySelector('.produto-qty-input');
    const m = Math.max(1, min | 0);
    if (!input) return;

    function corrigirValor() {
        const v = input.value.trim();
        if (v === '' || !/\d/.test(v)) {
            input.value = String(m);
            return;
        }
        const n = parseInt(v, 10);
        if (!Number.isFinite(n) || n < m) {
            input.value = String(m);
            return;
        }
        input.value = String(sanitizarQuantidadeProduto(v, m));
    }

    input.addEventListener('input', () => filtrarDigitosQuantidade(input));
    input.addEventListener('change', corrigirValor);
    input.addEventListener('blur', corrigirValor);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
        }
    });
}

function injectControlesQuantidadeProdutos() {
    document.querySelectorAll('.produto-content, .produto-content-home').forEach(content => {
        const btnRow = content.querySelector('.produto-buttons');
        if (!btnRow || !btnRow.querySelector('.btn-adicionar-carrinho')) return;
        if (content.querySelector('.produto-qty-row')) return;

        const card = content.closest('.produto-card, .produto-card-home');
        const labelFromCard = card && card.dataset.produtoQtyLabel ? card.dataset.produtoQtyLabel : '';
        const min = lerQtdMinimaDoCard(card);
        const row = criarLinhaQuantidadeProduto(min, labelFromCard);
        vincularInputQuantidadeProduto(row, min);
        btnRow.before(row);
    });
}

/**
 * @param {string} nome
 * @param {number} preco
 * @param {number} quantidade
 * @param {number} qtdMinima
 * @returns {boolean}
 */
function adicionarCarrinho(nome, preco, quantidade, qtdMinima) {
    const min = Math.max(1, parseInt(String(qtdMinima), 10) || 1);
    const qtd = parseInt(String(quantidade), 10);
    if (!Number.isFinite(qtd) || qtd < min) {
        alert(mensagemPedidoMinimo(min));
        return false;
    }

    const precoNum = typeof preco === 'number' ? preco : parseFloat(String(preco).replace(',', '.')) || 0;
    const itemExistente = carrinho.find(item => item.nome === nome && item.preco === precoNum);

    if (itemExistente) {
        const exMin =
            itemExistente.qtdMinima != null
                ? Math.max(1, parseInt(String(itemExistente.qtdMinima), 10) || 1)
                : min;
        itemExistente.qtdMinima = Math.max(exMin, min);
        itemExistente.quantidade += qtd;
        if (itemExistente.quantidade < itemExistente.qtdMinima) {
            itemExistente.quantidade = itemExistente.qtdMinima;
        }
    } else {
        carrinho.push({ nome, preco: precoNum, quantidade: qtd, qtdMinima: min });
    }

    salvarCarrinho(carrinho);
    atualizarCarrinho();
    atualizarBadge();
    abrirCarrinho();
    return true;
}

function removerItem(index) {
    carrinho.splice(index, 1);
    salvarCarrinho(carrinho);
    atualizarCarrinho();
    atualizarBadge();
}

/**
 * @param {HTMLInputElement} input
 */
function commitQuantidadeCarrinhoInput(input) {
    const index = parseInt(input.getAttribute('data-carrinho-index') || '', 10);
    const item = carrinho[index];
    if (!item || !Number.isFinite(index)) return;

    const min =
        item.qtdMinima != null ? Math.max(1, parseInt(String(item.qtdMinima), 10) || 1) : 1;

    const v = input.value.trim();
    if (v === '' || !/\d/.test(v)) {
        item.quantidade = min;
    } else {
        item.quantidade = sanitizarQuantidadeCarrinho(v, min);
    }

    input.value = String(item.quantidade);

    if (item.quantidade < min) {
        item.quantidade = min;
        input.value = String(min);
    }

    salvarCarrinho(carrinho);
    atualizarCarrinho();
    atualizarBadge();
}

function atualizarCarrinho() {
    const listaEl = document.getElementById('lista-carrinho');
    const totalEl = document.getElementById('total');
    const btnFinalizar = document.querySelector('.btn-finalizar-pedido');

    if (!listaEl) return;

    listaEl.innerHTML = '';

    if (carrinho.length === 0) {
        if (totalEl) totalEl.textContent = 'R$ 0,00';
        if (btnFinalizar) btnFinalizar.disabled = true;
        return;
    }

    carrinho.forEach((item, index) => {
        const subtotal = item.preco * item.quantidade;
        const li = document.createElement('li');
        li.className = 'carrinho-item';
        const qtyAria = escapeHtml(item.nome);
        const min =
            item.qtdMinima != null ? Math.max(1, parseInt(String(item.qtdMinima), 10) || 1) : 1;
        const minHint =
            min > 1
                ? `<div class="carrinho-item-min">Pedido mínimo: ${min} unidades</div>`
                : '';

        li.innerHTML = `
            <div class="carrinho-item-info">
                <div class="carrinho-item-nome">${escapeHtml(item.nome)}</div>
                ${minHint}
                <div class="carrinho-item-preco-unit">R$ ${formatarPreco(item.preco)} un.</div>
            </div>
            <div class="carrinho-item-controles">
                <div class="carrinho-item-qty">
                    <span class="carrinho-item-qty-hint">Qtd.</span>
                    <input type="text" class="carrinho-item-qty-input" data-carrinho-index="${index}"
                        inputmode="numeric" pattern="[0-9]*" autocomplete="off" spellcheck="false"
                        data-qtd-minima="${min}"
                        value="${item.quantidade}" aria-label="Quantidade: ${qtyAria}" />
                </div>
                <button type="button" class="carrinho-item-remove" onclick="removerItem(${index})">Remover</button>
            </div>
            <span class="carrinho-item-subtotal">R$ ${formatarPreco(subtotal)}</span>
        `;
        listaEl.appendChild(li);

        const qtyInput = li.querySelector('.carrinho-item-qty-input');
        if (qtyInput) {
            qtyInput.addEventListener('input', () => filtrarDigitosCarrinhoQty(qtyInput));
            qtyInput.addEventListener('blur', () => commitQuantidadeCarrinhoInput(qtyInput));
            qtyInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    qtyInput.blur();
                }
            });
        }
    });

    const total = calcularTotal();
    if (totalEl) totalEl.textContent = 'R$ ' + formatarPreco(total);
    if (btnFinalizar) btnFinalizar.disabled = false;
}

function calcularTotal() {
    return carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
}

function formatarPreco(valor) {
    return Number(valor).toFixed(2).replace('.', ',');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function atualizarBadge() {
    const badge = document.querySelector('.carrinho-badge');
    if (!badge) return;

    const qty = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    badge.textContent = qty;
    badge.style.display = qty > 0 ? 'flex' : 'none';
}

function abrirCarrinho() {
    document.querySelector('.carrinho-overlay')?.classList.add('ativo');
    document.querySelector('.carrinho-sidebar')?.classList.add('ativo');
    document.body.style.overflow = 'hidden';
}

function fecharCarrinho() {
    document.querySelector('.carrinho-overlay')?.classList.remove('ativo');
    document.querySelector('.carrinho-sidebar')?.classList.remove('ativo');
    document.body.style.overflow = '';
}

function extrairPreco(texto) {
    if (!texto) return 0;
    const match = texto.match(/R\$\s*([\d.,]+)/);
    if (!match) return 0;
    return parseFloat(match[1].replace('.', '').replace(',', '.')) || 0;
}

/**
 * Sincroniza qtdMinima com o catálogo do servidor (HTML) e corrige quantidades antigas.
 */
async function enriquecerCarrinhoComMinimos() {
    try {
        const r = await fetch('/api/catalogo-qtd-minima');
        if (!r.ok) return;
        const map = await r.json();
        if (!map || typeof map !== 'object') return;

        let changed = false;
        carrinho.forEach(item => {
            const k = chaveCatalogoCliente(item.nome, item.preco);
            const minSrv = map[k];
            if (minSrv == null) return;
            const m = Math.max(1, parseInt(String(minSrv), 10) || 1);
            if (item.qtdMinima !== m) {
                item.qtdMinima = m;
                changed = true;
            }
            if (item.quantidade < m) {
                item.quantidade = m;
                changed = true;
            }
        });
        if (changed) {
            salvarCarrinho(carrinho);
            atualizarCarrinho();
            atualizarBadge();
        }
    } catch (_) {
        /* hospedagem estática / offline */
    }
}

function initCarrinho() {
    carrinho = carregarCarrinho();

    injectControlesQuantidadeProdutos();

    document.querySelector('.carrinho-toggle')?.addEventListener('click', abrirCarrinho);
    document.querySelector('.carrinho-close')?.addEventListener('click', fecharCarrinho);
    document.querySelector('.carrinho-overlay')?.addEventListener('click', fecharCarrinho);

    document.querySelectorAll('.btn-adicionar-carrinho').forEach(btn => {
        btn.addEventListener('click', function () {
            const card = this.closest('[data-produto-nome]');
            if (!card) return;
            const nome = card.dataset.produtoNome || card.getAttribute('data-produto-nome');
            const preco = parseFloat(card.dataset.produtoPreco || card.getAttribute('data-produto-preco')) ||
                extrairPreco(card.querySelector('.produto-preco')?.textContent || '');
            const min = lerQtdMinimaDoCard(card);
            const qtdBruta = lerQuantidadeBrutaDoCard(card);
            if (!Number.isFinite(qtdBruta) || qtdBruta < min) {
                alert(mensagemPedidoMinimo(min));
                return;
            }
            if (adicionarCarrinho(nome, preco, qtdBruta, min)) {
                resetarQuantidadeCard(card);
            }
        });
    });

    atualizarCarrinho();
    atualizarBadge();

    enriquecerCarrinhoComMinimos().finally(() => {
        atualizarCarrinho();
        atualizarBadge();
    });
}

document.addEventListener('DOMContentLoaded', initCarrinho);
