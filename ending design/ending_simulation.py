# -*- coding: utf-8 -*-
"""
台南鐵路綠廊政策牌局 - 結局分布模擬腳本

使用方式：
1. 直接執行 `python3 ending_simulation.py`，會印出十種結局的數量、佔比，以及每種結局的一條範例路徑。
2. 如果想調整某張牌的分數，去下面 layers 裡找到對應的牌，
   tuple格式是 (牌名, cost, 移動安全分數, 維護信任分數, 仕紳化壓力分數, 搞笑分數, 搞笑系列)，
   改完數字直接重新執行整支腳本即可，會自動重新窮舉全部組合並算出新的機率分布。
3. 如果想加新的一層或新的牌，在 layers 這個list裡新增一組對應的list/tuple即可，
   程式會自動處理新的層數（不用手動改itertools那一行）。
4. BUDGET（目前是15）也可以直接改數字測試不同預算上限下的機率分布。
5. 搞笑牌的移動安全/維護信任/仕紳化壓力三個數值填0即可，因為搞笑判定優先於三軸比較，這三個數字不會被用到。

台南鐵路綠廊政策牌局 v3 - 結局分布模擬（v2：三軸對應三族群核心價值觀）
六層 x 4選1（3張正經 + 1張搞笑），總預算 cost <= 15
三軸：
  移動安全(mobility_safety) -> 短居學生核心價值（通勤效率、騎行/夜間安全）
  維護信任(elder_trust)     -> 高齡居民核心價值（視線清楚、維護可見、樹種友善）
  仕紳化壓力(gentri)        -> 在地青年核心矛盾（商圈活力 vs 房價排擠風險，保留為壓力指標）
另有搞笑(comedy)軸，命中即直接判定搞笑結局，不進入三軸比較
"""
import itertools
from collections import Counter

# 每張卡格式: (name, cost, mobility_safety, elder_trust, gentri, comedy, joke_series)
# joke_series: None 表示正經牌；否則標記屬於哪個搞笑系列

layers = [
    # 第一層：都市願景
    [
        ("景觀休憩", 1, 0, 1, 1, 0, None),
        ("商業活化", 2, 1, 0, 2, 0, None),
        ("交通轉化", 3, 2, 0, 0, 0, None),
        ("大游泳池(L1)", 10, 0, 0, 0, 4, "pool"),
    ],
    # 第二層：景觀願景
    [
        ("空曠廣場", 1, -1, -1, 0, 0, None),
        ("很多高大的樹", 2, -1, -1, 1, 0, None),
        ("低矮草和花", 3, 1, 1, 1, 0, None),
        ("大游泳池(L2)", 10, 0, 0, 0, 4, "pool"),
    ],
    # 第三層：景觀維護
    [
        ("廣場維護", 1, 0, -1, 0, 0, None),
        ("扁平單一植栽", 2, 0, 1, 0, 0, None),
        ("自然生態圈", 3, 0, 0, 1, 0, None),
        ("大游泳池維護(L3)", 10, 0, 0, 0, 4, "pool"),
    ],
    # 第四層：交通政策
    [
        ("汽機車", 1, -1, 0, 0, 0, None),
        ("自行車步行優先", 2, 2, 0, 1, 0, None),
        ("混合", 3, 1, 0, 0, 0, None),
        ("電動平衡車(L4)", 10, 0, 0, 0, 4, "wheel"),
    ],
    # 第五層：交通設計
    [
        ("減速街廓", 1, 0, 0, 0, 0, None),
        ("嚴格徒步限制", 2, 1, 1, 0, 1, None),
        ("人車分流", 3, 1, 1, 2, 0, None),
        ("電動平衡車專用道(L5)", 10, 0, 0, 0, 4, "wheel"),
    ],
    # 第六層：房價政策
    [
        ("市場自然發展", 1, 0, 0, 1, 0, None),
        ("居住正義保障", 2, 1, 1, -2, 0, None),
        ("招商開發優先", 3, 0, 0, 3, 0, None),
        ("賽博龐克大樓(L6)", 10, 0, 0, 0, 4, "cyber"),
    ],
]

BUDGET = 15

def classify(flow, maint, gentri, comedy, joke_series):
    """回傳結局名稱"""
    if comedy >= 4:
        # 搞笑路線，依系列分流
        return {"pool": "搞笑-游泳池", "wheel": "搞笑-電動平衡車", "cyber": "搞笑-賽博龐克大樓"}[joke_series]

    # 三軸比較
    vals = {"移動安全(學生)": flow, "維護信任(高齡)": maint, "仕紳化壓力(青年)": gentri}
    max_val = max(vals.values())
    top = [k for k, v in vals.items() if v == max_val]

    if len(top) == 1:
        return f"正經-{top[0]}最高"
    elif len(top) == 2:
        pair = "X".join(sorted(top))
        return f"正經-{pair}同分"
    else:
        return "正經-三軸全平"


results = Counter()
total_valid = 0
total_combos = 0
sample_paths = {}  # 紀錄每種結局的一個範例路徑

for combo in itertools.product(*layers):
    total_combos += 1
    cost = sum(c[1] for c in combo)
    if cost > BUDGET:
        continue
    total_valid += 1

    flow = sum(c[2] for c in combo)
    maint = sum(c[3] for c in combo)
    gentri = sum(c[4] for c in combo)
    comedy = sum(c[5] for c in combo)

    # 判斷是否選了搞笑牌（理論上 cost 10 預算下最多選一張，但仍抓 joke_series 出現）
    joke_series = None
    for c in combo:
        if c[6] is not None:
            joke_series = c[6]
            break

    ending = classify(flow, maint, gentri, comedy, joke_series)
    results[ending] += 1

    if ending not in sample_paths:
        sample_paths[ending] = ([c[0] for c in combo], cost, flow, maint, gentri, comedy)

print(f"總組合數（理論 4^6）: {total_combos}")
print(f"預算內有效組合數（cost<=15）: {total_valid}")
print(f"超支組合數: {total_combos - total_valid}")
print()
print("=== 十種結局分布 ===")
for ending, count in sorted(results.items(), key=lambda x: -x[1]):
    pct = count / total_valid * 100
    print(f"{ending:20s}  數量={count:5d}  佔比={pct:5.2f}%")

print()
print("=== 各結局範例路徑 ===")
for ending, (path, cost, flow, maint, gentri, comedy) in sample_paths.items():
    print(f"[{ending}] cost={cost} flow={flow} maint={maint} gentri={gentri} comedy={comedy}")
    print(f"   路徑: {' -> '.join(path)}")
