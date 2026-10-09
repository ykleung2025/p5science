var assert = require("assert");
var G = require("../js/grade.js");

function ok(step, text) {
  var result = G.grade(step, text);
  assert.strictEqual(result.ok, true, "step " + (step + 1) + " should accept: " + text + " (" + result.reason + ")");
}

function no(step, text) {
  var result = G.grade(step, text);
  assert.strictEqual(result.ok, false, "step " + (step + 1) + " should reject: " + text);
}

var correct = [
  "紙巾是乾的",
  "水沒有進去，因為紙巾沒濕",
  "有氣泡跑出來",
  "水進去了，紙巾變濕了",
  "藏著空氣，它佔了位置",
  "空氣佔有空間"
];

var wrong = [
  ["紙巾濕透了", "不知道"],
  ["水充滿了杯子", "沒有證據"],
  ["甚麼也沒有", "水變顏色了"],
  ["水還是進不去", "紙巾還是乾的"],
  ["杯子裡甚麼也沒有", "因為水太重了"],
  ["空氣甚麼也不是", "水才佔有空間"]
];

G.steps.forEach(function (step, index) {
  assert.strictEqual(step.options[0], correct[index]);
  ok(index, step.options[0]);
  wrong[index].forEach(function (text) { no(index, text); });
  no(index, step.hint);
  no(index, "提示：" + step.hint);
});

[
  ["  紙巾是乾的！ ", true],
  ["紙巾是乾的，沒有濕", true],
  ["沒有濕", true],
  ["沒濕", true],
  ["仍然是乾的", true],
  ["乾爽", true],
  ["紙巾係乾嘅", true],
  ["紙巾沒有變濕", true],
  ["紙巾濕透了", false],
  ["有點濕", false],
  ["不是乾的", false],
  ["半乾", false],
  ["不知道", false],
  ["<img src=x onerror=alert(1)>", false],
  ["<b>乾</b>", false],
  ["它是'乾'的", true],
  ["紙巾是 \"乾\" 的", true]
].forEach(function (pair) {
  (pair[1] ? ok : no)(0, pair[0]);
});

[
  ["紙巾沒有濕", true],
  ["水進不去", true],
  ["水冇入去，因為紙巾冇濕", true],
  ["水沒有進入杯底", true],
  ["紙巾是乾的", true],
  ["水充滿了杯子，紙巾是乾的", false],
  ["水進去了", false],
  ["水有進去", false],
  ["沒有證據", false],
  ["濕了", false]
].forEach(function (pair) {
  (pair[1] ? ok : no)(1, pair[0]);
});

[
  ["泡泡", true],
  ["有泡冒出", true],
  ["咕嚕咕嚕", true],
  ["有空氣跑出來", true],
  ["氣泡", true],
  ["沒有氣泡", false],
  ["沒有空氣跑出來", false],
  ["甚麼也沒有", false],
  ["水變顏色了", false]
].forEach(function (pair) {
  (pair[1] ? ok : no)(2, pair[0]);
});

[
  ["紙巾變濕了", true],
  ["水位上升了", true],
  ["杯子裡面有水", true],
  ["紙巾濕咗", true],
  ["水進不去", false],
  ["水沒有進去", false],
  ["沒有濕", false],
  ["紙巾還是乾的", false],
  ["水還是進不去", false]
].forEach(function (pair) {
  (pair[1] ? ok : no)(3, pair[0]);
});

[
  ["藏著空氣", true],
  ["空氣佔有空間", true],
  ["因為杯裡面有空氣擋住水", true],
  ["有氣擋住水", true],
  ["位置", false],
  ["空間", false],
  ["沒有空氣", false],
  ["有氣泡", false],
  ["因為水太重了", false],
  ["杯子裡甚麼也沒有", false]
].forEach(function (pair) {
  (pair[1] ? ok : no)(4, pair[0]);
});

[
  ["空氣雖然看不見，但佔有空間", true],
  ["看不見的空氣會佔住位置", true],
  ["空氣占有空間", true],
  ["佔有空間", false],
  ["位置", false],
  ["沒有空氣佔有空間", false],
  ["空氣不是佔有空間", false],
  ["水才佔有空間", false]
].forEach(function (pair) {
  (pair[1] ? ok : no)(5, pair[0]);
});

assert.strictEqual(G.grade(0, "   ").reason, "empty");
assert.strictEqual(G.grade(0, "").reason, "empty");
assert.strictEqual(G.grade(99, "空氣").reason, "done");

var spoken = G.speechPlain("**空氣**佔有空間。它是 '乾' 的');alert(1);//");
assert.strictEqual(spoken.indexOf("*"), -1);
assert.ok(spoken.indexOf("'乾'") !== -1);
assert.ok(spoken.indexOf("alert(1)") !== -1);

var voices = [
  { lang: "en-US", name: "English" },
  { lang: "zh-TW", name: "Google 國語（臺灣）" },
  { lang: "zh-CN", name: "Ting-Ting" },
  { lang: "zh-HK", name: "Google 粵語（香港）" }
];
assert.strictEqual(G.pickVoice(voices).lang, "zh-HK");
assert.strictEqual(G.pickVoice([{ lang: "yue-HK", name: "Cantonese" }, { lang: "zh-TW", name: "國語" }]).lang, "yue-HK");
assert.strictEqual(G.pickVoice([{ lang: "en-US", name: "Samantha" }]), null);
assert.strictEqual(G.pickVoice([]), null);

var step = 0;
correct.forEach(function (answer) {
  ok(step, answer);
  step += 1;
});
assert.strictEqual(step, G.steps.length);

console.log("grade tests passed (" + G.steps.length + " steps)");
