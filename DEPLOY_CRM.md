# Publicação do CRM

O projeto usa quatro serviços independentes:

- Vercel: painel Next.js.
- Supabase: PostgreSQL.
- Render: processo Baileys que mantém o WhatsApp conectado.
- OpenAI: respostas do agente.

## 1. Supabase

1. Abra o SQL Editor do projeto.
2. Execute `supabase/migrations/202608220001_crm_sales_agent.sql`.
3. Copie a URL PostgreSQL do pooler com SSL.
4. Use a mesma `DATABASE_URL` na Vercel e na Render.

O aplicativo não usa a chave pública do Supabase: o acesso acontece diretamente pelo PostgreSQL e todas as consultas do painel são filtradas pelo usuário autenticado no Clerk.

## 2. Clerk

Crie ou reutilize uma aplicação e configure:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`

Cadastre o webhook `https://SEU-DOMINIO/api/webhooks/clerk` para o evento `user.created`.

## 3. Segredos compartilhados

Crie dois valores aleatórios longos e diferentes:

- `APP_ENCRYPTION_KEY`: cifra a chave da OpenAI no banco.
- `WHATSAPP_SERVICE_TOKEN`: autentica chamadas privadas entre Vercel e Render.

O valor de cada variável deve ser exatamente o mesmo nos dois serviços quando ela for usada por ambos. Nunca salve esses valores no Git.

## 4. Vercel

Configure:

- Todas as variáveis do Clerk.
- `DATABASE_URL`.
- `APP_ENCRYPTION_KEY`.
- `WHATSAPP_SERVICE_URL=https://NOME-DO-SERVICO.onrender.com`.
- `WHATSAPP_SERVICE_TOKEN`.
- `NEXT_PUBLIC_URL=https://SEU-DOMINIO`.

Depois do deploy, faça login uma vez para que seu usuário seja criado no banco.

## 5. Render

Use o `render.yaml` ou crie um Web Service com:

- Build: `npm install --legacy-peer-deps && npm run build:whatsapp`
- Start: `npm run start:whatsapp`
- Health check: `/health`

Configure:

- `DATABASE_URL`.
- `APP_ENCRYPTION_KEY`.
- `WHATSAPP_SERVICE_TOKEN`.
- `CRM_OWNER_EMAIL`: o mesmo e-mail usado no login do CRM.
- `WHATSAPP_SESSION_DIR=/var/data/whatsapp-session`.
- `OPENAI_API_KEY`: opcional quando a chave for cadastrada no painel.

Monte um disco persistente em `/var/data`. Sem armazenamento persistente, a sessão por QR Code pode ser perdida após uma nova publicação ou reinicialização.

## 6. Primeiro uso

1. Entre no painel.
2. Abra **Configuração comercial** e cadastre o Pix, regras, pacotes e portfólio.
3. Abra **Agentes IA**, cadastre a chave da OpenAI e ative um agente.
4. Abra **WhatsApp** e clique em **Tentar conectar**.
5. Escaneie o QR Code real.
6. Envie uma mensagem de outro número e confirme que o lead e o histórico apareceram.

## 7. Pix manual e atendimento humano

O agente apenas envia a chave configurada e informa que a conferência é manual. No chat ou no card do lead:

- **Assumir** pausa a IA para aquele contato.
- **Ativar IA** devolve a conversa para o agente.
- **Pix pago** marca o lead como pago e pausa a IA automaticamente.

Não confirme pagamentos a partir de capturas de tela; confira o recebimento na conta antes de clicar em **Pix pago**.

