const API_URL        = '/produto';
const VENDAS_URL     = '/venda';
const USUARIO_URL    = '/usuario';
const USUARIO_ME_URL = '/usuario/me';
const FOTO_PADRAO    = '/assets/img/perfil-padrao.png';
let fotoAtualUsuario = null;

// monitora se o servidor e banco tao online
function monitorarSistema() {
    const pilula = document.getElementById('Status');
    const cIcon  = document.getElementById('status-icon');
    const cText  = document.getElementById('status-text');
    const cTime  = document.getElementById('status-time');

    fetch(API_URL)
        .then(res => {
            if (!res.ok) throw new Error();
            if (pilula) { pilula.innerText = 'Sistema Online'; pilula.style.backgroundColor = '#00c853'; }
            if (cIcon)  cIcon.className = 'bi bi-cloud-check text-success display-4 mb-3';
            if (cText)  { cText.innerText = 'Banco de Dados Ativo'; cText.classList.remove('text-danger'); }
        })
        .catch(() => {
            if (pilula) { pilula.innerText = 'Sistema Offline'; pilula.style.backgroundColor = '#ff4444'; }
            if (cIcon)  cIcon.className = 'bi bi-cloud-slash text-danger display-4 mb-3';
            if (cText)  { cText.innerText = 'Servidor Desconectado'; cText.classList.add('text-danger'); }
        })
        .finally(() => {
            if (!cTime) return;
            const agora = new Date();
            cTime.innerText = `Última atualização: ${String(agora.getHours()).padStart(2,'0')}:${String(agora.getMinutes()).padStart(2,'0')}`;
        });
}

// pega os dados do user logado
function carregarDadosUsuario() {
    fetch(USUARIO_ME_URL)
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(user => {
            if (!user) return;
            const login = (user.login || '').toString().trim();
            const nome  = login || 'Usuário';
            const email = user.email || '';
            const role  = user.role  || 'USER';
            const cargo = role === 'ADMIN' ? 'Administrador' : 'Usuário';

            document.querySelectorAll('#user-nome, #info-nome').forEach(el => el && (el.innerText = nome));
            document.querySelectorAll('#user-email, #info-email').forEach(el => el && (el.innerText = email));
            document.querySelectorAll('#user-cargo').forEach(el => el && (el.innerText = cargo));

            if (role === 'ADMIN') {
                const btnAdmin = document.getElementById('btnAdmin');
                if (btnAdmin) btnAdmin.style.display = 'block';
            }

            const fotoEl = document.getElementById('user-foto');
            if (fotoEl) fotoEl.src = user.fotoUrl || FOTO_PADRAO;
            fotoAtualUsuario = user.fotoUrl || FOTO_PADRAO;
            atualizarInterfaceFotos();
        })
        .catch(() => {
            const fotoEl = document.getElementById('user-foto');
            if (fotoEl) fotoEl.src = FOTO_PADRAO;
            fotoAtualUsuario = FOTO_PADRAO;
            atualizarInterfaceFotos();
            document.querySelectorAll('#user-cargo').forEach(el => el && (el.innerText = 'Usuário'));
        });
}

// muda a foto do user
function mudarFoto(novaUrl) {
    fetch('/usuario/foto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fotoUrl: novaUrl })
    })
    .then(res => {
        if (!res.ok) throw new Error();
        const fotoEl = document.getElementById('user-foto');
        if (fotoEl) fotoEl.src = novaUrl;
        fotoAtualUsuario = novaUrl;
        atualizarInterfaceFotos();
    })
    .catch(() => alert('Não foi possível atualizar a foto.'));
}

function atualizarInterfaceFotos() {
    const container = document.getElementById('opcoes-fotos-container');
    if (!container) return;

    document.querySelectorAll('#wrapper-custom').forEach(wrapper => wrapper.remove());

    if (fotoAtualUsuario && fotoAtualUsuario !== FOTO_PADRAO) {
        const wrapper = document.createElement('div');
        wrapper.id = 'wrapper-custom';
        wrapper.className = 'wrapper-foto-opcao';

        const img = document.createElement('img');
        img.src = fotoAtualUsuario;
        img.className = 'img-opcao';
        img.onclick = () => mudarFoto(fotoAtualUsuario);
        img.title = 'Usar foto personalizada';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-deletar-foto';
        btn.innerHTML = '×';
        btn.onclick = event => deletarFotoCustomizada(event);

        wrapper.appendChild(img);
        wrapper.appendChild(btn);

        const label = container.querySelector('label');
        if (label) {
            container.insertBefore(wrapper, label);
        } else {
            container.appendChild(wrapper);
        }
    }

    marcarFotoSelecionada(fotoAtualUsuario || FOTO_PADRAO);
}

