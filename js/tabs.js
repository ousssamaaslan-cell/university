// Accessible tabs: a row of tab buttons and one panel, which the page redraws for the selected tab.
//
// Keyboard: Tab reaches the selected tab; the arrow keys move to the next or previous tab
// (mirrored in Arabic, where "next" is to the left); Home and End jump to the first and last.
import {el} from './dom.js';

// `tabs` is a list of {id, label, count, countLabel}. `onSelect(id, panel)` runs when the reader picks a tab.
// The caller draws the first panel itself, so opening the page does not count as a choice.
export function createTabs({label, tabs, selected, onSelect}) {
  const panel = el('div', {class: 'tab-panel', role: 'tabpanel', id: 'tab-panel', tabindex: '0'});

  const buttons = tabs.map(tab =>
    el('button', {class: 'tab', type: 'button', role: 'tab', id: `tab-${tab.id}`, 'aria-controls': 'tab-panel', 'data-tab': tab.id},
      el('span', {class: 'tab__label'}, tab.label),
      // Sighted readers see the bare number; screen readers hear it with its unit ("5 documents").
      el('span', {class: 'tab__count', 'aria-hidden': 'true'}, String(tab.count)),
      el('span', {class: 'visually-hidden'}, `, ${tab.countLabel}`)
    )
  );
  const tablist = el('div', {class: 'tabs', role: 'tablist', 'aria-label': label}, buttons);

  function mark(id) {
    for (const button of buttons) {
      const isSelected = button.dataset.tab === id;
      button.setAttribute('aria-selected', String(isSelected));
      button.tabIndex = isSelected ? 0 : -1;
      if (isSelected) panel.setAttribute('aria-labelledby', button.id);
    }
  }

  function select(button) {
    mark(button.dataset.tab);
    button.focus();
    onSelect(button.dataset.tab, panel);
  }

  tablist.addEventListener('click', event => {
    const button = event.target.closest('[role="tab"]');
    if (button && button.getAttribute('aria-selected') !== 'true') select(button);
  });

  tablist.addEventListener('keydown', event => {
    const index = buttons.indexOf(document.activeElement);
    if (index === -1) return;
    const isRtl = document.documentElement.dir === 'rtl';
    const last = buttons.length - 1;
    const moves = {
      [isRtl ? 'ArrowLeft' : 'ArrowRight']: index === last ? 0 : index + 1,
      [isRtl ? 'ArrowRight' : 'ArrowLeft']: index === 0 ? last : index - 1,
      Home: 0,
      End: last
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(buttons[moves[event.key]]);
  });

  mark(selected);
  return {tablist, panel};
}
