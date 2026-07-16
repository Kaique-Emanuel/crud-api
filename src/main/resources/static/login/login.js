// login.js - Script da página de login

// mostra/esconde a senha
document.addEventListener('DOMContentLoaded', () => {
    const togglePwd = document.getElementById('togglePwd');
    const pwdInput  = document.getElementById('password');

    if (togglePwd && pwdInput) {
        togglePwd.addEventListener('click', () => {
            const isHidden = pwdInput.type === 'password';
            pwdInput.type = isHidden ? 'text' : 'password';
            togglePwd.className = isHidden
                ? 'bi bi-eye-slash toggle-password'
                : 'bi bi-eye toggle-password';
            togglePwd.setAttribute('aria-label', isHidden ? 'Ocultar senha' : 'Mostrar senha');
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', () => {
            document.getElementById('btnText').style.display   = 'none';
            document.getElementById('btnSpinner').style.display = 'block';
        });
    }

    if (window.location.search.includes('error')) {
        document.getElementById('errorMsg').classList.add('show');
    }
});

// solicita o reset de senha
async function solicitarResetSenha() {
    const login = document.getElementById('resetLogin').value.trim();
    const email = document.getElementById('resetEmail').value.trim();
    const msg = document.getElementById('resetMsg');
    const msgText = document.getElementById('resetMsgText');
    const btn = document.getElementById('btnResetEmail');

    if (!login || !email) {
        msgText.innerText = 'Informe seu usuário e e-mail cadastrados.';
        msg.className = 'error-msg show';
        return;
    }

    btn.disabled = true;
    btn.innerText = 'SOLICITANDO...';

    try {
        const res = await fetch('/usuario/esqueci-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, email })
        });

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const text = await res.text();
            if (text.includes('<html') || text.includes('<!DOCTYPE html')) {
                throw new Error('O servidor retornou uma página HTML. Reinicie a aplicação Spring para carregar o endpoint de reset.');
            }
            throw new Error(`Resposta inesperada do servidor (${res.status}).`);
        }

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.mensagem || `Erro ${res.status} ao solicitar reset.`);
        }

        msgText.innerText = data.mensagem || 'Se os dados estiverem corretos, um administrador verá sua solicitação.';
        msg.className = 'error-msg success show';
    } catch (error) {
        msgText.innerText = error.message || 'Não foi possível solicitar o reset agora.';
        msg.className = 'error-msg show';
    } finally {
        btn.disabled = false;
        btn.innerText = 'SOLICITAR RESET';
    }
}
