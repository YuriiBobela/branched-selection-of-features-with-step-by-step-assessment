
import sys, json, base64
import numpy as np
import cv2
import torch
import torchvision.models as models
from sklearn.feature_selection import mutual_info_classif, chi2, f_classif
from sklearn.preprocessing import MinMaxScaler

from torchvision import transforms as T
import warnings
warnings.filterwarnings("ignore")

def load_images(b64_list, size=(128, 128)):
    imgs = []
    for b64_str in b64_list:
        data = base64.b64decode(b64_str)
        arr = np.frombuffer(data, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        img = cv2.resize(img, size)
        imgs.append(img)
    return imgs

def extract_classical_features(images):
    feats = []
    for img in images:
        avg = img.mean(axis=(0, 1)).tolist()
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        std = float(gray.std())
        feats.append(avg + [std])
    return np.array(feats), ['avg_b', 'avg_g', 'avg_r', 'std_gray']

def extract_deep_features(images):
    model = models.mobilenet_v2(pretrained=True)
    model.classifier = torch.nn.Identity()
    model.eval()
    transform = T.Compose([
        T.ToTensor(),
        T.Resize((224, 224)),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    deep_feats = []
    for img in images:
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        tensor = transform(rgb).unsqueeze(0)
        with torch.no_grad():
            out = model(tensor).squeeze().numpy()
        deep_feats.append(out)
    return np.array(deep_feats)


def compute_mi(X, y):
    return mutual_info_classif(X, y, discrete_features='auto')

def compute_chi2(X, y):
    X_scaled = MinMaxScaler().fit_transform(X)
    scores, _ = chi2(X_scaled, y)
    return scores

def compute_f_value(X, y):
    scores, _ = f_classif(X, y)
    return scores

def generate_interpretations(features, scores, top_n=3):
    top_idx = np.argsort(scores)[-top_n:][::-1]
    texts = []
    for idx in top_idx:
        texts.append(f"Ознака '{features[idx]}' має високу інформативність ({scores[idx]:.3f}), що вказує на сильний зв’язок з мітками.")
    return texts

def main():
    raw = sys.stdin.read()
    if not raw:
        print(json.dumps({"error": "No input"}))
        return
    data = json.loads(raw)
    images = load_images(data.get('images', []))
    labels = np.array(data.get('labels', []))
    metric = data.get('metric', 'mi')  # default to mutual information

    classical_feats, classical_names = extract_classical_features(images)
    deep_feats = extract_deep_features(images)
    deep_names = [f"deep_{i}" for i in range(deep_feats.shape[1])]

    if metric == 'mi':
        mi_classical = compute_mi(classical_feats, labels)
        mi_deep = compute_mi(deep_feats, labels)
    elif metric == 'chi2':
        mi_classical = compute_chi2(classical_feats, labels)
        mi_deep = compute_chi2(deep_feats, labels)
    elif metric == 'f':
        mi_classical = compute_f_value(classical_feats, labels)
        mi_deep = compute_f_value(deep_feats, labels)
    else:
        print(json.dumps({"error": "Unsupported metric"}))
        return

    top_idx = np.argsort(mi_deep)[-10:][::-1]
    top_features = [deep_names[i] for i in top_idx]
    top_scores = [mi_deep[i] for i in top_idx]
    interpretations = generate_interpretations(top_features, top_scores)

    # Фінальний словник з приведенням до чистих типів Python
    out = {
        "metric": str(metric),
        "features_classical": list(map(str, classical_names)),
        "mi_classical": list(map(float, mi_classical)),
        "features_deep": list(map(str, top_features)),
        "mi_deep": list(map(float, top_scores)),
        "interpretations": list(map(str, interpretations))
    }
    print(json.dumps(out), flush=True)


if __name__ == '__main__':
    main()
