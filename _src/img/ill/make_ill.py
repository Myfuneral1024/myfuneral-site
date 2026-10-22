#!/usr/bin/env python3
"""사용자가 준 그림(promise.png · steps.png)에서 글씨 · 로고를 빼고 그림만 잘라
assets/img/ill-*.webp (540×360, 3:2)로 만든다.  python3 _src/img/ill/make_ill.py"""
import os
from PIL import Image, ImageStat
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', '..', 'assets', 'img')
P = Image.open(os.path.join(HERE, 'promise.png')); S = Image.open(os.path.join(HERE, 'steps.png'))
BOXES = {  # (왼쪽, 위, 오른쪽, 아래) — 원본 픽셀
    'promise-1': (P, (70, 240, 600, 560)), 'promise-2': (P, (650, 215, 1200, 560)),
    'promise-3': (P, (55, 715, 590, 1030)), 'promise-4': (P, (690, 720, 1180, 1010)),
    'step-1': (S, (30, 335, 500, 695)), 'step-2': (S, (525, 335, 1005, 695)), 'step-3': (S, (1040, 335, 1500, 695)),
}
for k, (im, b) in BOXES.items():
    c = im.crop(b); bg = tuple(round(v) for v in ImageStat.Stat(im.crop((5, 5, 40, 40))).mean)
    W, H = c.size; tw = max(W, int(H * 1.5)); th = round(tw / 1.5)
    can = Image.new('RGB', (tw, th), bg); can.paste(c, ((tw - W) // 2, (th - H) // 2))
    can.resize((540, 360), Image.LANCZOS).save(os.path.join(OUT, f'ill-{k}.webp'), 'WEBP', quality=84)
    print('ill-' + k)
