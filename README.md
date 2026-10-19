# Resume Maker Pro

A free, static resume tool by Usman. A home page and a dedicated builder — no backend, subscriptions, tracking scripts, or runtime dependencies.

## Features

- Four single-column templates: Modern, Classic, Editorial, and Compact.
- Live preview; preset/custom accent colors, serif/sans typography, compact spacing, and A4/Letter paper.
- Personal details, summary, reorderable experience/education/projects, skills, certifications, and languages.
- **PDF:** native browser printing with selectable text and automatic pagination. Choose Save as PDF in the print dialog. Match the paper size, use Default margins (14 mm in the stylesheet), disable headers/footers, and enable background graphics. Printer/browser overrides can affect layout. Check every page before sharing.
- **RTF:** a portable, editable text document for word processors; preserves Unicode and paper dimensions. It deliberately does not reproduce the visual template.
- **TXT:** plain text for application forms.
- **HTML:** a standalone styled resume with embedded CSS, no scripts or external assets.
- **JSON:** versioned content/design backup with validated import. Import replaces the current draft after confirmation. Maximum 20 entries per repeating section, 2 MB per import.
- Optional device-local saving; clear-draft and unsaved-navigation warnings.
- Responsive layout, labeled fields, keyboard-operable editor tabs, native disclosure controls, focus styles, reduced-motion support, and accent contrast feedback.

## GitHub Pages

1. Create a GitHub repository and upload this folder's contents, keeping `index.html` at the repository root.
2. In **Settings → Pages**, choose **Deploy from a branch**, select your branch (usually `main`), and select **/(root)**.
3. Open the provided Pages URL after deployment. All site links and assets are relative, so project subpaths work without configuration.

There is no build step, dependency install, environment variable, server, or form service. `package.json` and `tests/` are only for development. `resumeMaker.html` redirects existing bookmarks to `builder.html`.

## Local development and tests

Serve the directory through a local static HTTP server, such as VS Code's Live Server extension. Opening HTML using `file:` is not supported because browsers restrict JavaScript module loading. Test with Node.js 18 or newer:

```sh
npm test
```

The tests use the built-in Node test runner; no `npm install` is needed. They cover backup validation, escaping, Unicode RTF, all template exports, empty sections, filenames, and local asset references. Browser print-to-PDF and mobile layouts should also be checked in target browsers before deployment.

## Privacy and limitations

Content processing and document generation happen in the browser. With **Remember on this device** disabled, the draft stays in memory until the tab is closed or reloaded. Enabling it stores the draft under `resume-maker-pro.v1` in this browser's local storage. Saved data is **not encrypted**; do not enable saving on shared devices. Clearing the draft only removes this application's saved key and tab contents, not downloaded files or other sites' data. Storage may be unavailable in private browsing or when blocked; use a JSON backup.

The site loads no remote fonts, analytics, or CDN scripts. Hosting providers receive normal web requests and may retain access logs. The portfolio contact link opens an external website with its own privacy practices. No submissions are collected here. There are no promises of employment, guaranteed ATS compatibility, or universal browser print support.

An internet connection is needed for initial loading; editing and export are local after loading. No service worker, installable PWA, or guaranteed offline reload is provided. Saved drafts are browser/device-specific and can be erased by browser cleanup. Simultaneously editing the same saved draft in multiple tabs is not recommended.

## Structure

- `index.html`: home, templates, about/project context, workflow, privacy/safety, FAQ, and portfolio contact.
- `builder.html`: content editor, design controls, live preview, and export tools.
- `assets/styles.css`: responsive application layout and print isolation.
- `assets/resume.mjs`: shared data schema, templates, print/HTML styles, and export functions.
- `assets/builder.js`: editor interactions, consent-based storage, import/export, and preview fitting.
- `assets/home.js`: template previews using the same renderer as the editor.

Built with standards-based HTML, CSS, and JavaScript. MIT licensed; see `LICENSE`.
