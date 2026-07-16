// usuario.js - só o que roda na tela de usuarios
const API          = '/usuario';
let todosUsuarios  = [];

// carrega navbar e inicia a página
fetch('/shared/navbar.html')
    .then(r => r.text())
    .then(html => {
        document.getElementById('navbar').innerHTML = html;
        setTimeout(() => {
            setActiveLink();
            carregarDadosUsuarioNav();
        }, 100);
    });

document.addEventListener('DOMContentLoaded', carregarUsuarios);

// carrega todos os usuarios do server
function carregarUsuarios() {
    const grid = document.getElementById('grid-usuarios');
    grid.innerHTML = '<div class="empty-state"><i class="bi bi-arrow-repeat" style="animation:spin 1s linear infinite"></i><p>Carregando...</p></div>';

    fetch(API)
        .then(r => r.json())
        .then(data => { todosUsuarios = data; renderizarCards(data); })
        .catch(() => {
            grid.innerHTML = '<div class="empty-state"><i class="bi bi-wifi-off"></i><p>Erro ao conectar ao servidor.</p></div>';
        });
}

// renderiza os cards de usuario
function renderizarCards(lista) {
            const grid  = document.getElementById('grid-usuarios');
            const badge = document.getElementById('badge-total');
            badge.innerText = `${lista.length} USUÁRIO${lista.length !== 1 ? 'S' : ''}`;
 
            if (!lista.length) {
                grid.innerHTML = '<div class="empty-state"><i class="bi bi-people"></i><p>Nenhum usuário encontrado.</p></div>';
                return;
            }
 
            grid.innerHTML = '';
            lista.forEach((u, i) => {
                const isAdmin   = (u.role || 'USER') === 'ADMIN';
                const roleLabel = u.role || 'USER';
                const inicial   = (u.login || '?')[0].toUpperCase();
                const resetPendente = u.resetSolicitado === true;
 
                const card = document.createElement('div');
                card.className         = `user-card${isAdmin ? ' admin' : ''}${resetPendente ? ' reset-pendente' : ''}`;
                card.style.animationDelay = `${i * 0.05}s`;
                card.innerHTML = `
                    <div class="card-header-row">
                        <div class="card-avatar ${isAdmin ? 'admin-av' : 'user-av'}">
                            ${u.fotoUrl ? `<img src="${u.fotoUrl}" style="width:100%;height:100%;border-radius:inherit;object-fit:cover;">` : inicial}
                        </div>
                        <div class="card-badges">
                            ${resetPendente ? '<span class="reset-badge"><i class="bi bi-key"></i> RESET</span>' : ''}
                            <span class="role-badge ${roleLabel}">${roleLabel}</span>
                        </div>
                    </div>
                    <div style="margin-bottom:0.5rem">
                        <div class="card-login">${u.login || '—'}</div>
                        <div class="card-email">${u.email || 'sem e-mail'}</div>
                        ${resetPendente ? '<div class="card-reset-info">Usuário solicitou uma nova senha.</div>' : ''}
                    </div>
                    <div class="card-id"># ID ${u.id}</div>
                    <div class="card-acoes">
                        <button class="btn-acao btn-editar"  onclick="abrirEdicao(${u.id})"><i class="bi bi-pencil"></i> Editar</button>
                        <button class="btn-acao btn-role"    onclick="alternarRole(${u.id},'${roleLabel}')">
                            <i class="bi bi-shield${isAdmin ? '-x' : '-check'}"></i> ${isAdmin ? 'Rebaixar' : 'Promover'}
                        </button>
                        <button class="btn-acao btn-deletar" onclick="deletarUsuario(${u.id},'${u.login}')"><i class="bi bi-trash"></i> Deletar</button>
                    </div>`;
                grid.appendChild(card);
            });
        }
 
        // filtro rapido por tipo de usuario
        function filtrar(tipo, btn) {
            document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('ativo'));
            btn.classList.add('ativo');
            renderizarCards(tipo === 'todos' ? todosUsuarios : todosUsuarios.filter(u => (u.role || 'USER') === tipo));
        }
 
        // editar usuario
        function abrirEdicao(id) {
            const u = todosUsuarios.find(x => x.id === id);
            if (!u) return;
            document.getElementById('edit-id').value    = u.id;
            document.getElementById('edit-login').value = u.login || '';
            document.getElementById('edit-email').value = u.email || '';
            document.getElementById('edit-senha').value = '';
            document.getElementById('edit-role').value  = u.role  || 'USER';
            document.getElementById('senha-gerada-box').classList.remove('show');
            document.getElementById('senha-gerada-box').innerHTML = '';
            new bootstrap.Modal(document.getElementById('modalEditar')).show();
        }
 
        function salvarEdicao() {
            const id    = document.getElementById('edit-id').value;
            const login = document.getElementById('edit-login').value.trim();
            const email = document.getElementById('edit-email').value.trim();
            const senha = document.getElementById('edit-senha').value;
            const role  = document.getElementById('edit-role').value;
 
            const payload = { login, email, role };
            if (senha) payload.senha = senha; // só envia se preencheu
 
            fetch(`${API}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(r => {
                if (r.ok) { bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide(); carregarUsuarios(); }
                else alert('Erro ao salvar alterações.');
            })
            .catch(() => alert('Erro de conexão.'));
        }

        function gerarSenhaAleatoria() {
            const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
            const numeros = '23456789';
            const simbolos = '@#$%';
            const todos = letras + numeros + simbolos;
            let senha = 'Temp@';

            for (let i = 0; i < 8; i++) {
                senha += todos[Math.floor(Math.random() * todos.length)];
            }

            return senha;
        }

        function preencherSenhaGerada() {
            const senha = gerarSenhaAleatoria();
            document.getElementById('edit-senha').value = senha;
            const box = document.getElementById('senha-gerada-box');
            box.innerHTML = `Senha sugerida: <strong>${senha}</strong><br><small>Salve a edição para aplicar esta senha.</small>`;
            box.classList.add('show');
        }

        function gerarSenhaTemporaria() {
            const id = document.getElementById('edit-id').value;
            if (!id || !confirm('Gerar uma nova senha temporária para este usuário? A senha antiga deixará de funcionar.')) return;

            fetch(`${API}/${id}/gerar-senha`, { method: 'POST' })
                .then(r => {
                    if (!r.ok) throw new Error();
                    return r.json();
                })
                .then(data => {
                    const senha = data.senhaTemporaria;
                    const box = document.getElementById('senha-gerada-box');
                    document.getElementById('edit-senha').value = '';
                    box.innerHTML = `Nova senha temporária: <strong>${senha}</strong><br><small>Entregue essa senha ao usuário e peça para ele trocar depois.</small>`;
                    box.classList.add('show');
                    carregarUsuarios();
                })
                .catch(() => alert('Não foi possível gerar a senha temporária.'));
        }
 
        // muda role de admin/usuario
        function alternarRole(id, roleAtual) {
            const novoRole = roleAtual === 'ADMIN' ? 'USER' : 'ADMIN';
            const u        = todosUsuarios.find(x => x.id === id);
            if (!u || !confirm(`Deseja ${novoRole === 'ADMIN' ? 'promover' : 'rebaixar'} "${u.login}"?`)) return;
 
            fetch(`${API}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login: u.login, email: u.email, role: novoRole })
            })
            .then(r => { if (r.ok) carregarUsuarios(); else alert('Erro ao alterar role.'); })
            .catch(() => alert('Erro de conexão.'));
        }
 
        // deleta usuario
        function deletarUsuario(id, login) {
            if (!confirm(`Excluir "${login}"? Esta ação não pode ser desfeita.`)) return;
            fetch(`${API}/${id}`, { method: 'DELETE' })
                .then(r => { if (r.ok) carregarUsuarios(); else alert('Erro ao deletar.'); })
                .catch(() => alert('Erro de conexão.'));
        }
 
        function carregarDadosUsuarioNav() {
            fetch('/usuario/me')
                .then(r => r.json())
                .then(user => {
                    const login = (user.login || '').toString().trim();
                    const role = user.role || 'USER';
                    const cargo = role === 'ADMIN' ? 'Administrador' : 'Usuário';
                    document.querySelectorAll('#user-nome, #info-nome').forEach(el => el && (el.innerText = login || 'Usuário'));
                    document.querySelectorAll('#user-email, #info-email').forEach(el => el && (el.innerText = user.email || ''));
                    document.querySelectorAll('#user-cargo').forEach(el => el && (el.innerText = cargo));
                    const fotoEl = document.getElementById('user-foto');
                    if (fotoEl) fotoEl.src = user.fotoUrl || FOTO_PADRAO;
                })
                .catch(() => {
                    document.querySelectorAll('#user-cargo').forEach(el => el && (el.innerText = 'Usuário'));
                });
        }

