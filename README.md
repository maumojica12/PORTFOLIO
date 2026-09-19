# Portfolio

A static portfolio site with no build step. Black in dark mode, white in light mode. It follows the visitor's system setting, and a toggle in the header lets them switch.

## Deploy on GitHub Pages

1. Create a new repository on GitHub.
   - For a site at `https://your-username.github.io/`, name it exactly `your-username.github.io`.
   - For any other name, the site will live at `https://your-username.github.io/repo-name/`.
2. Upload these files to the root of the repository (or push them with Git):

   ```bash
   git init
   git add .
   git commit -m "Add portfolio"
   git branch -M main
   git remote add origin https://github.com/your-username/your-repo.git
   git push -u origin main
   ```

3. In the repository, open **Settings > Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose **main** and **/ (root)**, then save.
5. Wait a minute or two. Your site appears at the address shown at the top of the Pages settings.

## Interactions

Everything is optional polish. The page reads fine without any of it.

- **Hero spotlight.** With a mouse, the headline dims and a soft circle of full contrast follows the pointer, with a cobalt core. Touch devices and visitors who prefer reduced motion see the plain headline.
- **Project rows.** Click a row to open its details. One row is open at a time. Rows invert black and white on hover and when open.
- **Theme toggle.** A circular wipe grows from the button (Chrome, Edge and Safari; others switch instantly).
- **Reading progress.** A thin line under the header fills as you scroll.
- **Current section.** The matching nav link is underlined.
- **Copy email.** One click copies your address, with a confirmation.

To turn one off, delete its numbered block in `script.js`.

## Make it yours

Search for `EDIT` in `index.html`. Each spot that needs your content has a comment above it.

- Replace `Your Name`, `Your City`, and `hello@example.com` everywhere they appear.
- Update the GitHub and LinkedIn links in the hero.
- Copy or delete `<li class="project">` blocks in the Work section. Give each a unique `id` (`project-5`, and so on) and match its button's `aria-controls`. The text under the row is what opens on click.
- Change the letter in `favicon.svg` to your initial.
- Set `og:url` in the `<head>` to your real site address.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Change the colors

The palette lives in the first blocks of `styles.css`.

| Role | Light mode | Dark mode |
| --- | --- | --- |
| Page | `#ffffff` | `#000000` |
| Text | `#000000` | `#ffffff` |
| Accent (cobalt): links, focus, progress line, spotlight core, open-row icon | `#1a2cff` | `#8593ff` |
| Accent 2 (ember): current section, current job, "Copied" message | `#c2410c` | `#ff9558` |

Each accent has a light-mode and a dark-mode value so text stays readable on both backgrounds. To change one, edit `--accent` or `--accent-2` in the light block and in both dark blocks. `--inv-accent` is the accent shown on inverted (hovered or open) project rows, so set it to the other theme's `--accent`.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page content |
| `styles.css` | Layout, type, and light and dark themes |
| `script.js` | Theme toggle and footer year |
| `favicon.svg` | Browser tab icon that switches with the system theme |