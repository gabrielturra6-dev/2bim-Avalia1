import { gerarDesenho } from "../../lib/desenho.js";

const erro = (status, msg, extra = {}) =>
  new Response(JSON.stringify({ erro: msg }), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });

export async function onRequest({ request, env }) {
  // 1) método -> 405
  if (request.method !== "POST") {
    return erro(405, "Método não permitido", { Allow: "POST" });
  }

  // 2) corpo -> 400
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return erro(400, "JSON inválido ou ausente");
  }
  const numero = corpo?.numero;
  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    return erro(400, "numero deve ser inteiro entre 1 e 100");
  }

  // 3) token -> 401
  const m = (request.headers.get("Authorization") || "").match(/^Bearer\s+(.+)$/i);
  if (!m) return erro(401, "Token ausente");

  let info;
  try {
    const r = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(m[1])
    );
    if (r.status !== 200) return erro(401, "Token inválido ou expirado");
    info = await r.json();
  } catch {
    return erro(401, "Não foi possível validar o token");
  }

  if (
    !env.GOOGLE_CLIENT_ID ||
    info.aud !== env.GOOGLE_CLIENT_ID ||
    String(info.email_verified) !== "true" ||
    !info.email
  ) {
    return erro(401, "Token não aceito");
  }

  const svg = gerarDesenho(numero, info.email);
  return new Response(svg, {
    status: 200,
    headers: { "Content-Type": "image/svg+xml" },
  });
}