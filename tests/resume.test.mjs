import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { blankResume, sampleResume, validateResume, renderResume, plainText, rtfDocument, htmlDocument, fileName, displayDate, hasContent, TEMPLATES, MAX_ENTRIES } from '../assets/resume.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
test('blank drafts are independent and sample fields survive a backup round trip', () => {
  const a = blankResume(), b = blankResume();
  a.experience.push({});
  a.design.color = '#123456';
  assert.equal(b.experience.length, 0);
  assert.equal(b.design.color, '#245c48');
  assert.equal(hasContent(b), false);
  assert.equal(hasContent(sampleResume()), true);
  assert.deepEqual(validateResume(JSON.parse(JSON.stringify(sampleResume()))), sampleResume());
});
test('backup validation rejects incompatible types and oversized fields or lists', () => {
  for (const value of [null, [], { version: 2 }, { version: 1, name: {} }, { version: 1, name: 'x'.repeat(161) }, { version: 1, summary: 'x'.repeat(10001) }, { version: 1, experience: {} }, { version: 1, projects: Array(MAX_ENTRIES + 1).fill({}) }, { version: 1, education: [null] }, { version: 1, education: [{ start: '2025-13' }] }, { version: 1, design: [] }]) {
    assert.throws(() => validateResume(value));
  }
});
test('untrusted design values and prototype keys are not imported', () => {
  const result = validateResume(JSON.parse('{"version":1,"__proto__":{"polluted":true},"design":{"template":"bad","font":"bad","paper":"bad","density":"bad","color":"red;display:none"}}'));
  assert.deepEqual(result.design, blankResume().design);
  assert.equal({}.polluted, undefined);
  assert.equal(Object.hasOwn(result, '__proto__'), false);
});
test('all dynamic fields are escaped in resume HTML and standalone exports', () => {
  const marker = '<script>alert("x")</script>';
  const draft = blankResume();
  for (const key of ['name', 'title', 'email', 'phone', 'location', 'website', 'linkedin', 'summary', 'skills', 'certifications', 'languages']) draft[key] = marker;
  draft.experience = [{ role: marker, organization: marker, location: marker, start: '', end: '', description: marker }];
  draft.education = [{ degree: marker, institution: marker, location: marker, start: '', end: '', description: marker }];
  draft.projects = [{ name: marker, url: marker, description: marker }];
  for (const output of [renderResume(draft), htmlDocument(draft)]) {
    assert.ok(!output.includes('<script>'));
    assert.ok(output.includes('&lt;script&gt;'));
    assert.ok(!output.includes('href="javascript:'));
  }
});
test('only nonempty sections appear and placeholders do not enter exports', () => {
  const draft = blankResume();
  assert.ok(renderResume(draft).includes('Your name'));
  assert.ok(!renderResume(draft, false).includes('Your name'));
  draft.name = 'Usman';
  draft.experience = [{ role: '', organization: '', location: '', start: '', end: '', description: '' }];
  const output = renderResume(draft, false);
  assert.ok(!output.includes('Experience'));
  assert.ok(!output.includes('Skills'));
});
test('plain text exports all sections, dates, and literal content', () => {
  const draft = sampleResume();
  draft.projects = [{ name: 'Portfolio', url: 'https://example.com', description: 'Built with JavaScript' }];
  draft.certifications = 'Accessibility fundamentals';
  const output = plainText(draft);
  for (const value of ['Alex Morgan', 'PROFILE', 'EXPERIENCE', 'EDUCATION', 'PROJECTS', 'SKILLS', 'CERTIFICATIONS', 'LANGUAGES', 'Apr 2022 – Present', 'May 2019']) assert.ok(output.includes(value), value);
  assert.equal(displayDate('2026-01'), 'Jan 2026');
  assert.equal(displayDate(''), '');
});
test('RTF preserves Unicode, escapes control syntax, and respects paper choice', () => {
  const draft = blankResume();
  draft.name = 'Usman اردو 😀 {test} \\';
  draft.design.paper = 'letter';
  const output = rtfDocument(draft);
  assert.ok(output.startsWith('{\\rtf1'));
  assert.ok(output.endsWith('}'));
  assert.ok(output.includes('\\u'));
  assert.ok(output.includes('\\{test\\}'));
  assert.ok(output.includes('\\\\'));
  assert.ok(output.includes('\\paperw12240\\paperh15840'));
  assert.ok(output.includes('\\u-10179?\\u-8704?'));
});
test('standalone HTML embeds all document styles and every template design', () => {
  for (const template of TEMPLATES) {
    const draft = sampleResume();
    draft.design.template = template.id;
    draft.design.paper = 'letter';
    const html = htmlDocument(draft);
    assert.ok(html.includes(`data-template="${template.id}"`));
    assert.ok(html.includes('@page{size:letter'));
    assert.ok(html.includes('@media print'));
    assert.ok(!html.includes('<script'));
    assert.ok(!html.includes('<link'));
    assert.ok(html.includes('Alex Morgan'));
  }
});
test('filenames stay portable without dropping Unicode names', () => {
  assert.equal(fileName({ name: 'Alex / Morgan:*?' }), 'Alex-Morgan-resume');
  assert.equal(fileName({ name: 'Usman اردو' }), 'Usman-اردو-resume');
  assert.equal(fileName({ name: '   ' }), 'My-resume');
});
test('static pages use relative local assets and the portfolio contact destination', () => {
  for (const page of ['index.html', 'builder.html', 'resumeMaker.html']) {
    const html = readFileSync(resolve(root, page), 'utf8');
    for (const match of html.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)) assert.ok(existsSync(resolve(root, match[1])), match[1]);
    assert.ok(!html.includes('cdn.'));
    assert.ok(!html.includes('fonts.googleapis'));
    if (page !== 'resumeMaker.html') assert.ok(html.includes('https://usman-portfolio-silk.vercel.app/contact'));
  }
});
