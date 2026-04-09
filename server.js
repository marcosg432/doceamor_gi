'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const root = __dirname;

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

/**
 * @param {unknown} p
 * @returns {string}
 */
function normalizePrecoKey(p) {
    const n = parseFloat(String(p).replace(',', '.'));
    return Number.isFinite(n) ? String(n) : '0';
}

/**
 * @param {string} nome
 * @param {unknown} preco
 * @returns {string}
 */
function chaveCatalogo(nome, preco) {
    return `${String(nome).trim()}|${normalizePrecoKey(preco)}`;
}

/**
 * Lê o catálogo a partir dos HTML (data-produto-qtd-minima).
 * @returns {Map<string, number>}
 */
function carregarMapaQtdMinimaDisk() {
    const map = new Map();
    const files = [];
    const indexPath = path.join(root, 'index.html');
    if (fs.existsSync(indexPath)) files.push(indexPath);
    const pagesDir = path.join(root, 'pages');
    if (fs.existsSync(pagesDir)) {
        for (const f of fs.readdirSync(pagesDir)) {
            if (f.endsWith('.html')) files.push(path.join(pagesDir, f));
        }
    }
    const articleRe = /<article\b[^>]*\b(?:produto-card|produto-card-home)\b[^>]*>/gi;
    for (const file of files) {
        const html = fs.readFileSync(file, 'utf8');
        articleRe.lastIndex = 0;
        let m;
        while ((m = articleRe.exec(html)) !== null) {
            const tag = m[0];
            const nomeM = /data-produto-nome="([^"]*)"/.exec(tag);
            const precoM = /data-produto-preco="([^"]*)"/.exec(tag);
            const qminM = /data-produto-qtd-minima="(\d+)"/.exec(tag);
            if (!nomeM || !precoM) continue;
            let qmin = qminM ? parseInt(qminM[1], 10) : 1;
            if (!Number.isFinite(qmin) || qmin < 1) qmin = 1;
            map.set(chaveCatalogo(nomeM[1], precoM[1]), qmin);
        }
    }
    return map;
}

app.get('/api/catalogo-qtd-minima', (req, res) => {
    try {
        const map = carregarMapaQtdMinimaDisk();
        const obj = {};
        map.forEach((v, k) => {
            obj[k] = v;
        });
        res.json(obj);
    } catch (e) {
        res.status(500).json({ erro: 'catalogo_indisponivel' });
    }
});

app.post('/api/validar-carrinho', (req, res) => {
    const itens = req.body && req.body.itens;
    if (!Array.isArray(itens)) {
        return res.status(400).json({
            ok: false,
            mensagem:
                'Não foi possível validar o pedido. Atualize a página e tente novamente.',
        });
    }

    let map;
    try {
        map = carregarMapaQtdMinimaDisk();
    } catch (e) {
        return res.status(500).json({
            ok: false,
            mensagem: 'Serviço temporariamente indisponível. Tente novamente em instantes.',
        });
    }

    for (let i = 0; i < itens.length; i++) {
        const item = itens[i];
        const nome = item && item.nome != null ? String(item.nome).trim() : '';
        const preco = item && item.preco;
        const qtd = parseInt(item && item.quantidade, 10);
        if (!nome) {
            return res.status(400).json({
                ok: false,
                mensagem: 'Pedido inválido: há um item sem nome. Esvazie o carrinho e monte o pedido de novo.',
            });
        }
        const min = map.get(chaveCatalogo(nome, preco)) ?? 1;
        if (!Number.isFinite(qtd) || qtd < min) {
            const unid = min === 1 ? '1 unidade' : `${min} unidades`;
            return res.status(400).json({
                ok: false,
                mensagem: `O produto "${nome}" só é vendido com pedido mínimo de ${unid}. Ajuste o carrinho e tente finalizar novamente.`,
            });
        }
    }

    res.json({ ok: true });
});

app.use(express.static(root, { extensions: ['html'], index: ['index.html'] }));

app.listen(PORT, HOST, () => {
    console.log(`Cardápio Doce Amor Gi — http://${HOST}:${PORT}`);
});
