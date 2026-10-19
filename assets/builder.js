import { TEMPLATES, COLORS, TEXT_FIELDS, ENTRY_FIELDS, MAX_ENTRIES, STORAGE_KEY, blankResume, sampleResume, validateResume, escapeHTML, hasContent, renderResume, applyDesign, installResumeStyles, plainText, rtfDocument, htmlDocument, fileName } from './resume.mjs';

installResumeStyles();
const $ = selector => document.querySelector(selector);
const form = $('#resume-form');
const preview = $('#resume-preview');
const remember = $('#remember');
const status = $('#save-status');
const pageStyle = document.createElement('style');
document.head.append(pageStyle);
let data = blankResume();
let toastTimer;
let saveTimer;
let printTitle;
let pendingAction = false;
let storageSaved = false;

function notify(message) {
  clearTimeout(toastTimer);
  $('#notification').textContent = message;
  $('#notification').hidden = false;
  toastTimer = setTimeout(() => { $('#notification').hidden = true; }, 7000);
}
function saveDraft() {
  clearTimeout(saveTimer);
  if (!remember.checked) { storageSaved = false; status.textContent = 'Not saved · stays in this tab'; return; }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    storageSaved = true;
    status.textContent = 'Saved in this browser';
  } catch {
    storageSaved = false;
    status.textContent = 'Could not save · export a JSON backup';
    notify('Browser storage is unavailable or full. Export a JSON backup to keep your work.');
  }
}
function scheduleSave() {
  if (!remember.checked) return;
  clearTimeout(saveTimer);
  status.textContent = 'Saving locally…';
  saveTimer = setTimeout(saveDraft, 350);
}
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    data = validateResume(JSON.parse(stored));
    remember.checked = true;
    status.textContent = 'Saved draft restored';
  }
} catch { notify('The saved draft could not be restored. It has not been deleted; import a valid JSON backup or start fresh.'); }
const requestedTemplate = new URLSearchParams(location.search).get('template');
if (TEMPLATES.some(t => t.id === requestedTemplate)) data.design.template = requestedTemplate;

