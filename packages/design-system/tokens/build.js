import StyleDictionary from 'style-dictionary';

const sd = new StyleDictionary({
  source: ['tokens/src/**/*.json'],
  platforms: {
    scss: {
      transformGroup: 'scss',
      buildPath: 'tokens/dist/',
      files: [
        {
          destination: '_variables.scss',
          format: 'scss/variables'
        }
      ]
    },
    css: {
      transformGroup: 'css',
      buildPath: 'tokens/dist/',
      files: [
        {
          destination: 'variables.css',
          format: 'css/variables'
        }
      ]
    },
    js: {
      transformGroup: 'js',
      buildPath: 'tokens/dist/',
      files: [
        {
          destination: 'tokens.ts',
          format: 'javascript/es6'
        }
      ]
    }
  }
});

await sd.buildAllPlatforms();
