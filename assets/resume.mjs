export const TEMPLATES = [
  { id: 'modern', name: 'Modern', description: 'A confident header. A clean finish.' },
  { id: 'classic', name: 'Classic', description: 'Timeless, balanced, understated.' },
  { id: 'editorial', name: 'Editorial', description: 'Distinctive type. Thoughtful details.' },
  { id: 'compact', name: 'Compact', description: 'More experience. Less space.' }
];
export const COLORS = [
  ['Forest', '#245c48'], ['Navy', '#243d65'], ['Terracotta', '#984631'],
  ['Plum', '#70436b'], ['Slate', '#475569'], ['Black', '#202824']
];
export const PERSONAL = ['name', 'title', 'email', 'phone', 'location', 'website', 'linkedin'];
export const TEXT_FIELDS = [...PERSONAL, 'summary', 'skills', 'certifications', 'languages'];
export const ENTRY_FIELDS = {
  experience: [['role', 'Job title'], ['organization', 'Company'], ['location', 'Location'], ['start', 'Start date'], ['end', 'End date'], ['description', 'Achievements / responsibilities']],
  education: [['degree', 'Degree / qualification'], ['institution', 'School / university'], ['location', 'Location'], ['start', 'Start date'], ['end', 'End date'], ['description', 'Details / achievements']],
  projects: [['name', 'Project name'], ['url', 'Project URL'], ['description', 'What you built / achieved']]
};
export const MAX_ENTRIES = 20;
export const STORAGE_KEY = 'resume-maker-pro.v1';
export function blankResume() {
  return { version: 1, ...Object.fromEntries(TEXT_FIELDS.map(key => [key, ''])), experience: [], education: [], projects: [], design: { template: 'modern', color: '#245c48', font: 'sans', density: 'comfortable', paper: 'a4' } };
}
export function sampleResume() {
  return { ...blankResume(), name: 'Alex Morgan', title: 'Product Designer', email: 'alex@example.com', phone: '+1 555 012 3456', location: 'Portland, OR', website: 'https://example.com', summary: 'Product designer turning complex problems into clear, useful experiences. Bringing a research-led approach, a love for craft, and five years of thoughtful collaboration.', experience: [
    { role: 'Senior Product Designer', organization: 'Northstar Studio', location: 'Portland, OR', start: '2022-04', end: '', description: 'Led the redesign of a customer onboarding experience from research through delivery.\nPartnered with engineering to build a reusable, accessible design system.\nMentored two designers and introduced regular design critiques.' },
    { role: 'Product Designer', organization: 'Fieldwork', location: 'Remote', start: '2019-06', end: '2022-03', description: 'Designed web experiences for small businesses.\nTranslated customer interviews into practical product improvements.' }
  ], education: [{ degree: 'B.A. in Design', institution: 'Pacific Arts College', location: '', start: '2015-09', end: '2019-05', description: '' }], skills: 'Product strategy, User research, Interaction design, Figma, Prototyping, Accessibility', projects: [], languages: 'English (native), Spanish (conversational)' };
}
export function validateResume(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || input.version !== 1) throw new Error('Choose a version 1 Resume Maker Pro JSON backup.');
  const result = blankResume();
  const readText = (value, max = 10000) => {
    if (value === undefined) return '';
    if (typeof value !== 'string' || value.length > max) throw new Error('The backup contains invalid or oversized fields.');
    return value.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  };
  for (const key of TEXT_FIELDS) result[key] = readText(input[key], PERSONAL.includes(key) ? (['website', 'linkedin'].includes(key) ? 500 : 160) : 10000);
  for (const [section, fields] of Object.entries(ENTRY_FIELDS)) {
    const entries = input[section] ?? [];
    if (!Array.isArray(entries) || entries.length > MAX_ENTRIES) throw new Error('Each section supports up to 20 entries.');
    result[section] = entries.map(entry => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('The backup contains an invalid entry.');
      return Object.fromEntries(fields.map(([key]) => {
        const value = readText(entry[key], key === 'description' ? 10000 : key === 'url' ? 500 : 160);
        if (['start', 'end'].includes(key) && value && !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) throw new Error('Dates must use YYYY-MM format.');
        return [key, value];
      }));
    });
  }
  const d = input.design ?? {};
  if (d === null || typeof d !== 'object' || Array.isArray(d)) throw new Error('Invalid design settings.');
  if (TEMPLATES.some(t => t.id === d.template)) result.design.template = d.template;
  if (typeof d.color === 'string' && /^#[a-f0-9]{6}$/i.test(d.color)) result.design.color = d.color;
  if (['sans', 'serif'].includes(d.font)) result.design.font = d.font;
  if (['comfortable', 'compact'].includes(d.density)) result.design.density = d.density;
  if (['a4', 'letter'].includes(d.paper)) result.design.paper = d.paper;
  return result;
}
export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
export function displayDate(value) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return value;
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(value.slice(5)) - 1]} ${value.slice(0, 4)}`;
}
export function dates(entry) {
  return [displayDate(entry.start || ''), entry.end ? displayDate(entry.end) : entry.start ? 'Present' : ''].filter(Boolean).join(' – ');
}
export function hasContent(data) {
  return TEXT_FIELDS.some(k => data[k].trim()) || Object.keys(ENTRY_FIELDS).some(k => data[k].some(e => Object.values(e).some(v => v.trim())));
}
const lines = value => value.split('\n').map(line => line.trim()).filter(Boolean);
const present = entry => Object.values(entry).some(v => v.trim());
function section(title, content) { return content ? `<section class="resume-section"><h2>${title}</h2>${content}</section>` : ''; }
function bullets(value) { return value.trim() ? `<ul>${lines(value).map(line => `<li>${escapeHTML(line.replace(/^[•*-]\s+/, ''))}</li>`).join('')}</ul>` : ''; }
export function renderResume(data, placeholders = true) {
  const e = escapeHTML;
  const contact = [data.email, data.phone, data.location, data.website, data.linkedin].filter(v => v.trim());
  const work = data.experience.filter(present).map(entry => `<article class="resume-entry"><header><h3>${e(entry.role || entry.organization)}</h3><span>${e(dates(entry))}</span></header><p class="resume-subtitle">${e([entry.role ? entry.organization : '', entry.location].filter(Boolean).join(' · '))}</p>${bullets(entry.description)}</article>`).join('');
  const education = data.education.filter(present).map(entry => `<article class="resume-entry"><header><h3>${e(entry.degree || entry.institution)}</h3><span>${e(dates(entry))}</span></header><p class="resume-subtitle">${e([entry.degree ? entry.institution : '', entry.location].filter(Boolean).join(' · '))}</p>${bullets(entry.description)}</article>`).join('');
  const projects = data.projects.filter(present).map(entry => `<article class="resume-entry"><h3>${e(entry.name)}</h3>${entry.url ? `<p class="resume-subtitle">${e(entry.url)}</p>` : ''}${bullets(entry.description)}</article>`).join('');
  return `<header class="resume-header"><h1>${e(data.name || (placeholders ? 'Your name' : ''))}</h1>${data.title || placeholders ? `<p class="resume-title">${e(data.title || 'Your professional title')}</p>` : ''}${contact.length ? `<p class="resume-contact">${contact.map(v => `<span>${e(v)}</span>`).join('')}</p>` : ''}</header>${section('Profile', data.summary.trim() ? `<p class="resume-summary">${e(data.summary)}</p>` : '')}${section('Experience', work)}${section('Education', education)}${section('Projects', projects)}${section('Skills', data.skills.trim() ? `<p>${e(data.skills.split(',').map(s => s.trim()).filter(Boolean).join(' · '))}</p>` : '')}${section('Certifications', bullets(data.certifications))}${section('Languages', data.languages.trim() ? `<p class="resume-summary">${e(data.languages)}</p>` : '')}${placeholders && !hasContent(data) ? '<p class="resume-empty">Your next chapter goes here.<br>Add your details to start building your resume.</p>' : ''}`;
}
export function applyDesign(node, design) {
  node.dataset.template = design.template;
  node.dataset.font = design.font;
  node.dataset.density = design.density;
  node.dataset.paper = design.paper;
  node.style.setProperty('--accent', design.color);
}
export function plainText(data) {
  const chunks = [];
  const add = (...values) => chunks.push(values.filter(v => v && v.trim()).join('\n'));
  add(data.name, data.title, ...[data.email, data.phone, data.location, data.website, data.linkedin].filter(Boolean));
  if (data.summary.trim()) add('PROFILE', data.summary);
  if (data.experience.some(present)) add('EXPERIENCE', ...data.experience.filter(present).map(entry => [entry.role, entry.organization, entry.location, dates(entry), ...lines(entry.description).map(v => `• ${v.replace(/^[•*-]\s+/, '')}`)].filter(Boolean).join('\n')));
  if (data.education.some(present)) add('EDUCATION', ...data.education.filter(present).map(entry => [entry.degree, entry.institution, entry.location, dates(entry), entry.description].filter(Boolean).join('\n')));
  if (data.projects.some(present)) add('PROJECTS', ...data.projects.filter(present).map(entry => [entry.name, entry.url, entry.description].filter(Boolean).join('\n')));
  if (data.skills.trim()) add('SKILLS', data.skills);
  if (data.certifications.trim()) add('CERTIFICATIONS', data.certifications);
  if (data.languages.trim()) add('LANGUAGES', data.languages);
  return chunks.filter(Boolean).join('\n\n') + '\n';
}
export function rtfDocument(data) {
  const escapeRTF = value => value.split('').map(c => {
    if ('\\{}'.includes(c)) return `\\${c}`;
    if (c === '\n') return '\\par\n';
    const code = c.charCodeAt(0);
    return code > 127 ? `\\u${code > 32767 ? code - 65536 : code}?` : c;
  }).join('');
  const width = data.design.paper === 'letter' ? 12240 : 11906;
  const height = data.design.paper === 'letter' ? 15840 : 16838;
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 ${data.design.font === 'serif' ? 'Georgia' : 'Arial'};}}\\uc1\\paperw${width}\\paperh${height}\\margl900\\margr900\\margt900\\margb900\\f0\\fs22\n${escapeRTF(plainText(data))}}`;
}
export function fileName(data) {
  const name = data.name.trim().replace(/[^\p{L}\p{N} _-]/gu, '').replace(/\s+/g, '-').slice(0, 80);
  return `${name || 'My'}-resume`;
}
export const RESUME_CSS = `
.resume-paper{--accent:#245c48;box-sizing:border-box;color:#262e2a;background:#fff;font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.5;padding:48px 52px;width:794px;min-height:1123px;overflow-wrap:anywhere;text-align:left;}
.resume-paper[data-paper="letter"]{width:816px;min-height:1056px;}
.resume-paper[data-font="serif"]{font-family:Georgia,'Times New Roman',serif;}
.resume-paper *{box-sizing:border-box;}
.resume-paper h1,.resume-paper h2,.resume-paper h3,.resume-paper p,.resume-paper ul{margin:0;}
.resume-header{padding-bottom:22px;border-bottom:2px solid var(--accent);margin-bottom:25px;}
.resume-paper h1{font-size:30pt;line-height:1.15;font-weight:700;letter-spacing:-1px;color:var(--accent);}
.resume-title{font-size:13pt;margin-top:7px!important;}
.resume-contact{display:flex;flex-wrap:wrap;gap:3px 16px;margin-top:13px!important;font-size:9pt;color:#505852;}
.resume-section{margin-top:22px;}
.resume-section h2{font-size:10pt;color:var(--accent);text-transform:uppercase;letter-spacing:1.6px;border-bottom:1px solid #d9dedb;padding-bottom:6px;margin-bottom:11px;break-after:avoid;}
.resume-entry{margin-top:13px;}
.resume-entry header{display:flex;justify-content:space-between;align-items:baseline;gap:16px;break-after:avoid;}
.resume-entry h3{font-size:11pt;font-weight:700;break-after:avoid;}
.resume-entry header span{font-size:9pt;white-space:nowrap;color:#505852;}
.resume-subtitle{color:#505852;font-size:10pt;margin:3px 0 6px!important;break-after:avoid;}
.resume-paper ul{padding-left:17px;margin-top:6px;}
.resume-paper li{padding-left:2px;margin-top:3px;}
.resume-paper p,.resume-paper li{orphans:3;widows:3;}
.resume-summary{white-space:pre-line;}
.resume-empty{padding-top:90px;color:#6b746e;text-align:center;}
.resume-paper[data-template="classic"] .resume-header{text-align:center;border-bottom:1px solid #69756e;}
.resume-paper[data-template="classic"] .resume-contact{justify-content:center;}
.resume-paper[data-template="classic"] h1{font-family:Georgia,'Times New Roman',serif;font-size:29pt;}
.resume-paper[data-template="classic"] .resume-section h2{text-align:center;letter-spacing:2px;}
.resume-paper[data-template="editorial"] .resume-header{border-top:7px solid var(--accent);border-bottom:none;padding-top:22px;padding-bottom:4px;}
.resume-paper[data-template="editorial"] h1{font-family:Georgia,'Times New Roman',serif;font-size:35pt;font-weight:400;}
.resume-paper[data-template="editorial"] .resume-section h2{border-bottom:none;border-left:3px solid var(--accent);padding:0 0 0 10px;}
.resume-paper[data-template="compact"]{font-size:10pt;line-height:1.4;}
.resume-paper[data-template="compact"] .resume-header{padding-bottom:14px;margin-bottom:16px;}
.resume-paper[data-template="compact"] h1{font-size:25pt;}
.resume-paper[data-template="compact"] .resume-section{margin-top:15px;}
.resume-paper[data-template="compact"] .resume-entry{margin-top:9px;}
.resume-paper[data-density="compact"]{line-height:1.35;padding:36px 42px;}
.resume-paper[data-density="compact"] .resume-section{margin-top:15px;}
.resume-paper[data-density="compact"] .resume-entry{margin-top:10px;}
@media print{.resume-paper{width:100%!important;min-height:0!important;padding:0!important;zoom:1!important;box-shadow:none!important;border:none!important;}.resume-paper .resume-empty{display:none;}}
`;
export function installResumeStyles() {
  const style = document.createElement('style');
  style.textContent = RESUME_CSS;
  document.head.append(style);
}
export function htmlDocument(data) {
  const d = data.design;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(data.name || 'Resume')} — Resume</title><style>${RESUME_CSS}\nbody{margin:0;background:#edf0ed;padding:24px}.resume-paper{margin:0 auto;box-shadow:0 4px 24px #0001}@page{size:${d.paper === 'letter' ? 'letter' : 'A4'};margin:14mm}@media screen and (max-width:840px){body{padding:0}.resume-paper{width:100%;min-height:100vh;padding:28px}}@media print{body{padding:0;background:white}}</style></head><body><article class="resume-paper" data-template="${d.template}" data-font="${d.font}" data-density="${d.density}" data-paper="${d.paper}" style="--accent:${d.color}">${renderResume(data, false)}</article></body></html>`;
}
