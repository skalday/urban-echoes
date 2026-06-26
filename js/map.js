// map.js — Leaflet 地圖模組，由 index.html 的 initMap() 啟動
// 透過 window.initMap / updatePolicyMap / previewPolicyMap / restorePolicyMap 與主遊戲通訊
(function () {

  // ── 遊戲牌卡 key → 地圖場景 ID ──────────────────────────────────────
  const gameKeyToScene = {
    "vision_rest":           "vision-rest",
    "vision_commerce_v4":    "vision-commerce",
    "vision_mobility_v4":    "vision-traffic",
    "gag_pool_l1":           "vision-pool",
    "landscape_plaza":       "landscape-plaza",
    "landscape_tall_trees":  "landscape-trees",
    "landscape_low_plants":  "landscape-flowers",
    "gag_pool_l2":           "landscape-pool",
    "maintenance_plaza":     "maintenance-plaza",
    "maintenance_flat":      "maintenance-flat",
    "maintenance_ecology":   "maintenance-eco",
    "gag_pool_l3":           "maintenance-pool",
    "traffic_vehicle":       "traffic-car",
    "traffic_walk_bike":     "traffic-bike",
    "traffic_mixed":         "traffic-mixed",
    "gag_segway_l4":         "traffic-scooter",
    "design_slow":           "design-slow",
    "design_walk_limit":     "design-pedestrian",
    "design_separate":       "design-separated",
    "gag_segway_l5":         "design-scooter",
    "housing_market":        "housing-market",
    "housing_justice":       "housing-justice",
    "housing_development":   "housing-develop",
    "gag_cyber_l6":          "housing-cyber"
  };

  // ── 地圖狀態 ──────────────────────────────────────────────────────────
  let map = null;
  let sceneLayer = null;
  let staticLayer = null;
  let mapInitialized = false;
  let activeSceneId = "vision-rest";
  let lockedSceneId = "vision-rest";
  let housingPointData = null;
  let housingFetchStarted = false;
  let activeHeatLayer = null;
  let sidewalkLayerGroup = null;

  // ── 座標資料 ─────────────────────────────────────────────────────────
  const northCorridor = [
    [23.019625, 120.224447],
    [23.005901, 120.214845],
    [23.005038, 120.214534],
    [23.001572, 120.214019]
  ];

  const southCorridor = [
    [22.994451, 120.212592],
    [22.991538, 120.211938],
    [22.990441, 120.212066],
    [22.989523, 120.212356],
    [22.971417, 120.217806],
    [22.962181, 120.217313],
    [22.960482, 120.217570]
  ];

  const allCorridor = [...northCorridor, ...southCorridor];

  const bridgeNodes = [
    { name: "民族路高架橋", lat: 22.994439, lng: 120.212663 },
    { name: "林森路高架橋", lat: 22.981873, lng: 120.214708 }
  ];

  const elevatedGreenwayBounds = [
    [22.994605, 120.211809],
    [22.994605, 120.215113],
    [22.981883, 120.215113],
    [22.981883, 120.211809]
  ];

  const intersections = [
    { name: "長榮路口", lat: 23.012767, lng: 120.219524 },
    { name: "東豐路口", lat: 23.003968, lng: 120.214337 },
    { name: "小東路口", lat: 23.001553, lng: 120.213945 },
    { name: "青年路口", lat: 22.991499, lng: 120.211997 },
    { name: "東門路口", lat: 22.988619, lng: 120.212554 },
    { name: "府連路口", lat: 22.985327, lng: 120.213554 },
    { name: "榮譽街口", lat: 22.974532, lng: 120.216984 },
    { name: "中華東路口", lat: 22.972989, lng: 120.217473 },
    { name: "生產路口", lat: 22.964718, lng: 120.217478 }
  ];

  const stations = [
    { name: "臺鐵大橋車站", lat: 23.019625, lng: 120.224447 },
    { name: "臺鐵台南車站", lat: 22.996928, lng: 120.213176 },
    { name: "臺鐵林森站",   lat: 22.977343, lng: 120.216191 },
    { name: "臺鐵南臺南站", lat: 22.965715, lng: 120.217510 }
  ];

  const youbikeSites = [
    { name: "大橋車站(北側)", lat: 23.019732, lng: 120.224383 },
    { name: "大橋車站(南側)", lat: 23.019503, lng: 120.224568 },
    { name: "永祥公園",       lat: 23.015654, lng: 120.220231 },
    { name: "成功國中",       lat: 23.008901, lng: 120.216980 },
    { name: "勝安香草運動公園", lat: 23.006096, lng: 120.216170 },
    { name: "臺南二中",       lat: 23.004055, lng: 120.213480 },
    { name: "台南公園(公園南路)", lat: 23.004171, lng: 120.213389 },
    { name: "小東前鋒",       lat: 23.001186, lng: 120.214945 },
    { name: "臺南文化創意產業園區", lat: 22.999594, lng: 120.212821 },
    { name: "臺南車站(前站一)", lat: 22.997878, lng: 120.212443 },
    { name: "臺南車站(前站二)", lat: 22.997737, lng: 120.211990 },
    { name: "臺南車站(前站三)", lat: 22.996762, lng: 120.211882 },
    { name: "臺南車站(前鋒路)", lat: 22.997364, lng: 120.213819 },
    { name: "北門衛民",       lat: 22.993196, lng: 120.211595 },
    { name: "知事官邸生活館", lat: 22.992500, lng: 120.212955 },
    { name: "萬昌街停車場",   lat: 22.991174, lng: 120.210469 },
    { name: "疾病管制署南區管制中心", lat: 22.965721, lng: 120.215993 },
    { name: "大同公英",       lat: 22.971252, lng: 120.214911 },
    { name: "大林派出所",     lat: 22.973697, lng: 120.214634 },
    { name: "立德一路5巷",   lat: 22.976400, lng: 120.214437 },
    { name: "崇明五街停車場", lat: 22.979835, lng: 120.217287 }
  ];

  const trafficCountStations = [
    { name: "牛稠仔",        route: "台1線",  lat: 22.96467, lng: 120.21628, pcu: 47085, groupStrength: 1 },
    { name: "台南公園（北門路）", route: "台20線", lat: 23.00069, lng: 120.21297, pcu: 27262, groupStrength: 0.579 },
    { name: "高等法院（中山路）", route: "台20線", lat: 22.99558, lng: 120.20956, pcu: 18639, groupStrength: 0.396 }
  ];

  const elevatedZoneIndices = [3, 4, 5];

  // ── 公園多邊形 ────────────────────────────────────────────────────────
  // 座標原始格式 lng,lat → 轉為 Leaflet [lat, lng]
  const parkPolygons = [
    {
      name: "永祥里公園", emojiCount: 3,
      coords: [
        [23.015392,120.219924],[23.015392,120.220396],[23.015059,120.220364],
        [23.015019,120.220235],[23.014906,120.220193],[23.014916,120.220101],
        [23.014257,120.220112],[23.013983,120.219889],[23.013625,120.219833],
        [23.013533,120.219978],[23.013168,120.219710],[23.013173,120.219460],
        [23.013314,120.219436],[23.013375,120.219584],[23.013546,120.219602],
        [23.013602,120.219444],[23.014262,120.219675],[23.014521,120.219643],
        [23.014945,120.219501],[23.015318,120.219707]
      ]
    },
    {
      name: "實踐公園", emojiCount: 1,
      coords: [
        [23.013314,120.219440],[23.013366,120.219607],[23.013493,120.219706],
        [23.013352,120.219868],[23.013154,120.219717],[23.013186,120.219461]
      ]
    },
    {
      name: "香草運動公園", emojiCount: 2,
      coords: [
        [23.006549,120.215648],[23.006749,120.216281],
        [23.006159,120.216487],[23.005971,120.215889]
      ]
    },
    {
      name: "台南公園", emojiCount: 5,
      coords: [
        [23.004424,120.210875],[23.003900,120.213418],
        [23.000110,120.212662],[23.001191,120.208966]
      ]
    },
    {
      name: "公60公園", emojiCount: 1,
      coords: [
        [22.962363,120.216954],[22.962360,120.217220],
        [22.960535,120.217410],[22.960530,120.217134]
      ]
    },
    {
      name: "崇賢公園", emojiCount: 1,
      coords: [
        [22.960932,120.217656],[22.960957,120.219885],
        [22.960653,120.219952],[22.960539,120.217712]
      ]
    }
  ];

  // ── cardScenes ────────────────────────────────────────────────────────
  const cardScenes = {
    "vision-rest": {
      round: "1 都市願景", title: "景觀休憩",
      tint: "green", corridor: "green",
      impactEmojis: ["🌳", "🪑", "🚶"], impactCount: 12, impactAnimation: "float",
      dataLegend: "綠廊道北段 / 南段線段與 4 個車站點位。",
      impactLegend: "柔和綠色濾鏡與浮動休憩符號，誇張化安靜散步、停留、樹蔭的城市想像。"
    },
    "vision-commerce": {
      round: "1 都市願景", title: "商業活化",
      tint: "warm", corridor: "green", showSites: true,
      impactEmojis: ["☕", "🛍️", "🏪", "💸"], impactCount: 14, impactAnimation: "pop",
      dataLegend: "YouBike 站點作為沿線可觀察節點；這些點不是商家資料。",
      impactLegend: "暖色濾鏡與跳動商業符號表現人流、消費與活化想像。"
    },
    "vision-traffic": {
      round: "1 都市願景", title: "交通轉化",
      corridor: "traffic", showBikeHint: true, showIntersections: "points",
      showBridges: true, showTrafficCounts: true,
      impactEmojis: ["🚲", "🚶", "🚉"], impactCount: 10, impactAnimation: "pulse",
      dataLegend: "綠廊線段、9 個路口、2 個高架橋點位、4 個車站，以及 3 個 PCU/日交通量調查站。",
      impactLegend: "藍色虛線強化路網轉型感；PCU 顯示現況車流壓力。"
    },
    "vision-pool": {
      round: "1 都市願景", title: "大游泳池 L1",
      tint: "blue", corridor: "blue", corridorWeight: 20,
      impactEmojis: ["🏊", "🌊", "🛟"], impactCount: 16, impactAnimation: "float",
      dataLegend: "廊道線段加粗變藍（weight 20），表現廊道「淹水」成水道的荒謬感。",
      impactLegend: "廊道線寬擴大為水道，游泳池符號沿線漂浮，暗示政策與空間尺度錯位。"
    },
    "landscape-plaza": {
      round: "2 景觀願景", title: "空曠廣場",
      corridor: "green", treeMode: "none", showParks: "green-empty",
      impactEmojis: ["⬜", "🧱", "☀️"], impactCount: 10, impactAnimation: "pulse",
      dataLegend: "廊道線段 + 6 座公園多邊形（綠色）；刻意不顯示行道樹，呈現空曠硬鋪面狀態。",
      impactLegend: "行道樹消失，廣場硬鋪面增加，曝曬感上升。"
    },
    "landscape-trees": {
      round: "2 景觀願景", title: "很多高大的樹",
      tint: "green", corridor: "green", treeMode: "dense",
      corridorPlant: "trees", sightlineWarnings: [1, 4], showParks: "green-trees",
      impactEmojis: ["🌳", "🌲", "🌳"], impactCount: 14, impactAnimation: "float",
      dataLegend: "真實行道樹點位 + 廊道補植樹木符號 + 公園綠色面積（內有🌳）；東豐、東門路口加視線警示。",
      impactLegend: "密植樹冠強化遮蔭感；路口視線警示呼應高齡居民真實抱怨。"
    },
    "landscape-flowers": {
      round: "2 景觀願景", title: "低矮草和花",
      corridor: "green", treeMode: "sparse", corridorPlant: "flowers", showParks: "green-flowers",
      impactEmojis: ["🌼", "🌷", "🌱"], impactCount: 12, impactAnimation: "pop",
      dataLegend: "稀疏行道樹 + 花草符號沿廊道分布 + 公園綠色面積（內有🌼🌷）；加「需持續維護」提示。",
      impactLegend: "植栽密度下降，花草填補空間，但維護標籤暗示後續成本。"
    },
    "landscape-pool": {
      round: "2 景觀願景", title: "大游泳池 L2",
      tint: "blue", corridor: "blue", corridorWeight: 30, showParks: "blue-pool",
      impactEmojis: ["🏊", "🌊", "🤿", "🛟"], impactCount: 26, impactAnimation: "float", impactLarge: true,
      dataLegend: "廊道加粗藍色線段 + 公園面積轉為藍色水域（內有🏊🌊🛟）。",
      impactLegend: "水池範圍再次擴大，廊道與公園全部藍化，荒謬感進一步放大。"
    },
    "maintenance-plaza": {
      round: "3 景觀維護", title: "廣場維護",
      corridor: "green", treeMode: "none", showParks: "green-empty",
      impactEmojis: ["🧹", "⬜", "🧽"], impactCount: 10, impactAnimation: "pulse",
      dataLegend: "廊道線段 + 6 座公園綠色面積（無植栽）；本牌不顯示行道樹，代表維護對象偏硬鋪面。",
      impactLegend: "清潔與空地符號表現低複雜度維護，也暗示空間可能變單調。"
    },
    "maintenance-flat": {
      round: "3 景觀維護", title: "扁平單一植栽",
      corridor: "green", treeMode: "regular", showParks: "green-flat",
      impactEmojis: ["🌱", "🌱", "📋"], impactCount: 16, impactAnimation: "pulse",
      dataLegend: "規律取樣行道樹點位 + 公園綠色面積（內有🌱）；呈現標準化管理感。",
      impactLegend: "重複植栽與排程符號誇張化單一、好管、但缺乏多樣性的維護路線。"
    },
    "maintenance-eco": {
      round: "3 景觀維護", title: "自然生態圈",
      tint: "green", corridor: "green", treeMode: "dense", corridorPlant: "trees", showParks: "green-eco",
      impactEmojis: ["🌿", "🪲", "🦋", "🌼"], impactCount: 18, impactAnimation: "float",
      dataLegend: "真實行道樹點位 + 公園綠色面積（內有🌿🦋🌼）；生態維護邊界模糊。",
      impactLegend: "浮動昆蟲與雜生植物符號表現生態豐富，也暗示維護邊界變模糊。"
    },
    "maintenance-pool": {
      round: "3 景觀維護", title: "大游泳池維護 L3",
      tint: "blue", corridor: "blue", corridorWeight: 30, showParks: "blue-pool",
      impactEmojis: ["🚧", "🧹", "💸", "🛟"], impactCount: 24, impactAnimation: "shake", impactLarge: true,
      dataLegend: "廊道藍色寬線延續 L2 + 公園面積轉為藍色水域（內有🛟💸）；維護場景失控。",
      impactLegend: "龐大水池後續維護失控；抖動的維修與費用符號誇張化維護壓力。"
    },
    "traffic-car": {
      round: "4 交通政策", title: "汽機車",
      corridor: "car", showIntersections: "r4-car", showBridges: false, showYoubike: true,
      impactEmojis: ["🚗", "🛵", "💨"], impactCount: 12, impactAnimation: "shake",
      dataLegend: "9 個路口顯示汽機車平面穿越；21 個 YouBike 站點（🚲）；高架橋不建。",
      impactLegend: "廊道灰暗、路口允許車輛平面通過，凸顯綠廊被切斷。"
    },
    "traffic-bike": {
      round: "4 交通政策", title: "自行車步行優先",
      tint: "green", corridor: "connected", showIntersections: "r4-bike", showBridges: true, showYoubike: true,
      impactEmojis: ["🚲", "🚶", "✨"], impactCount: 14, impactAnimation: "float",
      dataLegend: "9 個路口全部轉為禁止汽機車；21 個 YouBike 站點（🚲）；2 座高架橋保留。",
      impactLegend: "廊道全線連貫，所有路口禁止汽機車，展現最高優先的慢行政策。"
    },
    "traffic-mixed": {
      round: "4 交通政策", title: "混合",
      corridor: "mixed", showIntersections: "r4-mixed", showBridges: true, showYoubike: true,
      impactEmojis: ["🚗", "🚲", "↔️"], impactCount: 10, impactAnimation: "pulse",
      dataLegend: "立體綠廊範圍內路口高架化；其餘 6 個路口維持車道；21 個 YouBike 站點（🚲）；2 座高架橋。",
      impactLegend: "部分高架保護、部分維持車道穿越，折衷帶來複雜性。"
    },
    "traffic-scooter": {
      round: "4 交通政策", title: "電動平衡車 L4",
      corridor: "scooter", showIntersections: "r4-scooter", showYoubike: true,
      impactEmojis: ["🛴", "🛴", "❓"], impactCount: 28, impactAnimation: "shake",
      dataLegend: "9 個路口點位顯示電動平衡車通道；21 個 YouBike 站點（🚲）。",
      impactLegend: "紫色歪斜線與大量抖動平衡車符號誇張化新工具和日常動線不協調。"
    },
    "design-slow": {
      round: "5 交通設計", title: "減速街廓",
      corridor: "green", showTrafficCounts: true, showYoubike: true,
      conflictPoints: [{ index: 1, style: "warning" }, { index: 2, style: "warning" }, { index: 3, style: "warning" }, { index: 4, style: "warning" }],
      impactEmojis: ["🛑", "⚠️"], impactCount: 6, impactAnimation: "pulse",
      dataLegend: "3 個 PCU 調查站；21 個 YouBike 站點（🚲）；東豐、小東、青年、東門路口標示衝突風險。",
      impactLegend: "減速設施有效但主要路口仍有衝突壓力。"
    },
    "design-pedestrian": {
      round: "5 交通設計", title: "嚴格徒步限制",
      corridor: "pedestrian", showTrafficCounts: true, showSidewalk: true, showYoubike: true,
      conflictPoints: [{ index: 0, style: "warning" }, { index: 2, style: "warning" }, { index: 3, style: "explosion" }, { index: 4, style: "explosion" }, { index: 5, style: "explosion" }],
      impactEmojis: ["🚶", "💥", "🚧"], impactCount: 10, impactAnimation: "shake",
      dataLegend: "3 個 PCU 調查站；人行道多邊形 + 21 個 YouBike 站點（🚲）；青年、東門、府連路口為邊界爆炸衝突點。",
      impactLegend: "車流被逼到徒步區邊界集中，入口處衝突最嚴重。"
    },
    "design-separated": {
      round: "5 交通設計", title: "人車分流",
      corridor: "separated", showTrafficCounts: true, showYoubike: true,
      conflictPoints: [{ index: 7, style: "warning" }, { index: 8, style: "warning" }],
      impactEmojis: ["🚲", "🚶", "🧱"], impactCount: 10, impactAnimation: "pulse",
      dataLegend: "3 個 PCU 調查站；21 個 YouBike 站點（🚲）；白虛線為分流設計示意；南段末端路口仍有輕微衝突。",
      impactLegend: "實體分隔後衝突大幅降低，僅南段末端路口仍需注意。"
    },
    "design-scooter": {
      round: "5 交通設計", title: "電動平衡車專用道 L5",
      corridor: "scooter", showTrafficCounts: true, showYoubike: true,
      conflictPoints: [0,1,2,3,4,5,6,7,8].map(function(i) { return { index: i, style: "explosion" }; }),
      impactEmojis: ["🛴", "💥", "⚡"], impactCount: 34, impactAnimation: "shake", impactLarge: true,
      dataLegend: "3 個 PCU 調查站；21 個 YouBike 站點（🚲）；全部 9 個路口標示爆炸衝突點 💥。",
      impactLegend: "大量抖動平衡車、爆炸與閃電符號誇張化動線完全混亂。"
    },
    "housing-market": {
      round: "6 房價政策", title: "市場自然發展",
      corridor: "green", housing: "neutral",
      impactEmojis: ["🏠", "🏢"], impactCount: 8, impactAnimation: "pulse",
      dataLegend: "housing_heat.js 同一套房價熱力圖，以及 housing_points.geojson 的建物型態與百分位資料。",
      impactLegend: "少量住宅符號表現市場自然變動；四張房價牌的熱力圖色階固定一致。"
    },
    "housing-justice": {
      round: "6 房價政策", title: "居住正義保障",
      corridor: "green", housing: "protected",
      impactEmojis: ["🛡️", "🏠", "＝"], impactCount: 14, impactAnimation: "pulse",
      dataLegend: "與其他房價牌相同的熱力圖與 housing_points.geojson 點位。",
      impactLegend: "保護與穩定符號是政策介入示意；不改變房價資料本身的色階。"
    },
    "housing-develop": {
      round: "6 房價政策", title: "招商開發優先",
      corridor: "red", housing: "develop",
      impactEmojis: ["🏗️", "🏢", "↗️", "💸"], impactCount: 20, impactAnimation: "pop",
      dataLegend: "與其他房價牌相同的房價熱力圖；高百分位交易點以建物增長符號標示。",
      impactLegend: "開發、上升與金錢符號誇張化招商後的開發壓力與居住排擠感。"
    },
    "housing-cyber": {
      round: "6 房價政策", title: "賽博龐克大樓 L6",
      corridor: "blue", housing: "cyber",
      impactEmojis: ["🏙️", "✨", "📈", "💸"], impactCount: 24, impactAnimation: "pop", impactLarge: true,
      dataLegend: "與其他房價牌相同的房價熱力圖與交易點位；巨大建物是荒謬政策示意。",
      impactLegend: "巨大未來建物、閃光與上升符號誇張化脫離街區尺度的開發想像。"
    }
  };

  // ── Icon 工廠 ─────────────────────────────────────────────────────────
  function makeEmojiIcon(emoji, large) {
    large = large || false;
    return L.divIcon({
      className: "",
      html: '<div class="emoji-marker ' + (large ? "large" : "") + '">' + emoji + '</div>',
      iconSize: large ? [46, 46] : [30, 30],
      iconAnchor: large ? [23, 23] : [15, 15]
    });
  }

  function makeImpactIcon(emoji, animation, large) {
    animation = animation || "pulse";
    large = large || false;
    return L.divIcon({
      className: "",
      html: '<div class="impact-marker ' + animation + ' ' + (large ? "large" : "") + '">' + emoji + '</div>',
      iconSize: large ? [52, 52] : [34, 34],
      iconAnchor: large ? [26, 26] : [17, 17]
    });
  }

  function makeRoadIcon(label, variant) {
    variant = variant || "";
    return L.divIcon({
      className: "",
      html: '<div class="road-marker ' + variant + '">' + label + '</div>',
      iconSize: [44, 28],
      iconAnchor: [22, 14]
    });
  }

  function makeHousingIcon(label) {
    return L.divIcon({
      className: "",
      html: '<div class="housing-label">' + label + '</div>',
      iconSize: [46, 30],
      iconAnchor: [23, 15]
    });
  }

  function makeCrossMarker(html, type) {
    return L.divIcon({
      className: "",
      html: '<div class="cross-marker ' + type + '">' + html + '</div>',
      iconSize: [50, 28],
      iconAnchor: [25, 14]
    });
  }

  function makeTrafficDataIcon(station) {
    const label = Math.round(station.groupStrength * 100) + "%";
    return L.divIcon({
      className: "",
      html: '<div class="traffic-data-marker">' + label + '<br>PCU</div>',
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });
  }

  // ── 路徑工具 ──────────────────────────────────────────────────────────
  function interpolatePath(path, t) {
    const segments = [];
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segments.push({ a, b, length });
      total += length;
    }
    let target = total * t;
    for (const seg of segments) {
      if (target <= seg.length) {
        const ratio = seg.length === 0 ? 0 : target / seg.length;
        return [seg.a[0] + (seg.b[0] - seg.a[0]) * ratio, seg.a[1] + (seg.b[1] - seg.a[1]) * ratio];
      }
      target -= seg.length;
    }
    return path[path.length - 1];
  }

  function seededOffset(index, scale) {
    scale = scale || 0.00046;
    const a = Math.sin(index * 12.9898) * 43758.5453;
    const b = Math.sin(index * 78.233) * 24634.6345;
    return [((a - Math.floor(a)) - 0.5) * scale, ((b - Math.floor(b)) - 0.5) * scale];
  }

  function corridorPoint(index, total, regular) {
    const t = regular ? (index + 0.5) / total : ((index * 37) % 100) / 100;
    const base = interpolatePath(allCorridor, Math.min(0.98, Math.max(0.02, t)));
    const offset = regular ? [0, 0] : seededOffset(index);
    return [base[0] + offset[0], base[1] + offset[1]];
  }

  // ── 場景繪製函數 ──────────────────────────────────────────────────────
  function drawCorridor(scene) {
    const colorMap = {
      green: "#2f8f50", blue: "#2387c7", red: "#b84c42",
      car: "#66726c", traffic: "#2f6f9f", connected: "#2f8f50",
      mixed: "#3d8b5a", scooter: "#8b5cf6", pedestrian: "#3d8b5a", separated: "#2f6f9f"
    };
    const color = colorMap[scene.corridor] || colorMap.green;
    const dashArray = scene.corridor === "traffic" ? "10 10" : scene.corridor === "scooter" ? "4 10" : null;
    const opacity = scene.corridor === "car" ? 0.45 : 0.84;
    const baseWeight = scene.corridor === "car" ? 7 : 10;
    const weight = scene.corridorWeight || baseWeight;

    [northCorridor, southCorridor].forEach(function(path) {
      L.polyline(path, { color, weight, opacity, dashArray, lineCap: "round", lineJoin: "round" }).addTo(sceneLayer);

      if (scene.corridor === "separated") {
        L.polyline(path, { color: "#fffdf7", weight: 3, opacity: 0.88, dashArray: "8 8", lineCap: "round" }).addTo(sceneLayer);
      }
      if (scene.corridor === "traffic" || scene.showBikeHint) {
        L.polyline(path.map(function(pt) { return [pt[0] + 0.00028, pt[1] - 0.00024]; }), {
          color: "#2f6f9f", weight: 4, opacity: 0.86, dashArray: "6 8", lineCap: "round"
        }).addTo(sceneLayer);
      }
    });

    if (scene.corridor === "pedestrian") {
      L.polygon(elevatedGreenwayBounds, { color: "#3d8b5a", weight: 1, fillColor: "#3d8b5a", fillOpacity: 0.18 }).addTo(sceneLayer);
    }
    if (scene.corridor === "connected" || scene.corridor === "mixed") {
      L.polygon(elevatedGreenwayBounds, {
        color: "#3d8b5a", weight: 2, fillColor: "#3d8b5a", fillOpacity: 0.12,
        dashArray: scene.corridor === "mixed" ? "8 8" : null
      }).addTo(sceneLayer);
    }
  }

  function addTreeData(scene) {
    if (!scene.treeMode || scene.treeMode === "none") return;
    const data = window.treeData;
    if (!data) return;
    const mode = scene.treeMode;
    const step = mode === "dense" ? 7 : mode === "regular" ? 14 : 22;
    const limit = mode === "dense" ? 160 : mode === "regular" ? 80 : 50;
    const emoji = mode === "sparse" ? "🌿" : mode === "regular" ? "🌱" : "🌳";
    const fs = mode === "dense" ? 16 : mode === "regular" ? 14 : 13;
    data.filter(function(_, i) { return i % step === 0; }).slice(0, limit).forEach(function(tree) {
      L.marker([tree.lat, tree.lng], {
        icon: L.divIcon({
          className: "",
          html: '<div style="font-size:' + fs + 'px;line-height:1;filter:drop-shadow(0 1px 4px rgba(0,0,0,0.35));">' + emoji + '</div>',
          iconSize: [fs + 4, fs + 4],
          iconAnchor: [(fs + 4) / 2, (fs + 4) / 2]
        })
      })
        .bindTooltip(tree.name + (tree.road ? "｜" + tree.road : ""), { direction: "top" })
        .addTo(sceneLayer);
    });
  }

  function addCorridorPlants(scene) {
    if (!scene.corridorPlant) return;
    const isFlowers = scene.corridorPlant === "flowers";
    const emojis = isFlowers ? ["🌼", "🌷", "🌱", "🌸"] : ["🌳", "🌲", "🌳", "🌿"];
    const count = isFlowers ? 36 : 50;
    for (let i = 0; i < count; i++) {
      const pt = corridorPoint(i + 20, count + 25, false);
      L.marker(pt, { icon: makeImpactIcon(emojis[i % emojis.length], isFlowers ? "pop" : "float", false), interactive: false }).addTo(sceneLayer);
    }
    if (isFlowers) {
      const mid = corridorPoint(Math.floor(count / 2), count + 25, true);
      L.marker(mid, {
        icon: L.divIcon({
          className: "",
          html: '<div class="design-label">需持續維護 →<small>植栽管理成本</small></div>',
          iconSize: [150, 44],
          iconAnchor: [75, 22]
        })
      }).addTo(sceneLayer);
    }
  }

  function addSightlineWarnings(scene) {
    if (!scene.sightlineWarnings || !scene.sightlineWarnings.length) return;
    scene.sightlineWarnings.forEach(function(idx) {
      const pt = intersections[idx];
      if (!pt) return;
      L.marker([pt.lat, pt.lng], { icon: makeRoadIcon("視線↓", "warning") })
        .bindTooltip(pt.name + "｜密植後視線受阻", { direction: "top" })
        .addTo(sceneLayer);
    });
  }

  function addTrafficCountData(scene) {
    if (!scene.showTrafficCounts) return;
    trafficCountStations.forEach(function(station) {
      const tooltip = station.name + "｜" + station.route + "｜" + station.pcu.toLocaleString() + " PCU/日｜組內相對強度 " + Math.round(station.groupStrength * 100) + "%";
      L.circle([station.lat, station.lng], {
        radius: 180 + station.groupStrength * 460,
        color: "#b84c42", weight: 2, fillColor: "#b84c42",
        fillOpacity: 0.12 + station.groupStrength * 0.16
      }).bindTooltip(tooltip, { direction: "top" }).addTo(sceneLayer);
      L.marker([station.lat, station.lng], { icon: makeTrafficDataIcon(station) })
        .bindTooltip(tooltip, { direction: "top" }).addTo(sceneLayer);
    });
  }

  function addProvidedSites(scene) {
    if (!scene.showSites) return;
    youbikeSites.forEach(function(site) {
      L.circleMarker([site.lat, site.lng], { radius: 4, color: "#fffdf7", weight: 2, fillColor: "#d3a13f", fillOpacity: 0.86 })
        .bindTooltip(site.name, { direction: "top" }).addTo(sceneLayer);
    });
  }

  function addIntersections(scene) {
    if (!scene.showIntersections) return;
    intersections.forEach(function(intersection, index) {
      const mode = scene.showIntersections;
      if (mode === "r4-car") {
        L.marker([intersection.lat, intersection.lng], { icon: makeCrossMarker("🚗🛵", "car") })
          .bindTooltip(intersection.name + "｜汽機車平面通過", { direction: "top" }).addTo(sceneLayer);
        return;
      }
      if (mode === "r4-bike") {
        L.marker([intersection.lat, intersection.lng], { icon: makeCrossMarker("🚲🚶", "bike") })
          .bindTooltip(intersection.name + "｜禁止汽機車穿越", { direction: "top" }).addTo(sceneLayer);
        return;
      }
      if (mode === "r4-mixed") {
        if (elevatedZoneIndices.includes(index)) {
          L.marker([intersection.lat, intersection.lng], { icon: makeCrossMarker("⬆️🚲", "elevated") })
            .bindTooltip(intersection.name + "｜立體綠廊高架化", { direction: "top" }).addTo(sceneLayer);
        } else {
          L.marker([intersection.lat, intersection.lng], { icon: makeCrossMarker("🚗🛵", "car") })
            .bindTooltip(intersection.name + "｜汽機車平面通過", { direction: "top" }).addTo(sceneLayer);
        }
        return;
      }
      if (mode === "r4-scooter") {
        L.marker([intersection.lat, intersection.lng], { icon: makeCrossMarker("🛴", "scooter") })
          .bindTooltip(intersection.name + "｜電動平衡車通道", { direction: "top" }).addTo(sceneLayer);
        return;
      }
      // legacy modes
      let label = "車", variant = "";
      if (mode === "greenway-only") { label = "🚲禁車"; variant = "safe"; }
      else if (mode === "mixed-split") { label = elevatedZoneIndices.includes(index) ? "🚲" : "車"; variant = elevatedZoneIndices.includes(index) ? "safe" : ""; }
      else if (mode === "continuous") { label = "綠"; variant = "safe"; }
      else if (mode === "points") { label = "口"; variant = ""; }
      L.marker([intersection.lat, intersection.lng], { icon: makeRoadIcon(label, variant) })
        .bindTooltip(intersection.name, { direction: "top" }).addTo(sceneLayer);
    });
  }

  function addConflictPoints(scene) {
    if (!scene.conflictPoints || !scene.conflictPoints.length) return;
    scene.conflictPoints.forEach(function(cp) {
      const pt = intersections[cp.index];
      if (!pt) return;
      const isExplosion = cp.style === "explosion";
      const emoji = isExplosion ? "💥" : "⚠️";
      L.marker([pt.lat, pt.lng], {
        icon: L.divIcon({
          className: "",
          html: '<div class="impact-marker ' + (isExplosion ? "shake" : "pulse") + '" style="font-size:20px;width:36px;height:36px;">' + emoji + '</div>',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        }),
        interactive: true
      })
        .bindTooltip(pt.name + (isExplosion ? "｜高衝突風險" : "｜中等衝突風險"), { direction: "top" })
        .addTo(sceneLayer);
    });
  }

  function addBridges(scene) {
    if (!scene.showBridges) return;
    const isR4 = scene.showIntersections && scene.showIntersections.startsWith("r4");
    bridgeNodes.forEach(function(bridge) {
      const icon = isR4
        ? L.divIcon({ className: "", html: '<div class="cross-marker elevated">🌉高架</div>', iconSize: [66, 28], iconAnchor: [33, 14] })
        : makeRoadIcon("橋", "safe");
      L.marker([bridge.lat, bridge.lng], { icon }).bindTooltip(bridge.name + "｜高架連通點", { direction: "top" }).addTo(sceneLayer);
    });
  }

  function getCentroid(coords) {
    const lat = coords.reduce(function(s, pt) { return s + pt[0]; }, 0) / coords.length;
    const lng = coords.reduce(function(s, pt) { return s + pt[1]; }, 0) / coords.length;
    return [lat, lng];
  }

  function getParkSpread(coords) {
    const lats = coords.map(function(pt) { return pt[0]; });
    const lngs = coords.map(function(pt) { return pt[1]; });
    const latR = Math.max.apply(null, lats) - Math.min.apply(null, lats);
    const lngR = Math.max.apply(null, lngs) - Math.min.apply(null, lngs);
    return Math.min(latR, lngR) * 0.28;
  }

  function getParkEmojis(mode) {
    if (mode === "green-trees")   return ["🌳", "🌲", "🌳"];
    if (mode === "green-flowers") return ["🌼", "🌷", "🌸", "🌱"];
    if (mode === "green-flat")    return ["🌱", "🌱"];
    if (mode === "green-eco")     return ["🌿", "🦋", "🌼", "🌳"];
    if (mode === "blue-pool")     return ["🏊", "🌊", "🛟"];
    return [];
  }

  function addParkPolygons(scene) {
    if (!scene.showParks) return;
    const mode = scene.showParks;
    const isPool = mode === "blue-pool";
    const color       = isPool ? "#1a6fa3" : "#2f6f3d";
    const fillColor   = isPool ? "#2387c7" : "#3d8b5a";
    const fillOpacity = isPool ? 0.30 : 0.22;
    const emojis      = getParkEmojis(mode);
    const anim        = isPool ? "float" : mode === "green-eco" ? "float" : mode === "green-flowers" ? "pop" : "pulse";

    parkPolygons.forEach(function(park) {
      L.polygon(park.coords, {
        color: color, weight: 2, opacity: 0.72,
        fillColor: fillColor, fillOpacity: fillOpacity
      }).bindTooltip(park.name, { direction: "center" }).addTo(sceneLayer);

      if (!emojis.length) return;
      const center = getCentroid(park.coords);
      const spread = getParkSpread(park.coords);
      const count  = park.emojiCount;
      for (var i = 0; i < count; i++) {
        const angle = count === 1 ? 0 : (i / count) * Math.PI * 2;
        const lat   = center[0] + Math.sin(angle) * spread;
        const lng   = center[1] + Math.cos(angle) * spread;
        L.marker([lat, lng], {
          icon: makeImpactIcon(emojis[i % emojis.length], anim, false),
          interactive: false
        }).addTo(sceneLayer);
      }
    });
  }

  function addYoubikeSites(scene) {
    if (!scene.showYoubike) return;
    youbikeSites.forEach(function(site) {
      L.marker([site.lat, site.lng], {
        icon: L.divIcon({
          className: "",
          html: '<div style="font-size:15px;line-height:1;filter:drop-shadow(0 1px 4px rgba(0,0,0,0.38));">🚲</div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).bindTooltip("YouBike｜" + site.name, { direction: "top" }).addTo(sceneLayer);
    });
  }

  function addSidewalk(scene) {
    if (!scene.showSidewalk) return;
    const data = window.sidewalkData;
    if (!data || !data.features) return;
    if (sidewalkLayerGroup) { map.removeLayer(sidewalkLayerGroup); sidewalkLayerGroup = null; }
    sidewalkLayerGroup = L.geoJSON(data, {
      style: { color: "#3d8b5a", weight: 1, fillColor: "#3d8b5a", fillOpacity: 0.22, opacity: 0.5 }
    }).addTo(map);
  }

  function addImpactEffects(scene) {
    const emojis = scene.impactEmojis || [];
    if (!emojis.length) return;
    const count = scene.impactCount || 10;
    for (let i = 0; i < count; i++) {
      const emoji = emojis[i % emojis.length];
      const point = corridorPoint(i + 3, count + 5, false);
      L.marker(point, {
        icon: makeImpactIcon(emoji, scene.impactAnimation || "pulse", scene.impactLarge && i % 5 === 0),
        interactive: false
      }).addTo(sceneLayer);
    }
  }

  function featureInBounds(feature) {
    const coords = feature.geometry && feature.geometry.coordinates;
    if (!coords) return false;
    return coords[1] > 22.94 && coords[1] < 23.04 && coords[0] > 120.18 && coords[0] < 120.24;
  }

  function housingEmoji(feature, mode) {
    const type = feature.properties && feature.properties.type;
    const pct = (feature.properties && feature.properties.percentile) || 0;
    const base = type === "住宅大樓" ? "🏢" : type === "透天厝" ? "🏠" : type === "華廈" ? "🏘️" : "🏚️";
    if (mode === "protected") return pct > 0.65 ? base + "＝" : "🛡️";
    if (mode === "develop") return pct > 0.65 ? base + "↑" : base + "↓";
    if (mode === "cyber") return "🏙️";
    return base;
  }

  function renderHousingPoints(mode) {
    if (!housingPointData || !housingPointData.features) return;
    const filtered = housingPointData.features.filter(featureInBounds);
    const sample = filtered.filter(function(_, i) { return i % 18 === 0; }).slice(0, 42);
    sample.forEach(function(feature) {
      const coords = feature.geometry.coordinates;
      const label = housingEmoji(feature, mode);
      L.marker([coords[1], coords[0]], { icon: makeHousingIcon(label) })
        .bindTooltip((feature.properties.type || "建物") + "｜" + Math.round((feature.properties.percentile || 0) * 100) + "%", { direction: "top" })
        .addTo(sceneLayer);
    });
    if (mode === "cyber") {
      stations.slice(1, 3).forEach(function(station) {
        L.marker([station.lat, station.lng], { icon: makeEmojiIcon("🏙️", true) })
          .bindTooltip("賽博龐克大樓示意", { direction: "top" }).addTo(sceneLayer);
      });
    }
  }

  function loadHousingPointsThenRender(mode) {
    if (housingPointData) { renderHousingPoints(mode); return; }
    if (window.housingPointsData) { housingPointData = window.housingPointsData; renderHousingPoints(mode); return; }
    if (housingFetchStarted) return;
    housingFetchStarted = true;
    fetch("材料/housing_points.geojson")
      .then(function(r) { return r.json(); })
      .then(function(geojson) {
        housingPointData = geojson;
        if (cardScenes[activeSceneId] && cardScenes[activeSceneId].housing) renderHousingPoints(cardScenes[activeSceneId].housing);
      })
      .catch(function() {
        L.marker([22.996928, 120.213176], { icon: makeHousingIcon("房價資料未載入") }).addTo(sceneLayer);
      });
  }

  function addHousing(scene) {
    if (!scene.housing) return;
    if (activeHeatLayer) { map.removeLayer(activeHeatLayer); activeHeatLayer = null; }
    const heatData = (typeof housingHeatData !== "undefined") ? housingHeatData : window.housingHeatData;
    if (heatData && L.heatLayer) {
      activeHeatLayer = L.heatLayer(heatData, {
        radius: 22, blur: 18, maxOpacity: 0.5,
        gradient: { 0.25: "#3b82f6", 0.65: "#facc15", 1: "#ef4444" }
      }).addTo(map);
    }
    loadHousingPointsThenRender(scene.housing);
  }

  function clearScene() {
    sceneLayer.clearLayers();
    if (activeHeatLayer) { map.removeLayer(activeHeatLayer); activeHeatLayer = null; }
    if (sidewalkLayerGroup) { map.removeLayer(sidewalkLayerGroup); sidewalkLayerGroup = null; }
    const tintEl = document.getElementById("mapTint");
    if (tintEl) tintEl.className = "map-tint";
    const bandEl = document.getElementById("impactBand");
    if (bandEl) bandEl.className = "impact-band";
  }

  function renderPolicyMapScene(sceneId) {
    const scene = cardScenes[sceneId] || cardScenes["vision-rest"];
    activeSceneId = sceneId;
    clearScene();

    const tintEl = document.getElementById("mapTint");
    if (tintEl && scene.tint) tintEl.classList.add(scene.tint);

    drawCorridor(scene);
    addSidewalk(scene);
    addTreeData(scene);
    addCorridorPlants(scene);
    addSightlineWarnings(scene);
    addTrafficCountData(scene);
    addProvidedSites(scene);
    addIntersections(scene);
    addConflictPoints(scene);
    addBridges(scene);
    addParkPolygons(scene);
    addYoubikeSites(scene);
    addHousing(scene);
    addImpactEffects(scene);

    const statusEl = document.getElementById("mapSceneStatus");
    if (statusEl) {
      statusEl.innerHTML =
        "<strong>" + scene.round + "｜" + scene.title + "</strong>" +
        "<span>地圖依選擇牌自動更新。</span>";
    }

    const heatLegendHtml = scene.housing
      ? '<div class="legend-row"><b>房價壓力色階</b><div class="heat-legend-bar"></div><div class="heat-legend-labels"><span>低</span><span>中</span><span>高</span></div></div>'
      : "";

    const crossLegendHtml = (scene.showIntersections && scene.showIntersections.startsWith("r4"))
      ? '<div class="legend-row"><b>路口類型</b><span>' +
        '<span class="cross-marker car" style="display:inline-flex;margin-right:5px;">🚗🛵</span>汽機車平面通過&nbsp;' +
        '<span class="cross-marker bike" style="display:inline-flex;margin-right:5px;">🚲🚶</span>禁止汽機車&nbsp;' +
        '<span class="cross-marker elevated" style="display:inline-flex;margin-right:5px;">⬆️🚲</span>高架化' +
        (scene.showIntersections === "r4-scooter" ? '<br><span class="cross-marker scooter" style="display:inline-flex;margin-right:5px;">🛴</span>電動平衡車通道' : "") +
        '</span></div>'
      : "";

    const legendEl = document.getElementById("mapLegend");
    if (legendEl) {
      legendEl.innerHTML =
        "<strong>" + scene.title + "</strong>" +
        '<div class="legend-block">' +
          '<div class="legend-row"><b>資料依據</b><span>' + (scene.dataLegend || "本卡牌只調整政策視覺狀態，未新增外部資料點。") + "</span></div>" +
          heatLegendHtml +
          crossLegendHtml +
          '<div class="legend-row"><b>政策衝擊示意</b><span>' + (scene.impactLegend || "") + "</span></div>" +
        "</div>";
    }
  }

  // ── 初始化 ────────────────────────────────────────────────────────────
  function initMap() {
    if (mapInitialized) {
      map.invalidateSize({ animate: false });
      return;
    }

    const greenwayBounds = L.latLngBounds([22.957537, 120.188143], [23.032044, 120.242559]);

    map = L.map("map", {
      zoomControl: false,
      attributionControl: true,
      maxBounds: greenwayBounds.pad(0.12),
      maxBoundsViscosity: 0.95
    });

    map.fitBounds(greenwayBounds);
    map.setMinZoom(13);
    map.setMaxZoom(18);
    L.control.zoom({ position: "bottomleft" }).addTo(map);

    const baseMaps = {
      "CARTO 淡色底圖": L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19, attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
      }),
      "OSM 標準底圖": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: "&copy; OpenStreetMap contributors"
      })
    };
    baseMaps["CARTO 淡色底圖"].addTo(map);
    L.control.layers(baseMaps, null, { position: "bottomright", collapsed: true }).addTo(map);

    sceneLayer = L.layerGroup().addTo(map);
    staticLayer = L.layerGroup().addTo(map);

    // 靜態車站點位（永遠顯示）
    stations.forEach(function(station) {
      L.circleMarker([station.lat, station.lng], {
        radius: 5, color: "#fffdf7", weight: 2, fillColor: "#66726c", fillOpacity: 0.82
      }).bindTooltip(station.name, { direction: "top" }).addTo(staticLayer);
    });

    mapInitialized = true;

    // 版面穩定後 fitBounds
    requestAnimationFrame(function() {
      map.invalidateSize({ animate: false });
      map.fitBounds(greenwayBounds, { animate: false });
    });
    setTimeout(function() { map.invalidateSize({ animate: false }); }, 250);

    const mapZone = document.querySelector(".map-zone");
    if (mapZone) {
      new ResizeObserver(function() { map.invalidateSize({ animate: false }); }).observe(mapZone);
    }
  }

  // ── 公開 API ──────────────────────────────────────────────────────────
  window.initMap = function() {
    initMap();
    renderPolicyMapScene(lockedSceneId);
  };

  // 選牌時鎖定場景
  window.updatePolicyMap = function(gameKey) {
    if (!mapInitialized) return;
    const sceneId = gameKeyToScene[gameKey] || "vision-rest";
    lockedSceneId = sceneId;
    renderPolicyMapScene(sceneId);
  };

  // hover 預覽（不改變 lockedSceneId）
  window.previewPolicyMap = function(gameKey) {
    if (!mapInitialized) return;
    const sceneId = gameKeyToScene[gameKey] || "vision-rest";
    renderPolicyMapScene(sceneId);
  };

  // hover 離開，恢復鎖定場景
  window.restorePolicyMap = function() {
    if (!mapInitialized) return;
    renderPolicyMapScene(lockedSceneId);
  };

})();
