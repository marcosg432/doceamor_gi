'use strict';

/** PM2 — Cardápio na Hostinger (proxy reverso → localhost:3010) */
module.exports = {
    apps: [
        {
            name: 'doceamor_gi',
            script: './server.js',
            cwd: __dirname,
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '200M',
            env: {
                NODE_ENV: 'production',
                PORT: 3010,
                HOST: '0.0.0.0'
            }
        }
    ]
};
