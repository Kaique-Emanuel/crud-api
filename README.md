# Estoque — Sistema de Gestão de Estoque e Vendas

Sistema de controle de estoque com autenticação, controle de acesso por papel (admin/usuário) e registro de vendas com atualização automática de estoque, construído com **Spring Boot** e **Spring Security** no backend, banco de dados relacional para persistência, e um frontend em **JavaScript puro** consumindo a própria API REST.

Este projeto nasceu como um estudo prático de desenvolvimento backend e evoluiu para um sistema completo: cadastro e gestão de produtos, registro de vendas com validação de estoque, geração de relatórios, e um painel administrativo com controle de usuários e permissões.

---

## Funcionalidades

- **Autenticação e autorização** — login por sessão via Spring Security, senhas criptografadas com BCrypt, controle de acesso por papel (`ADMIN` / `USER`)
- **CRUD de produtos** — cadastro, edição, listagem e exclusão
- **Exclusão segura de produtos (soft delete)** — produtos sem vendas são excluídos permanentemente; produtos com histórico de vendas são desativados em vez de removidos, preservando a integridade dos relatórios. Existe uma visualização dedicada para consultar e reativar produtos desativados
- **Controle de estoque** — registro de vendas com baixa automática de estoque (operação transacional), e entrada manual de itens
- **Relatórios de vendas** — faturamento do dia e total, produto mais vendido e forma de pagamento mais usada, calculados em tempo real com Java Streams; o indicador de estoque baixo considera apenas produtos ativos
- **Gestão de usuários** — painel administrativo para promover/rebaixar permissões, gerar senha temporária e visualizar solicitações de reset
- **Perfil de usuário** — foto de perfil persistida no banco de dados (por usuário, não local ao navegador), troca de senha
- **Dados de exemplo automáticos** — na primeira inicialização, um usuário administrador e alguns produtos de exemplo são criados automaticamente, permitindo avaliar o sistema completo sem nenhuma configuração manual prévia

---

## Stack técnica

| Camada         | Tecnologia                                              |
|----------------|-----------------------------------------------------------|
| Backend        | Java 21, Spring Boot, Spring Security, Spring Data JPA    |
| Banco de dados | MySQL                                                      |
| Frontend       | HTML, CSS, JavaScript puro (Fetch API), Bootstrap 5        |
| Build          | Maven                                                      |

---

## Arquitetura

O backend segue uma arquitetura em camadas clássica:

```
Controller → Service → Repository → Model
```

- **Controller** — recebe requisições HTTP e devolve respostas, sem regra de negócio complexa
- **Service** — concentra a lógica de negócio (ex: orquestração transacional do fluxo de venda, soft delete de produtos)
- **Repository** — interfaces do Spring Data JPA, sem necessidade de implementação manual
- **Model** — entidades JPA mapeadas para as tabelas do banco

Pontos de destaque:

- Senha nunca é exposta em respostas da API (`@JsonProperty(access = WRITE_ONLY)` na entidade `Usuario`)
- Autenticação usa um `UserDetailsService` customizado, ligando o Spring Security à tabela de usuários do banco
- O fluxo de venda (baixa de estoque + registro do histórico) é protegido com `@Transactional`, garantindo que as duas operações aconteçam de forma atômica
- Exclusão de produtos com vendas associadas é tratada como soft delete (campo `ativo`), evitando violação de integridade referencial e perda de histórico financeiro
- Relatórios são calculados em memória com Stream API / Collectors, agregando dados de vendas sem SQL manual
- Foto de perfil é persistida no banco (campo `fotoUrl`), evitando inconsistência entre diferentes contas no mesmo navegador ou entre dispositivos diferentes

---

## Como rodar localmente

### Pré-requisitos

- Java 21
- Maven (ou usar o wrapper incluso, `./mvnw`)
- MySQL rodando localmente

### 1. Configurar o banco de dados

Crie um banco MySQL e ajuste a URL/usuário em `src/main/resources/application.properties`, se necessário, ou defina as variáveis de ambiente:

```bash
export SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/seu_banco?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
export SPRING_DATASOURCE_USERNAME=root
export SPRING_DATASOURCE_PASSWORD=sua_senha
```

