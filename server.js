const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, '[]', 'utf-8');
  }
}

function readProducts() {
  try {
    ensureDataFile();
    const content = fs.readFileSync(PRODUCTS_FILE, 'utf-8').trim();

    if (!content) {
      return [];
    }

    const data = JSON.parse(content);

    if (!Array.isArray(data)) {
      console.error('Arquivo products.json inválido: esperado um array.');
      return [];
    }

    return data;
  } catch (error) {
    console.error('Erro ao ler products.json:', error.message);
    return [];
  }
}

function writeProducts(products) {
  try {
    ensureDataFile();
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Erro ao escrever products.json:', error.message);
    return false;
  }
}

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function parseBenefits(benefits) {
  if (!benefits || typeof benefits !== 'string') {
    return [];
  }

  return benefits
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function formatBenefitsBlock(benefits) {
  const lines = parseBenefits(benefits);

  if (lines.length === 0) {
    return '';
  }

  return lines.map((line) => `✅ ${line}`).join('\n');
}

function generateTechPost({ name, currentPrice, previousPrice, emoji, coupon, benefits, affiliateLink }) {
  const productEmoji = emoji && emoji.trim() ? emoji.trim() : '📱';
  const lines = [
    '🔥 ACHADINHO TECH',
    '',
    `${productEmoji} ${name.trim()}`,
    '',
  ];

  if (previousPrice && previousPrice > 0) {
    lines.push(`De ${formatPrice(previousPrice)}`);
  }

  lines.push(`Por apenas ${formatPrice(currentPrice)} 😱`);

  const benefitsBlock = formatBenefitsBlock(benefits);
  if (benefitsBlock) {
    lines.push('', benefitsBlock);
  }

  if (coupon && coupon.trim()) {
    lines.push('', `🎟️ Cupom: ${coupon.trim()}`);
  }

  lines.push(
    '',
    '🛒 Comprar na Shopee:',
    affiliateLink.trim(),
    '',
    '⚠️ Preço, cupom e estoque podem mudar a qualquer momento.',
    '🔗 Este canal pode utilizar links de afiliado.'
  );

  return lines.join('\n');
}

function generateItGirlsPost({ name, currentPrice, previousPrice, emoji, coupon, benefits, affiliateLink }) {
  const productEmoji = emoji && emoji.trim() ? emoji.trim() : '🛍️';
  const lines = [
    '✨ ACHADINHO IT GIRL',
    '',
    `${productEmoji} ${name.trim()}`,
    '',
    'Meninas, olha esse achadinho! 😍',
    '',
  ];

  if (previousPrice && previousPrice > 0) {
    lines.push(`De ${formatPrice(previousPrice)}`);
  }

  lines.push(`Por apenas ${formatPrice(currentPrice)}`);

  const benefitsBlock = formatBenefitsBlock(benefits);
  if (benefitsBlock) {
    lines.push('', benefitsBlock);
  }

  if (coupon && coupon.trim()) {
    lines.push('', `🎟️ Cupom: ${coupon.trim()}`);
  }

  lines.push(
    '',
    '🛍️ Garanta o seu:',
    affiliateLink.trim(),
    '',
    '⚠️ Preço, cupom e estoque podem mudar a qualquer momento.',
    '🔗 Este canal pode utilizar links de afiliado.'
  );

  return lines.join('\n');
}

function validatePostBody(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return ['Corpo da requisição inválido.'];
  }

  const { channel, name, currentPrice, previousPrice, affiliateLink } = body;

  if (!channel || (channel !== 'tech' && channel !== 'itgirls')) {
    errors.push('Canal inválido. Use "tech" ou "itgirls".');
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Nome do produto é obrigatório.');
  }

  const parsedCurrentPrice = Number(currentPrice);
  if (Number.isNaN(parsedCurrentPrice) || parsedCurrentPrice <= 0) {
    errors.push('Preço atual deve ser maior que zero.');
  }

  if (previousPrice !== undefined && previousPrice !== null && previousPrice !== '') {
    const parsedPreviousPrice = Number(previousPrice);
    if (Number.isNaN(parsedPreviousPrice) || parsedPreviousPrice <= 0) {
      errors.push('Preço anterior deve ser maior que zero.');
    }
  }

  if (!affiliateLink || typeof affiliateLink !== 'string' || !affiliateLink.trim()) {
    errors.push('Link de afiliado é obrigatório.');
  } else if (!/^https?:\/\//i.test(affiliateLink.trim())) {
    errors.push('Link de afiliado deve começar com http:// ou https://.');
  }

  return errors;
}

app.get('/api/status', (_req, res) => {
  res.json({ message: 'Bot de achadinhos funcionando!' });
});

app.get('/api/products', (_req, res) => {
  const products = readProducts();
  const sorted = [...products].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(sorted);
});

app.post('/api/posts/generate', (req, res) => {
  const errors = validatePostBody(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const {
    channel,
    name,
    currentPrice,
    previousPrice,
    emoji,
    coupon,
    benefits,
    affiliateLink,
  } = req.body;

  const parsedCurrentPrice = Number(currentPrice);
  const parsedPreviousPrice =
    previousPrice !== undefined && previousPrice !== null && previousPrice !== ''
      ? Number(previousPrice)
      : null;

  const postData = {
    name,
    currentPrice: parsedCurrentPrice,
    previousPrice: parsedPreviousPrice,
    emoji: emoji || '',
    coupon: coupon || '',
    benefits: benefits || '',
    affiliateLink,
  };

  const generatedPost =
    channel === 'tech'
      ? generateTechPost(postData)
      : generateItGirlsPost(postData);

  const product = {
    id: crypto.randomUUID(),
    channel,
    name: name.trim(),
    currentPrice: parsedCurrentPrice,
    previousPrice: parsedPreviousPrice,
    emoji: emoji && emoji.trim() ? emoji.trim() : channel === 'tech' ? '📱' : '🛍️',
    coupon: coupon && coupon.trim() ? coupon.trim() : '',
    benefits: benefits || '',
    affiliateLink: affiliateLink.trim(),
    generatedPost,
    createdAt: new Date().toISOString(),
  };

  const products = readProducts();
  products.push(product);

  if (!writeProducts(products)) {
    return res.status(500).json({ errors: ['Erro ao salvar a publicação.'] });
  }

  res.status(201).json(product);
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const products = readProducts();
  const index = products.findIndex((product) => product.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'Publicação não encontrada.' });
  }

  products.splice(index, 1);

  if (!writeProducts(products)) {
    return res.status(500).json({ message: 'Erro ao excluir a publicação.' });
  }

  res.status(204).send();
});

ensureDataFile();

app.listen(PORT, () => {
  console.log(`Bot Achadinhos rodando em http://localhost:${PORT}`);
});
