/**
 * SCSS modules resolve to a map of class names.
 *
 * Needed here as well as in `@app/design-system`: this project's program pulls in
 * the design-system sources through the `@app/design-system` path alias, and
 * ambient declarations are resolved against the *importing* project's program.
 */
declare module "*.module.scss" {
  const classes: Record<string, string>;
  export default classes;
}
