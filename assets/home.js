import { TEMPLATES, sampleResume, renderResume, applyDesign, installResumeStyles } from './resume.mjs';

installResumeStyles();
const sample = sampleResume();
const hero = document.createElement('article');
hero.className = 'resume-paper';
hero.innerHTML = renderResume(sample);
applyDesign(hero, sample.design);
document.querySelector('#hero-resume').append(hero);

const gallery = document.querySelector('#template-gallery');
for (const template of TEMPLATES) {
  const card = document.createElement('a');
  card.href = `builder.html?template=${template.id}`;
  card.className = 'template-card';
  card.setAttribute('aria-label', `Use the ${template.name} template`);
  const thumbnail = document.createElement('div');
  thumbnail.className = 'template-thumbnail';
  thumbnail.setAttribute('aria-hidden', 'true');
  const paper = document.createElement('article');
  paper.className = 'resume-paper';
  paper.innerHTML = renderResume(sample);
  applyDesign(paper, { ...sample.design, template: template.id });
  thumbnail.append(paper);
  const heading = document.createElement('h3');
  heading.textContent = template.name;
  const arrow = document.createElement('span');
  arrow.textContent = '↗';
  arrow.setAttribute('aria-hidden', 'true');
  heading.append(arrow);
  const caption = document.createElement('p');
  caption.textContent = template.description;
  card.append(thumbnail, heading, caption);
  gallery.append(card);
}

function fitSamples() {
  document.querySelectorAll('.hero-art .resume-paper, .template-thumbnail .resume-paper').forEach(paper => {
    paper.style.zoom = '';
    const baseZoom = parseFloat(getComputedStyle(paper).zoom) || 1;
    const container = paper.parentElement;
    const style = getComputedStyle(container);
    const available = container.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    paper.style.zoom = String(Math.min(baseZoom, available / 794));
  });
}
window.addEventListener('resize', fitSamples);
fitSamples();
