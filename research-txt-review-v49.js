/* v4.9 - Local TXT pedigree auditor (not loaded by the web app).
 * Validates only evidence contained in the user-exported 31 sire-position rows.
 * It cannot certify in-game Shiko or detect siblings hidden in female ancestry.
 * Own implementation; no third-party library or pedigree data included.
 */
(function (root, factory) {
 'use strict';
 const api = factory();
 if (typeof module === 'object' && module.exports) module.exports = api;
 if (root) root.DabimasTxtReview49 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
 'use strict';
 const PATH = /^[SD]{0,4}S$/;
 const norm = v => String(v ?? '').normalize('NFKC').trim();
 const unknown = s => !norm(s) || norm(s) === '未確認';
 const keys = ['種', '肌', '最終産駒'];
 const targets = ['SSS', 'DSSS', 'DDDSS'];
 const expected = [];
 for (let d = 1; d <= 5; d++) for (let j = 0; j < 2 ** (d - 1); j++) {
  let path = '';
  for (let k = d - 2; k >= 0; k--) path += ((j >> k) & 1) ? 'D' : 'S';
  expected.push(path + 'S');
 }
 function parse(txt) {
  const text = String(txt ?? '').replace(/^\uFEFF/, '');
  const title = (text.match(/^計画：(.+)$/m) || [])[1] || '';
  const assigned = (text.match(/^至高指定：(.+)$/m) || [])[1] || '';
  const sections = {};
  const warnings = [];
  let active = null;
  for (const line of text.split(/\r?\n/)) {
   const head = line.match(/^【(種|肌|最終産駒)[^\n]*】\s+(\d+)\/(\d+)枠/);
   if (head) { active = head[1]; sections[active] = { advertised: [Number(head[2]), Number(head[3])], records: [], byPath: new Map() }; continue; }
   if (!active || !line || line.startsWith('位置\t')) continue;
   const cols = line.split('\t');
   if (!PATH.test(cols[0] || '')) continue;
   if (cols.length !== 6) { warnings.push(`${active}:${cols[0]} は6列ではありません`); continue; }
   const [path, horse, variant, factorText, lineage, source] = cols;
   const row = { path, horse: norm(horse), variant: norm(variant), factors: unknown(factorText) ? null : factorText.split('・').map(norm).filter(Boolean), lineage: norm(lineage), source: norm(source) };
   sections[active].records.push(row);
   if (sections[active].byPath.has(path)) warnings.push(`${active}:${path} の位置重複`);
   sections[active].byPath.set(path, row);
  }
  return { title, assigned, sections, warnings };
 }
 function review(input) {
  const data = typeof input === 'string' ? parse(input) : input;
  const problems = [...(data.warnings || [])];
  const sheets = {};
  for (const label of keys) {
   const section = data.sections[label];
   if (!section) { problems.push(`${label} の31枠表がありません`); continue; }
   const missing = expected.filter(p => !section.byPath.has(p));
   const outOfRange = section.records.filter(r => !expected.includes(r.path)).map(r => r.path);
   if (missing.length) problems.push(`${label}: 不足 ${missing.join(',')}`);
   if (outOfRange.length) problems.push(`${label}: 対象外 ${outOfRange.join(',')}`);
   if (section.records.length !== 31 || section.advertised.join('/') !== '31/31') problems.push(`${label}: 31/31の完全な祖先名表示ではありません`);
   sheets[label] = {
    records: section.records.length,
    unknownFactors: section.records.filter(r => r.factors === null).length,
    unknownVariants: section.records.filter(r => unknown(r.variant)).length,
    unknownLineages: section.records.filter(r => unknown(r.lineage)).length,
    missing, outOfRange
   };
  }
  const sire = data.sections['種']?.byPath, dam = data.sections['肌']?.byPath, foal = data.sections['最終産駒']?.byPath;
  const inheritanceMismatches = [];
  if (sire && dam && foal) for (const [prefix, table] of [['S', sire], ['D', dam]]) {
   for (const [p, row] of table) {
    const childPath = prefix + p;
    if (childPath.length > 5) continue;
    const actual = foal.get(childPath);
    for (const field of ['horse', 'variant', 'lineage']) {
     if (!actual || norm(actual[field]) !== norm(row[field])) inheritanceMismatches.push({ path: childPath, field, expected: row[field], actual: actual?.[field] ?? null });
    }
    if (JSON.stringify(actual?.factors) !== JSON.stringify(row.factors)) inheritanceMismatches.push({ path: childPath, field: 'factors', expected: row.factors, actual: actual?.factors ?? null });
   }
  }
  if (inheritanceMismatches.length) problems.push(`種・肌→最終産駒の継承不一致 ${inheritanceMismatches.length}項目`);
  const triples = targets.map(p => foal?.get(p) || null);
  const sameName = triples.every(r => !!r?.horse) && new Set(triples.map(r => norm(r.horse))).size === 1;
  const knownVariants = triples.every(r => !unknown(r?.variant));
  const variantsDistinct = knownVariants && new Set(triples.map(r => norm(r.variant))).size === 3;
  const factorEvidence = triples.every(r => Array.isArray(r?.factors) && r.factors.length > 0);
  const factorKinds = [...new Set(triples.flatMap(r => r?.factors || []))].sort();
  const headerDeclared = data.assigned.split('/').map(s => s.trim());
  const headerAgreement = headerDeclared.length === 3 && triples.every((r, i) => {
   const match = headerDeclared[i].match(/^g[345]=([^\s]+)$/);
   if (!match || !r) return false;
   const id = norm(match[1]);
   return id === r.horse + '-' + r.variant + '-' || id === r.horse + r.variant;
  });
  if (!headerAgreement) problems.push('至高指定の見出しと3・4・5代の表示馬が一致しません');
  const groups = new Map();
  for (const r of foal?.values() || []) {
   if (!r.horse) continue;
   if (!groups.has(r.horse)) groups.set(r.horse, { sire: [], dam: [] });
   groups.get(r.horse)[r.path[0] === 'S' ? 'sire' : 'dam'].push(r);
  }
  const crosses = [...groups].filter(([, x]) => x.sire.length && x.dam.length).map(([name, x]) => ({
   name, sire: x.sire.map(r => r.path), dam: x.dam.map(r => r.path),
   closestDepth: Math.min(...x.sire.map(r => r.path.length)) + Math.min(...x.dam.map(r => r.path.length)),
   sameVariant: x.sire.some(a => x.dam.some(b => !unknown(a.variant) && norm(a.variant) === norm(b.variant))),
   unknownVariant: [...x.sire, ...x.dam].some(a => unknown(a.variant)),
   unknownFactor: [...x.sire, ...x.dam].some(a => a.factors === null)
  })).sort((a, b) => a.closestDepth - b.closestDepth || a.name.localeCompare(b.name, 'ja'));
  const closeNonAnchor = crosses.filter(x => x.name !== triples[0]?.horse &&
   Math.min(...x.sire.map(p => p.length)) <= 3 && Math.min(...x.dam.map(p => p.length)) <= 3);
  return {
   title: data.title, status: problems.length ? '入力・継承に要確認点あり' : 'TXT内部整合性確認済み・ゲーム内成立は未確認',
   sheets, targets: targets.map((path, i) => ({ path, ...triples[i] })),
   theoryPremise: { sameName, knownVariants, variantsDistinct, factorEvidence, factorKinds, sixKinds: factorKinds.length >= 6, headerAgreement, gameVerified: false, siblingBlockerChecked: false },
   inheritance: { comparedAncestorPositions: (sire && dam && foal) ? 30 : 0, mismatches: inheritanceMismatches },
   acrossParentCrosses: crosses, closeNonAnchor, problems,
   notes: ['31/31は種牡馬祖先の馬名が31枠あるという意味で、牝馬祖先や全兄弟姉妹の検証ではない。', '両親の元データが同じ誤記を持つ場合は継承比較だけでは検出できない。', '同名重複は有効な独立クロス・ニトロ数・危険配合判定を保証しない。']
  };
 }
 return Object.freeze({ parse, review, expectedPaths: () => [...expected] });
});
