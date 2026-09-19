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

## What's on the page

- **Animated gradient hero.** Three soft orange, amber and red blobs drift slowly behind the headline over a fine grain. It is pure CSS, so it costs no JavaScript.
- **Hero spotlight.** With a mouse, the headline dims and a circle of full contrast with an orange core follows the pointer.
- **Rotating badge.** Circular text beside your links. Click it to jump to Contact. Hidden on small screens.
- **Skills band.** A scrolling strip of your tools. It pauses on hover.
- **Work.** Click a row to open its details. One row is open at a time.
- **What I do.** Three services with orange icons. An orange rule draws across the top on hover.
- **About.** Skills shown as chips.
- **Experience.** A timeline with an orange dot on your current role.
- **Kind words.** Testimonials you switch with the bars underneath.
- **Contact.** A full-width orange panel. One click copies your email.
- **Theme toggle.** A circular wipe grows from the button (Chrome, Edge and Safari; others switch instantly).
- **Reading progress line and current-section link** in the header.

Visitors who prefer reduced motion get the same page without the drifting gradient, spinning badge and scrolling band.

To remove an interaction, delete its numbered block in `script.js`. To remove a section, delete its `<section>` in `index.html`.

## Make it yours

Search for `EDIT` in `index.html`. Each spot that needs your content has a comment above it.

- Edit the skills band, the three services and the testimonials (look for `EDIT`).
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
| Orange accent (`--accent`): fills, lines, icons, gradient, contact panel | `#ff5a00` | `#ff6a1a` |
| Orange for small text (`--accent-ink`) | `#c2410c` | `#ff8a3d` |
| Blue complement (`--accent-2`): current nav section and copy confirmation | `#1a2cff` | `#8593ff` |

The orange has a darker light-mode shade for small text so it stays readable on white. Text on orange fills is always black. `--inv-accent` is the orange shown on inverted (hovered or open) project rows, so set it to the shade that works on the opposite background. `--glow` controls how strong the hero gradient is.

The blob colors are set in the `.b1`, `.b2` and `.b3` rules if you want a different mix.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page content |
| `styles.css` | Layout, type, and light and dark themes |
| `script.js` | Theme toggle and footer year |
| `favicon.svg` | Orange browser tab icon. Change the letter to your initial |