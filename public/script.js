const API_BASE = '/api';

const form = document.getElementById('post-form');
const submitBtn = document.getElementById('submit-btn');
const alertBox = document.getElementById('alert');
const previewSection = document.getElementById('preview-section');
const previewText = document.getElementById('preview-text');
const copyBtn = document.getElementById('copy-btn');
const clearFormBtn = document.getElementById('clear-form-btn');
const historyList = document.getElementById('history-list');
const modal = document.getElementById('modal');
const modalText = document.getElementById('modal-text');
const modalCopyBtn = document.getElementById('modal-copy-btn');

let alertTimeout = null;

function showAlert(message, type = 'success') {
  alertBox.textContent = message;
  alertBox.className = `alert alert--${type}`;
  alertBox.hidden = false;

  clearTimeout(alertTimeout);
  alertTimeout = setTimeout(() => {
    alertBox.hidden = true;
  }, 4000);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getChannelLabel(channel) {
  return channel === 'tech' ? 'Achadinhos Tech' : 'Achadinhos It Girls';
}

function validateForm(formData) {
  const errors = [];
  const name = formData.get('name').trim();
  const currentPrice = parseFloat(formData.get('currentPrice'));
  const previousPriceRaw = formData.get('previousPrice').trim();
  const affiliateLink = formData.get('affiliateLink').trim();
  const channel = formData.get('channel');

  if (!name) {
    errors.push('Nome do produto é obrigatório.');
  }

  if (Number.isNaN(currentPrice) || currentPrice <= 0) {
    errors.push('Preço atual deve ser maior que zero.');
  }

  if (previousPriceRaw) {
    const previousPrice = parseFloat(previousPriceRaw);
    if (Number.isNaN(previousPrice) || previousPrice <= 0) {
      errors.push('Preço anterior deve ser maior que zero.');
    }
  }

  if (!affiliateLink) {
    errors.push('Link de afiliado é obrigatório.');
  } else if (!/^https?:\/\//i.test(affiliateLink)) {
    errors.push('Link de afiliado deve começar com http:// ou https://.');
  }

  if (channel !== 'tech' && channel !== 'itgirls') {
    errors.push('Canal inválido.');
  }

  return errors;
}

function buildPayload(formData) {
  const payload = {
    channel: formData.get('channel'),
    name: formData.get('name').trim(),
    currentPrice: parseFloat(formData.get('currentPrice')),
    affiliateLink: formData.get('affiliateLink').trim(),
  };

  const previousPriceRaw = formData.get('previousPrice').trim();
  if (previousPriceRaw) {
    payload.previousPrice = parseFloat(previousPriceRaw);
  }

  const emoji = formData.get('emoji').trim();
  if (emoji) {
    payload.emoji = emoji;
  }

  const coupon = formData.get('coupon').trim();
  if (coupon) {
    payload.coupon = coupon;
  }

  const benefits = formData.get('benefits').trim();
  if (benefits) {
    payload.benefits = benefits;
  }

  return payload;
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
  showAlert('Publicação copiada com sucesso!');
}

function setSubmitLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? 'Gerando...' : 'Gerar publicação';
}

function clearForm() {
  form.reset();
  previewSection.hidden = true;
  previewText.value = '';
}

function openModal(text) {
  modalText.value = text;
  modal.hidden = false;
}

function closeModal() {
  modal.hidden = true;
  modalText.value = '';
}

