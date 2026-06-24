function getAgentSummaryText() {
      return agents.map(agent => `${agent.name}：${agentState[agent.key]}`).join("、");
    }

    function getInternalScoreSummaryText() {
      return [
        `移動安全：${state.moveSafety}`,
        `維護信任：${state.maintenanceTrust}`,
        `仕紳化壓力：${state.gentrificationPressure}`,
        `已使用 cost：${state.costSpent}/${totalCost}`,
        `剩餘 cost：${remainingCost()}`
      ].join("、");
    }

    function getRoundSummaryText() {
      if (!logs.length) return "玩家沒有完成任何政策選擇。";
      return logs.map((log, index) => `${index + 1}. ${log}`).join("\n");
    }

    function buildDiscussionPrompt(result) {
      return [
        "我剛玩了一個「都市的聲音：台南鐵路綠廊道政策牌局」互動測驗，想請你和我一起分析這條政策路線。",
        "",
        "【議題背景】",
        "這個遊戲以台南鐵路地下化後的綠廊道治理想像為題。綠廊道可能同時牽涉公共空間、植栽維護、慢行交通、轉乘銜接、商圈活化、房價與租金壓力，以及不同年齡與居住型態居民的日常需求。",
        "請保持中立分析：不要把任何單一選項預設為絕對正確或錯誤，也不要把 Agent 回應視為真實民調。這些回應是基於資料整理與角色設定的政策模擬，用來幫助討論不同取捨。",
        "",
        "【遊戲規則摘要】",
        `玩家有總 cost ${totalCost}，共 6 個政策節點。每張牌會消耗 cost，並在內部累積三個隱藏軸：移動安全、維護信任、仕紳化壓力。`,
        "移動安全大致對應短居學生對通勤、騎行、夜間安全的需求；維護信任大致對應高齡居民對照明、排水、樹種與可見維護的需求；仕紳化壓力大致對應在地青年居民面對商圈活力與居住排擠的矛盾。",
        "如果玩家選到搞笑牌，會直接導向對應系列的荒謬結局；若沒有，則依三軸最高分、兩兩同分或三軸全平判定結局。",
        "",
        "【我的結果】",
        `我的測驗結果是：${result.title}`,
        `結果說明：${result.text}`,
        `我的選擇路徑：${path.length ? path.join(" → ") : "無"}`,
        `內部判定摘要：${getInternalScoreSummaryText()}`,
        "",
        "【每回合摘要】",
        getRoundSummaryText(),
        "",
        "【四種 Agent 最終期望度】",
        getAgentSummaryText(),
        "",
        "【我想討論的方向】",
        "請你從以下角度分析：",
        "1. 請先重建我的政策路線：每一步選擇大概代表什麼治理想像？它們之間是否一致，或在哪些地方互相拉扯？",
        "2. 這條路線最可能回應哪些族群的需求？哪些族群可能會覺得被忽略？請分別討論青年短居學生、青年在地居民、高齡在地居民與輿論報導。",
        "3. 請分析三個隱藏軸的結果：移動安全、維護信任、仕紳化壓力各自如何被我的選擇推高或壓低？",
        "4. 請指出這條路線在交通、植栽、維護、居住正義、商業活化或地方溝通上的盲點。",
        "5. 如果要修正這條路線，請提出三個下一步政策調整，並說明各自可能犧牲或改善什麼。",
        "6. 請提出三個適合放進公聽會、課堂討論或政策簡報的中立討論問題。"
      ].join("\n");
    }

    function buildShareText(result) {
      return [
        "我在「都市的聲音：台南鐵路綠廊道政策牌局」",
        `得到的結果是：${result.title}`,
        "你會怎麼決定台南鐵路綠廊道的未來？",
        "https://skalday.github.io/urban-echoes/"
      ].join("\n");
    }

