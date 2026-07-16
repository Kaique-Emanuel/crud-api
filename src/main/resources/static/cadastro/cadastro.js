 // cadastro.js - Script para a página de cadastro de usuário
  

    const API = '/usuario';

  
    // visibilidade da senha
    
    document.getElementById('toggleSenha').addEventListener('click',    () => toggleVer('senha',          'toggleSenha'));
    document.getElementById('toggleConfirmar').addEventListener('click', () => toggleVer('confirmarSenha', 'toggleConfirmar'));

    // mostra e nao mostrar a senha (mostra/sumir)
    function toggleVer(inputId, iconId) {
        const input  = document.getElementById(inputId);
        const icon   = document.getElementById(iconId);
        const oculto = input.type === 'password';
        input.type       = oculto ? 'text' : 'password';
        icon.className   = oculto
            ? 'bi bi-eye-slash toggle-password'
            : 'bi bi-eye toggle-password';
    }
   

    // barrinha de forca da senha
    document.getElementById('senha').addEventListener('input', function () {
        const val   = this.value;
        const fill  = document.getElementById('forcaFill');
        const texto = document.getElementById('forcaTexto');

        let forca = 0;
        if (val.length >= 6)              forca++;
        if (/[A-Z]/.test(val))            forca++;
        if (/[0-9]/.test(val))            forca++;
        if (/[^A-Za-z0-9]/.test(val))     forca++;

        const niveis = [
            { pct: '0%',   cor: 'transparent', label: '' },
            { pct: '25%',  cor: '#ff4444',      label: 'Fraca' },
            { pct: '50%',  cor: '#ff9800',      label: 'Razoável' },
            { pct: '75%',  cor: '#ffeb3b',      label: 'Boa' },
            { pct: '100%', cor: '#00c853',      label: 'Forte' },
        ];

        const n = niveis[forca];
        fill.style.width      = n.pct;
        fill.style.background = n.cor;
        texto.innerText       = n.label;
        texto.style.color     = n.cor;
    });



    // vendo se as senha sao iguais ou nao
    document.getElementById('confirmarSenha').addEventListener('input', validarConfirmar);

    function validarConfirmar() {
        const s1  = document.getElementById('senha').value;
        const s2  = document.getElementById('confirmarSenha').value;
        const msg = document.getElementById('msg-confirmar');
        const inp = document.getElementById('confirmarSenha');

        if (!s2) { msg.className = 'field-msg'; return; }

        if (s1 === s2) {
            msg.className = 'field-msg ok show';
            msg.innerText = '✓ Senhas coincidem';
            inp.classList.remove('input-error');
        } else {
            msg.className = 'field-msg erro show';
            msg.innerText = '✗ Senhas não coincidem';
            inp.classList.add('input-error');
        }
    }

    // processa o cadastro dr novo usuário
    async function cadastrar() {
        const login     = document.getElementById('login').value.trim();
        const email     = document.getElementById('email').value.trim();
        const senha     = document.getElementById('senha').value;
        const confirmar = document.getElementById('confirmarSenha').value;

        document.getElementById('alertErro').classList.remove('show');
        document.getElementById('alertSucesso').classList.remove('show');

        if (!login || !email || !senha || !confirmar) {
            return mostrarErro('Preencha todos os campos.');
        }

        if (senha.length < 6) {
            return mostrarErro('A senha deve ter pelo menos 6 caracteres.');
        }

        if (senha !== confirmar) {
            return mostrarErro('As senhas não coincidem.');
        }

        // Carregarmento
        document.getElementById('btnTexto').style.display   = 'none';
        document.getElementById('btnSpinner').style.display  = 'block';
        document.getElementById('btnCadastro').disabled      = true;

        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, email, senha })
            });

            if (res.ok) {
                document.getElementById('alertSucesso').classList.add('show');
                setTimeout(() => window.location.href = '/login/login.html', 2000);
            } else {
                mostrarErro('Esse usuário ou e-mail já está em uso.');
            }
        } catch (err) {
            mostrarErro('Não foi possível conectar ao servidor.');
        } finally {
            document.getElementById('btnTexto').style.display   = 'block';
            document.getElementById('btnSpinner').style.display  = 'none';
            document.getElementById('btnCadastro').disabled      = false;
        }
    }


    // mostra mensagens de erro para o usuário
    function mostrarErro(msg) {
        document.getElementById('alertErroTexto').innerText = msg;
        document.getElementById('alertErro').classList.add('show');
    }


    
