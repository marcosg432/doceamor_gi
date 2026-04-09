'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function minFor(filePath, nome, preco) {
    const base = path.basename(filePath);
    if (base === 'lembrancinha-convidados.html') return 1;
    if (nome === 'Mini Pão de Mel' && String(preco) === '3.7') return 100;
    return 50;
}

function patchFile(filePath) {
    let html = fs.readFileSync(filePath, 'utf8');
    const next = html.replace(
        /<article\b([^>]*\b(?:produto-card|produto-card-home)\b[^>]*)>/gi,
        (full, attrs) => {
            if (/data-produto-qtd-minima\s*=/.test(attrs)) return full;
            const nomeM = /data-produto-nome="([^"]*)"/.exec(attrs);
            const precoM = /data-produto-preco="([^"]*)"/.exec(attrs);
            if (!nomeM || !precoM) return full;
            const min = minFor(filePath, nomeM[1], precoM[1]);
            const newAttrs = attrs.replace(
                /(data-produto-preco="[^"]*")/,
                '$1 data-produto-qtd-minima="' + min + '"'
            );
            return '<article' + newAttrs + '>';
        }
    );
    if (next !== html) fs.writeFileSync(filePath, next, 'utf8');
}

patchFile(path.join(root, 'index.html'));
const pagesDir = path.join(root, 'pages');
for (const f of fs.readdirSync(pagesDir)) {
    if (f.endsWith('.html')) patchFile(path.join(pagesDir, f));
}

console.log('data-produto-qtd-minima aplicado onde faltava.');
