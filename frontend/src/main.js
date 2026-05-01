import { State } from '/tools/state.js';
import { createElement, renderComponent, loadCSS } from '/tools/helpers.js'
import { createEmptySnapshot, createService } from '/models/aggregator.js'
import { createServiceCard } from '/src/components/service-card/service-card.js'
import { connectToGate } from '/tools/gate_connection.js'
import { yt_dlp_ui } from '/services/media-dl.js'

// -----------------------------
// Definitions & and Imports 
// -----------------------------

const CSS = '/src/main.css'
const app = document.getElementById('app');

// -----------------------------
// Page Layout
// -----------------------------
function createComponent() {
  const parent = createElement('div', 'parent');

  const head = createElement('div', 'head');
  const main = createElement('div', 'main');
  const dock = createElement('div', 'dock');

  const logo = createElement('div', 'logo');
  const logoSVG = createElement('img', 'logo-svg');
  logoSVG.src = 'favicon.svg';
  const logoText = createElement('h1', 'logo-text');
  logoText.innerHTML = 'MiniTools';

  const section_names = ['services', 'content', 'home', 'logs', 'options'];

  let sections = {};
  let btns = {};

  section_names.forEach((name) => { 
    sections[name] = createElement('div', 'main-section', name);
    sections[name].dataset.target = name;

    btns[name] = createElement('div', 'button-div');
    btns[name].onclick = () => selected_section.value = sections[name];
    btns[name].innerHTML = `<img src='/${name}.svg' >`;

    main.appendChild(sections[name]);
    dock.appendChild(btns[name]);
  });
  sections.home.classList.add('active');
  btns.home.classList.add('active');
 
  parent.appendChild(head);
  parent.appendChild(main);
  parent.appendChild(dock);

  head.appendChild(logo);
  logo.appendChild(logoSVG);
  logo.appendChild(logoText);

  return { parent, sections, btns }
}

const {parent, sections, btns} = createComponent();

// -----------------------------
// State Hooks
// -----------------------------

/* States */
const selected_section = new State(sections['home']);
const aggregate_snapshot = new State(createEmptySnapshot());
const selected_service = new State(null);

/* Hooks */
selected_section.use((n, p) => {
  if (!n || n == null) return n = p;
  if (p == n) return;

  n.classList.add('active');
  p?.classList.remove('active');
  btns[n.dataset.target].classList.add('active');
  btns[p?.dataset.target].classList.remove('active');
});
aggregate_snapshot.use((n, p) => {
  if (!n || n == p) return;

  const container = sections['services'];
  container.innerHTML = '';

  n.services.forEach((service_info) => {
    const { parent_card } = createServiceCard(service_info, selected_service);
    container.appendChild(parent_card);
  });
});
selected_service.use((n, p) => {
  if (!n || n == p) return;

  n?.classList.add('active');
  p?.classList.remove('active');

  const container = sections['home'];
  container.innerHTML = '';

  loadCSS('/src/forms.css')
  let service_ui = yt_dlp_ui.parent;
  container.appendChild(service_ui);

  btns['home'].click();
})

// -----------------------------
// Rendering
// -----------------------------
renderComponent(CSS, () => ({ parent }), app);

/* Hard Coded */
selected_section.value = sections['services'];

connectToGate(aggregate_snapshot)
