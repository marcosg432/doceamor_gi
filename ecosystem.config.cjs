/**
 * PM2 - cardapio_apresentativo
 * Porta 3008 (livre no servidor além de 3000–3007, 22, 80, 443)
 * Sem domínio: http://SEU_IP:3008
 */
module.exports = {
  apps: [
    {
      name: 'cardapio_apresentativo',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      env: {
        NODE_ENV: 'production',
        PORT: '3008'
      }
    }
  ]
};
