import { loadCSS } from '/tools/helpers.js'

export async function fetchServiceUI(service) {
  const res = await fetch(`/services/${service.id}/ui.js`);
  await loadCSS(`/services/${service.id}/ui.css`);
  const html = await res.text();

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;

  return wrapper;
}
