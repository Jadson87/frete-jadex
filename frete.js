/**
 * Script de integração da API de Frete CriarInfo com Nuvemshop
 * Local de execução: Checkout
 * Evento: onload
 */

(function() {
  console.log("🚚 Frete CriarInfo - Script carregado com sucesso");

  // === CONFIGURAÇÕES ===
  const API_URL = "https://SEU_DOMINIO.com/api/frete.php"; // 🔧 Substitua pela URL real
  const CEP_LOJA = "61700-000"; // 🔧 Pode ser configurado pelo lojista

  // Função para obter CEP do checkout
  function obterCEP() {
    const cepInput = document.querySelector('input[name="zip"]') ||
                     document.querySelector('input[name="postal_code"]');
    return cepInput ? cepInput.value.replace(/\D/g, '') : null;
  }

  // Função para buscar dados do carrinho
  async function obterCarrinho() {
    try {
      const resp = await fetch("/cart.js");
      const dados = await resp.json();
      return dados;
    } catch (e) {
      console.error("Erro ao buscar carrinho:", e);
      return null;
    }
  }

  // Função para calcular o frete via API
  async function calcularFrete(cepDestino) {
    const carrinho = await obterCarrinho();
    if (!carrinho) return;

    // Peso total e cubagem simples (caso precise enviar)
    const pesoTotal = carrinho.items.reduce((t, i) => t + (i.grams / 1000), 0);
    const volume = carrinho.items.length; // simplificado

    const payload = {
      cep_origem: CEP_LOJA,
      cep_destino: cepDestino,
      peso: pesoTotal,
      volume: volume
    };

    try {
      const resposta = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const dados = await resposta.json();
      exibirOpcoesFrete(dados);
    } catch (e) {
      console.error("Erro ao calcular frete:", e);
    }
  }

  // Função para exibir opções de frete no checkout
  function exibirOpcoesFrete(dados) {
    if (!dados || !dados.opcoes) return;

    const container = document.createElement("div");
    container.style.padding = "10px";
    container.style.border = "1px solid #ddd";
    container.style.marginTop = "10px";
    container.style.borderRadius = "8px";
    container.style.background = "#f9f9f9";

    const titulo = document.createElement("h4");
    titulo.textContent = "Opções de Entrega CriarInfo";
    titulo.style.marginBottom = "8px";
    container.appendChild(titulo);

    dados.opcoes.forEach(opcao => {
      const linha = document.createElement("div");
      linha.innerHTML = `
        <strong>${opcao.nome}</strong> — 
        R$ ${opcao.valor.toFixed(2)} 
        <small>(${opcao.prazo} dias úteis)</small>
      `;
      linha.style.marginBottom = "4px";
      container.appendChild(linha);
    });

    const checkoutContainer = document.querySelector(".shipping-options") ||
                              document.querySelector(".step-shipping");
    if (checkoutContainer) {
      checkoutContainer.prepend(container);
    } else {
      document.body.appendChild(container);
    }
  }

  // Monitora mudanças no CEP
  function monitorarCEP() {
    const cepInput = document.querySelector('input[name="zip"]') ||
                     document.querySelector('input[name="postal_code"]');
    if (!cepInput) return;

    cepInput.addEventListener("change", () => {
      const cepDestino = cepInput.value.replace(/\D/g, '');
      if (cepDestino.length >= 8) {
        console.log("🔍 Calculando frete para:", cepDestino);
        calcularFrete(cepDestino);
      }
    });
  }

  // Inicia o script quando a página carregar
  window.addEventListener("load", () => {
    setTimeout(() => {
      monitorarCEP();
      const cepAtual = obterCEP();
      if (cepAtual && cepAtual.length >= 8) {
        calcularFrete(cepAtual);
      }
    }, 2000);
  });
})();
