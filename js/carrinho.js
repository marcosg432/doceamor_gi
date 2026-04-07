/**
 * carrinho.js - Lógica do carrinho de compras
 * Sistema de pedidos reutilizável para cardápios digitais
 */

/** Array do carrinho: { nome, preco, quantidade } */
let carrinho = [];

const QTD_MIN_PRODUTO = 1;
const QTD_MAX_PRODUTO = 99;
/** Limite por linha no painel do carrinho (pode ser maior que no cardápio) */
const QTD_MAX_CARRINHO_ITEM = 999;

/**
 * Normaliza quantidade escolhida no cardápio (inteiro entre mínimo e máximo)
 * @param {unknown} val
 * @returns {number}
 */
function sanitizarQuantidadeProduto(val) {
    const n = parseInt(String(val).trim(), 10);
    if (!Number.isFinite(n) || n < QTD_MIN_PRODUTO) return QTD_MIN_PRODUTO;
    return Math.min(n, QTD_MAX_PRODUTO);
}

/**
 * Normaliza quantidade editada dentro do carrinho
 * @param {unknown} val
 * @returns {number}
 */
function sanitizarQuantidadeCarrinho(val) {
    const n = parseInt(String(val).trim(), 10);
    if (!Number.isFinite(n) || n < QTD_MIN_PRODUTO) return QTD_MIN_PRODUTO;
    return Math.min(n, QTD_MAX_CARRINHO_ITEM);
}

/**
 * Mantém apenas dígitos no campo de quantidade do carrinho
 * @param {HTMLInputElement} input
 */
function filtrarDigitosCarrinhoQty(input) {
    const apenasDigitos = input.value.replace(/\D/g, '');
    if (apenasDigitos !== input.value) input.value = apenasDigitos;
}

/**
 * Lê a quantidade do seletor do card do produto
 * @param {Element} card
 * @returns {number}
 */
function lerQuantidadeDoCard(card) {
    if (!card) return QTD_MIN_PRODUTO;
    const input = card.querySelector('.produto-qty-input');
    return sanitizarQuantidadeProduto(input?.value ?? QTD_MIN_PRODUTO);
}

/**
 * Reseta o seletor do card para 1 após adicionar ao carrinho
 * @param {Element} card
 */
function resetarQuantidadeCard(card) {
    const input = card?.querySelector('.produto-qty-input');
    if (input) input.value = String(QTD_MIN_PRODUTO);
}

/**
 * Monta o bloco de quantidade (campo numérico) antes dos botões do produto
 * @returns {HTMLDivElement}
 */
function criarLinhaQuantidadeProduto(labelText) {
    const row = document.createElement('div');
    row.className = 'produto-qty-row';
    const lbl =
        labelText != null && String(labelText).trim() !== '' ? String(labelText).trim() : 'Qtd.';
    row.innerHTML = `
        <label class="produto-qty-label">
            <span class="produto-qty-label-text"></span>
            <input type="text" class="produto-qty-input" inputmode="numeric" pattern="[0-9]*" autocomplete="off" spellcheck="false" aria-label="Quantidade deste item" value="${QTD_MIN_PRODUTO}" />
        </label>
    `;
    row.querySelector('.produto-qty-label-text').textContent = lbl;
    return row;
}

/**
 * Mantém apenas dígitos no campo enquanto o usuário digita
 * @param {HTMLInputElement} input
 */
function filtrarDigitosQuantidade(input) {
    const apenasDigitos = input.value.replace(/\D/g, '');
    if (apenasDigitos !== input.value) {
        input.value = apenasDigitos;
    }
}

/**
 * Liga validação ao campo de quantidade de um produto
 * @param {HTMLDivElement} row
 */
