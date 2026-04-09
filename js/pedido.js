/**
 * pedido.js - Finalização de pedido e envio para WhatsApp
 * Sistema de pedidos reutilizável para cardápios digitais
 */

/**
 * Monta a mensagem do pedido no formato especificado
 * @returns {string}
 */
function montarMensagemPedido() {
    const nome = (document.getElementById('nome') || {}).value?.trim();
    const telefone = (document.getElementById('telefone') || {}).value?.trim();
    const tipo = (document.getElementById('tipo') || {}).value?.trim();
    const endereco = (document.getElementById('endereco') || {}).value?.trim();
    const pagamento = (document.getElementById('pagamento') || {}).value?.trim();
    const observacao = (document.getElementById('observacao') || {}).value?.trim();

    let msg = 'NOVO PEDIDO\n\n';
    msg += 'ITENS:\n';
    carrinho.forEach(item => {
        const subtotal = item.preco * item.quantidade;
        msg += `${item.quantidade}x ${item.nome} - R$ ${formatarPreco(subtotal)}\n`;
    });
    msg += `\nTotal: R$ ${formatarPreco(calcularTotal())}\n\n`;
    msg += `Tipo: ${tipo || 'Não informado'}\n`;
    if (tipo === 'Entrega') {
        msg += `Endereço: ${endereco || '-'}\n`;
    }
    msg += `\nPagamento: ${pagamento || '-'}\n`;
    msg += `Observações: ${observacao || '-'}\n\n`;
    msg += `Nome: ${nome}\n`;
    msg += `Telefone: ${telefone}\n`;
    msg += '-------------';

    return msg;
}

/**
 * Valida os dados do formulário
 * @returns {string|null} Mensagem de erro ou null se válido
 */
function validarFormulario() {
    const nome = (document.getElementById('nome') || {}).value?.trim();
    const telefone = (document.getElementById('telefone') || {}).value?.trim();
    const tipo = (document.getElementById('tipo') || {}).value?.trim();
    const endereco = (document.getElementById('endereco') || {}).value?.trim();

    if (!nome) return 'Preencha o nome do cliente.';
    if (!telefone) return 'Preencha o telefone.';
    if (!tipo) return 'Selecione Entrega ou Retirada.';
    if (tipo === 'Entrega' && !endereco) return 'Preencha o endereço para entrega.';

    return null;
}

/**
 * Valida quantidades mínimas no servidor (obrigatório antes do envio).
 * @returns {Promise<string|null>} Mensagem de erro ou null se ok
 */
async function validarCarrinhoNoServidor() {
    try {
        const r = await fetch('/api/validar-carrinho', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itens: carrinho }),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data.ok) {
            return (
                data.mensagem ||
                'Não foi possível validar o pedido. Confira as quantidades no carrinho e tente de novo.'
            );
        }
        return null;
    } catch (e) {
        return 'Não foi possível conectar ao servidor para validar o pedido. Verifique sua internet ou se o site está no ar, e tente novamente.';
    }
}

/**
 * Finaliza o pedido: valida, monta mensagem e redireciona para WhatsApp
 */
async function finalizarPedido() {
    if (carrinho.length === 0) {
        alert('Adicione itens ao carrinho antes de finalizar.');
        return;
    }

    const erro = validarFormulario();
    if (erro) {
        alert(erro);
        return;
    }

    const erroMinimos = await validarCarrinhoNoServidor();
    if (erroMinimos) {
        alert(erroMinimos);
        return;
    }

    const telefone = CONFIG?.telefoneWhatsApp || '5515996451801';
    const mensagem = montarMensagemPedido();
    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;

    window.open(url, '_blank');

    /* Limpa carrinho após envio */
    carrinho = [];
    salvarCarrinho(carrinho);
    atualizarCarrinho();
    atualizarBadge();
    fecharCarrinho();
}

/**
 * Mostra ou esconde campo de endereço conforme tipo selecionado
 */
function toggleCampoEndereco() {
    const tipo = document.getElementById('tipo');
    const enderecoWrap = document.getElementById('endereco-wrap');
    const enderecoInput = document.getElementById('endereco');

    if (tipo && enderecoWrap) {
        if (tipo.value === 'Entrega') {
            enderecoWrap.style.display = 'block';
            if (enderecoInput) enderecoInput.required = true;
        } else {
            enderecoWrap.style.display = 'none';
            if (enderecoInput) {
                enderecoInput.required = false;
                enderecoInput.value = '';
            }
        }
    }
}

/**
 * Inicializa formulário de pedido
 */
function initPedido() {
    const btnFinalizar = document.querySelector('.btn-finalizar-pedido');
    const tipoSelect = document.getElementById('tipo');

    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', finalizarPedido);
    }

    if (tipoSelect) {
        tipoSelect.addEventListener('change', toggleCampoEndereco);
        toggleCampoEndereco(); /* Estado inicial */
    }
}

document.addEventListener('DOMContentLoaded', initPedido);
