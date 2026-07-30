# Bot Achadinhos

Painel web para gerar publicações de produtos da Shopee prontas para copiar e publicar manualmente nos Canais do WhatsApp **Achadinhos Tech** e **Achadinhos It Girls**.

## Objetivo

Facilitar a criação de legendas padronizadas para divulgação de achadinhos da Shopee, com formatação de preços, cupons, benefícios e links de afiliado — sem automação do WhatsApp.

## Tecnologias

- Node.js
- Express
- HTML, CSS e JavaScript puro
- Arquivo JSON como banco de dados local
- Nodemon (desenvolvimento)
- CORS

## Estrutura de pastas

```text
bot-achadinhos/
├── data/
│   └── products.json
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Instalação

```bash
npm install
```

## Executar

Modo desenvolvimento (com reload automático):

```bash
npm run dev
```

Modo produção:

```bash
npm start
```

## Acessar no navegador

Abra:

```text
http://localhost:3000
```

## Como usar o painel

1. Selecione o canal (**Achadinhos Tech** ou **Achadinhos It Girls**).
2. Preencha o nome do produto, preço atual e link de afiliado (campos obrigatórios).
3. Opcionalmente, informe preço anterior, emoji, cupom e benefícios (um por linha).
4. Clique em **Gerar publicação**.
5. Revise o texto na pré-visualização e faça ajustes se necessário.
6. Clique em **Copiar publicação** e cole manualmente no seu Canal do WhatsApp.
7. Consulte o histórico para copiar, visualizar ou excluir publicações anteriores.

## Como gerar um link de afiliado

1. Acesse o programa de afiliados da Shopee.
2. Encontre o produto desejado e gere o link de afiliado.
3. Copie o link (deve começar com `http://` ou `https://`).
4. Cole o link no campo **Link de afiliado** do formulário.

## Publicação manual no WhatsApp

Este sistema **não publica automaticamente** no WhatsApp. Ele apenas gera o texto formatado para você copiar e colar manualmente no Canal.

**Não utiliza automações não oficiais** do WhatsApp, como Puppeteer, Selenium, whatsapp-web.js ou similares.

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/status` | Status do servidor |
| GET | `/api/products` | Lista publicações (mais recentes primeiro) |
| POST | `/api/posts/generate` | Gera e salva uma publicação |
| DELETE | `/api/products/:id` | Exclui uma publicação |
# bot-whatsApp
