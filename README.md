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
- Charts: [D3](https://d3js.org) and [Scrollama](https://github.com/russellsamora/scrollama). Their licences are in `docs/vendor/`.

## Run it locally

The site is static, with no build step and no external requests:

```bash
cd docs && python3 -m http.server 8000
```

Then open http://localhost:8000.

By [@taridepaco](https://github.com/taridepaco).
