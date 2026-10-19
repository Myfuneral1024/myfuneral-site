#!/usr/bin/env python3
"""사진 만들기: _src/img/원본.jpg → assets/img/이름-480.webp · 이름-900.webp
원본(AI로 만든 사진, 로고 팻말 포함)에서 팻말을 잘라 내고 3:2로 맞춘다.
    python3 _src/img/make.py
"""
import os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(os.path.dirname(HERE)), 'assets', 'img')
# 이름: (자르기 상자 x0, y0, x1, y1) — 원본 1536×1024 기준, 모두 3:2
CROPS = {
    'flowers': (640, 20, 1536, 617),   # 흰 국화 꽃송이 (왼쪽 팻말 · 아래 화병 뺌)
    'candle': (100, 180, 955, 750),    # 촛불 · 국화 (오른쪽 팻말 뺌)
    'urn': (30, 230, 890, 803),        # 유골함 · 국화 (오른쪽 팻말 뺌)
    'note': (480, 410, 1380, 1010),    # 노트 · 펜 (위 팻말 · 찻잔 뺌)
    'shroud': (0, 240, 870, 820),      # 수의 · 국화 (오른쪽 팻말 · 장갑 뺌)
}
os.makedirs(OUT, exist_ok=True)
for name, box in CROPS.items():
    im = Image.open(os.path.join(HERE, name + '.jpg')).convert('RGB').crop(box)
    for w in (480, 900):
        h = round(w * 2 / 3)
        im.resize((w, h), Image.LANCZOS).save(os.path.join(OUT, f'{name}-{w}.webp'), 'WEBP', quality=80, method=6)
    print(name, 'ok')
