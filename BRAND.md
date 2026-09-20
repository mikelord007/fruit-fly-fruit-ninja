# Fruit Fly Fruit Ninja artwork

The mascot and sharing card were generated with ChatGPT's built-in image-generation tool. The tool does not expose a model-version selector or version identifier, so this project does not claim a verified backend model version. PNG resizing for delivery preserves the generated designs; no runtime image service is required.

- `assets/logo.png`: original full-resolution mascot (1254 × 1254, transparent).
- `assets/logo-128.png`: lightweight header logo on the site's cream background.
- `assets/social-card.png`: 1200 × 600, opaque PNG used by Open Graph and X/Twitter large-image cards.
- `assets/favicon-32.png`, `assets/favicon-96.png`: browser icons.
- `assets/apple-touch-icon.png`, `assets/icon-192.png`, `assets/icon-512.png`: home-screen icons.

## Mascot generation prompt

Use case: logo-brand. Create an original polished mascot logo for the playful browser game Fruit Fly Fruit Ninja. Asset type: standalone square app icon and website logo, 1024x1024. A charming determined tiny FRUIT FLY with two big burnt-orange eyes, compact deep forest green body, two pale sage wings, small antennae, holding one small kitchen knife as it slices a simple orange fruit wedge. Expressive and immediately recognizable at small icon sizes. Bold clean flat graphic illustration with rounded shapes, very few details, confident dark green outlines; boutique playful kitchen brand, not a realistic insect. Center the compact cohesive silhouette, fill 82 percent of frame with generous even safe margin. Background solid warm cream #f9f6ed. Palette deep forest green #245443, terracotta #eb6e4d, pale sage #e7edda, cream. No letters, no words, no mockup, no shadows, no gradients, no watermark. This is a finished logo, not a sheet of concepts. Use ChatGPT's latest image generation available.

## Sharing-card generation prompt

Input reference: the generated mascot above.

Use case: ads-marketing. Create the finished Twitter/X and Open Graph social sharing image for the browser game Fruit Fly Fruit Ninja, using this exact mascot logo as the identity reference. Wide horizontal 2:1 composition, target 1200x600 pixels. Solid warm cream #f9f6ed background. Left 57 percent is beautiful oversized very bold dark forest green rounded editorial typography, exact title stacked over three lines: "FRUIT FLY" then "FRUIT NINJA" (two lines total preferred if fits beautifully); small terracotta uppercase eyebrow above it: "THE TINIEST SALAD BAR". Below the title, neat readable dark green sans serif tagline exactly "Tiny flies. Big slices." and below that a tasteful solid terracotta pill with exact cream text "PLAY IN YOUR BROWSER". Right side: the supplied cheerful forest green fly with orange eyes, pale wings, knife slicing orange, large and clear; preserve its specific mascot identity. A few minimal sage dots and subtle terracotta juice marks can accent the composition. Sophisticated clean game branding, generous cream negative space, friendly but visually sharp, beautifully balanced graphic layout. All text comfortably within 8 percent safe margin and readable on a phone link preview. No URL, no fake UI, no neural/medical claims, no watermark. Image must have an opaque cream background edge to edge.

## Search and sharing

The canonical public address is https://fruit-fly-fruit-ninja.vercel.app/. All metadata is present in the initial HTML, including the image's absolute URL and accessible description, so crawlers do not need to run the game. No unverified social handle, reviews, or human cognitive-training claims are included. `robots.txt` allows crawling and points to the homepage sitemap. Icons also appear in `site.webmanifest`.

For later redesigns, use a new social-image filename and update both Open Graph and Twitter metadata to avoid stale image caches. Share the canonical public address rather than a protected deployment-preview URL. A crawler fetch checks delivery and markup, but actual search snippets and X card rendering are controlled by those platforms.
