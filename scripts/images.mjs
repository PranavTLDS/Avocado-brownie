// Converts source photos to optimised webp. Usage: node scripts/images.mjs <srcDir> <platesDir>
import sharp from 'sharp'; import fs from 'node:fs'; import path from 'node:path';
const [src, plates] = process.argv.slice(2);
const out = 'public/img'; fs.mkdirSync(out + '/plates', { recursive: true });
const map = {
  'magnum-side': '7283', 'magnum-macro': '7281', 'magnum-top': '7284', 'magnum-card': '7278',
  'brownie-macro': '7406', 'brownie-macro2': '7405', 'brownie-side': '7409', 'brownie-side2': '7408', 'brownie-angle': '7402', 'brownie-top': '7413', 'brownie-top2': '7414',
  'stack': '7306', 'bites': '7308', 'bites-macro': '7358', 'bites-macro2': '7360',
  'croissant': '7322', 'croissant2': '7327', 'croissant-dark': '7313',
  'avotoast': '7441', 'avotoast-top': '7440', 'avotoast-tall': '7443',
  'bowl': '7445', 'bowl-wide': '7451', 'bowl-wide2': '7452',
  'ube': '9320', 'ube-hand': '9329', 'matcha': '7426', 'matcha-table': '7431', 'latte': '7421',
  'cafe': '7432', 'cafe2': '7433', 'frenchtoast': '9791', 'frenchtoast-macro': '9796', 'panini': '9788',
};
for (const [name, id] of Object.entries(map)) {
  const f = path.join(src, id + '.jpg');
  await sharp(f).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(`${out}/${name}.webp`);
  await sharp(f).rotate().resize({ width: 720 }).webp({ quality: 74 }).toFile(`${out}/${name}-sm.webp`);
}
for (const [name, file] of Object.entries({ magnum: 'magnumA', brownie: 'brownie', bites: 'chicken', croissant: 'croissant' })) {
  await sharp(path.join(plates, file + '.png')).resize(1024).webp({ quality: 86, alphaQuality: 95 }).toFile(`${out}/plates/${name}.webp`);
}
console.log('done', fs.readdirSync(out).length);