function vincularInputQuantidadeProduto(row) {
    const input = row.querySelector('.produto-qty-input');
    if (!input) return;

    function corrigirValor() {
        const v = input.value.trim();
        if (v === '' || !/\d/.test(v)) {
            input.value = String(QTD_MIN_PRODUTO);
            return;
        }
        input.value = String(sanitizarQuantidadeProduto(v));
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

/**
 * Insere controles de quantidade em todos os cards do cardápio que ainda não os têm
 */
function injectControlesQuantidadeProdutos() {
    document.querySelectorAll('.produto-content, .produto-content-home').forEach(content => {
        const btnRow = content.querySelector('.produto-buttons');
        if (!btnRow || !btnRow.querySelector('.btn-adicionar-carrinho')) return;
        if (content.querySelector('.produto-qty-row')) return;

        const card = content.closest('.produto-card, .produto-card-home');
        const labelFromCard = card && card.dataset.produtoQtyLabel ? card.dataset.produtoQtyLabel : '';
        const row = criarLinhaQuantidadeProduto(labelFromCard);
        vincularInputQuantidadeProduto(row);
        btnRow.before(row);
    });
}

/**
 * Adiciona produto ao carrinho ou soma a quantidade se já existir
 * @param {string} nome - Nome do produto
 * @param {number} preco - Preço unitário
 * @param {number} [quantidade=1] - Quantidade a adicionar (mínimo 1)
 */
function adicionarCarrinho(nome, preco, quantidade) {
    const qtd = sanitizarQuantidadeProduto(quantidade == null ? QTD_MIN_PRODUTO : quantidade);
    const precoNum = typeof preco === 'number' ? preco : parseFloat(String(preco).replace(',', '.')) || 0;
    const itemExistente = carrinho.find(item => item.nome === nome && item.preco === precoNum);

    if (itemExistente) {
        itemExistente.quantidade += qtd;
    } else {
        carrinho.push({ nome, preco: precoNum, quantidade: qtd });
    }

    salvarCarrinho(carrinho);
    atualizarCarrinho();
    atualizarBadge();
    abrirCarrinho();
}

/**
 * Remove item do carrinho pelo índice
 * @param {number} index - Índice do item
 */
function removerItem(index) {
    carrinho.splice(index, 1);
    salvarCarrinho(carrinho);
    atualizarCarrinho();
    atualizarBadge();
}

/**
 * Aplica a quantidade digitada no carrinho e atualiza totais
 * @param {HTMLInputElement} input
 */
function commitQuantidadeCarrinhoInput(input) {
    const index = parseInt(input.getAttribute('data-carrinho-index') || '', 10);
    const item = carrinho[index];
    if (!item || !Number.isFinite(index)) return;

    const v = input.value.trim();
    if (v === '' || !/\d/.test(v)) {
        item.quantidade = QTD_MIN_PRODUTO;
    } else {
        item.quantidade = sanitizarQuantidadeCarrinho(v);
    }

    if (item.quantidade < QTD_MIN_PRODUTO) {
        removerItem(index);
        return;
    }

    salvarCarrinho(carrinho);
    atualizarCarrinho();
    atualizarBadge();
}

/**
 * Atualiza a interface do carrinho (lista e total)
 */
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
        li.innerHTML = `
            <div class="carrinho-item-info">
                <div class="carrinho-item-nome">${escapeHtml(item.nome)}</div>
                <div class="carrinho-item-preco-unit">R$ ${formatarPreco(item.preco)} un.</div>
            </div>
            <div class="carrinho-item-controles">
                <div class="carrinho-item-qty">
                    <span class="carrinho-item-qty-hint">Qtd.</span>
                    <input type="text" class="carrinho-item-qty-input" data-carrinho-index="${index}"
                        inputmode="numeric" pattern="[0-9]*" autocomplete="off" spellcheck="false"
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

/**
 * Calcula o valor total do carrinho
 * @returns {number}
 */
function calcularTotal() {
    return carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
}

/**
 * Formata preço para exibição
 * @param {number} valor
 * @returns {string}
 */
function formatarPreco(valor) {
    return Number(valor).toFixed(2).replace('.', ',');
}

/**
 * Escapa HTML para evitar XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Atualiza badge com quantidade de itens
 */
function atualizarBadge() {
    const badge = document.querySelector('.carrinho-badge');
    if (!badge) return;

    const qty = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    badge.textContent = qty;
    badge.style.display = qty > 0 ? 'flex' : 'none';
}

/**
 * Abre o sidebar do carrinho
 */
function abrirCarrinho() {
    document.querySelector('.carrinho-overlay')?.classList.add('ativo');
    document.querySelector('.carrinho-sidebar')?.classList.add('ativo');
    document.body.style.overflow = 'hidden';
}

/**
 * Fecha o sidebar do carrinho
 */
function fecharCarrinho() {
    document.querySelector('.carrinho-overlay')?.classList.remove('ativo');
    document.querySelector('.carrinho-sidebar')?.classList.remove('ativo');
    document.body.style.overflow = '';
}

/**
 * Extrai preço numérico de texto como "R$ 45,00" ou "A partir de R$ 45,00"
 * @param {string} texto
 * @returns {number}
 */
function extrairPreco(texto) {
    if (!texto) return 0;
    const match = texto.match(/R\$\s*([\d.,]+)/);
    if (!match) return 0;
    return parseFloat(match[1].replace('.', '').replace(',', '.')) || 0;
}

/**
 * Inicializa o carrinho: carrega dados e vincula eventos
 */
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
            const qtd = lerQuantidadeDoCard(card);
            adicionarCarrinho(nome, preco, qtd);
            resetarQuantidadeCard(card);
        });
    });

    atualizarCarrinho();
    atualizarBadge();
}

document.addEventListener('DOMContentLoaded', initCarrinho);
