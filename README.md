# Website

This is the static website.

## Publish with your domain

This repository is configured for GitHub Pages custom domain publishing.

1. In GitHub, open this repository and go to **Settings → Pages**.
2. Set **Source** to deploy from the default branch.
3. Confirm the custom domain is set to `codewithimpact.com`.
4. In your domain DNS provider, configure GitHub Pages DNS:
   - For apex/root domain (`codewithimpact.com`), add A records to:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - For `www`, add a CNAME record to `<your-github-username>.github.io`.
