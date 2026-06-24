const maxTurns = eventFlow.length;
    let turn = 1;
    let selectedPolicy = eventFlow[0].options[0].key;
    const logs = [];
    const path = [];

    const totalCost = 15;

    const state = {
      moveSafety: 0,
      maintenanceTrust: 0,
      gentrificationPressure: 0,
      costSpent: 0,
      gagSeries: null
    };

    const initialState = { ...state };


    let activeMapLayer = "plant";


    function clamp(value) {
      return Math.max(0, Math.min(100, Math.round(value)));
    }

    function applyDelta(key, value) {
      state[key] = (state[key] || 0) + value;
    }

    function currentNode() {
      return eventFlow[Math.min(turn - 1, maxTurns - 1)];
    }

    function remainingCost() {
      return totalCost - state.costSpent;
    }

    function canAfford(option) {
      return option.cost <= remainingCost();
    }

    function ensureAffordableSelection() {
      const selected = getOption(selectedPolicy);
      if (selected && canAfford(selected)) return;
      const fallback = currentNode().options.find(option => canAfford(option));
      selectedPolicy = fallback ? fallback.key : null;
    }

    function renderMapLayer() {
      const layer = mapLayers[activeMapLayer];
      document.getElementById("mapLayerData").innerHTML = layer.markers.map(marker => `
        <div class="map-marker ${layer.markerClass}" style="left:${marker.x}%; top:${marker.y}%;">
          ${marker.code}
          <span>${marker.label}</span>
        </div>
      `).join("");
      document.getElementById("mapLegend").innerHTML = `
        <strong>${layer.title}</strong>
        <p>${layer.note}</p>
      `;
      Object.keys(mapLayers).forEach(key => {
        document.getElementById(`layer-${key}`).classList.toggle("active", key === activeMapLayer);
      });
    }

    function setMapLayer(layerKey) {
      activeMapLayer = layerKey;
      renderMapLayer();
    }

    function startGame() {
      document.getElementById("introScreen").classList.add("hidden");
      document.getElementById("gameScreen").classList.remove("hidden");
      renderAll();
      renderCurrentEvent();
    }

    function renderPolicyHand() {
      const node = currentNode();
      ensureAffordableSelection();
      document.getElementById("policyHand").innerHTML = node.options.map(option => `
        <button class="policy-tile ${option.key === selectedPolicy ? "active" : ""}" onclick="selectPolicy('${option.key}')" ${canAfford(option) ? "" : "disabled"}>
          <span class="tile-char">${option.char}</span>
          <strong>${option.title}</strong>
          <small>cost ${option.cost}｜${option.desc}</small>
        </button>
      `).join("");
      document.getElementById("selectedTag").textContent = `剩餘 cost:${remainingCost()}`;
    }

    function getAgentScore(agent, option) {
      if (option.gagSeries) {
        const gagScores = { media: 8, student: -3, youngLocal: -5, elder: -5 };
        return gagScores[agent.key] || 0;
      }
      return Math.round(Object.entries(option.delta).reduce((total, [key, value]) => {
        return total + (agent.weights[key] || 0) * value;
      }, 0));
    }

    function getEmotion(score) {
      if (score >= 5) return { label: "支持", mark: "↑", tone: "support" };
      if (score >= 2) return { label: "期待", mark: "↑", tone: "expect" };
      if (score <= -5) return { label: "不滿", mark: "↓", tone: "oppose" };
      if (score <= -2) return { label: "擔心", mark: "↓", tone: "concern" };
      return { label: "觀望", mark: "→", tone: "neutral" };
    }

    function formatRoundTitle(title) {
      return title.replace(/^(第[^：:]+局)[：:]\s*/, "【$1】<br>");
    }

    function getReaction(agent, option) {
      const score = getAgentScore(agent, option);
      const emotion = getEmotion(score);
      const copy = reactionCopy[option.key]?.[agent.key] || [agent.baseline, ["觀望"]];
      return {
        ...agent,
        score,
        emotion,
        comment: copy[0],
        tags: copy[1]
      };
    }

    function renderAgentWall(option = getOption(selectedPolicy), mode = "preview") {
      if (!option) {
        document.getElementById("agentPhase").textContent = "無可選政策";
        document.getElementById("agentWall").innerHTML = agents.map(agent => `
          <article class="agent-card neutral">
            <div class="agent-avatar" aria-hidden="true">${agent.emoji}</div>
            <div class="agent-speech">
              <div class="agent-top">
                <div class="agent-title">
                  <div class="agent-name">${agent.name}</div>
                </div>
                <div class="agent-status">
                  <small class="agent-score">期望度：${agentState[agent.key]}</small>
                  <span class="agent-emotion neutral">觀望 →0</span>
                </div>
              </div>
              <p>「本輪 cost 已不足，沒有新的政策牌可執行。」</p>
            </div>
          </article>
        `).join("");
        return;
      }
      const reactions = agents.map(agent => getReaction(agent, option));
      document.getElementById("agentPhase").textContent = mode === "committed" ? "本輪反應" : "選擇預覽";
      document.getElementById("agentWall").innerHTML = reactions.map(reaction => `
        <article class="agent-card ${reaction.emotion.tone}">
          <div class="agent-avatar" aria-hidden="true">${reaction.emoji}</div>
          <div class="agent-speech">
            <div class="agent-top">
              <div class="agent-title">
                <div class="agent-name">${reaction.name}</div>
              </div>
              <div class="agent-status">
                <small class="agent-score">期望度：${agentState[reaction.key]}</small>
                <span class="agent-emotion ${reaction.emotion.tone}">${reaction.emotion.label} ${reaction.emotion.mark}${Math.abs(reaction.score)}</span>
              </div>
            </div>
            <p>「${reaction.comment}」</p>
          </div>
        </article>
      `).join("");
    }

    function applyAgentReactions(option) {
      agents.forEach(agent => {
        agentState[agent.key] = clamp(agentState[agent.key] + getAgentScore(agent, option));
      });
    }

    function renderCurrentEvent() {
      const node = currentNode();
      document.getElementById("roundTitle").innerHTML = formatRoundTitle(node.title);
      document.getElementById("roundText").textContent = node.text;
      renderAgentWall(getOption(selectedPolicy), "preview");
    }

    function renderAll() {
      renderPolicyHand();
      renderAgentWall(getOption(selectedPolicy), "preview");
      renderMapLayer();
    }

    function selectPolicy(key) {
      const option = currentNode().options.find(item => item.key === key);
      if (!option || !canAfford(option)) return;
      selectedPolicy = key;
      renderPolicyHand();
      renderAgentWall(getOption(selectedPolicy), "preview");
    }

    function getOption(key) {
      return currentNode().options.find(option => option.key === key);
    }

    function applyChoice(option) {
      state.costSpent += option.cost;
      if (option.gagSeries) {
        state.gagSeries = option.gagSeries;
      }
      Object.entries(option.delta).forEach(([key, value]) => applyDelta(key, value));
    }

    function makeFeedbackSummary(option) {
      const reactions = agents.map(agent => getReaction(agent, option));
      const strongest = reactions.reduce((picked, item) => Math.abs(item.score) > Math.abs(picked.score) ? item : picked, reactions[0]);
      const concerns = reactions.filter(reaction => reaction.score < -1).map(reaction => reaction.name);
      const supporters = reactions.filter(reaction => reaction.score > 1).map(reaction => reaction.name);
      if (concerns.length && supporters.length) {
        return `${strongest.name}反應最明顯；${supporters.join("、")}偏支持，${concerns.join("、")}出現疑慮。`;
      }
      if (concerns.length) return `${strongest.name}反應最明顯；本輪主要引發${concerns.join("、")}的疑慮。`;
      if (supporters.length) return `${strongest.name}反應最明顯；本輪獲得${supporters.join("、")}較明確支持。`;
      return "四種 agent 反應接近觀望，這個選擇暫時沒有形成明顯支持或反彈。";
    }

    function playTurn() {
      if (turn > maxTurns) return;

      const node = currentNode();
      const option = getOption(selectedPolicy);
      if (!option || !canAfford(option)) {
        turn += 1;
        if (turn > maxTurns) {
          showResult();
          return;
        }
        selectedPolicy = currentNode().options.find(nextOption => canAfford(nextOption))?.key || null;
        renderAll();
        renderCurrentEvent();
        return;
      }
      applyChoice(option);
      applyAgentReactions(option);

      const summary = makeFeedbackSummary(option);
      path.push(option.title);
      const reactionSummary = agents.map(agent => {
        const reaction = getReaction(agent, option);
        return `${agent.name}${reaction.emotion.label}${reaction.score >= 0 ? "+" : ""}${reaction.score}`;
      }).join("、");
      logs.push(`第 ${turn} 節點｜${node.stage}｜選擇：${option.title}｜cost ${option.cost}｜${summary}｜${reactionSummary}`);

      if (turn >= maxTurns) {
        showResult();
        return;
      }

      document.getElementById("roundTitle").textContent = `${node.eventType}：${option.title}`;
      document.getElementById("roundText").textContent = `${node.text} 本輪回饋：${summary} 目前剩餘 cost：${remainingCost()}。`;
      renderAgentWall(option, "committed");

      turn += 1;

      selectedPolicy = currentNode().options[0].key;
      renderAll();
      renderCurrentEvent();
      renderAgentWall(option, "committed");
    }


    async function copyText(text, feedbackId, successText) {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.setAttribute("readonly", "");
          textarea.style.position = "fixed";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
        document.getElementById(feedbackId).textContent = successText;
      } catch (error) {
        document.getElementById(feedbackId).textContent = "複製失敗，請手動選取文字。";
      }
    }

    function copyDiscussionPrompt() {
      copyText(document.getElementById("discussionPrompt").value, "promptFeedback", "已複製 prompt。");
    }

    function getShareUrl(platform, text) {
      const pageUrl = "https://skalday.github.io/urban-echoes/";
      const encodedText = encodeURIComponent(text);
      const encodedUrl = encodeURIComponent(pageUrl);
      if (platform === "facebook") return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      if (platform === "threads") return `https://www.threads.net/intent/post?text=${encodedText}`;
      if (platform === "x") return `https://twitter.com/intent/tweet?text=${encodedText}`;
      return "";
    }

    function shareResult(platform) {
      const text = window.latestShareText || "";
      if (platform === "facebook") {
        copyText(text, "shareFeedback", "已複製 Facebook 分享文案，並開啟分享視窗。");
        window.open(getShareUrl(platform, text), "_blank", "noopener,noreferrer");
        return;
      }
      if (platform === "instagram") {
        copyText(text, "shareFeedback", "已複製 Instagram 分享文案，請貼到限動或貼文。");
        return;
      }
      const url = getShareUrl(platform, text);
      window.open(url, "_blank", "noopener,noreferrer");
      document.getElementById("shareFeedback").textContent = "已開啟分享視窗。";
    }

    function updateResultAudioButton(isPlaying = false) {
      const button = document.getElementById("resultAudioToggle");
      button.classList.toggle("playing", isPlaying);
      button.setAttribute("aria-label", isPlaying ? "暫停結果聲景" : "播放結果聲景");
    }

    function toggleResultAudio() {
      const audio = document.getElementById("resultAudio");
      if (!audio.src) return;
      if (audio.paused) {
        audio.play()
          .then(() => updateResultAudioButton(true))
          .catch(() => updateResultAudioButton(false));
      } else {
        audio.pause();
        updateResultAudioButton(false);
      }
    }

    function showResult() {
      const result = makeResult();
      window.latestShareText = buildShareText(result);
      document.getElementById("gameScreen").classList.add("hidden");
      document.getElementById("resultScreen").classList.remove("hidden");
      document.getElementById("resultTitle").textContent = result.title;
      document.getElementById("resultRarity").textContent = `結局稀有度 ${result.rarity}`;
      document.getElementById("resultText").textContent = result.text;
      const audio = document.getElementById("resultAudio");
      const soundtrack = endingSoundtracks[result.title];
      audio.pause();
      audio.currentTime = 0;
      if (soundtrack) {
        audio.src = soundtrack;
      } else {
        audio.removeAttribute("src");
      }
      audio.load();
      document.getElementById("resultAudioToggle").disabled = !soundtrack;
      updateResultAudioButton(false);
      audio.onended = () => updateResultAudioButton(false);
      audio.onpause = () => updateResultAudioButton(false);
      audio.onplay = () => updateResultAudioButton(true);
      document.getElementById("resultSoundText").textContent = soundtrack
        ? "播放聲音"
        : "這個結局尚未設定聲景。";
      document.getElementById("discussionPrompt").value = buildDiscussionPrompt(result);
      document.getElementById("promptFeedback").textContent = "";
      document.getElementById("shareFeedback").textContent = "";
      document.getElementById("resultAgents").innerHTML = agents.map(agent => `
        <div class="result-stat">
          <span>${agent.name}</span>
          <strong>${agentState[agent.key]}</strong>
          <div class="bar"><i style="width:${agentState[agent.key]}%"></i></div>
          <p class="result-echo">「${endingEchoes[result.title]?.[agent.key] || agent.baseline}」</p>
        </div>
      `).join("");
    }

    function resetGame() {
      turn = 1;
      selectedPolicy = eventFlow[0].options[0].key;
      logs.length = 0;
      path.length = 0;
      Object.assign(state, initialState);
      Object.assign(agentState, initialAgentState);
      const audio = document.getElementById("resultAudio");
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      document.getElementById("resultAudioToggle").disabled = false;
      updateResultAudioButton(false);
      document.getElementById("resultScreen").classList.add("hidden");
      document.getElementById("introScreen").classList.remove("hidden");
      document.getElementById("gameScreen").classList.add("hidden");
      document.getElementById("roundTitle").innerHTML = formatRoundTitle("第一局：綠廊尚未被解讀");
      document.getElementById("roundText").textContent = "請從下方選擇本輪選項，再按「確認選擇」推進事件樹。";
      renderAll();
    }

    renderAll();
