# Backend do site TW7

Servidor Node.js (Express + Nodemailer) que recebe as solicitações do formulário do site e envia um e-mail com todos os dados preenchidos para **tw7group@gmail.com**.

## Como configurar

### 1. Criar a senha de app do Gmail (usada para enviar)

1. Ative a **Verificação em 2 etapas** na conta do Gmail que enviará os e-mails (https://myaccount.google.com/security)
2. Acesse https://myaccount.google.com/apppasswords
3. Crie uma senha de app e copie o código gerado

### 2. Configurar o arquivo `.env`

```powershell
Copy-Item .env.example .env
```

Abra o `.env` e preencha:

- `SMTP_USER` = o e-mail do Gmail que envia
- `SMTP_PASS` = a senha de app criada acima
- `RECIPIENT_EMAIL` = para onde as solicitações devem ir (padrão: `tw7group@gmail.com`)

> **Importante:** o arquivo `.env` NÃO deve ser enviado ao GitHub (ele está no `.gitignore`).

### 3. Instalar e rodar

```powershell
npm install
npm start
```

O servidor sobe em `http://localhost:3000`.

### 4. Ligar o site ao backend

No arquivo `js/main.js` do site, ajuste a constante `BACKEND_URL` para o endereço público do backend (ex.: `https://api.tw7.com.br` ou o domínio da plataforma onde ele estiver hospedado).

## Endpoints

| Método | Rota          | Descrição |
| ------ | ------------- | --------- |
| POST   | `/api/contact`| Recebe `{ nome, email, tag, interesse, mensagem }` e envia o e-mail |
| GET    | `/api/health` | Verifica se o serviço está no ar |

## Testando localmente

```powershell
curl -X POST http://localhost:3000/api/contact -H "Content-Type: application/json" -d '{"nome":"Teste","email":"teste@email.com","tag":"ABC","interesse":"jogador","mensagem":"Oi"}'
```

## Colocando em produção

Este backend pode ser hospedado gratuitamente em plataformas como **Render**, **Railway** ou **Fly.io**, ou em uma VPS. Em qualquer hospedagem, preencha as mesmas variáveis de ambiente do `.env` e aponte a `BACKEND_URL` do site para a URL pública.

> Lembrete: o GitHub Pages é estático — ele **não** executa este servidor. O backend precisa rodar em um serviço próprio.