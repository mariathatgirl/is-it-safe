const input = document.getElementById("urlInput");
const button = document.getElementById("checkBtn");
const clearBtn = document.getElementById("clearBtn");
const result = document.getElementById("result");
const statusTitle = document.getElementById("statusTitle");
const scoreText = document.getElementById("scoreText");
const scoreBar = document.getElementById("scoreBar");
const detailsList = document.getElementById("detailsList");
const resultIcon = document.getElementById("resultIcon");
const securityLevel = document.getElementById("securityLevel");


const suspiciousWords = [
  "login",
  "verify",
  "update",
  "free",
  "bonus",
  "win",
  "gift",
  "premio",
  "prize",
  "urgent",
  "security",
  "password",
  "bank"
];

const riskyExtensions = [
  ".zip",
  ".exe",
  ".scr",
  ".bat",
  ".cmd",
  ".apk",
  ".msi"
];
const shortenerDomains = [
  "bit.ly",
  "tinyurl.com",
  "cutt.ly",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "rebrand.ly",
  "shorturl.at"
];
const famousBrands = [
  "google",
  "facebook",
  "instagram",
  "whatsapp",
  "paypal",
  "netflix",
  "amazon",
  "microsoft",
  "apple",
  "github"
];

button.addEventListener("click", analyzeUrl);
clearBtn.addEventListener("click", clearAnalysis);

input.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    analyzeUrl();
  }
});

function analyzeUrl() {
  let rawUrl = input.value.trim();
  detailsList.innerHTML = "";

  if (!rawUrl) {
    showMessage("Digite um link para analisar.", "warning");
    return;
  }

  if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
    rawUrl = "https://" + rawUrl;
  }

  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    showMessage("Esse link não parece válido. Confira se você digitou corretamente.", "danger");
    return;
  }

  let score = 100;
  const details = [];

  if (url.protocol === "https:") {
    details.push(["ok", "Usa HTTPS, o que é um ponto positivo."]);
  } else {
    score -= 25;
    details.push(["bad", "Não usa HTTPS. Isso pode deixar dados menos protegidos."]);
  }

  const hostname = url.hostname.toLowerCase();
  if (shortenerDomains.includes(hostname)) {
  score -= 18;
  details.push(["warn", "O link usa um encurtador. Ele pode esconder o destino real, então abra apenas se confiar na fonte."]);
}
const normalizedHostname = normalizeText(hostname);

famousBrands.forEach(function(brand) {
  const isOfficialDomain =
    hostname === `${brand}.com` ||
    hostname === `www.${brand}.com`;

  const looksLikeBrand =
    normalizedHostname.includes(brand) && !isOfficialDomain;

  if (looksLikeBrand) {
    score -= 18;
    details.push(["warn", `O domínio parece tentar imitar uma marca conhecida: ${brand}. Confira com muita atenção.`]);
  }
});

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    score -= 25;
    details.push(["bad", "O link usa endereço por números/IP, algo comum em links suspeitos."]);
  } else {
    details.push(["ok", "O domínio tem formato de nome, não apenas números."]);
  }

  if (hostname.length > 35) {
    score -= 15;
    details.push(["warn", "O domínio é muito longo. Links falsos às vezes usam nomes grandes para confundir."]);
  } else {
    details.push(["ok", "O tamanho do domínio parece normal."]);
  }

  if (hostname.includes("-")) {
    score -= 8;
    details.push(["warn", "O domínio tem hífen. Não é sempre perigoso, mas merece atenção."]);
  }

  const fullUrl = rawUrl.toLowerCase();

  const foundWords = suspiciousWords.filter(word => fullUrl.includes(word));

  if (foundWords.length > 0) {
    score -= Math.min(foundWords.length * 8, 24);
    details.push(["warn", `Encontrou palavras que podem aparecer em golpes: ${foundWords.join(", ")}.`]);
  } else {
    details.push(["ok", "Não foram encontradas palavras muito comuns em golpes."]);
  }

  const foundExtension = riskyExtensions.find(ext => fullUrl.endsWith(ext) || fullUrl.includes(ext + "?"));

  if (foundExtension) {
    score -= 30;
    details.push(["bad", `O link parece apontar para arquivo ${foundExtension}, que exige muito cuidado antes de baixar.`]);
  } else {
    details.push(["ok", "Não parece ser um link direto para arquivo executável ou compactado perigoso."]);
  }

  if (url.search.length > 80) {
    score -= 10;
    details.push(["warn", "O link tem muitos parâmetros. Isso pode ser normal, mas também pode esconder rastreio ou redirecionamento."]);
  }

  score = Math.max(0, Math.min(100, score));

  renderResult(score, details);
}

function renderResult(score, details) {
  result.classList.remove("hidden");

  result.classList.remove("safe-card", "warning-card", "danger-card");
  securityLevel.classList.remove("safe-level", "warning-level", "danger-level");
  statusTitle.className = "";
  detailsList.innerHTML = "";

  if (score >= 80) {
    result.classList.add("safe-card");
    securityLevel.classList.add("safe-level");

    resultIcon.textContent = "✅";
    statusTitle.textContent = "Link provavelmente seguro";
    statusTitle.classList.add("safe");
    securityLevel.textContent = "Nível de risco: baixo";
  } else if (score >= 50) {
    result.classList.add("warning-card");
    securityLevel.classList.add("warning-level");

    resultIcon.textContent = "⚠️";
    statusTitle.textContent = "Link suspeito";
    statusTitle.classList.add("warning");
    securityLevel.textContent = "Nível de risco: médio";
  } else {
    result.classList.add("danger-card");
    securityLevel.classList.add("danger-level");

    resultIcon.textContent = "🚨";
    statusTitle.textContent = "Link perigoso";
    statusTitle.classList.add("danger");
    securityLevel.textContent = "Nível de risco: alto";
  }

  scoreText.textContent = `Pontuação de segurança: ${score}/100`;
  scoreBar.style.width = `${score}%`;

  details.forEach(([type, text]) => {
    const li = document.createElement("li");
    const icon = type === "ok" ? "✅" : type === "warn" ? "⚠️" : "🚨";

    li.textContent = `${icon} ${text}`;
    detailsList.appendChild(li);
  });
}

function showMessage(message, type) {
  result.classList.remove("hidden");

  result.classList.remove("safe-card", "warning-card", "danger-card");
  securityLevel.classList.remove("safe-level", "warning-level", "danger-level");

  resultIcon.textContent = "🔎";
  statusTitle.textContent = message;
  statusTitle.className = type;
  scoreText.textContent = "";
  scoreBar.style.width = "0%";
  securityLevel.textContent = "";
  detailsList.innerHTML = "";
}
function clearAnalysis() {
  input.value = "";
  result.classList.add("hidden");

  result.classList.remove("safe-card", "warning-card", "danger-card");
  securityLevel.classList.remove("safe-level", "warning-level", "danger-level");

  resultIcon.textContent = "🔎";
  statusTitle.textContent = "";
  statusTitle.className = "";
  scoreText.textContent = "";
  scoreBar.style.width = "0%";
  securityLevel.textContent = "";
  detailsList.innerHTML = "";

  input.focus();
}
function normalizeText(text) {
  return text
    .toLowerCase()
    .replaceAll("0", "o")
    .replaceAll("1", "i")
    .replaceAll("3", "e")
    .replaceAll("4", "a")
    .replaceAll("5", "s")
    .replaceAll("7", "t")
    .replaceAll("@", "a")
    .replaceAll("$", "s");
}