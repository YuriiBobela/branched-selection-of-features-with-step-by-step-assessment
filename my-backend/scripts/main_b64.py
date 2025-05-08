#!/usr/bin/env python3
import sys
import json
import base64
import logging

import numpy as np
import cv2
import torch
import torchvision.models as models
import torchvision.transforms as T
from sklearn.feature_selection import mutual_info_classif

# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stderr)]
)

def load_images(b64_list, size=(128, 128)):
    """Декодує base64 → OpenCV BGR → змінює розмір."""
    imgs = []
    for i, b64_str in enumerate(b64_list):
        try:
            data = base64.b64decode(b64_str)
            arr = np.frombuffer(data, np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("cv2 failed to decode image")
            img = cv2.resize(img, size)
            imgs.append(img)
        except Exception as e:
            logging.warning(f"Image #{i} decode error: {e}")
    return imgs

def extract_classical_features(images):
    """Рахує avg R,G,B і std_gray для кожного зображення."""
    feats = []
    for img in images:
        avg = img.mean(axis=(0,1)).tolist()      # [B,G,R]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        feats.append([avg[2], avg[1], avg[0], float(gray.std())])
    return np.array(feats, dtype=float)

def extract_deep_features(images, model, transform):
    """Пропускає через MobileNetV2 без класифікатора, повертає (N×1280) масив."""
    deep_feats = []
    for i, img in enumerate(images):
        try:
            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            tensor = transform(rgb).unsqueeze(0)  # додаємо batch dim
            with torch.no_grad():
                feat = model(tensor)
            deep_feats.append(feat.squeeze().cpu().numpy())
        except Exception as e:
            logging.warning(f"Deep feature extraction failed for image #{i}: {e}")
    return np.vstack(deep_feats) if deep_feats else np.empty((0,1280))

def main():
    # --- Читання stdin ---
    raw = sys.stdin.read()
    if not raw:
        logging.error("No input provided")
        print(json.dumps({"error": "No input provided"}), flush=True)
        sys.exit(1)

    try:
        data = json.loads(raw)
        images_b64 = data.get("images", [])
        labels = np.array(data.get("labels", []), dtype=int)
    except Exception as e:
        logging.exception("Failed to parse JSON input")
        print(json.dumps({"error": f"Invalid JSON input: {e}"}), flush=True)
        sys.exit(1)

    if len(images_b64) == 0 or labels.size == 0 or labels.size != len(images_b64):
        msg = "Must provide equal number of images and labels"
        logging.error(msg)
        print(json.dumps({"error": msg}), flush=True)
        sys.exit(1)

    # --- Завантаження і підготовка зображень ---
    images = load_images(images_b64, size=(128,128))
    if len(images) != labels.size:
        msg = "Some images failed to decode"
        logging.error(msg)
        print(json.dumps({"error": msg}), flush=True)
        sys.exit(1)

    # --- Класичні ознаки ---
    X_classical = extract_classical_features(images)
    logging.info(f"Extracted classical features: {X_classical.shape}")

    # --- Підготовка моделі MobileNetV2 ---
    try:
        base_model = models.mobilenet_v2(pretrained=True)
    except Exception as e:
        logging.exception("Failed to load pretrained MobileNetV2")
        print(json.dumps({"error": f"Model load error: {e}"}), flush=True)
        sys.exit(1)

    # Прибираємо класифікатор, лишаємо feature extractor
    feature_extractor = torch.nn.Sequential(*list(base_model.features.children()))
    pooling = torch.nn.AdaptiveAvgPool2d((1,1))
    model = torch.nn.Sequential(feature_extractor, pooling, torch.nn.Flatten())
    model.eval()

    # Трансформації для MobileNetV2
    transform = T.Compose([
        T.ToTensor(),
        T.Resize((224,224)),
        T.Normalize(mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225])
    ])

    # --- Глибокі ознаки ---
    X_deep = extract_deep_features(images, model, transform)
    logging.info(f"Extracted deep features: {X_deep.shape}")

    if X_deep.shape[0] == 0:
        msg = "No deep features extracted"
        logging.error(msg)
        print(json.dumps({"error": msg}), flush=True)
        sys.exit(1)

    # --- Обчислення Mutual Information ---
    try:
        mi_classical = mutual_info_classif(X_classical, labels, discrete_features='auto')
        mi_deep_all = mutual_info_classif(X_deep, labels, discrete_features='auto')
    except Exception as e:
        logging.exception("Mutual Information calculation failed")
        print(json.dumps({"error": f"MI error: {e}"}), flush=True)
        sys.exit(1)

    # Топ-10 deep ознак
    top_n = min(10, X_deep.shape[1])
    top_idxs = np.argsort(mi_deep_all)[-top_n:][::-1]
    top_features = [f"deep_{i}" for i in top_idxs.tolist()]
    top_mi = mi_deep_all[top_idxs].tolist()

    # --- Повернення результату ---
    result = {
        "features_classical": ["avg_r","avg_g","avg_b","std_gray"],
        "mi_classical": mi_classical.tolist(),
        "features_deep": top_features,
        "mi_deep": top_mi
    }
    print(json.dumps(result), flush=True)

if __name__ == "__main__":
    main()
