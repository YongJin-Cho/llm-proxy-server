import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { detectContent, resolveSelection, utf8ByteLength } from '../src/ui/data-query/content-viewer.js';

const json = detectContent('{"message":"hello","count":2}');
assert.equal(json.detectedMode, 'json');
assert.deepEqual(json.parsedJson, { message: 'hello', count: 2 });

const hintedJson = detectContent('{"message":"hello"}', 'json');
assert.equal(hintedJson.detectedMode, 'json');
const invalidJson = detectContent('{not-json}', 'json');
assert.equal(invalidJson.detectedMode, 'plain-text');
assert.match(invalidJson.fallbackReason ?? '', /could not be parsed/);

assert.equal(detectContent('# Heading\n\n- safe item').detectedMode, 'markdown');
assert.equal(detectContent('ordinary prose without a supported format').detectedMode, 'plain-text');
assert.equal(resolveSelection('{"value":1}', { mode: 'plain-text' }).selectedMode, 'plain-text');
assert.equal(resolveSelection('{"value":1}', { mode: 'json' }).selectedMode, 'json');
assert.equal(resolveSelection('{"value":1}', { mode: 'code', language: 'not-supported' }).selectedMode, 'plain-text');
assert.equal(resolveSelection('const answer = 42;', { mode: 'code', language: 'javascript' }).selectedMode, 'code');

const oneMiB = 'x'.repeat(1_048_576);
assert.equal(utf8ByteLength(oneMiB), 1_048_576);
assert.equal(utf8ByteLength('가'.repeat(349_525)), 1_048_575);

const viewer = readFileSync(resolve('src/ui/components/ContentViewer.tsx'), 'utf8');
const detail = readFileSync(resolve('src/ui/components/LogDetail.tsx'), 'utf8');
const tree = readFileSync(resolve('src/ui/components/TurnTree.tsx'), 'utf8');
const turnView = readFileSync(resolve('src/ui/components/TurnView.tsx'), 'utf8');
const page = readFileSync(resolve('src/ui/pages/TrafficPage.tsx'), 'utf8');
assert.match(viewer, /rehypeSanitize/);
assert.match(viewer, /readOnly: true/);
assert.match(viewer, /domReadOnly: true/);
assert.match(viewer, /enableClipboard=\{false\}/);
assert.doesNotMatch(viewer, /dangerouslySetInnerHTML|\beval\s*\(|new Function|<iframe/);
assert.match(detail, /key=\{`\$\{log\.id\}:request`\}/);
assert.match(detail, /key=\{`\$\{log\.id\}:response`\}/);
assert.match(detail, /key=\{`\$\{log\.id\}:error`\}/);
assert.match(viewer, /PopupViewer key=\{target\.path\}/);
assert.match(tree, /onRenameTraffic/);
assert.match(page, /updateTrafficMetadata/);
assert.match(turnView, /summary\.provider/);
assert.match(turnView, /summary\.execution_environment/);
console.log('Viewer verification passed: detection precedence, safe fallbacks, curated overrides, UTF-8 full-content bound, read-only rendering, field-scoped reset, traffic title editing, and turn summary metadata.');
