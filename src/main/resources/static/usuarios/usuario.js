   const API          = '/usuario';
        const FOTO_PADRAO  = '/assets/img/perfil-padrao.png';
        let todosUsuarios  = [];
 
        // Carrega navbar e inicializa
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
 
        // CARREGAR USUÁRIOS 
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
 
        // ── RENDERIZAR CARDS ──
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
                        <div class="card-avatar ${isAdmin ? 'admin-av' : 'user-av'}">${inicial}</div>
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
 
        // ── FILTRO ──
        function filtrar(tipo, btn) {
            document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('ativo'));
            btn.classList.add('ativo');
            renderizarCards(tipo === 'todos' ? todosUsuarios : todosUsuarios.filter(u => (u.role || 'USER') === tipo));
        }
 
        // ── EDITAR ──
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
 
        // ── ALTERNAR ROLE ──
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
 
        // ── DELETAR ──
        function deletarUsuario(id, login) {
            if (!confirm(`Excluir "${login}"? Esta ação não pode ser desfeita.`)) return;
            fetch(`${API}/${id}`, { method: 'DELETE' })
                .then(r => { if (r.ok) carregarUsuarios(); else alert('Erro ao deletar.'); })
                .catch(() => alert('Erro de conexão.'));
        }
 
        // ── NAVBAR ──
        function setActiveLink() {
            const pagina = window.location.pathname.split('/').pop() || 'index.html';
            document.querySelectorAll('#menuLateral .nav-link').forEach(link => {
                link.classList.toggle('active', (link.getAttribute('href') || '').split('/').pop() === pagina);
            });
        }
 
        function carregarDadosUsuarioNav() {
            fetch('/usuario/me')
                .then(r => r.json())
                .then(user => {
                    const role = user.role || 'USER';
                    const cargo = role === 'ADMIN' ? 'Administrador' : 'Usuário';
                    document.querySelectorAll('#user-nome, #info-nome').forEach(el => el && (el.innerText = user.login || 'Usuário'));
                    document.querySelectorAll('#user-email, #info-email').forEach(el => el && (el.innerText = user.email || ''));
                    document.querySelectorAll('#user-cargo').forEach(el => el && (el.innerText = cargo));
                    const fotoEl = document.getElementById('user-foto');
                    if (fotoEl) fotoEl.src = localStorage.getItem('userFoto') || FOTO_PADRAO;
                })
                .catch(() => {
                    document.querySelectorAll('#user-cargo').forEach(el => el && (el.innerText = 'Usuário'));
                });
        }


// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
function fazerLogout() {
    const form    = document.createElement('form');
    form.method   = 'POST';
    form.action   = '/logout';
    document.body.appendChild(form);
    form.submit();
}

function carregarDadosUsuario() {
    fetch(USUARIO_ME_URL)
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(user => {
            if (!user) return;

            const nome  = user.login || 'Usuário';
            const email = user.email || '';
            const role  = user.role  || 'USER';
            const cargo = role === 'ADMIN' ? 'Administrador' : 'Usuário';

            document.querySelectorAll('#user-nome, #info-nome').forEach(el => el && (el.innerText = nome));
            document.querySelectorAll('#user-email, #info-email').forEach(el => el && (el.innerText = email));
            document.querySelectorAll('#user-cargo').forEach(el => el && (el.innerText = cargo));

            // ← nome correto do elemento
            if (role === 'ADMIN') {
                const btnAdmin = document.getElementById('btnAdmin');
                if (btnAdmin) btnAdmin.style.display = 'block';
            }

            const fotoEl = document.getElementById('user-foto');
            if (fotoEl) fotoEl.src = localStorage.getItem('userFoto') || FOTO_PADRAO;
        })
        .catch(() => {
            const fotoEl = document.getElementById('user-foto');
            if (fotoEl) fotoEl.src = localStorage.getItem('userFoto') || FOTO_PADRAO;
            document.querySelectorAll('#user-cargo').forEach(el => el && (el.innerText = 'Usuário'));
        });
}

