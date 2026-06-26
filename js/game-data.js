const eventFlow = [
      {
        stage: "都市願景",
        eventType: "願景",
        title: "第一局：想像中的綠廊道是什麼樣子？",
        text: "第一層會設定後續政策的基調：休憩、商業或交通，各自會帶來不同族群期待與壓力。",
        agent: "玩家要在有限 cost 裡決定綠廊最先被誰看見、誰使用，以及誰開始感到壓力。",
        options: [
          { key: "vision_rest", char: "憩", title: "景觀休憩", desc: "先提供可停留的日常綠地。", cost: 1, delta: { moveSafety: 0, maintenanceTrust: 1, gentrificationPressure: 1 } },
          { key: "vision_commerce_v4", char: "市", title: "商業活化", desc: "用人潮與店家創造街區熱度。", cost: 2, delta: { moveSafety: 1, maintenanceTrust: 0, gentrificationPressure: 2 } },
          { key: "vision_mobility_v4", char: "行", title: "交通轉化", desc: "把綠廊視為移動基礎設施。", cost: 3, delta: { moveSafety: 2, maintenanceTrust: 0, gentrificationPressure: 0 } },
          { key: "gag_pool_l1", char: "泳", title: "大游泳池", desc: "把綠廊直接挖成城市泳池。", cost: 10, gagSeries: "pool", delta: {} }
        ]
      },
      {
        stage: "景觀願景",
        eventType: "景觀",
        title: "第二局：開放空間要長成什麼樣子？",
        text: "景觀不是只看美感，空曠、密植或低矮設計會影響夜間安全、維護信任與未來開發想像。",
        agent: "學生在意能不能安全通過，高齡居民在意視線與維護，在地青年會留意環境改善是否轉成價格壓力。",
        options: [
          { key: "landscape_plaza", char: "場", title: "空曠廣場", desc: "保留開放視野與彈性使用。", cost: 1, delta: { moveSafety: -1, maintenanceTrust: -1, gentrificationPressure: 0 } },
          { key: "landscape_tall_trees", char: "森", title: "很多高大的樹", desc: "快速形成濃密綠廊效果。", cost: 2, delta: { moveSafety: -1, maintenanceTrust: -1, gentrificationPressure: 1 } },
          { key: "landscape_low_plants", char: "花", title: "低矮草和花", desc: "維持視線並保留景觀感。", cost: 3, delta: { moveSafety: 1, maintenanceTrust: 1, gentrificationPressure: 1 } },
          { key: "gag_pool_l2", char: "泳", title: "大游泳池", desc: "把第二段也延伸成水域景觀。", cost: 10, gagSeries: "pool", delta: {} }
        ]
      },
      {
        stage: "景觀維護",
        eventType: "維護",
        title: "第三局：景觀後續要怎麼被照顧？",
        text: "維護方式會決定居民是否感覺到政策被持續照顧，而不是完工後就被留在原地。",
        agent: "這一局特別影響高齡居民對樹種、落葉、排水與管理責任的信任。",
        options: [
          { key: "maintenance_plaza", char: "廣", title: "廣場維護", desc: "用最低限度維持基本整潔。", cost: 1, delta: { moveSafety: 0, maintenanceTrust: -1, gentrificationPressure: 0 } },
          { key: "maintenance_flat", char: "平", title: "扁平單一植栽", desc: "降低管理複雜度與視線死角。", cost: 2, delta: { moveSafety: 0, maintenanceTrust: 1, gentrificationPressure: 0 } },
          { key: "maintenance_ecology", char: "生", title: "自然生態圈", desc: "提高生態感與區域吸引力。", cost: 3, delta: { moveSafety: 0, maintenanceTrust: 0, gentrificationPressure: 1 } },
          { key: "gag_pool_l3", char: "池", title: "大游泳池維護", desc: "讓維護團隊改成水質管理隊。", cost: 10, gagSeries: "pool", delta: {} }
        ]
      },
      {
        stage: "交通政策",
        eventType: "交通",
        title: "第四局：綠廊要優先服務哪種移動？",
        text: "交通政策會決定綠廊是維持車行效率、轉向步行自行車，還是折衷混合。",
        agent: "學生最在意移動安全與效率；長輩在意是否被車流或新交通工具嚇到。",
        options: [
          { key: "traffic_vehicle", char: "車", title: "汽機車", desc: "維持既有車行與停車便利。", cost: 1, delta: { moveSafety: -1, maintenanceTrust: 0, gentrificationPressure: 0 } },
          { key: "traffic_walk_bike", char: "步", title: "自行車步行優先", desc: "把日常慢行放在道路設計前面。", cost: 2, delta: { moveSafety: 2, maintenanceTrust: 0, gentrificationPressure: 1 } },
          { key: "traffic_mixed", char: "混", title: "混合", desc: "保留多種交通使用彈性。", cost: 3, delta: { moveSafety: 1, maintenanceTrust: 0, gentrificationPressure: 0 } },
          { key: "gag_segway_l4", char: "衡", title: "電動平衡車", desc: "把科技感交通工具推成亮點。", cost: 10, gagSeries: "segway", delta: {} }
        ]
      },
      {
        stage: "交通設計",
        eventType: "路口",
        title: "第五局：街廓與路口要怎麼重新分配？",
        text: "細部交通設計會影響衝突風險、長輩步行感受，也可能讓高投資基建轉成開發訊號。",
        agent: "交通改善越明確，越可能提高安全感；但投資強度也可能提高仕紳化壓力。",
        options: [
          { key: "design_slow", char: "慢", title: "減速街廓", desc: "降低車速，維持生活街區節奏。", cost: 1, delta: { moveSafety: 0, maintenanceTrust: 0, gentrificationPressure: 0 } },
          { key: "design_walk_limit", char: "徒", title: "嚴格徒步限制", desc: "用明確規範減少人車衝突。", cost: 2, delta: { moveSafety: 1, maintenanceTrust: 1, gentrificationPressure: 0 } },
          { key: "design_separate", char: "分", title: "人車分流", desc: "投入較高成本做完整基建。", cost: 3, delta: { moveSafety: 1, maintenanceTrust: 1, gentrificationPressure: 2 } },
          { key: "gag_segway_l5", char: "道", title: "電動平衡車專用道", desc: "替平衡車畫出專屬城市賽道。", cost: 10, gagSeries: "segway", delta: {} }
        ]
      },
      {
        stage: "房價政策",
        eventType: "居住",
        title: "第六局：房價與開發壓力要怎麼處理？",
        text: "最後一層不是直接選結局，而是選擇房價政策槓桿，決定熱度、保障與開發之間的關係。",
        agent: "在地青年居民會追問：這條綠廊是讓人留下來，還是把地方重新定價？",
        options: [
          { key: "housing_market", char: "市", title: "市場自然發展", desc: "讓周邊價值由市場自行反映。", cost: 1, delta: { moveSafety: 0, maintenanceTrust: 0, gentrificationPressure: 1 } },
          { key: "housing_justice", char: "居", title: "居住正義保障", desc: "用配套對沖租金與排擠風險。", cost: 2, delta: { moveSafety: 1, maintenanceTrust: 1, gentrificationPressure: -2 } },
          { key: "housing_development", char: "招", title: "招商開發優先", desc: "把綠廊作為大型投資入口。", cost: 3, delta: { moveSafety: 0, maintenanceTrust: 0, gentrificationPressure: 3 } },
          { key: "gag_cyber_l6", char: "樓", title: "賽博龐克大樓", desc: "用未來感大樓一次改寫天際線。", cost: 10, gagSeries: "cyber", delta: {} }
        ]
      }
    ];



