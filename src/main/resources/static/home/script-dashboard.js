// dashboard.js - Script para a página dashboard 

// Inicia o dashboard ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('valorTotal')) carregarDashboard();
    if (document.getElementById('dashboard-historico-vendas')) carregarHistoricoDashboard();
    if (document.getElementById('rel-vendas-hoje')) carregarRelatoriosDashboard();

    monitorarSistema();
    setInterval(monitorarSistema, 15000);

    const navbarEl = document.getElementById('navbar');
    if (!navbarEl) return;

    const observer = new MutationObserver(() => {
        if (!document.getElementById('menuLateral')) return;
        observer.disconnect();
        carregarDadosUsuario();
        atualizarInterfaceFotos();
        setActiveLink();
    });
    observer.observe(navbarEl, { childList: true, subtree: true });
});


//  carrega info do dashboard
function carregarDashboard() {
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            let soma = 0, alerta = 0, vendas = 0;
            data.forEach(p => {
                soma += (p.valor || 0) * (p.quantidade || 0);
                if ((p.quantidade || 0) < 5) alerta++;
                vendas += p.vendas || 0;
            });

            const elProd  = document.querySelector('[data-target="total-produtos"]');
            const elAlert = document.querySelector('[data-target="estoque-baixo"]');
            const elVendas = document.querySelector('[data-target="total-vendas"]');
            const elValor = document.getElementById('valorTotal');

            if (elProd)  elProd.innerText  = data.length;
            if (elAlert) elAlert.innerText = alerta;
            if (elVendas) elVendas.innerText = vendas;
            if (elValor) elValor.innerText = soma.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });
        })
        .catch(err => console.error('Erro Dashboard:', err));
}

// carrega os relatorios
function carregarRelatoriosDashboard() {
    fetch(`${VENDAS_URL}/relatorio`)
        .then(res => res.json())
        .then(relatorio => {
            setText('rel-vendas-hoje', relatorio.vendasHoje || 0);
            setText('rel-faturamento-hoje', formatarMoeda(relatorio.faturamentoHoje || 0));
            setText('rel-faturamento-total', formatarMoeda(relatorio.faturamentoTotal || 0));
            setText('rel-produto-top', relatorio.produtoMaisVendido || 'Sem vendas');
            setText('rel-pagamento-top', relatorio.pagamentoMaisUsado || 'Sem vendas');
            carregarHistoricoDashboard();
        })
        .catch(err => console.error('Erro ao carregar relatórios:', err));
}

// carrega o historico de vendas
function carregarHistoricoDashboard() {
    const container = document.getElementById('dashboard-historico-vendas');
    if (!container) return;

    fetch(`${VENDAS_URL}/recentes`)
        .then(res => res.json())
        .then(vendas => {
            if (!vendas.length) {
                container.innerHTML = '<small class="text-secondary">Nenhuma venda registrada.</small>';
                return;
            }

            container.innerHTML = '';
            vendas.forEach(v => {
                const item = document.createElement('div');
                item.className = 'venda-historico-item';
                item.innerHTML = `
                    <div>
                        <strong>${v.produtoNome || 'Produto'}</strong>
                        <small>${formatarDataHora(v.dataHora)} · ${v.formaPagamento || 'Não informado'}</small>
                    </div>
                    <span>${v.quantidade}x · R$ ${(v.valorTotal || 0).toFixed(2)}</span>
                `;
                container.appendChild(item);
            });
        })
        .catch(() => {
            container.innerHTML = '<small class="text-danger">Erro ao carregar histórico.</small>';
        });
}