function createHistoryItem(product) {
  const item = document.createElement('article');
  item.className = `history__item history__item--${product.channel}`;
  item.dataset.id = product.id;

  const info = document.createElement('div');
  info.className = 'history__info';

  const name = document.createElement('h3');
  name.className = 'history__name';
  name.textContent = product.name;

  const meta = document.createElement('div');
  meta.className = 'history__meta';

  const badge = document.createElement('span');
  badge.className = `history__badge history__badge--${product.channel}`;
  badge.textContent = getChannelLabel(product.channel);

  const price = document.createElement('span');
  price.textContent = formatCurrency(product.currentPrice);

  const date = document.createElement('span');
  date.textContent = formatDate(product.createdAt);

  meta.appendChild(badge);
  meta.appendChild(price);
  meta.appendChild(date);

  info.appendChild(name);
  info.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'history__actions';

  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.className = 'btn btn--secondary btn--small';
  copyButton.textContent = 'Copiar';
  copyButton.addEventListener('click', () => {
    copyToClipboard(product.generatedPost).catch(() => {
      showAlert('Não foi possível copiar a publicação.', 'error');
    });
  });

  const viewButton = document.createElement('button');
  viewButton.type = 'button';
  viewButton.className = 'btn btn--ghost btn--small';
  viewButton.textContent = 'Visualizar';
  viewButton.addEventListener('click', () => {
    openModal(product.generatedPost);
  });

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'btn btn--danger btn--small';
  deleteButton.textContent = 'Excluir';
  deleteButton.addEventListener('click', () => {
    deleteProduct(product.id, item);
  });

  actions.appendChild(copyButton);
  actions.appendChild(viewButton);
  actions.appendChild(deleteButton);

  item.appendChild(info);
  item.appendChild(actions);

  return item;
}

function renderHistory(products) {
  historyList.textContent = '';

  if (!products.length) {
    const empty = document.createElement('p');
    empty.className = 'history__empty';
    empty.textContent = 'Nenhuma publicação criada ainda.';
    historyList.appendChild(empty);
    return;
  }

  products.forEach((product) => {
    historyList.appendChild(createHistoryItem(product));
  });
}

async function loadHistory() {
  try {
    const response = await fetch(`${API_BASE}/products`);

    if (!response.ok) {
      throw new Error('Falha ao carregar histórico.');
    }

    const products = await response.json();
    renderHistory(products);
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

async function deleteProduct(id, itemElement) {
  const confirmed = window.confirm('Deseja realmente excluir esta publicação?');

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
    });

    if (response.status === 404) {
      const data = await response.json();
      throw new Error(data.message || 'Publicação não encontrada.');
    }

    if (!response.ok && response.status !== 204) {
      throw new Error('Erro ao excluir a publicação.');
    }

    itemElement.remove();

    if (!historyList.querySelector('.history__item')) {
      renderHistory([]);
    }

    showAlert('Publicação excluída com sucesso!');
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const errors = validateForm(formData);

  if (errors.length > 0) {
    showAlert(errors.join(' '), 'error');
    return;
  }

  setSubmitLoading(true);

  try {
    const response = await fetch(`${API_BASE}/posts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(formData)),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data.errors ? data.errors.join(' ') : 'Erro ao gerar publicação.';
      throw new Error(message);
    }

    previewText.value = data.generatedPost;
    previewSection.hidden = false;
    previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const newItem = createHistoryItem(data);
    const emptyMessage = historyList.querySelector('.history__empty');

    if (emptyMessage) {
      emptyMessage.remove();
    }

    historyList.prepend(newItem);
    showAlert('Publicação gerada com sucesso!');
  } catch (error) {
    showAlert(error.message, 'error');
  } finally {
    setSubmitLoading(false);
  }
});

copyBtn.addEventListener('click', () => {
  const text = previewText.value.trim();

  if (!text) {
    showAlert('Não há publicação para copiar.', 'error');
    return;
  }

  copyToClipboard(text).catch(() => {
    showAlert('Não foi possível copiar a publicação.', 'error');
  });
});

clearFormBtn.addEventListener('click', clearForm);

modalCopyBtn.addEventListener('click', () => {
  copyToClipboard(modalText.value).catch(() => {
    showAlert('Não foi possível copiar a publicação.', 'error');
  });
});

document.querySelectorAll('[data-close-modal]').forEach((element) => {
  element.addEventListener('click', closeModal);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.hidden) {
    closeModal();
  }
});

loadHistory();
