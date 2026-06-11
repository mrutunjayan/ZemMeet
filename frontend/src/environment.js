let IS_PROD = true;

const server = IS_PROD
  ? "https://zemmeet.onrender.com"
  : "http://localhost:3001";

export default server;