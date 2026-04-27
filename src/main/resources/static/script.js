
const API_URL = 'https://crud-api-production-1281.up.railway.app/usuarios';

document.addEventListener('DOMContentLoaded', () => {
   
    if (document.getElementById('valorTotal')) carregarDashboard();
    if (document.getElementById('produto-tbody')) carregarProdutos();
    
    monitorarSistema();
    setInterval(monitorarSistema, 15000);
});

function carregarDashboard() {
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            const elProd = document.querySelector('[data-target="total-produtos"]');
            const elAlerta = document.querySelector('[data-target="estoque-baixo"]');
            const elValorTotal = document.getElementById('valorTotal');

            let soma = 0, alerta = 0;
            data.forEach(p => {
                const v = p.valor || 0;
                const q = p.quantidade || 0;
                soma += (v * q);
                if (q < 5) alerta++;
            });

            if (elProd) elProd.innerText = data.length;
            if (elAlerta) elAlerta.innerText = alerta;
            if (elValorTotal) elValorTotal.innerText = soma.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });
        })
        .catch(err => console.error("Erro Dashboard:", err));
}


function carregarProdutos() {
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('produto-tbody');
            if (!tbody) return;
            tbody.innerHTML = '';
            data.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${p.id}</td>
                    <td>${p.nome}</td>
                    <td>R$ ${(p.valor || 0).toFixed(2)}</td>
                    <td>${p.quantidade}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deletarProduto(${p.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>`;
                tbody.appendChild(tr);
            });
        });
}


function deletarProduto(id) {
    if (confirm("Deseja excluir este produto?")) {
        fetch(`${API_URL}/${id}`, { method: 'DELETE' })
            .then(res => { if (res.ok) window.location.reload(); });
    }
}


window.carregarListaEdicao = function() {
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

window.abrirFormEdicao = function(id) {
    const modalListaEl = document.getElementById('modalListaEdicao');
    const instanceLista = bootstrap.Modal.getInstance(modalListaEl);
    if (instanceLista) instanceLista.hide();


    fetch(`${API_URL}/${id}`)
        .then(res => res.json())
        .then(p => {
            document.getElementById('edit-id').value = p.id;
            document.getElementById('edit-nome').value = p.nome;
            document.getElementById('edit-valor').value = p.valor;
            document.getElementById('edit-quantidade').value = p.quantidade;

            const modalEdicao = new bootstrap.Modal(document.getElementById('modalEditar'));
            modalEdicao.show();
        })
        .catch(err => alert("Erro ao buscar dados do produto: " + err));
};

document.addEventListener('submit', function (e) {
    const targetId = e.target.id;
    if (targetId !== 'formCadastro' && targetId !== 'formEditar') return;
    
    e.preventDefault();
    const isEdicao = (targetId === 'formEditar');

    const id = isEdicao ? document.getElementById('edit-id').value : '';
    const url = isEdicao ? `${API_URL}/${id}` : API_URL;
    const metodo = isEdicao ? 'PUT' : 'POST';

    const produto = {
        nome: document.getElementById(isEdicao ? 'edit-nome' : 'nome').value,
        valor: parseFloat(document.getElementById(isEdicao ? 'edit-valor' : 'valor').value),
        quantidade: parseInt(document.getElementById(isEdicao ? 'edit-quantidade' : 'quantidade').value)
    };

    fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(produto)
    })
    .then(res => {
        if (res.ok) {
            alert(isEdicao ? "Atualizado com sucesso!" : "Cadastrado com sucesso!");
            window.location.reload();
        } else {
            alert("Erro ao processar requisição no servidor.");
        }
    })
    .catch(err => console.error("Erro na requisição:", err));
});


function monitorarSistema() {
    const pilula = document.getElementById('Status');
    const cIcon = document.getElementById('status-icon');
    const cText = document.getElementById('status-text');
    const cTime = document.getElementById('status-time');

    fetch(API_URL)
        .then(res => {
            if (!res.ok) throw new Error();
            
            if (pilula) {
                pilula.innerText = "Sistema Online";
                pilula.style.backgroundColor = "#00c853";
            }
            if (cIcon) cIcon.className = "bi bi-cloud-check text-success display-4 mb-3";
            if (cText) {
                cText.innerText = "Banco de Dados Ativo";
                cText.classList.remove('text-danger');
            }
        })
        .catch(() => {
            if (pilula) {
                pilula.innerText = "Sistema Offline";
                pilula.style.backgroundColor = "#ff4444";
            }
            if (cIcon) cIcon.className = "bi bi-cloud-slash text-danger display-4 mb-3";
            if (cText) {
                cText.innerText = "Servidor Desconectado";
                cText.classList.add('text-danger');
            }
        })
        .finally(() => {
            if (cTime) {
                const agora = new Date();
                cTime.innerText = `Última atualização: ${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
            }
        });
}