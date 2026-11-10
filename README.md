# What were the hits about?

An interactive, scroll-driven article on how the themes of the most popular songs in the US
changed between 1946 and 2025.

**Read it here: https://taridepaco.github.io/MusicTopicEvolution/**
(en español: https://taridepaco.github.io/MusicTopicEvolution/?lang=es)

The article covers about 7,200 entries from the Billboard year-end charts. It uses lyrics for
99% of them, after an audit of the lyric matches.

The themes come from an ensemble of 100 topic models. Only the themes that keep coming back
across models and random seeds are reported. A second method, BERTopic with sentence embeddings,
checks the trends.

The site also has the characteristic words of each decade and a search box that shows the theme
mix of any hit. It is available in English and Spanish, with a switch at the top of the page.

The site contains aggregate results only: theme weights, word lists, titles and artists. It never
contains lyrics.

## Data and credits

- Song lists: Wikipedia's *Billboard Year-End Hot 100* pages ([CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)).
- Lyrics, used for the analysis only: [LRCLIB](https://lrclib.net) and [lyrics.ovh](https://lyrics.ovh).
- Embeddings: [sentence-transformers](https://www.sbert.net) (`all-mpnet-base-v2`).
- Charts: [D3](https://d3js.org) and [Scrollama](https://github.com/russellsamora/scrollama). Their licences are in `web/vendor/`.

## Run it locally

The site is in `web/`. It is static, with no dependencies and no external requests:

```bash
python3 -m http.server 8000 --directory web
```

Then open http://localhost:8000.

## Deploy

`deploy/build.sh` builds `web/` into `dist/`, and that same `dist/` is published everywhere:
GitHub Pages (by `.github/workflows/pages.yml`, with every push to `main`) and, if wanted, a server
of your own (by `deploy/install.sh`). Details in [DEPLOY.md](DEPLOY.md).

By [@taridepaco](https://github.com/taridepaco).
