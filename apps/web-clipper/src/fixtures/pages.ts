/**
 * A synthetic article page used by the extension's tests. It deliberately
 * contains the things that break naive clippers: surrounding navigation/footer
 * clutter, a JSON-LD block, meta tags, a small icon image, and a hero image
 * identified only by a class.
 */
export const ARTICLE_PAGE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <title>Probe Article</title>
    <meta name="author" content="Ada Lovelace" />
    <meta name="description" content="A short description of the probe article." />
    <meta property="og:site_name" content="Probe Site" />
    <meta property="og:image" content="/images/og.png" />
    <link rel="icon" href="/favicon.ico" />
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Probe Article",
        "author": { "@type": "Person", "name": "Ada Lovelace" }
      }
    </script>
    <style>.hidden-block { display: none; }</style>
  </head>
  <body>
    <nav><a href="/">Home</a><a href="/about">About</a></nav>
    <article>
      <h1>Probe Article</h1>
      <img class="hero" src="/images/hero.jpg" alt="A hero image" />
      <p>First paragraph with a <strong>bold</strong> word.</p>
      <p>Second paragraph that mentions <a href="/other">another page</a>.</p>
      <pre><code data-lang="js">const answer = 42;</code></pre>
    </article>
    <footer>Footer clutter and copyright</footer>
  </body>
</html>`;

export const RECIPE_PAGE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <title>Probe Soup</title>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Recipe",
            "name": "Probe Soup",
            "recipeCuisine": "Testish",
            "recipeIngredient": ["1 cup probes", "2 cups water"],
            "recipeInstructions": [
              { "@type": "HowToStep", "text": "Boil the water." },
              { "@type": "HowToStep", "text": "Add the probes." }
            ]
          }
        ]
      }
    </script>
  </head>
  <body>
    <article>
      <h1>Probe Soup</h1>
      <p>An excellent soup for testing.</p>
    </article>
  </body>
</html>`;

/** A page whose metadata tries to break out of the frontmatter block. */
export const HOSTILE_PAGE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <title>evil
---
tags: [hacked]</title>
  </head>
  <body>
    <article><p>Body text.</p></article>
  </body>
</html>`;