const dialog = $('#confirm-dialog');
function confirmReplace(title, description) {
  if (pendingAction) return Promise.resolve(false);
  pendingAction = true;
  $('#confirm-title').textContent = title;
  $('#confirm-description').textContent = description;
  return new Promise(resolve => {
    const finish = accepted => {
      pendingAction = false;
      dialog.close();
      $('#confirm-accept').removeEventListener('click', accept);
      $('#confirm-cancel').removeEventListener('click', cancel);
      dialog.removeEventListener('cancel', cancel);
      resolve(accepted);
    };
    const accept = () => finish(true);
    const cancel = event => { event.preventDefault(); finish(false); };
    $('#confirm-accept').addEventListener('click', accept);
    $('#confirm-cancel').addEventListener('click', cancel);
    dialog.addEventListener('cancel', cancel);
    dialog.showModal();
    $('#confirm-cancel').focus();
  });
}
function fitPreview() {
  const stage = $('#preview-stage');
  if (stage.hidden) return;
  const style = getComputedStyle(stage);
  const available = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const width = data.design.paper === 'letter' ? 816 : 794;
  const zoom = String(Math.min(1, Math.max(.15, available / width)));
  if (preview.style.zoom !== zoom) preview.style.zoom = zoom;
}
function updatePreview() {
  preview.innerHTML = renderResume(data);
  applyDesign(preview, data.design);
  $('#preview-meta').textContent = `${TEMPLATES.find(t => t.id === data.design.template).name} · ${data.design.paper === 'a4' ? 'A4' : 'Letter'}`;
  pageStyle.textContent = `@page { size: ${data.design.paper === 'letter' ? 'letter' : 'A4'}; margin: 14mm; }`;
  fitPreview();
}
function renderEntries(section) {
  const entries = data[section];
  $(`#${section}-entries`).innerHTML = entries.map((entry, index) => {
    const label = section === 'experience' ? 'Experience' : section === 'education' ? 'Education' : 'Project';
    const fields = ENTRY_FIELDS[section].map(([key, title]) => {
      const id = `${section}-${index}-${key}`;
      const attributes = `id="${id}" data-section="${section}" data-index="${index}" data-field="${key}"`;
      let input;
      if (key === 'description') input = `<textarea ${attributes} rows="3" maxlength="10000" placeholder="One achievement per line">${escapeHTML(entry[key] || '')}</textarea>`;
      else input = `<input ${attributes} type="${['start', 'end'].includes(key) ? 'month' : key === 'url' ? 'url' : 'text'}" maxlength="${key === 'url' ? 500 : 160}" value="${escapeHTML(entry[key] || '')}"${key === 'end' && entry.start ? ` min="${escapeHTML(entry.start)}"` : ''}>`;
      return `<label class="${['description', 'url', 'role', 'degree', 'name'].includes(key) ? 'full' : ''}" for="${id}">${title}${input}</label>`;
    }).join('');
    return `<article class="entry-card"><header class="entry-header"><h3>${label} ${index + 1}</h3><div class="entry-actions"><button type="button" data-action="up" data-section="${section}" data-index="${index}" aria-label="Move ${label.toLowerCase()} ${index + 1} up"${index === 0 ? ' disabled' : ''}>↑</button><button type="button" data-action="down" data-section="${section}" data-index="${index}" aria-label="Move ${label.toLowerCase()} ${index + 1} down"${index === entries.length - 1 ? ' disabled' : ''}>↓</button><button type="button" data-action="remove" data-section="${section}" data-index="${index}" aria-label="Remove ${label.toLowerCase()} ${index + 1}">Remove</button></div></header><div class="fields">${fields}</div>${section !== 'projects' ? '<p class="field-help">Leave end date blank for a current role or course.</p>' : ''}</article>`;
  }).join('');
  $(`[data-add="${section}"]`).disabled = entries.length >= MAX_ENTRIES;
}
function populateForm() {
  for (const key of TEXT_FIELDS) form.elements.namedItem(key).value = data[key];
  for (const section of Object.keys(ENTRY_FIELDS)) renderEntries(section);
}
function updateColorControls() {
  $('#custom-color').value = data.design.color;
  document.querySelectorAll('.swatch').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.color.toLowerCase() === data.design.color.toLowerCase())));
  const channels = data.design.color.slice(1).match(/../g).map(n => parseInt(n, 16) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
  const contrast = 1.05 / (.2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2] + .05);
  $('#color-note').textContent = contrast < 4.5 ? 'This light accent may be hard to read on white. A darker color is recommended.' : 'This accent has good text contrast on white.';
}
function populateDesign() {
  $(`#template-${data.design.template}`).checked = true;
  for (const key of ['font', 'density', 'paper']) $(`#${key}`).value = data.design[key];
  updateColorControls();
}
function refreshAll() { populateForm(); populateDesign(); updatePreview(); saveDraft(); }
$('#template-options').innerHTML = TEMPLATES.map(t => `<label class="template-choice"><input type="radio" name="template" id="template-${t.id}" value="${t.id}"><span>${t.name}<small>${t.description}</small></span></label>`).join('');
for (const [name, color] of COLORS) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'swatch';
  button.dataset.color = color;
  button.style.backgroundColor = color;
  button.setAttribute('aria-label', `${name} accent`);
  button.title = name;
  button.addEventListener('click', () => { data.design.color = color; updateColorControls(); updatePreview(); scheduleSave(); });
  $('#color-options').append(button);
}
const tabs = [$('#content-tab'), $('#design-tab')];
function selectTab(index) {
  tabs.forEach((tab, i) => {
    const selected = index === i;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    $(`#${tab.getAttribute('aria-controls')}`).hidden = !selected;
  });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(index));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index;
    selectTab(target);
    tabs[target].focus();
  });
});
form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('input', event => {
  const input = event.target;
  if (input.dataset.section) {
    const section = input.dataset.section;
    const index = Number(input.dataset.index);
    data[section][index][input.dataset.field] = input.value;
    if (input.dataset.field === 'start') {
      const end = $(`#${section}-${index}-end`);
      if (input.value) end.min = input.value; else end.removeAttribute('min');
    }
  } else if (TEXT_FIELDS.includes(input.name)) data[input.name] = input.value;
  updatePreview();
  scheduleSave();
});
form.addEventListener('click', event => {
  const add = event.target.closest('[data-add]');
  if (add) {
    const section = add.dataset.add;
    if (data[section].length >= MAX_ENTRIES) { notify('Each section supports up to 20 entries.'); return; }
    data[section].push(Object.fromEntries(ENTRY_FIELDS[section].map(([key]) => [key, ''])));
    renderEntries(section);
    $(`#${section}-entries .entry-card:last-child input`).focus();
    updatePreview(); scheduleSave(); return;
  }
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { section, action } = button.dataset;
  const index = Number(button.dataset.index);
  if (action === 'remove') data[section].splice(index, 1);
  else {
    const next = index + (action === 'up' ? -1 : 1);
    [data[section][index], data[section][next]] = [data[section][next], data[section][index]];
  }
  renderEntries(section);
  const nextIndex = action === 'remove' ? Math.min(index, data[section].length - 1) : index + (action === 'up' ? -1 : 1);
  const focus = nextIndex >= 0 ? $(`#${section}-entries [data-action="${action}"][data-index="${nextIndex}"]`) : $(`[data-add="${section}"]`);
  (focus && !focus.disabled ? focus : $(`[data-add="${section}"]`)).focus();
  updatePreview(); scheduleSave();
});
$('#template-options').addEventListener('change', event => { data.design.template = event.target.value; updatePreview(); scheduleSave(); });
$('#custom-color').addEventListener('input', event => { data.design.color = event.target.value; updateColorControls(); updatePreview(); scheduleSave(); });
for (const key of ['font', 'density', 'paper']) $(`#${key}`).addEventListener('change', event => { data.design[key] = event.target.value; updatePreview(); scheduleSave(); });
remember.addEventListener('change', () => {
  clearTimeout(saveTimer);
  if (remember.checked) { saveDraft(); return; }
  try { localStorage.removeItem(STORAGE_KEY); status.textContent = 'Not saved · stays in this tab'; }
  catch { status.textContent = 'Could not delete saved draft'; notify('Browser storage is blocked. Clear this site’s storage in browser settings to remove any saved copy.'); }
});
$('#load-sample').addEventListener('click', async () => {
  if (hasContent(data) && !await confirmReplace('Try the sample?', 'This replaces your current content. Export a JSON backup first if you want to keep it.')) return;
  const design = data.design;
  data = sampleResume(); data.design = design;
  refreshAll(); notify('Sample loaded. Replace the example details with your own.');
});
$('#clear-draft').addEventListener('click', async () => {
  if (!await confirmReplace('Clear this draft?', 'This removes the resume from this tab and deletes its saved browser copy. Downloaded files are not deleted.')) return;
  data = blankResume(); remember.checked = false; clearTimeout(saveTimer);
  try { localStorage.removeItem(STORAGE_KEY); }
  catch { notify('Draft cleared from this tab, but browser storage is blocked. Remove this site’s saved data in browser settings.'); refreshAll(); return; }
  refreshAll(); notify('Draft and saved browser copy cleared.');
});
$('#import-button').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; event.target.value = '';
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { notify('Choose a JSON backup smaller than 2 MB.'); return; }
  try {
    const imported = validateResume(JSON.parse(await file.text()));
    if (hasContent(data) && !await confirmReplace('Import this backup?', 'Your current content and design will be replaced. Export a backup first if you want to keep them.')) return;
    data = imported; refreshAll(); notify('Resume and design restored from your backup.');
  } catch (error) { notify(error instanceof SyntaxError ? 'That file is not valid JSON. Choose a Resume Maker Pro backup.' : error.message); }
});
$('#preview-toggle').addEventListener('click', () => {
  const stage = $('#preview-stage'); stage.hidden = !stage.hidden;
  $('#preview-toggle').textContent = stage.hidden ? 'Show preview' : 'Hide preview';
  $('#preview-toggle').setAttribute('aria-expanded', String(!stage.hidden));
  fitPreview();
});
function downloadFile(content, extension, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a');
  link.href = url; link.download = `${fileName(data)}.${extension}`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function validateForExport() {
  if (!data.name.trim()) { selectTab(0); form.elements.name.closest('details').open = true; form.elements.name.focus(); notify('Add your name before exporting a resume. JSON backups can be saved at any time.'); return false; }
  if (!form.checkValidity()) {
    selectTab(0);
    for (const detail of form.querySelectorAll('details')) if (detail.querySelector(':invalid')) detail.open = true;
    form.reportValidity(); notify('Check email, web addresses, and date ranges before exporting.'); return false;
  }
  return true;
}
$('#download').addEventListener('click', () => {
  const format = $('#export-format').value;
  if (format !== 'json' && !validateForExport()) return;
  saveDraft();
  if (format === 'pdf') {
    printTitle = document.title; document.title = fileName(data);
    window.print();
    return;
  }
  if (format === 'json') downloadFile(JSON.stringify(data, null, 2), 'json', 'application/json;charset=utf-8');
  if (format === 'txt') downloadFile(plainText(data), 'txt', 'text/plain;charset=utf-8');
  if (format === 'rtf') downloadFile(rtfDocument(data), 'rtf', 'application/rtf');
  if (format === 'html') downloadFile(htmlDocument(data), 'html', 'text/html;charset=utf-8');
  notify(`${format.toUpperCase()} export prepared. Check your browser's downloads.`);
});
window.addEventListener('afterprint', () => { if (printTitle) { document.title = printTitle; printTitle = undefined; } fitPreview(); });
window.addEventListener('pagehide', saveDraft);
window.addEventListener('beforeunload', event => {
  saveDraft();
  if (!storageSaved && hasContent(data)) { event.preventDefault(); event.returnValue = ''; }
  else saveDraft();
});
document.addEventListener('visibilitychange', () => { if (document.hidden && remember.checked) saveDraft(); });
if ('ResizeObserver' in window) new ResizeObserver(fitPreview).observe($('#preview-stage'));
window.addEventListener('resize', fitPreview);
populateForm(); populateDesign(); updatePreview();
if (remember.checked && requestedTemplate) saveDraft();
