import sys
import json
import base64
import numpy as np
import cv2
import torch
import torchvision.models as models
from sklearn.decomposition import PCA
from sklearn.feature_selection import mutual_info_classif
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from scipy.stats import entropy

# ---- Класичні ознаки ----
def extract_classical_features(img):
    feats = []
    # Середні, std по кольорах
    avg = img.mean(axis=(0, 1)).tolist()
    std = img.std(axis=(0, 1)).tolist()
    # Гістограма (грубо)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    hist = cv2.calcHist([gray], [0], None, [8], [0,256]).flatten().tolist()  # 8-бінна гістограма
    # Ентропія
    entr = float(entropy(hist))
    # Фільтр Собеля (текстурна ознака)
    sobel = cv2.Sobel(gray, cv2.CV_64F, 1, 1, ksize=3)
    sobel_mean = float(np.mean(np.abs(sobel)))
    feats = avg + std + hist + [entr, sobel_mean]
    feature_names = [f"avg_{c}" for c in ['b','g','r']] + [f"std_{c}" for c in ['b','g','r']] \
        + [f"hist_bin{i}" for i in range(8)] + ['entropy', 'sobel_mean']
    return feats, feature_names

# ---- Deep (CNN) ознаки ----
def extract_deep_features(imgs, n_deep=10):
    model = models.mobilenet_v2(pretrained=True)
    model.classifier = torch.nn.Identity()
    model.eval()
    from torchvision import transforms as T
    transform = T.Compose([
        T.ToTensor(),
        T.Resize((224, 224)),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    deep_feats = []
    for img in imgs:
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        tensor = transform(rgb).unsqueeze(0)
        with torch.no_grad():
            out = model(tensor).squeeze().numpy()
        deep_feats.append(out)
    deep_feats = np.array(deep_feats)
    # PCA для зменшення розмірності
    pca = PCA(n_components=n_deep)
    deep_reduced = pca.fit_transform(deep_feats)
    names = [f"deep_{i+1}" for i in range(n_deep)]
    return deep_reduced, names

# ---- Декодування зображень ----
def load_images_and_labels(b64_list, labels, size=(128, 128)):
    imgs = []
    good_labels = []
    bad_indices = []
    for idx, (b64_str, label) in enumerate(zip(b64_list, labels)):
        try:
            data = base64.b64decode(b64_str)
            arr = np.frombuffer(data, np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("cv2.imdecode повернув None")
            img = cv2.resize(img, size)
            imgs.append(img)
            good_labels.append(label)
        except Exception as e:
            bad_indices.append(idx)
            print(f"Пропущено зображення #{idx}: {e}", file=sys.stderr)
    return imgs, good_labels, bad_indices

# ---- Вибір ознак ----
def branched_selection(X, y, feature_names, max_branches=2, min_delta=0.01, max_depth=4):
    """
    Будує дерево вибору ознак (branched selection tree)
    """
    # Розбиваємо train/test (фіксовано, для всіх кроків)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.33, random_state=42, stratify=y)
    base_pred = np.bincount(y_test).argmax()
    base_acc = np.mean(y_test == base_pred)

    def recursive(selected, remain, parent_acc, depth):
        # Зупинка: або всі ознаки обрано, або досягли max_depth
        if not remain or depth >= max_depth:
            return []
        candidates = []
        # Оцінюємо всі можливі додавання однієї ознаки
        for i, fname in enumerate(remain):
            feats = selected + [fname]
            idxs = [feature_names.index(f) for f in feats]
            X_sub = X_train[:, idxs]
            X_sub_test = X_test[:, idxs]
            model = LogisticRegression(max_iter=1000)
            model.fit(X_sub, y_train)
            acc = model.score(X_sub_test, y_test)
            delta = acc - parent_acc
            candidates.append({
                "feature": fname,
                "feats_now": feats,
                "accuracy": acc,
                "delta": delta
            })
        # Сортуємо кандидати за точністю (або приростом)
        candidates.sort(key=lambda x: x['accuracy'], reverse=True)
        # Відбираємо лише top N (max_branches), які дають приріст > min_delta
        best = [c for c in candidates if c['delta'] > min_delta][:max_branches]
        # Для кожної гілки — рекурсія далі
        children = []
        for c in best:
            new_remain = [f for f in remain if f != c['feature']]
            c['children'] = recursive(c['feats_now'], new_remain, c['accuracy'], depth+1)
            children.append(c)
        return children

    # Початок дерева
    root = {
        "feature": None,
        "feats_now": [],
        "accuracy": base_acc,
        "delta": 0,
        "children": recursive([], feature_names, base_acc, 0)
    }
    return root

def main():
    raw = sys.stdin.read()
    if not raw:
        print(json.dumps({"error": "No input"}))
        return
    data = json.loads(raw)
    images, labels, bad_indices = load_images_and_labels(data.get('images', []), data.get('labels', []))
    if len(images) == 0:
        print(json.dumps({"error": "Жодного коректного зображення не вдалося обробити!"}))
        return

    # Виділення ознак
    X_cls = []
    for img in images:
        feats, feature_names = extract_classical_features(img)
        X_cls.append(feats)
    X_cls = np.array(X_cls)
    cls_names = feature_names

    # Deep-ознаки
    X_deep, deep_names = extract_deep_features(images, n_deep=10)

    # Об'єднання всіх ознак
    X_full = np.hstack([X_cls, X_deep])
    all_names = cls_names + deep_names

    # Побудова дерева відбору ознак
    selection_tree = branched_selection(X_full, labels, all_names, max_branches=2, min_delta=0.01, max_depth=4)

    # Повертаємо результат
    result = {
        "selectionTree": selection_tree,
        "featureNames": all_names,
        "classicalFeatures": cls_names,
        "deepFeatures": deep_names,
        "skippedImages": bad_indices  # Можна й пустий масив якщо все ок
    }
    print(json.dumps(result, ensure_ascii=False), flush=True)

if __name__ == '__main__':
    main()
