# Deploy

The article is a static site. `deploy/build.sh` builds it into `dist/`, and that same `dist/` is
published everywhere:

| Where | URL | How it is updated |
|---|---|---|
| GitHub Pages | https://taridepaco.github.io/MusicTopicEvolution/ | On its own, with every push to `main` (`.github/workflows/pages.yml`). |
| Home server | `music.taridepaco.com.es` (planned, not published yet) | By hand: `deploy/build.sh && sudo deploy/install.sh`. |

`deploy/build.sh`, `deploy/install.sh` and `.github/workflows/pages.yml` are common to every
taridepaco site and are copied from [taridepaco.github.io](https://github.com/taridepaco/taridepaco.github.io):
they are not edited here.

## Build

```sh
deploy/build.sh                                   # web/ → dist/
python3 -m http.server 8000 --directory dist      # to try the result
```

`dist/` is not committed. Everything but `index.html` goes under `v/<hash>/`, a directory named after
the content, and `index.html` points there. Every change gives new URLs, so no cache mixes two
versions: GitHub Pages keeps files for 10 minutes and Cloudflare keeps CSS and JS for hours.

All paths are relative, so `dist/` works the same at the root of a domain as under a subpath such as
`/MusicTopicEvolution/`.

## GitHub Pages

- In every pull request the workflow builds the site but does not publish it.
- With every push to `main`, or by hand from *Actions → Pages → Run workflow*, it also publishes `dist/`.
- If the build fails, nothing is published.

One-time setting: *Settings → Pages → Build and deployment → Source: GitHub Actions*.

## Home server (Cloudflare tunnel on WSL)

```
Browser ── HTTPS ── Cloudflare ── tunnel ──► cloudflared (WSL) ──► http://localhost:8007
                                                                   python3 -m http.server on 127.0.0.1
```

- **Service:** `deploy/music.service`. System user `music` and systemd isolation.
- **Files served:** `/opt/music`, a copy of `dist/`, owned by root and only readable by the service.
- **Port:** `8007`, on `127.0.0.1` only.

### Install or update

From WSL, at the root of the repository:

```sh
git pull
deploy/build.sh && sudo deploy/install.sh
```

`install.sh` creates the user and the unit the first time. After that it only replaces the files and
restarts the service.

### First time: tunnel and DNS

Replace `<tunnel>` with the name of your tunnel (`cloudflared tunnel list`).

1. Check that the port is free with `ss -ltn | grep ':8007 ' || echo free`. If it is taken, pick
   another one and change it in `deploy/music.service` and in the tunnel entry.
2. Add the entry to `/etc/cloudflared/config.yml` **before** the 404 rule, without touching the others:

   ```yaml
   ingress:
     # ...your other entries...
     - hostname: music.taridepaco.com.es
       service: http://localhost:8007
     - service: http_status:404
   ```

3. Validate, create the DNS record (as your user, without sudo) and restart the tunnel:

   ```sh
   cloudflared tunnel ingress validate --config /etc/cloudflared/config.yml
   cloudflared tunnel route dns <tunnel> music.taridepaco.com.es
   sudo systemctl restart cloudflared
   curl -sI https://music.taridepaco.com.es/ | head -1
   ```

### Switch it off

1. Remove the `music` entry from `/etc/cloudflared/config.yml` and run `sudo systemctl restart cloudflared`.
2. `sudo systemctl disable --now music && sudo rm /etc/systemd/system/music.service`
3. `sudo rm -rf /opt/music && sudo userdel music`
4. Delete the `music` CNAME record in the Cloudflare dashboard.

The scripts in `deploy/` stay in the repository, to install it again on this or another machine.
