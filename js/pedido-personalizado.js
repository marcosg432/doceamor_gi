/**
 * pedido-personalizado.js - Envio de pedido personalizado para WhatsApp
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-pedido-personalizado');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const tipoProduto = (document.getElementById('tipo-produto') || {}).value?.trim();
        const massa = (document.getElementById('massa') || {}).value?.trim();
        const recheio = (document.getElementById('recheio') || {}).value?.trim();
        const cobertura = (document.getElementById('cobertura') || {}).value?.trim();
        const tamanho = (document.getElementById('tamanho') || {}).value?.trim();
        const tema = (document.getElementById('tema') || {}).value?.trim();
        const nomeBolo = (document.getElementById('nome-bolo') || {}).value?.trim();
        const quantidade = (document.getElementById('quantidade') || {}).value?.trim();
        const observacoes = (document.getElementById('observacoes') || {}).value?.trim();
        const nomeCliente = (document.getElementById('nome-cliente') || {}).value?.trim();
        const telefoneCliente = (document.getElementById('telefone-cliente') || {}).value?.trim();

        if (!tipoProduto) {
            alert('Selecione o tipo de produto.');
            return;
        }
        if (!nomeCliente) {
            alert('Preencha seu nome.');
            return;
        }
        if (!telefoneCliente) {
            alert('Preencha seu telefone.');
            return;
        }

        let msg = 'PEDIDO PERSONALIZADO\n\n';
        msg += `Tipo de produto: ${tipoProduto}\n`;
        msg += `Massa: ${massa || '-'}\n`;
        msg += `Recheio: ${recheio || '-'}\n`;
        msg += `Cobertura: ${cobertura || '-'}\n`;
        msg += `Tamanho: ${tamanho || '-'}\n`;
        msg += `Tema: ${tema || '-'}\n`;
        msg += `Nome no bolo: ${nomeBolo || '-'}\n`;
        msg += `Quantidade: ${quantidade || '-'}\n\n`;
        msg += `Observações: ${observacoes || '-'}\n\n`;
        msg += `Nome do cliente: ${nomeCliente}\n`;
        msg += `Telefone: ${telefoneCliente}\n`;
        msg += '-------------';

        const telefone = (typeof CONFIG !== 'undefined' && CONFIG.telefoneWhatsApp) ? CONFIG.telefoneWhatsApp : '5515996451801';
        const url = `https://wa.me/${telefone}?text=${encodeURIComponent(msg)}`;

        window.open(url, '_blank');
    });
});
