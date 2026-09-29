# LP publish � pov-01

## Prod URLs

| Surface | URL |
|---------|-----|
| **Branded subdomain (primary)** | https://earlyaccess.michaelstewman.com/ |
| **GitHub Pages mirror** | https://thepokerninja.github.io/rainmaker-lp/pov-01/ |
| **Form API** | `https://rainmaker-api-waqs.onrender.com/growth/email` |

## Do not use Framer Embed

Interactive LP (WebGL hero, Lenis, 14+ canvases) is **unusable inside a Framer iframe**.
Use **full-page** on the subdomain above, or link out from Framer.

## One-time DNS (operator)

At the **michaelstewman.com** DNS provider:

| Type | Name | Target |
|------|------|--------|
| **CNAME** | `earlyaccess` | `thepokerninja.github.io` |

Then GitHub ? **ThePokerNinja/rainmaker-lp** ? Settings ? Pages:

1. Custom domain: `earlyaccess.michaelstewman.com`
2. Wait for DNS check (can take up to 24h; often minutes)
3. **Enforce HTTPS**

`publish_lp.py --push` writes `CNAME` + deploys LP at repo root automatically.

## Framer /earlyaccess page

Replace any Embed with a **Link** (same tab) or auto-redirect to:

`https://earlyaccess.michaelstewman.com/`

Optional deep-link to form: `https://earlyaccess.michaelstewman.com/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=pov-01&utm_content=lp&focus=form`

LinkedIn / campaign link (with UTMs):

`https://earlyaccess.michaelstewman.com/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=pov-01&utm_content=lp`

## UTM defaults

```
utm_source=linkedin
utm_medium=organic_social
utm_campaign=pov-01
utm_content=lp
```

## Re-export after LP edits

```powershell
cd C:\Users\User\Desktop\rainMaker
.\publish-lp.ps1 -Lp lp-innovation-update -Campaign pov-01 -Push
.\publish-lp.ps1 -Lp lp-innovation-update -Campaign pov-01 -Push -Domain earlyaccess.michaelstewman.com
```