// ─────────────────────────────────────────────
// FOTO DE PERFIL
// ─────────────────────────────────────────────
function mudarFoto(novaUrl) {
    const fotoEl = document.getElementById('user-foto');
    if (fotoEl) fotoEl.src = novaUrl;
    localStorage.setItem('userFoto', novaUrl);
    marcarFotoSelecionada(novaUrl);
}

function marcarFotoSelecionada(url) {
    document.querySelectorAll('.img-opcao').forEach(img => {
        img.classList.toggle('selecionada', img.getAttribute('src') === url || img.src === url);
    });
}

function deletarFotoCustomizada(event) {
    event.stopPropagation();
    if (confirm('Deseja remover sua foto personalizada?')) {
        localStorage.removeItem('userFoto');
        mudarFoto(FOTO_PADRAO);
        atualizarInterfaceFotos();
    }
}

function atualizarInterfaceFotos() {
    const container = document.getElementById('opcoes-fotos-container');
    if (!container) return;

    const fotoSalva    = localStorage.getItem('userFoto');
    const wrapperVelho = document.getElementById('wrapper-custom');
    if (wrapperVelho) wrapperVelho.remove();

    if (fotoSalva && !fotoSalva.includes(FOTO_PADRAO)) {
        const wrapper = document.createElement('div');
        wrapper.id        = 'wrapper-custom';
        wrapper.className = 'wrapper-foto-opcao';

        const img    = document.createElement('img');
        img.src       = fotoSalva;
        img.className = 'img-opcao';
        img.onclick   = () => mudarFoto(fotoSalva);

        const btnDel       = document.createElement('button');
        btnDel.className   = 'btn-deletar-foto';
        btnDel.innerHTML   = '<i class="bi bi-x-lg"></i>';
        btnDel.onclick     = deletarFotoCustomizada;

        wrapper.appendChild(img);
        wrapper.appendChild(btnDel);
        container.insertBefore(wrapper, container.querySelector('label'));
    }

    marcarFotoSelecionada(localStorage.getItem('userFoto') || FOTO_PADRAO);
}

function uploadNovaFoto(input) {
    if (!input.files?.[0]) return;
    const leitor    = new FileReader();
    leitor.onload   = e => { mudarFoto(e.target.result); atualizarInterfaceFotos(); };
    leitor.readAsDataURL(input.files[0]);
}

async function alterarMinhaSenha() {
    const senhaAtual = document.getElementById('senha-atual').value;
    const novaSenha = document.getElementById('nova-senha').value;
    const confirmar = document.getElementById('confirmar-nova-senha').value;
    const erro = document.getElementById('senha-erro');
    const sucesso = document.getElementById('senha-sucesso');

    erro.classList.add('d-none');
    sucesso.classList.add('d-none');

    if (!senhaAtual || !novaSenha || !confirmar) {
        erro.innerText = 'Preencha todos os campos.';
        erro.classList.remove('d-none');
        return;
    }

    if (novaSenha.length < 6) {
        erro.innerText = 'A nova senha deve ter pelo menos 6 caracteres.';
        erro.classList.remove('d-none');
        return;
    }

    if (novaSenha !== confirmar) {
        erro.innerText = 'As senhas novas não coincidem.';
        erro.classList.remove('d-none');
        return;
    }

    try {
        const res = await fetch('/usuario/alterar-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senhaAtual, novaSenha })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.mensagem || 'Não foi possível alterar a senha.');

        sucesso.innerText = data.mensagem || 'Senha alterada com sucesso.';
        sucesso.classList.remove('d-none');
        document.getElementById('senha-atual').value = '';
        document.getElementById('nova-senha').value = '';
        document.getElementById('confirmar-nova-senha').value = '';
    } catch (error) {
        erro.innerText = error.message || 'Não foi possível alterar a senha.';
        erro.classList.remove('d-none');
    }
}
