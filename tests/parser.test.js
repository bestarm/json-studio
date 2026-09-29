const test = require('node:test');
const assert = require('node:assert/strict');
const { parseInput } = require('../parser.js');

test('keeps strict JSON types and strings', () => {
  const result = parseInput('{"n":12,"ok":false,"items":[null,"027199000588"]}');
  assert.equal(result.recovered, false);
  assert.deepEqual(result.value, { n: 12, ok: false, items: [null, '027199000588'] });
});

test('reads the supplied Java Map style sample as a nested tree', () => {
  const source = '{longitude=, integrity=false, latitude=, cccd=027199000588, client_session=null, raw={com=YBlfAQQwMTA3XzYGMDQwMDAwXAdhdWN2bW9u, sod=d4IHSDCCB0QGCSqGSIb3DQEHAqCCBzUwggcxAgEDMQ8wDQYJYIZIAWUDBAIBBQAwggE7BgZngQgBAQGgggEvBIIBKzCCAScCAQAwDQYJYIZIAWUDBAIBBQAwggERMCUCAQEEIG6h9m42ewGSUt//udCgYIKoZIzj0EAwIEZzBlAjA4CGNxOIIp2atJiM6lcW8Sp3Vc3dvFcyw2fHV0nqoslTOkKrjvUOTtQhU+EuEmhJgCMQCKvRrIkiUeV0ThUU99SdXvA3lm8dROILVAXyxXeyLnrgwLrx48f0bjFfgO/VCyS7M=, dg1=YV1fH1pJRFZOTTE5OTAwMDU4ODAwMjcxOTkwMDA1ODg8PDM5OTA4MTU0RjM5MDgxNTJWTk08PDw8PDw8PDw8PDw8PDJUUkFOPDxUSEk8WUVOPE5ISTw8PDw8PDw8PDw8PDw=, dg14=, dg15=, dg16=}, device_type=mobile, device_name=iPhone, device_version=17.5.1}';
  const result = parseInput(source);
  assert.equal(result.recovered, true);
  assert.equal(result.value.longitude, '');
  assert.equal(result.value.integrity, false);
  assert.equal(result.value.latitude, '');
  assert.equal(result.value.cccd, '027199000588');
  assert.equal(result.value.client_session, null);
  assert.equal(result.value.raw.com, 'YBlfAQQwMTA3XzYGMDQwMDAwXAdhdWN2bW9u');
  assert.match(result.value.raw.sod, /\/\/udCg/);
  assert.match(result.value.raw.dg1, /PDw8PDw=$/);
  assert.equal(result.value.raw.dg14, '');
  assert.equal(result.value.raw.dg15, '');
  assert.equal(result.value.raw.dg16, '');
  assert.equal(result.value.device_version, '17.5.1');
  assert.equal(JSON.parse(JSON.stringify(result.value)).raw.dg15, '');
});

test('recovers unquoted keys, single quotes, trailing commas and incomplete objects', () => {
  const result = parseInput("{name='An', active:true, tags:[one, two,], nested:{x:1}");
  assert.equal(result.recovered, true);
  assert.equal(result.value.name, 'An');
  assert.equal(result.value.active, true);
  assert.deepEqual(result.value.tags, ['one', 'two']);
  assert.equal(result.value.nested.x, 1);
  assert.ok(result.issues.some((issue) => issue.includes('thiếu dấu }')));
});

test('treats unsafe keys as data and never evaluates values', () => {
  const result = parseInput('{__proto__={polluted=true}, payload=alert(1)}');
  assert.equal(result.value.__proto__.polluted, true);
  assert.equal({}.polluted, undefined);
  assert.equal(result.value.payload, 'alert(1)');
});

test('reports unstructured text instead of pretending it is JSON', () => {
  const result = parseInput('hello world');
  assert.ok(result.error);
});
