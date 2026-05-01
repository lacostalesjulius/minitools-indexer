import { createElement, loadCSS } from '/tools/helpers.js';

const CSSPath = '/src/components/service-card/service-card.css';

const createServiceCard = (service_info, stateRef) => {
  const parent_card = createElement('div', 'service-card');

  const card_info = createElement('div', 'card-info');
  const card_bar = createElement('div', 'card-bar');

  const card_name = createElement('div', 'card-name');
  const card_status = createElement('div', 'card-status');

  const status_indicator = createElement('div', 'card-status-indicator');
  const status_text = createElement('div', 'card-status-text');

  parent_card.appendChild(card_info);
  parent_card.appendChild(card_bar);

  card_info.appendChild(card_name);
  card_info.appendChild(card_status);

  card_status.appendChild(status_indicator);
  card_status.appendChild(status_text);

  card_name.innerHTML = service_info.name;
  status_text.innerHTML = service_info.status;
  status_indicator.classList.add(service_info.status);
  card_bar.classList.add(service_info.healthy ? 'good' : 'bad');

  parent_card.onclick = () => stateRef.value = parent_card;

  return { parent_card };
}

await loadCSS(CSSPath);

export { createServiceCard };
