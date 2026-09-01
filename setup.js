const fs = require('fs');
const path = require('path');

const packages = [
  'packages/core-types',
  'packages/design-system',
  'packages/indexer',
  'packages/sync-client',
  'apps/desktop',
  'apps/mobile'
];

for (const pkg of packages) {
  fs.mkdirSync(pkg, { recursive: true });
  
  const pkgName = pkg.startsWith('services/') ? `@service/${pkg.split('/')[1]}` : `@app/${pkg.split('/')[1]}`;
  
  const isApp = pkg.startsWith('apps/');
  
  fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({
    name: pkgName,
    version: "0.0.0",
    main: "index.ts",
    scripts: {
      build: "echo 'build " + pkgName + "'",
      dev: "echo 'dev " + pkgName + "'",
      lint: "eslint . --ext .ts,.tsx",
      test: "echo 'test " + pkgName + "'"
    },
    dependencies: isApp ? {
      "@app/core-types": "workspace:*",
      "@app/design-system": "workspace:*",
      "@app/indexer": "workspace:*",
      "@app/sync-client": "workspace:*"
    } : {}
  }, null, 2));

  fs.writeFileSync(path.join(pkg, 'tsconfig.json'), JSON.stringify({
    extends: "../../tsconfig.json",
    compilerOptions: {
      outDir: "dist"
    },
    include: ["."]
  }, null, 2));

  fs.writeFileSync(path.join(pkg, 'index.ts'), `export const name = "${pkgName}";\n`);
  
  // Create an ESLint config in each package to extend the root
  fs.writeFileSync(path.join(pkg, '.eslintrc.js'), `module.exports = {\n  extends: ["../../.eslintrc.js"]\n};\n`);
}

// Ensure the root package.json has a "scripts" section for setup
console.log('Scaffolding complete.');
