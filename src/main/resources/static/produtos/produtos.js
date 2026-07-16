// produtos.js - só o que rola na tela de produtos

let produtosVendaCache = [];
let mostrandoDesativados = false;

// inicia a página de produtos
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const acao = params.get('acao');
    if (acao === 'cadastrar') {
        new bootstrap.Modal(document.getElementById('modalCadastro')).show();
    } else if (acao === 'editar') {
        carregarListaEdicao();
        new bootstrap.Modal(document.getElementById('modalListaEdicao')).show();
    }

    if (document.getElementById('produto-tbody')) carregarProdutos();
    if (document.getElementById('venda-produto')) carregarProdutosVenda();
    if (document.getElementById('venda-busca')) configurarBuscaVenda();

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

// carrega produtos e preenche tabela
function carregarProdutos() {
    const url = mostrandoDesativados ? `${API_URL}/desativados` : API_URL;
    fetch(url)
        .then(res => res.json())
        .then(data => renderizarTabelaProdutos(data, mostrandoDesativados))
        .catch(err => console.error('Erro ao carregar produtos:', err));
}

function renderizarTabelaProdutos(data, desativados) {
    const tbody = document.getElementById('produto-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    let totalVendas = 0;

    const headerAcoes = document.querySelector('thead tr th:last-child');
    if (headerAcoes) {
        headerAcoes.innerText = desativados ? 'Reativar' : 'Excluir';
    }

    if (data.length === 0) {
        const trVazio = document.createElement('tr');
        trVazio.innerHTML = `
            <td colspan="8" class="text-center text-secondary" style="padding: 3rem 0;">
                <i class="bi ${desativados ? 'bi-archive' : 'bi-inbox'} me-2"></i>
                ${desativados ? 'Nenhum produto desativado no momento.' : 'Nenhum produto cadastrado ainda. Use o menu Gestão > Cadastrar para adicionar o primeiro produto.'}
            </td>`;
        tbody.appendChild(trVazio);
    } else {
        data.forEach(p => {
        totalVendas += p.vendas || 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.id}</td>
            <td>${p.nome}</td>
            <td>R$ ${(p.valor || 0).toFixed(2)}</td>
            <td>${p.quantidade}</td>
            <td>${p.vendas || 0}</td>
            <td>
                <button class="btn btn-sm btn-success" onclick="selecionarProdutoVendaPorId(${p.id})">
                    <i class="bi bi-cart-check"></i>
                </button>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="abrirEntradaEstoque(${p.id})">
                    <i class="bi bi-plus-square"></i>
                </button>
            </td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="abrirFormEdicao(${p.id})">
                    <i class="bi bi-pencil-square"></i>
                </button>
            </td>
            <td>
                ${desativados ? `<button class="btn btn-sm btn-outline-success" onclick="reativarProduto(${p.id})">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>` : `<button class="btn btn-sm btn-danger" onclick="deletarProduto(${p.id})">
                    <i class="bi bi-trash"></i>
                </button>`}
            </td>`;
        tbody.appendChild(tr);
        });
    }

    const totalEl = document.getElementById('total-vendas-produtos');
    if (totalEl) totalEl.innerText = totalVendas;
    if (!desativados) {
        preencherSelectVenda(data);
    }
}

function alternarVisualizacaoDesativados() {
    mostrandoDesativados = !mostrandoDesativados;
    const btn = document.getElementById('btn-visualizacao-desativados');
    if (btn) {
        btn.innerHTML = mostrandoDesativados
            ? '<i class="bi bi-arrow-counterclockwise"></i> Ver produtos ativos'
            : '<i class="bi bi-archive"></i> Ver produtos desativados';
    }
    carregarProdutos();
}

function reativarProduto(id) {
    if (!confirm('Deseja reativar este produto?')) return;

    fetch(`${API_URL}/${id}/reativar`, { method: 'POST' })
        .then(async res => {
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.mensagem || 'Não foi possível reativar o produto.');
            }
            carregarProdutos();
        })
        .catch(err => alert(err.message || 'Erro ao reativar o produto.'));
}

// guarda produtos para usar na busca e venda
function preencherSelectVenda(produtos) {
    produtosVendaCache = produtos || [];
    renderizarResultadosVenda('');
}

// carrega lista de produtos para vender
function carregarProdutosVenda() {
    fetch(API_URL)
        .then(res => res.json())
        .then(preencherSelectVenda)
        .catch(err => console.error('Erro ao carregar venda:', err));
}

// busca produto para venda
function configurarBuscaVenda() {
    const busca = document.getElementById('venda-busca');
    if (!busca) return;

    busca.addEventListener('input', () => {
        const selecionado = document.getElementById('venda-produto');
        if (selecionado) selecionado.value = '';
        atualizarInfoProdutoVenda(null);
        renderizarResultadosVenda(busca.value);
    });

    busca.addEventListener('focus', () => renderizarResultadosVenda(busca.value));
}

// mostra os resultados da busca de venda
function renderizarResultadosVenda(termo) {
    const container = document.getElementById('venda-resultados');
    if (!container) return;

    const filtro = (termo || '').trim().toLowerCase();
    const produtos = produtosVendaCache
        .filter(p => !filtro || (p.nome || '').toLowerCase().includes(filtro))
        .slice(0, 6);

    if (!produtos.length) {
        container.innerHTML = '<button type="button" class="venda-opcao" disabled>Nenhum produto encontrado</button>';
        return;
    }

    container.innerHTML = '';
    produtos.forEach(p => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'venda-opcao';
        btn.disabled = (p.quantidade || 0) <= 0;
        btn.innerHTML = `
            <span>${p.nome}</span>
            <small>Estoque: ${p.quantidade || 0} · R$ ${(p.valor || 0).toFixed(2)}</small>
        `;
        btn.onclick = () => selecionarProdutoVenda(p);
        container.appendChild(btn);
    });
}

// seleciona o produto escolhido para venda
function selecionarProdutoVenda(produto) {
    const produtoInput = document.getElementById('venda-produto');
    const buscaInput = document.getElementById('venda-busca');

    if (produtoInput) produtoInput.value = produto.id;
    if (buscaInput) buscaInput.value = produto.nome || '';
    atualizarInfoProdutoVenda(produto);
    renderizarResultadosVenda(produto.nome || '');
}

// seleciona produto pelo id direto da tabela
function selecionarProdutoVendaPorId(id) {
    const produto = produtosVendaCache.find(p => Number(p.id) === Number(id));
    if (!produto) return;
    selecionarProdutoVenda(produto);

    const quantidadeInput = document.getElementById('venda-quantidade');
    if (quantidadeInput) quantidadeInput.focus();
    document.querySelector('.venda-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// atualiza o card de info do produto selecionado
function atualizarInfoProdutoVenda(produto) {
    const info = document.getElementById('venda-produto-info');
    if (!info) return;

    if (!produto) {
        info.innerText = 'Nenhum produto selecionado.';
        return;
    }

    info.innerText = `Estoque: ${produto.quantidade || 0} · Preço: R$ ${(produto.valor || 0).toFixed(2)} · Vendidos: ${produto.vendas || 0}`;
}

// chama a venda depois de selecionar o produto
function registrarVendaSelecionada() {
    const produtoId = document.getElementById('venda-produto').value;
    const quantidade = parseInt(document.getElementById('venda-quantidade').value, 10);
    const formaPagamento = document.getElementById('venda-pagamento').value;
    const feedback = document.getElementById('venda-feedback');

    if (!produtoId) {
        if (feedback) {
            feedback.className = 'd-block mt-3 text-warning';
            feedback.innerText = 'Selecione um produto para vender.';
        }
        return;
    }

    if (!formaPagamento) {
        if (feedback) {
            feedback.className = 'd-block mt-3 text-warning';
            feedback.innerText = 'Selecione a forma de pagamento.';
        }
        return;
    }

    registrarVenda(produtoId, quantidade, formaPagamento);
}

// envia a venda pro backend
function registrarVenda(id, quantidade = 1, formaPagamento = 'Não informado') {
    const qtd = parseInt(quantidade, 10);
    const feedback = document.getElementById('venda-feedback');

    if (!qtd || qtd <= 0) {
        if (feedback) {
            feedback.className = 'd-block mt-3 text-warning';
            feedback.innerText = 'Informe uma quantidade válida.';
        }
        return;
    }

    fetch(`${API_URL}/${id}/vender`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantidade: qtd, formaPagamento })
    })
        .then(async res => {
            const contentType = res.headers.get('content-type') || '';
            const data = contentType.includes('application/json') ? await res.json() : {};
            if (!res.ok) throw new Error(data.mensagem || 'Não foi possível registrar a venda.');
            return data;
        })
        .then(resultado => {
            const produto = resultado.produto || resultado;
            if (feedback) {
                feedback.className = 'd-block mt-3 text-success';
                feedback.innerText = `Venda registrada: ${qtd} unidade(s) de ${produto.nome} em ${resultado.venda?.formaPagamento || formaPagamento}.`;
            }
            const qtdInput = document.getElementById('venda-quantidade');
            if (qtdInput) qtdInput.value = 1;
            carregarProdutos();
        })
        .catch(error => {
            if (feedback) {
                feedback.className = 'd-block mt-3 text-danger';
                feedback.innerText = error.message;
            } else {
                alert(error.message);
            }
        });
}

// exclui produto do estoque
function deletarProduto(id) {
    if (!confirm('Deseja excluir este produto?')) return;

    fetch(`${API_URL}/${id}`, { method: 'DELETE' })
        .then(async res => {
            if (res.status === 204) {
                window.location.reload();
                return;
            }
            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                alert(data.mensagem || 'Produto desativado.');
                window.location.reload();
                return;
            }
            alert('Não foi possível processar essa exclusão.');
        })
        .catch(() => alert('Erro de conexão ao tentar excluir o produto.'));
}

window.carregarListaEdicao = function () {
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            const lista = document.getElementById('lista-para-editar');
            if (!lista) return;
            lista.innerHTML = '';
            data.forEach(p => {
                const li = document.createElement('li');
                li.className = 'list-group-item bg-dark text-white d-flex justify-content-between align-items-center border-secondary';
                li.innerHTML = `
                    <span>${p.nome}</span>
                    <button class="btn btn-sm btn-outline-warning" onclick="abrirFormEdicao(${p.id})">Selecionar</button>`;
                lista.appendChild(li);
            });
        });
};

window.abrirFormEdicao = function (id) {
    const modalListaEl  = document.getElementById('modalListaEdicao');
    const instanceLista = bootstrap.Modal.getInstance(modalListaEl);
    if (instanceLista) instanceLista.hide();

    fetch(`${API_URL}/${id}`)
        .then(res => res.json())
        .then(p => {
            document.getElementById('edit-id').value         = p.id;
            document.getElementById('edit-nome').value       = p.nome;
            document.getElementById('edit-valor').value      = p.valor;
            document.getElementById('edit-quantidade').value = p.quantidade;
            new bootstrap.Modal(document.getElementById('modalEditar')).show();
        })
        .catch(err => alert('Erro ao buscar produto: ' + err));
};

function abrirEntradaEstoque(id) {
    fetch(`${API_URL}/${id}`)
        .then(res => res.json())
        .then(p => {
            document.getElementById('entrada-id').value = p.id;
            document.getElementById('entrada-nome').value = p.nome;
            document.getElementById('entrada-estoque-atual').value = p.quantidade || 0;
            document.getElementById('entrada-quantidade').value = 1;
            new bootstrap.Modal(document.getElementById('modalEntradaEstoque')).show();
        })
        .catch(err => alert('Erro ao buscar produto: ' + err));
}

document.addEventListener('submit', function (e) {
    const targetId = e.target.id;
    if (targetId === 'formEntradaEstoque') {
        e.preventDefault();
        registrarEntradaEstoque();
        return;
    }

    if (targetId !== 'formCadastro' && targetId !== 'formEditar') return;
    e.preventDefault();

    const isEdicao = targetId === 'formEditar';
    const id       = isEdicao ? document.getElementById('edit-id').value : '';
    const url      = isEdicao ? `${API_URL}/${id}` : API_URL;
    const metodo   = isEdicao ? 'PUT' : 'POST';

    const produto = {
        nome:       document.getElementById(isEdicao ? 'edit-nome'       : 'nome').value,
        valor:      parseFloat(document.getElementById(isEdicao ? 'edit-valor'      : 'valor').value),
        quantidade: parseInt(document.getElementById(isEdicao ? 'edit-quantidade'  : 'quantidade').value)
    };

    fetch(url, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(produto) })
        .then(res => {
            if (res.ok) { alert(isEdicao ? 'Atualizado!' : 'Cadastrado!'); window.location.reload(); }
            else alert('Erro ao processar requisição.');
        })
        .catch(err => console.error('Erro:', err));
});

function registrarEntradaEstoque() {
    const id = document.getElementById('entrada-id').value;
    const quantidade = parseInt(document.getElementById('entrada-quantidade').value, 10);

    if (!quantidade || quantidade <= 0) {
        alert('Informe uma quantidade válida para entrada.');
        return;
    }

    fetch(`${API_URL}/${id}/entrada`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantidade })
    })
        .then(async res => {
            const contentType = res.headers.get('content-type') || '';
            const data = contentType.includes('application/json') ? await res.json() : {};
            if (!res.ok) throw new Error(data.mensagem || 'Erro ao registrar entrada.');
            return data;
        })
        .then(() => {
            bootstrap.Modal.getInstance(document.getElementById('modalEntradaEstoque')).hide();
            carregarProdutos();
            alert('Entrada registrada!');
        })
        .catch(error => alert(error.message));
}
