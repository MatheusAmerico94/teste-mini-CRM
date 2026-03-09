# Guia Definitivo: Colocando seu Agente WhatsApp na Nuvem (100% Grátis)

Para seu bot funcionar 24 horas por dia com seu computador desligado, vamos dividir o projeto em **dois servidores gratuitos**:

1. **Vercel**: Vai hospedar o seu Painel Web (CRM).
2. **Render.com**: Vai hospedar o robô do WhatsApp (Baileys) rodando eternamente.

---

## 🚀 Passo 1: Subir o código para o GitHub
Tanto a Vercel quanto o Render precisam ler os arquivos do seu projeto. O jeito mais fácil é subir no GitHub.

1. Crie uma conta no [GitHub](https://github.com/) (se não tiver).
2. Baixe e instale o [GitHub Desktop](https://desktop.github.com/).
3. No GitHub Desktop:
   - File > Add Local Repository... e escolha a pasta `mini-crm-tutorial-main`.
   - Clique no botão azul **"Publish repository"** no topo.
   - Dê um nome (ex: `meu-crm-zap`) e certifique-se de marcar "Keep this code private" (Mantenha o código privado para ninguém roubar suas senhas).

---

## 🖥️ Passo 2: Hospedar o Site na Vercel
1. Acesse a [Vercel](https://vercel.com/) e faça login com sua conta do GitHub.
2. Clique no botão preto **"Add New..."** > **"Project"**.
3. Do lado esquerdo, você vai ver o seu repositório `meu-crm-zap`. Clique em **Import**.
4. Expanda a seção **"Environment Variables"** (Variáveis de Ambiente) e adicione suas chaves do arquivo `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: (Copie do seu .env.local)
   - `CLERK_SECRET_KEY`: (Copie do seu .env.local)
   - `DATABASE_URL`: (Sua URL do Supabase)
   - `OPENAI_API_KEY`: (Sua chave sk-proj da OpenAI)
5. Clique em **Deploy**. Espere uns 3 minutinhos e seu painel CRM estará no ar em um link estilo `seu-crm.vercel.app`.

---

## 🤖 Passo 3: Hospedar o Robô WhatsApp no Render
Como o WhatsApp precisa ficar sempre conectado, usaremos um "Web Service" gratuito no Render.

1. Acesse o [Render.com](https://render.com/) e faça login usando o GitHub.
2. Nós já criamos um arquivo mágico chamado `render.yaml` na raiz do projeto. Por isso, clique no botão **"New +"** (no topo à direita) e escolha **"Blueprint"**.
3. Na lista, clique no seu repositório do GitHub `meu-crm-zap` e clique em **Connect**.
4. O Render vai ler o arquivo `render.yaml` sozinho! Ele vai pedir para você preencher os valores (Environment Variables) abaixo na tela:
   - `OPENAI_API_KEY`: A mesma chave que você usou na Vercel.
   - `DATABASE_URL`: A mesma Connection String do Supabase.
5. Clique em **Apply** e espere (o primeiro *Build* demora uns 4 a 5 minutos, tenha paciência).

---

## 📸 Passo 4: Escanear o QR Code
1. Quando o robô estiver "Live" no Render.com, acesse seu **Painel Web (na Vercel)** que você criou no Passo 2.
2. Faça login com seu e-mail/Clerk.
3. Clique em **Conversas** ou **Configuração WhatsApp** na barra lateral.
4. Escaneie o QR Code usando seu WhatsApp no celular (Aparelhos Conectados > Conectar aparelho).

---

### ⚠️ Dica de Ouro Pro Bot Nunca Dormir (Opcional, mas recomendado)
Servidores gratuitos no Render "dormem" (desligam) se ficarem muito tempo sem acesso. 
O WhatsApp Bot não cria um link de site pra você acessar externamente, portanto, no render.yaml, ele age apenas como um processo. 

A forma gratuita mais estável que você tem hoje para o provedor Node (Background Worker Gratuito não existe no Render sem cartão) é:
O nosso `render.yaml` criou um Serviço **"Web Service"** falso que fica rodando eternamente graças ao bot rodando por trás.

**Use o UptimeRobot:**
1. Crie uma conta no [UptimeRobot](https://uptimerobot.com/).
2. Adicione um novo "Monitor" do tipo HTTP(s).
3. Na URL, coloque o link maluco que o Render te der (ex: `https://mini-crm-whatsapp-bot-xxxx.onrender.com`).
4. Coloque para dar "Ping" a cada 5 minutos.
5. Pronto! Agora seu WhatsApp Bot vai ficar rodando de forma perpétua grátis para sempre.

Mão na massa! Qualquer dúvida, o Agente de IA está aqui para ajudar.
