const GOOGLE_CLIENT_ID =
  "7627808438-reg42t9afg4666dq7onk2li7d8qibhn3.apps.googleusercontent.com";

let idToken = null;
let svgAtual = null;

const erroEl = document.getElementById("erro");
const saida = document.getElementById("resultado");
const botaoBaixar = document.getElementById("baixar");
const usuarioEl = document.getElementById("usuario");

function aoLogar(resp) {
  idToken = resp.credential;
  erroEl.textContent = "";
  // Só para exibir na tela. O servidor nunca usa este valor.
  try {
    const payload = JSON.parse(
      atob(idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    usuarioEl.textContent = "Logado como " + payload.email;
  } catch {
    usuarioEl.textContent = "Login realizado.";
  }
}

window.addEventListener("load", () => {
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: aoLogar,
  });
  google.accounts.id.renderButton(
    document.getElementById("botao-google"),
    { theme: "outline", size: "large" }
  );
});

document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  erroEl.textContent = "";
  const numero = Number(document.getElementById("numero").value);

  try {
    const resp = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(idToken ? { Authorization: "Bearer " + idToken } : {}),
      },
      body: JSON.stringify({ numero }),
    });

    if (resp.status === 400) {
      erroEl.textContent = "Erro 400: informe um número inteiro entre 1 e 100.";
      return;
    }
    if (resp.status === 401) {
      erroEl.textContent = "Erro 401: faça login com o Google (ou entre novamente).";
      return;
    }
    if (!resp.ok) {
      erroEl.textContent = "Erro inesperado (" + resp.status + ").";
      return;
    }

    svgAtual = await resp.text();
    saida.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
  } catch {
    erroEl.textContent = "Falha de rede ao chamar o servidor.";
  }
});

botaoBaixar.addEventListener("click", () => {
  if (!svgAtual) return;
  const blob = new Blob([svgAtual], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "exemplo.svg";
  a.click();
  URL.revokeObjectURL(a.href);
});