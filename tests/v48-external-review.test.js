const assert=require('node:assert/strict');
const test=require('node:test');
const {PATHS,make,format,snap}=require('../research-external-review.js');
test('31 ordered paths, distinct and generations 1-5',()=>{assert.equal(PATHS.length,31);assert.equal(new Set(PATHS).size,31);assert.deepEqual([1,2,3,4,5].map(n=>PATHS.filter(p=>p.length===n).length),[1,2,4,8,16]);});
test('missing ancestors remain unknown',()=>{const x=snap({name:'A'},[{path:'S',horse:'B'}]);assert.equal(x.known,1);assert.equal(x.ancestors.length,31);assert.equal(x.ancestors.find(r=>r.path==='DS').name,'');});
test('conflicting same-position ancestor is flagged',()=>{const x=snap({name:'A'},[{path:'S',horse:'B'},{path:'S',horse:'C'}]);assert.deepEqual(x.conflicts,['S']);});
test('different variant and factors preserved in report',()=>{const r=make({sire:{id:'ディープ-甲-'},mare:{id:'名牝'},foalRows:[{path:'S',horse:'X',factorVariant:'極',factors:['速'],line:'ハビタット'}],sireRows:[],mareRows:[],planTitle:'試験'});const t=format(r);assert.match(t,/ディープ-甲-/);assert.match(t,/極\t速\tハビタット/);assert.match(t,/未収録/);assert.equal(r.gameVerified,false);});
test('malformed input rejected',()=>assert.throws(()=>format({schema:'other'})));
test('no unsupported path or inferred ancestry',()=>{const x=snap({name:'A'},[{path:'D',horse:'Fictional'},{path:'S',horse:'Real'}]);assert.equal(x.known,1);assert.equal(x.ancestors.find(r=>r.path==='S').name,'Real');});
