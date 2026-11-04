# Détection automatique (approximative) des prises sur public/wall.jpg -> src/initialHolds.json
# Usage : pip install opencv-python-headless numpy && python3 tools/detect_holds.py
# À ne relancer que si tu changes de photo : cela écrase la liste initiale de prises.
import cv2, numpy as np, json
img0 = cv2.imread('public/wall.jpg'); H, W = img0.shape[:2]
img = cv2.GaussianBlur(img0, (5, 5), 0)
# Contour du mur sur la photo (en pixels) : à adapter si la photo change
poly = np.array([(0, 1290), (0, 540), (440, 160), (745, 70), (1500, 15), (1500, 420), (1290, 1290)], np.int32)
wm = np.zeros((H, W), np.uint8); cv2.fillPoly(wm, [poly], 255)
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
# Couleurs de fond du mur (Lab) : jaune, bleus, noir, blanc
refs = np.float32([[177,136,188],[130,127,116],[114,126,116],[37,130,132],[206,128,143],[100,126,118],[150,128,118]])
d = np.min(np.stack([np.sqrt(((lab - r) ** 2).sum(2)) for r in refs]), 0)
m = ((d > 20) & (wm > 0)).astype(np.uint8) * 255
m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
ff = m.copy(); cv2.floodFill(ff, None, (0, 0), 255); m = m | cv2.bitwise_not(ff)
n, lbl, st, _ = cv2.connectedComponentsWithStats(m)
holds = []; vis = img0.copy()
for i in range(1, n):
    x, y, w, h, a = st[i]
    if a < 90 or a > 60000: continue
    c, _ = cv2.findContours((lbl[y:y+h, x:x+w] == i).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    c = cv2.approxPolyDP(max(c, key=cv2.contourArea), 2.5, True) + [x, y]
    if len(c) < 3: continue
    holds.append([[round(float(p[0][0]) / W, 4), round(float(p[0][1]) / H, 4)] for p in c])
    cv2.polylines(vis, [c], True, (255, 0, 255), 3)
print(len(holds), 'prises détectées'); cv2.imwrite('holds_preview.jpg', vis)
json.dump(holds, open('src/initialHolds.json', 'w'))
