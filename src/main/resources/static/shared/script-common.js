const API_URL        = 'http://localhost:8080/produto';
const VENDAS_URL     = 'http://localhost:8080/venda';
const USUARIO_URL    = 'http://localhost:8080/usuario';
const USUARIO_ME_URL = 'http://localhost:8080/usuario/me';
const FOTO_PADRAO    = '/assets/img/perfil-padrao.png';

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
    if (!confirm('Deseja remover sua foto personalizada?')) return;

    localStorage.removeItem('userFoto');
    mudarFoto(FOTO_PADRAO);
    atualizarInterfaceFotos();
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

        const img = document.createElement('img');
        img.src = fotoSalva;
        img.className = 'img-opcao';
        img.onclick = () => mudarFoto(fotoSalva);

        const btnDel = document.createElement('button');
        btnDel.className = 'btn-deletar-foto';
        btnDel.innerHTML = '<i class="bi bi-x-lg"></i>';
        btnDel.onclick = deletarFotoCustomizada;

        wrapper.appendChild(img);
        wrapper.appendChild(btnDel);
        container.insertBefore(wrapper, container.querySelector('label'));
    }

    marcarFotoSelecionada(localStorage.getItem('userFoto') || FOTO_PADRAO);
}

function uploadNovaFoto(input) {
    if (!input.files?.[0]) return;
    const leitor = new FileReader();
    leitor.onload = e => { mudarFoto(e.target.result); atualizarInterfaceFotos(); };
    leitor.readAsDataURL(input.files[0]);
}

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

function setActiveLink() {
    const pagina = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('#menuLateral .nav-link').forEach(link => {
        const href = (link.getAttribute('href') || '').split('/').pop();
        link.classList.toggle('active', href === pagina);
    });
}

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

function initPasswordToggles() {
    togglePasswordVisibility('toggle-senha-atual', 'senha-atual');
    togglePasswordVisibility('toggle-nova-senha', 'nova-senha');
    togglePasswordVisibility('toggle-confirmar-nova-senha', 'confirmar-nova-senha');
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

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
