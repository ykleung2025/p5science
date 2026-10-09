(function () {
  var G = window.P5Grade;
  var chat = document.getElementById("chat");
  var optionsEl = document.getElementById("options");
  var form = document.getElementById("composer");
  var input = document.getElementById("user-input");
  var sendBtn = document.getElementById("send");
  var hintBtn = document.getElementById("hint");
  var resetBtn = document.getElementById("reset");
  var statusEl = document.getElementById("form-status");
  var progressText = document.getElementById("progress-text");
  var progressDots = document.getElementById("progress-dots");
  var app = document.getElementById("app");
  var stage = document.getElementById("stage");
  var stageKicker = document.getElementById("stage-kicker");
  var stageCaption = document.getElementById("stage-caption");
  var tankBadge = document.getElementById("tank-badge");

  var SCENES = [
    { scene: "push", badge: "垂直壓入", caption: "杯口朝下，垂直壓入水中，紙巾還是乾的。" },
    { scene: "dry", badge: "紙巾是乾的", caption: "紙巾沒有濕，證明水沒有進到杯底。" },
    { scene: "bubbles", badge: "氣泡跑出", caption: "杯子一傾斜，空氣就變成氣泡跑出來。" },
    { scene: "wet", badge: "紙巾變濕", caption: "氣泡走了，水進到杯裡，紙巾變濕。" },
    { scene: "air", badge: "空氣佔住位置", caption: "杯裡的空氣佔住位置，所以水剛才進不去。" },
    { scene: "air", badge: "說出結論", caption: "看著杯裡的空氣，用一句話講出它的特性。" }
  ];

  var stepIndex = 0;
  var phase = "ask";
  var generation = 0;
  var busy = false;
  var resetArmed = false;
  var resetTimer = 0;
  var imeEnter = false;

  function setPhase(next) {
    phase = next;
    app.setAttribute("data-phase", phase);
    app.setAttribute("data-step", phase === "done" ? "done" : String(stepIndex + 1));
  }

  function scrollChat() {
    window.requestAnimationFrame(function () {
      chat.scrollTop = chat.scrollHeight;
    });
  }

  function fitViewport() {
    if (!window.visualViewport) return;
    var height = window.visualViewport.height;
    app.style.height = height + "px";
    scrollChat();
  }

  function appendRich(parent, text) {
    var parts = String(text == null ? "" : text).split(/(\*\*[^*]+\*\*)/g);
    parts.forEach(function (part) {
      if (!part) return;
      var marked = part.match(/^\*\*([^*]+)\*\*$/);
      if (marked) {
        var strong = document.createElement("strong");
        strong.textContent = marked[1];
        parent.appendChild(strong);
      } else {
        parent.appendChild(document.createTextNode(part));
      }
    });
  }

  function speak(text) {
    try {
      var synth = window.speechSynthesis;
      if (!synth || typeof window.SpeechSynthesisUtterance !== "function") {
        statusEl.textContent = "這部裝置未能朗讀，請讀畫面上的字。";
        return;
      }
      var plain = G.speechPlain(text);
      if (!plain) return;
      var utter = new window.SpeechSynthesisUtterance(plain);
      utter.lang = "zh-HK";
      utter.rate = 0.95;
      var voice = G.pickVoice(synth.getVoices());
      if (voice) {
        utter.voice = voice;
        if (voice.lang) utter.lang = voice.lang;
      }
      var start = function () {
        try {
          synth.resume();
          synth.speak(utter);
        } catch (err) {
          statusEl.textContent = "暫時未能朗讀，請讀畫面上的字。";
        }
      };
      if (synth.speaking || synth.pending) {
        synth.cancel();
        window.setTimeout(start, 80);
      } else {
        start();
      }
    } catch (err) {
      statusEl.textContent = "暫時未能朗讀，請讀畫面上的字。";
    }
  }

  function addMessage(kind, text, speechText) {
    var row = document.createElement("div");
    row.className = "msg " + (kind === "user" ? "user" : "bot");
    row.setAttribute("role", "article");

    if (kind !== "user") {
      var avatar = document.createElement("span");
      avatar.className = "avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = "🔬";
      row.appendChild(avatar);
    }

    var bubble = document.createElement("div");
    bubble.className = "bubble " + kind;

    if (kind !== "user") {
      var kicker = document.createElement("p");
      kicker.className = "kicker";
      var labels = { ask: "", hint: "提示", wrong: "再試一次", end: "結論", note: "助手" };
      var step = G.steps[stepIndex];
      kicker.textContent = kind === "ask" && step ? step.typeLabel : (labels[kind] || "助手");
      bubble.appendChild(kicker);
    }

    var body = document.createElement("p");
    body.className = "msg-text";
    appendRich(body, text);
    bubble.appendChild(body);

    if (kind !== "user") {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "speak-btn";
      btn.textContent = "聽聲音";
      btn.setAttribute("aria-label", "朗讀這則訊息");
      var spoken = speechText || G.speechPlain(text);
      btn.addEventListener("click", function () {
        speak(spoken);
      });
      bubble.appendChild(btn);
    }

    row.appendChild(bubble);
    chat.appendChild(row);
    scrollChat();
    return row;
  }

  function updateProgress() {
    progressDots.textContent = "";
    G.steps.forEach(function (step, index) {
      var li = document.createElement("li");
      if (phase === "done" || index < stepIndex) li.className = "is-done";
      else if (index === stepIndex) li.className = "is-now";
      li.textContent = step.typeLabel;
      progressDots.appendChild(li);
    });
    if (phase === "done") {
      progressText.textContent = "探究完成：空氣佔有空間";
    } else {
      var current = G.steps[stepIndex];
      progressText.textContent = "第 " + (stepIndex + 1) + " 步，共 " + G.steps.length + " 步：" + current.typeLabel;
    }
    renderStage();
  }

  function renderStage() {
    if (phase === "done") {
      stage.setAttribute("data-scene", "conclude");
      stageKicker.textContent = "探究完成";
      stageCaption.textContent = "結論：空氣雖然看不見，但佔有空間。";
      tankBadge.textContent = "空氣佔有空間";
      return;
    }
    var scene = SCENES[stepIndex];
    var step = G.steps[stepIndex];
    stage.setAttribute("data-scene", scene.scene);
    stageKicker.textContent = "第 " + (stepIndex + 1) + " 步 · " + step.typeLabel;
    stageCaption.textContent = scene.caption;
    tankBadge.textContent = scene.badge;
  }

  function setOptions(list, onPick) {
    optionsEl.textContent = "";
    list.forEach(function (label) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option";
      btn.textContent = label;
      btn.addEventListener("click", function () {
        onPick(label);
      });
      optionsEl.appendChild(btn);
    });
  }

  function setBusy(next) {
    busy = next;
    sendBtn.disabled = next;
    hintBtn.disabled = next;
    optionsEl.querySelectorAll("button").forEach(function (btn) {
      btn.disabled = next;
    });
  }

  function clearStatus() {
    statusEl.textContent = "";
    input.removeAttribute("aria-invalid");
  }

  function askCurrent() {
    var step = G.steps[stepIndex];
    updateProgress();
    addMessage("ask", step.question);
    setOptions(step.options, function (label) {
      input.value = label;
      handleSend("option");
    });
  }

  function showDone() {
    setPhase("done");
    updateProgress();
    addMessage(
      "end",
      "太棒了！你得出結論：**空氣雖然看不見，但它佔有空間。** 空氣留在杯子裡時，水進不去；空氣跑出來後，水才能進去。"
    );
    setOptions(["我學會了！", "再玩一次"], function (label) {
      input.value = label;
      handleSend("option");
    });
  }

  function respond(text) {
    if (phase === "done") {
      if (/再玩一次|重新開始|再來一次|再玩/.test(text)) {
        resetChat();
        return;
      }
      addMessage("note", "你已經明白：**空氣雖然看不見，但它佔有空間。** 可以按「再玩一次」再探究。");
      return;
    }

    var result = G.grade(stepIndex, text);
    if (result.reason === "hint") {
      addMessage("note", "這句是提示。請用自己的說話，講出你看到或想到的答案。");
      return;
    }
    if (!result.ok) {
      addMessage("wrong", G.steps[stepIndex].wrong);
      return;
    }

    stepIndex += 1;
    if (stepIndex >= G.steps.length) {
      showDone();
      return;
    }
    setPhase("ask");
    askCurrent();
  }

  function handleSend(source) {
    if (busy) return;
    var text = input.value.trim();
    if (!text) {
      statusEl.textContent = "請先輸入答案，或點選上面的選項。";
      input.setAttribute("aria-invalid", "true");
      if (source !== "option") input.focus();
      return;
    }
    clearStatus();
    disarmReset();
    addMessage("user", text);
    input.value = "";
    var token = generation;
    setBusy(true);
    window.setTimeout(function () {
      setBusy(false);
      if (token !== generation) return;
      respond(text);
      if (source !== "option") input.focus();
    }, 280);
  }

  function showHint() {
    if (busy) return;
    clearStatus();
    if (phase === "done") {
      addMessage("hint", "探究完成了。結論是：**空氣佔有空間。**");
      return;
    }
    var hint = G.steps[stepIndex].hint;
    var last = chat.lastElementChild;
    if (last && last.dataset.hint === String(stepIndex)) {
      scrollChat();
      statusEl.textContent = "提示就在上面，再看一次。";
      return;
    }
    var row = addMessage("hint", hint, "提示。" + G.speechPlain(hint));
    row.dataset.hint = String(stepIndex);
  }

  function disarmReset() {
    resetArmed = false;
    resetBtn.textContent = "重新開始";
    window.clearTimeout(resetTimer);
  }

  function resetChat() {
    generation += 1;
    setBusy(false);
    stepIndex = 0;
    setPhase("ask");
    chat.textContent = "";
    input.value = "";
    clearStatus();
    disarmReset();
    askCurrent();
  }

  function onReset() {
    var fresh = phase === "ask" && stepIndex === 0 && chat.querySelectorAll(".msg.user").length === 0;
    if (!fresh && !resetArmed) {
      resetArmed = true;
      resetBtn.textContent = "確定重新開始？";
      resetTimer = window.setTimeout(disarmReset, 3000);
      return;
    }
    resetChat();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (imeEnter) return;
    handleSend("enter");
  });

  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && (event.isComposing || event.keyCode === 229)) {
      imeEnter = true;
    }
  });

  input.addEventListener("keyup", function (event) {
    if (event.key !== "Enter") return;
    window.setTimeout(function () {
      imeEnter = false;
    }, 0);
  });

  input.addEventListener("input", function () {
    if (input.value.trim()) clearStatus();
  });

  hintBtn.addEventListener("click", showHint);
  resetBtn.addEventListener("click", onReset);

  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", function () {});
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", fitViewport);
    window.visualViewport.addEventListener("scroll", fitViewport);
    fitViewport();
  }

  setPhase("ask");
  askCurrent();
})();
