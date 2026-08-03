#!/usr/bin/env node
/**
 * Optimize assets/map/busan.svg with SVGO while preserving extract-busan-map-paths
 * identifiers: path id=CD*, class=OUTLINE, text id=L*.
 */
const fs = require('fs');
const path = require('path');
const { optimize } = require('svgo');

const svgPath = path.join(__dirname, '..', 'assets', 'map', 'busan.svg');

const before = fs.readFileSync(svgPath, 'utf8');
const beforeBytes = Buffer.byteLength(before, 'utf8');

const result = optimize(before, {
  path: svgPath,
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // Keep path/text ids used by extract-busan-map-paths.cjs
          cleanupIds: false,
          // inlineStyles can drop unreferenced ids in this SVG
          inlineStyles: false,
          removeViewBox: false,
          collapseGroups: false,
          mergePaths: false,
        },
      },
    },
    {
      name: 'convertPathData',
      params: {
        floatPrecision: 2,
        transformPrecision: 2,
        utilizeAbsolute: false,
      },
    },
    {
      name: 'cleanupNumericValues',
      params: { floatPrecision: 2 },
    },
  ],
});

if (result.error) {
  console.error('[Bu-Ting] SVGO failed:', result.error);
  process.exit(1);
}

const after = result.data;
const afterBytes = Buffer.byteLength(after, 'utf8');

const pathCount = (after.match(/id="CD\d+"/g) || []).length;
const labelCount = (after.match(/id="LCD\d+"/g) || []).length;
const outlineCount = (after.match(/class="OUTLINE"/g) || []).length;

if (pathCount < 16 || outlineCount < 16) {
  console.error(
    `[Bu-Ting] SVGO regression: pathIds=${pathCount} outline=${outlineCount} (expected ≥16)`,
  );
  process.exit(1);
}

fs.writeFileSync(svgPath, after, 'utf8');
console.log(
  `[Bu-Ting] Optimized busan.svg ${beforeBytes} → ${afterBytes} bytes (−${Math.round(
    (1 - afterBytes / beforeBytes) * 100,
  )}%), pathIds=${pathCount}, labels=${labelCount}`,
);
