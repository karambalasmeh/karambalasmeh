# How the card is built

`../README.md` shows one image. This directory generates it.

```bash
cd tools && npm install          # once
npx playwright install chromium  # once
node build.mjs                   # from the repo root: node tools/build.mjs
```

That writes `assets/card-dark.png`, `assets/card-light.png` and the six link
buttons, then runs them through `pngquant` (roughly 3 MB → 1 MB each).

| File | What it holds |
| --- | --- |
| `data.js` | **All the words.** Name, capabilities, the refusals, stack, stations, footer. Edit here. |
| `build.mjs` | Layout, theme tokens, the contour generator, and the renderer. |
| `stats.json` | GitHub numbers. Regenerate with the query below. |

## After every rebuild, bump the cache-buster

GitHub proxies README images through camo, which caches on the URL rather than
on the bytes. Re-render without changing the URL and camo keeps serving the old
image — no browser refresh can reach it. Bump `?v=` on every asset URL in
`../README.md`.

## Refreshing the stats

`stats.json` is a snapshot, not a live query. To update it:

```bash
gh api graphql -f query='
{ user(login: "karambalasmeh") {
    contributionsCollection(from: "2026-01-01T00:00:00Z", to: "2026-12-31T23:59:59Z") {
      contributionCalendar { totalContributions weeks { contributionDays { contributionCount } } } }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
      totalCount nodes { name languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
        edges { size node { name } } } } } } }' > gh.json
```

Then recompute `total`, `active`, `streak`, `repos`, `langs` and `calendar`.

**Keep the language exclusions.** Three repositories — `let_it_to_Allah`,
`9xai-the-reg-tech-let-it-to-allah` and `reg_techV2` — hold about 1.4 GB of
generated and vendored HTML between them. Counted, they report this profile as
87% HTML. Excluded, it reads Python 41.6% / TypeScript 32.6%, which is what was
actually written. The card says on its face that they are excluded and why.

## The snake

`.github/workflows/snake.yml` redraws the contribution graph every six hours and
pushes the SVGs to the `output` branch, which `../README.md` points at. It needs
no secret beyond the automatic `GITHUB_TOKEN`.
