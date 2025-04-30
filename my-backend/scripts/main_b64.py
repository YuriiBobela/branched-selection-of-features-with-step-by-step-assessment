# scripts/main_b64.py
import sys
import json
import base64
import numpy as np
import cv2
from sklearn.feature_selection import mutual_info_classif

def load_images(b64_list, size=(128,128)):
    imgs = []
    for b64 in b64_list:
        data = base64.b64decode(b64)
        arr = np.frombuffer(data, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        img = cv2.resize(img, size)
        imgs.append(img)
    return imgs

def main():
    # --- читаємо весь stdin як рядок ---
    raw = sys.stdin.read()
    if not raw:
        print(json.dumps({"error":"No input provided"}))
        sys.exit(1)

    try:
        data = json.loads(raw)
    except Exception as e:
        print(json.dumps({"error":f"Invalid JSON: {e}"}))
        sys.exit(1)

    images = load_images(data.get('images', []))
    labels = np.array(data.get('labels', []))

    # витягуємо ознаки
    feats = []
    for img in images:
        avg = img.mean(axis=(0,1)).tolist()          # RGB
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        feats.append(avg + [float(gray.std())])      # std
    X = np.array(feats)
    mi = mutual_info_classif(X, labels, discrete_features='auto')

    # виводимо результат у stdout
    out = {
        "features": ['avg_r','avg_g','avg_b','std_gray'],
        "mi_scores": mi.tolist()
    }
    print(json.dumps(out), flush=True)


if __name__=='__main__':
    main()
