// Builds DOM elements without innerHTML, so catalogue text is always inserted as text.
//
//   el('a', {class: 'module__link', href: 'module.html?id=asd3'}, 'ASD3')
//
// Attributes set to null, undefined or false are skipped. Children may be strings, nodes or arrays of them.
export function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === null || value === undefined || value === false) continue;
    if (name === 'class') node.className = value;
    else node.setAttribute(name, value === true ? '' : value);
  }
  node.append(...children.flat().filter(child => child !== null && child !== undefined && child !== false));
  return node;
}
