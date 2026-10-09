/* 杯子＋紙巾實驗的答案判斷。
   垂直壓入：空氣佔住杯內空間，紙巾保持乾。
   傾斜：空氣以氣泡離開，水才能進入，紙巾變濕。
   結論：空氣佔有空間。 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.P5Grade = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function normalize(raw) {
    return String(raw == null ? "" : raw)
      .replace(/[\u200b\uFEFF]/g, "")
      .replace(/[\s\u3000]+/g, "")
      .replace(/[，。！？、；：,.!?;:“”"'「」『』（）()[\]…~～\-—]/g, "")
      .replace(/湿/g, "濕")
      .replace(/气/g, "氣")
      .replace(/占/g, "佔")
      .replace(/干(?=的|爽|燥)/g, "乾")
      .replace(/冇/g, "沒")
      .replace(/係/g, "是")
      .replace(/嘅/g, "的")
      .replace(/咗/g, "了")
      .replace(/喺/g, "在")
      .replace(/入面/g, "裡面")
      .replace(/裏面/g, "裡面")
      .replace(/唔/g, "不");
  }

  function mask(s, phrases) {
    var sorted = phrases.slice().sort(function (a, b) { return b.length - a.length; });
    return sorted.reduce(function (acc, phrase) {
      return acc.split(phrase).join("＃");
    }, s);
  }

  var NOT_WET = ["有沒有變濕", "有沒有濕", "沒有變濕", "沒有濕", "沒濕", "不濕", "未濕", "無濕"];
  var NOT_ENTER = [
    "有沒有進去", "有沒有進入", "沒有進去", "沒有進入", "沒進去", "沒進入",
    "進不去", "進不了", "入不去", "入不了", "不能進", "不能入",
    "沒有進", "沒進", "沒有入", "沒入", "水沒進", "水沒入"
  ];

  function mentionsDry(s) {
    if (/半乾|有點乾|有些乾|少少乾|不乾|沒有乾|不是乾|未乾|無乾/.test(s)) return false;
    return /乾/.test(s);
  }

  function mentionsNotWet(s) {
    return /沒有變濕|沒有濕|沒濕|不濕|未濕|無濕/.test(s);
  }

  function step1(s) {
    if (/不知道|不確定|不清楚/.test(s) && !mentionsDry(s) && !mentionsNotWet(s)) return false;
    var wet = /濕/.test(mask(s, NOT_WET));
    var dry = mentionsDry(s);
    if (wet) return false;
    return dry || mentionsNotWet(s);
  }

  function step2(s) {
    var notEntered = /沒有?進|沒有?入|進不|入不|不能進|不能入|無水進|水沒/.test(s);
    var dry = mentionsDry(s);
    var notWet = mentionsNotWet(s);
    var noEvidence = /沒有證據|無證據|沒證據/.test(s);
    var entered = /充滿|灌滿|進去了|有進去|水進入|進入了|跑進去|滲進|變濕|濕了|濕透|水進了/.test(
      mask(s, NOT_ENTER.concat(NOT_WET))
    );
    if (entered && !notEntered) return false;
    if (noEvidence && !notEntered && !dry && !notWet) return false;
    if (/不知道|不清楚/.test(s) && !notEntered && !dry && !notWet) return false;
    return notEntered || dry || notWet;
  }

  function step3(s) {
    var masked = mask(s, [
      "沒有氣泡", "沒氣泡", "沒有泡泡", "沒泡泡", "沒有泡", "沒泡",
      "沒有空氣", "沒空氣", "無空氣", "空氣沒有",
      "甚麼也沒有", "什麼也沒有", "甚麼都沒有", "什麼都沒有", "沒有東西"
    ]);
    if (/變色|變顏色|變了顏色/.test(s) && !/氣泡|泡泡|咕嚕|冒泡|有泡/.test(masked)) return false;
    if (/氣泡|泡泡|冒泡|咕嚕|圓泡|有泡/.test(masked)) return true;
    return /空氣/.test(masked);
  }

  function step4(s) {
    var masked = mask(s, NOT_ENTER.concat(NOT_WET).concat([
      "還是乾", "仍然乾", "仍是乾", "保持乾", "依然乾", "還是乾的"
    ]));
    if (/乾/.test(masked) && !/濕|進去|進入|水進|有水|水位/.test(masked)) return false;
    return /濕|進去|進入|水進|有水|水位上升|水位升高|水位高了|水位升了|水位上漲|灌進|滲進|入了水|滿水/.test(masked);
  }

  function step5(s) {
    var masked = mask(s, ["沒有空氣", "無空氣", "不是空氣", "沒空氣"]);
    if (/空氣沒有佔|空氣不佔|空氣不是/.test(s)) return false;
    if (/太重/.test(s) && !/空氣/.test(masked)) return false;
    if (/甚麼也沒有|什麼也沒有|甚麼都沒有|什麼都沒有|沒有東西/.test(s) && !/空氣/.test(masked)) return false;
    if (/空氣/.test(masked)) return true;
    var noBubble = masked.replace(/氣泡/g, "").replace(/泡泡/g, "");
    return /有氣|藏氣|藏住氣/.test(noBubble);
  }

  function step6(s) {
    var masked = mask(s, ["沒有空氣", "無空氣", "不是空氣", "沒空氣"]);
    if (/空氣不是|空氣不佔|空氣沒有|不佔有|沒有佔/.test(s)) return false;
    if (!/空氣/.test(masked)) return false;
    if (/水才佔|只有水佔|水佔有/.test(s) && !/空氣佔/.test(masked)) return false;
    return /佔/.test(masked) && /空間|位置|位子/.test(masked);
  }

  var steps = [
    {
      id: 1,
      type: "observe",
      typeLabel: "觀察",
      question: "你好！杯底已塞好紙巾。把杯子**垂直**壓入水中再取出，你**觀察到**杯底的紙巾有甚麼變化？",
      hint: "用手指摸摸杯底的紙巾，比較它是乾的，還是濕的。",
      options: ["紙巾是乾的", "紙巾濕透了", "不知道"],
      wrong: "再摸摸看。杯子要垂直放入水中，不要傾斜。紙巾摸起來是乾的，還是濕的？",
      accept: step1
    },
    {
      id: 2,
      type: "evidence",
      typeLabel: "證據",
      question: "紙巾是乾的。你有甚麼**證據**，證明水有沒有進到杯子底部？",
      hint: "如果水剛才進了杯底，紙巾會變成怎樣？現在的紙巾又是怎樣？",
      options: ["水沒有進去，因為紙巾沒濕", "水充滿了杯子", "沒有證據"],
      wrong: "如果水剛才跑進杯底，紙巾還會是乾的嗎？用紙巾的狀況說明水有沒有進去。",
      accept: step2
    },
    {
      id: 3,
      type: "observe",
      question: "觀察得好！現在把杯子在水中稍微**傾斜**，你**觀察到**甚麼跑出來？",
      hint: "看看水裡有沒有一粒粒圓圓的、向上升的東西。",
      options: ["有氣泡跑出來", "甚麼也沒有", "水變顏色了"],
      wrong: "再看清楚。杯子傾斜時，水面有沒有冒出咕嚕咕嚕的圓泡？",
      accept: step3
    },
    {
      id: 4,
      type: "evidence",
      typeLabel: "證據",
      question: "對，有氣泡冒出來。氣泡跑走之後，水有沒有進入杯子？你的**證據**是甚麼？",
      hint: "傾斜之後，再看杯子裡的水位，以及杯底紙巾有沒有變濕。",
      options: ["水進去了，紙巾變濕了", "水還是進不去", "紙巾還是乾的"],
      wrong: "氣泡跑出來之後，再摸摸紙巾。現在紙巾有沒有變濕？杯子裡有沒有水？",
      accept: step4
    },
    {
      id: 5,
      type: "explain",
      typeLabel: "解釋",
      question: "為甚麼氣泡跑出來之後，水才進得去？杯子裡原本藏著甚麼？",
      hint: "那些冒出來的氣泡，就是原本藏在杯子裡的東西。它剛才佔著位置。",
      options: ["藏著空氣，它佔了位置", "杯子裡甚麼也沒有", "因為水太重了"],
      wrong: "那些跑出來的氣泡是甚麼？它剛才在杯子裡時，有沒有擋住水？",
      accept: step5
    },
    {
      id: 6,
      type: "conclude",
      typeLabel: "結論",
      question: "請用自己的一句話講出**結論**：這個實驗說明空氣有甚麼特性？",
      hint: "空氣雖然看不見，試講它會不會佔住杯子裡的空間。",
      options: ["空氣佔有空間", "空氣甚麼也不是", "水才佔有空間"],
      wrong: "回想整組實驗：看不見的空氣留在杯裡時，水進不去。空氣離開後，水才進來。空氣有甚麼特性？",
      accept: step6
    }
  ];

  steps.forEach(function (step) {
    if (!step.typeLabel) {
      step.typeLabel = { observe: "觀察", evidence: "證據", explain: "解釋", conclude: "結論" }[step.type] || "探究";
    }
  });

  function grade(stepIndex, raw) {
    var step = steps[stepIndex];
    if (!step) return { ok: false, reason: "done" };
    var original = String(raw == null ? "" : raw).trim();
    if (!original) return { ok: false, reason: "empty" };
    if (/[<>]/.test(original)) return { ok: false, reason: "wrong" };
    var norm = normalize(original);
    var hintNorm = normalize(step.hint);
    if (!norm) return { ok: false, reason: "empty" };
    if (norm === hintNorm || norm === "提示" + hintNorm) return { ok: false, reason: "hint" };
    var graded = hintNorm ? norm.split(hintNorm).join("") : norm;
    if (!graded) return { ok: false, reason: "hint" };
    return step.accept(graded) ? { ok: true, reason: "ok" } : { ok: false, reason: "wrong" };
  }

  function speechPlain(text) {
    return String(text == null ? "" : text)
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]+/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .trim();
  }

  function scoreVoice(voice) {
    if (!voice) return 0;
    var lang = String(voice.lang || "").toLowerCase().replace(/_/g, "-");
    var name = String(voice.name || "").toLowerCase();
    var score = 0;
    if (lang === "zh-hk" || lang.indexOf("zh-hk-") === 0) score += 100;
    if (lang === "yue" || lang.indexOf("yue-") === 0) score += 100;
    if (/cantonese|hong kong|粵|粤|yue/.test(name)) score += 50;
    if (score < 100 && (lang.indexOf("zh") === 0)) score += 10;
    return score;
  }

  function pickVoice(voices) {
    var best = null;
    var bestScore = 0;
    var list = voices || [];
    for (var i = 0; i < list.length; i++) {
      var score = scoreVoice(list[i]);
      if (score > bestScore) {
        bestScore = score;
        best = list[i];
      }
    }
    return bestScore >= 10 ? best : null;
  }

  return {
    steps: steps,
    grade: grade,
    normalize: normalize,
    speechPlain: speechPlain,
    pickVoice: pickVoice,
    scoreVoice: scoreVoice
  };
});