// marca qual foto tá selecionada
function marcarFotoSelecionada(url) {
    document.querySelectorAll('.img-opcao').forEach(img => {
        const srcAtual = img.getAttribute('src') || img.src || '';
        const temMesmoValor = srcAtual === url || img.src === url || new URL(srcAtual, window.location.href).href === new URL(url, window.location.href).href;
        img.classList.toggle('selecionada', temMesmoValor);
    });
}

function deletarFotoCustomizada(event) {
    event.stopPropagation();
    if (!confirm('Deseja remover sua foto personalizada?')) return;
    mudarFoto(FOTO_PADRAO);
}

// faz upload da foto nova
function uploadNovaFoto(input) {
    if (!input.files?.[0]) return;
    const leitor = new FileReader();
    leitor.onload = e => mudarFoto(e.target.result);
    leitor.readAsDataURL(input.files[0]);
}

// altera a senha do usuario
async function alterarMinhaSenha() {
    const senhaAtual = document.getElementById('senha-atual')?.value;
    const novaSenha = document.getElementById('nova-senha')?.value;
    const confirmar = document.getElementById('confirmar-nova-senha')?.value;
    const erro = document.getElementById('senha-erro');
    const sucesso = document.getElementById('senha-sucesso');

    if (erro) erro.classList.add('d-none');
    if (sucesso) sucesso.classList.add('d-none');

    if (!senhaAtual || !novaSenha || !confirmar) {
        if (erro) {
            erro.innerText = 'Preencha todos os campos.';
            erro.classList.remove('d-none');
        }
        return;
    }

    if (novaSenha.length < 6) {
        if (erro) {
            erro.innerText = 'A nova senha deve ter pelo menos 6 caracteres.';
            erro.classList.remove('d-none');
        }
        return;
    }

    if (novaSenha !== confirmar) {
        if (erro) {
            erro.innerText = 'As senhas novas não coincidem.';
            erro.classList.remove('d-none');
        }
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

        if (sucesso) {
            sucesso.innerText = data.mensagem || 'Senha alterada com sucesso.';
            sucesso.classList.remove('d-none');
        }
        document.getElementById('senha-atual').value = '';
        document.getElementById('nova-senha').value = '';
        document.getElementById('confirmar-nova-senha').value = '';
    } catch (error) {
        if (erro) {
            erro.innerText = error.message || 'Não foi possível alterar a senha.';
            erro.classList.remove('d-none');
        }
    }
}

// marca qual link do menu ta ativo
function setActiveLink() {
    const pagina = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('#menuLateral .nav-link').forEach(link => {
        const href = (link.getAttribute('href') || '').split('/').pop();
        link.classList.toggle('active', href === pagina);
    });
}

// mostra/esconde a senha
function togglePasswordVisibility(toggleId, inputId) {
    const toggle = document.getElementById(toggleId);
    const input = document.getElementById(inputId);
    if (!toggle || !input) return;

    toggle.addEventListener('click', () => {
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        toggle.className = isHidden
            ? 'bi bi-eye-slash toggle-password position-absolute top-50 end-0 translate-middle-y pe-3'
            : 'bi bi-eye toggle-password position-absolute top-50 end-0 translate-middle-y pe-3';
        toggle.setAttribute('aria-label', isHidden ? 'Ocultar senha' : 'Mostrar senha');
    });
}

// inicia os botoes de mostrar/esconder senha
function initPasswordToggles() {
    togglePasswordVisibility('toggle-senha-atual', 'senha-atual');
    togglePasswordVisibility('toggle-nova-senha', 'nova-senha');
    togglePasswordVisibility('toggle-confirmar-nova-senha', 'confirmar-nova-senha');
}

// coloca texto num elemento
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

// formata numero em reais
function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// formata a data e hora
function formatarDataHora(valor) {
    if (!valor) return '--/-- --:--';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return valor;
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}
