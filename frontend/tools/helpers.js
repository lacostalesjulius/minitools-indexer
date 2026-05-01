const loadedCSS = new Set();

export function loadCSS(href) {
  if (loadedCSS.has(href)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;

    link.onload = () => {
      loadedCSS.add(href);
      resolve();
    };

    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));

    document.head.appendChild(link);
  });
}

export function isCSSLoaded(href) {
  return loadedCSS.has(href);
}

export function createElement(tag, className, id = "") {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (id) el.id = id;
  return el;
}

export async function renderComponent(cssPath, componentCreator, mountPoint) {
  await loadCSS(cssPath);

  const componentRefs = componentCreator();

  if (!componentRefs || !componentRefs.parent) {
    throw new Error('componentCreator must return an object containing at least { parent: HTMLElement }');
  }

  mountPoint.appendChild(componentRefs.parent);
  return componentRefs;
}

export function isValidURL(url) {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}
