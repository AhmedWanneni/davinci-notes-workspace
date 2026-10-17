import type { ClipTemplate } from "./ClipTemplate.js";

/**
 * Starter templates shipped with the extension (plan §6).
 *
 * They are plain data, not code: a user can clone, edit, export and re-import
 * them. `triggers` are auto-apply rules the extension evaluates
 * (`/regex/` matched against the URL, `schema:@Type` matched against page data).
 */

export const ARTICLE_TEMPLATE: ClipTemplate = {
  id: "article",
  name: "Article",
  behavior: "create",
  noteNameFormat: "{{title|safe_name}}",
  folder: "Clippings",
  properties: [
    { name: "author", value: "{{author}}" },
    { name: "published", value: '{{published|date:"YYYY-MM-DD"}}' },
    { name: "description", value: "{{description}}" },
    { name: "source", value: "{{url}}" },
    { name: "site", value: "{{site}}" },
    { name: "created", value: '{{date|date:"YYYY-MM-DD"}}' },
  ],
  tags: ["clippings"],
  body: `{{content}}

---

Source: [{{title}}]({{url}})`,
  triggers: ["schema:@Article", "schema:@NewsArticle", "schema:@BlogPosting"],
};

export const RECIPE_TEMPLATE: ClipTemplate = {
  id: "recipe",
  name: "Recipe",
  behavior: "create",
  noteNameFormat: "{{title|safe_name}}",
  folder: "Clippings/Recipes",
  properties: [
    { name: "cuisine", value: "{{schema:Recipe:recipeCuisine}}" },
    { name: "prep_time", value: "{{schema:Recipe:prepTime}}" },
    { name: "cook_time", value: "{{schema:Recipe:cookTime}}" },
    { name: "servings", value: "{{schema:Recipe:recipeYield}}" },
    { name: "source", value: "{{url}}" },
    { name: "created", value: '{{date|date:"YYYY-MM-DD"}}' },
  ],
  tags: ["clippings", "recipe"],
  body: `# {{title}}

{{content}}

## Ingredients

{{schema:Recipe:recipeIngredient|list}}

## Instructions

{{schema:Recipe:recipeInstructions|list}}`,
  triggers: ["schema:@Recipe"],
};

export const MOVIE_TEMPLATE: ClipTemplate = {
  id: "movie",
  name: "Movie",
  behavior: "create",
  noteNameFormat: "{{title|safe_name}}",
  folder: "Clippings/References",
  properties: [
    { name: "director", value: "{{schema:Movie:director}}" },
    { name: "genre", value: '{{schema:Movie:genre|join:", "}}' },
    {
      name: "released",
      value: '{{schema:Movie:datePublished|date:"YYYY-MM-DD"}}',
    },
    { name: "rating", value: "{{schema:Movie:aggregateRating.ratingValue}}" },
    { name: "source", value: "{{url}}" },
    { name: "created", value: '{{date|date:"YYYY-MM-DD"}}' },
  ],
  tags: ["clippings", "reference"],
  body: `# {{title}}

{{description}}

{{content}}`,
  triggers: ["schema:@Movie"],
};

export const PAPER_TEMPLATE: ClipTemplate = {
  id: "paper",
  name: "Paper",
  behavior: "create",
  noteNameFormat: "{{title|safe_name}}",
  folder: "Clippings/Papers",
  properties: [
    { name: "authors", value: '{{schema:ScholarlyArticle:author|join:", "}}' },
    {
      name: "published",
      value: '{{schema:ScholarlyArticle:datePublished|date:"YYYY-MM-DD"}}',
    },
    { name: "source", value: "{{url}}" },
    { name: "created", value: '{{date|date:"YYYY-MM-DD"}}' },
  ],
  tags: ["clippings", "paper"],
  body: `# {{title}}

{{description}}

{{content}}`,
  triggers: ["schema:@ScholarlyArticle"],
};

export const STARTER_TEMPLATES: readonly ClipTemplate[] = [
  ARTICLE_TEMPLATE,
  RECIPE_TEMPLATE,
  MOVIE_TEMPLATE,
  PAPER_TEMPLATE,
];
