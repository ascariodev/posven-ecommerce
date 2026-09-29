module.exports = {
  apps: [
    {
      name: "posven-ecommerce",
      cwd: `${__dirname}/current`,
      script: "server.js",
      env: { PORT: 3000, HOSTNAME: "127.0.0.1" },
      watch: [`${__dirname}/.deployed`],
      watch_delay: 2000,
    },
  ],
};
