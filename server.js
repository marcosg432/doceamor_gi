'use strict';

const path = require('path');
const express = require('express');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const root = __dirname;

app.disable('x-powered-by');
app.use(express.static(root, { extensions: ['html'], index: ['index.html'] }));

app.listen(PORT, HOST, () => {
    console.log(`Cardápio Doce Amor Gi — http://${HOST}:${PORT}`);
});