> ⚠️ A senha do banco **não possui valor padrão** no projeto — é obrigatório definir a variável `SPRING_DATASOURCE_PASSWORD` antes de rodar a aplicação, por questão de segurança (evita credenciais expostas no código-fonte).

### 2. Rodar a aplicação

```bash
./mvnw clean
./mvnw spring-boot:run
```

A aplicação sobe em `http://localhost:8080`.

### 3. Primeiro acesso

Na primeira inicialização, caso o banco esteja vazio, o sistema cria automaticamente:

- Um usuário administrador:
  - **Login:** `admin`
  - **Senha:** `admin123`
- Alguns produtos de exemplo, para que o sistema já possa ser avaliado com dados reais desde o primeiro acesso

> ⚠️ Recomenda-se trocar a senha do administrador imediatamente após o primeiro login, através do menu de perfil.

Isso garante que qualquer pessoa que clone o repositório consiga acessar o sistema completo — incluindo o painel de gestão de usuários e produtos — sem precisar de ferramentas externas como Postman ou de popular o banco manualmente.

---

## Principais endpoints

| Método | Rota                          | Acesso        | Descrição                                       |
|--------|-------------------------------|---------------|----------------------------------------------------|
| POST   | `/usuario`                     | Público       | Cadastro de novo usuário                            |
| GET    | `/usuario/me`                  | Autenticado   | Dados do usuário logado                             |
| POST   | `/usuario/foto`                | Autenticado   | Atualiza a foto de perfil                           |
| POST   | `/usuario/alterar-senha`       | Autenticado   | Troca a própria senha                               |
| GET    | `/usuario`                     | Admin         | Lista todos os usuários                             |
| PUT    | `/usuario/{id}`                | Admin         | Edita um usuário (incluindo papel/role)             |
| POST   | `/usuario/{id}/gerar-senha`    | Admin         | Gera senha temporária para outro usuário            |
| GET    | `/produto`                     | Autenticado   | Lista produtos ativos                               |
| GET    | `/produto/desativados`         | Autenticado   | Lista produtos desativados                          |
| POST   | `/produto`                     | Autenticado   | Cadastra produto                                    |
| PUT    | `/produto/{id}`                | Autenticado   | Edita um produto                                    |
| DELETE | `/produto/{id}`                | Autenticado   | Exclui um produto (ou desativa, se houver vendas)   |
| POST   | `/produto/{id}/reativar`       | Autenticado   | Reativa um produto previamente desativado           |
| POST   | `/produto/{id}/vender`         | Autenticado   | Registra venda e baixa estoque                      |
| POST   | `/produto/{id}/entrada`        | Autenticado   | Registra entrada de estoque                         |
| GET    | `/venda/relatorio`             | Autenticado   | Relatório agregado de vendas                        |

---

## Exclusão de produtos

Produtos sem vendas registradas são excluídos permanentemente. Produtos que já possuem histórico de vendas são desativados em vez de excluídos, preservando a integridade dos relatórios e do histórico financeiro do sistema. Produtos desativados podem ser consultados e reativados a qualquer momento na tela de Produtos.

---

## Decisões técnicas e possíveis melhorias

Documentar isso é parte de manter um projeto honesto sobre suas limitações atuais:

- **CSRF desabilitado** — o frontend consome a API via chamadas JSON/Fetch, não via formulários tradicionais com cookie de sessão; uma evolução natural seria migrar para autenticação via JWT, eliminando esse problema de raiz
- **Foto de perfil em base64 no banco** — funciona bem na escala atual, mas armazenamento de arquivos dedicado (ex: S3) seria mais adequado para produção
- **Verificação de papel administrativo** — hoje é feita manualmente dentro dos métodos do `UsuarioController`; o Spring Security oferece anotações como `@PreAuthorize` que poderiam simplificar essa lógica

---

## Estrutura do projeto

```
src/main/java/com/kaique/crudapi/
├── Controller/       # Endpoints REST
├── Interface/        # Repositórios (Spring Data JPA)
├── Model/            # Entidades JPA
├── Service/          # Regras de negócio
├── SecurityConfig    # Configuração do Spring Security
└── CrudApiApplication

src/main/resources/
├── static/           # Frontend (HTML, CSS, JS por página)
└── application.properties
```

---

## Autor

Desenvolvido por **Kaique Emanuel**, estudante de Engenharia de Software.