import sys, json, base64, cv2, numpy as np
import torch, torch.nn as nn, torchvision.models as models
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.feature_selection import mutual_info_classif

# Вхідні дані (images: список base64, labels: список чисел, finetune: bool)
data = json.loads(sys.stdin.read() or "{}")
images_b64 = data.get('images', [])
labels = np.array(data.get('labels', []), dtype=np.int64)
finetune_all = data.get('finetune', False)

# Функція для декодування зображень (аналогічна load_images)
def decode_image(b64_str):
    arr = np.frombuffer(base64.b64decode(b64_str), np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return cv2.resize(img, (224, 224))  # до розміру 224x224 для MobileNetV2

# Декодуємо всі зображення
all_images = [decode_image(b64) for b64 in images_b64]
# Розділяємо на навчальну і тестову вибірки (20% – тест)
X_train_img, X_test_img, y_train, y_test = train_test_split(
    all_images, labels, test_size=0.2, stratify=labels, random_state=42
)

# 1. Класичний підхід: ознаки + LogisticRegression
def extract_classical_feats(img):
    avg_color = img.mean(axis=(0,1)).tolist()
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray_std = float(gray.std())
    return avg_color + [gray_std]

X_train_feats = np.array([extract_classical_feats(img) for img in X_train_img])
X_test_feats  = np.array([extract_classical_feats(img) for img in X_test_img])
clf = LogisticRegression(max_iter=1000).fit(X_train_feats, y_train)
y_pred_baseline = clf.predict(X_test_feats)
baseline_acc = accuracy_score(y_test, y_pred_baseline)  # точність логістичної регресії

# 2. Підхід CNN: навчання MobileNetV2
model = models.mobilenet_v2(pretrained=True)
# Замінюємо фінальний повнозв'язний шар на новий з потрібним числом виходів:contentReference[oaicite:8]{index=8}
model.classifier[1] = nn.Linear(model.classifier[1].in_features, len(np.unique(labels)))
if not finetune_all:
    # Заморожуємо ваги базової частини, якщо обрали навчати лише класифікатор
    for param in model.features.parameters():
        param.requires_grad = False

# Визначаємо оптимізатор і функцію втрат
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)

# Підготовка тензорів та перетворень для навчання
import torchvision.transforms as T
transform = T.Compose([
    T.ToTensor(),
    T.Normalize(mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225])
])
X_train_tensor = [transform(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)) for img in X_train_img]
X_test_tensor  = [transform(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))  for img in X_test_img]

# Навчальний цикл
model.train()
epochs = 10
loss_history = []
for epoch in range(epochs):
    total_loss = 0.0
    for i, tensor in enumerate(X_train_tensor):
        optimizer.zero_grad()
        outputs = model(tensor.unsqueeze(0))
        loss = criterion(outputs, torch.tensor([y_train[i]]))
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    avg_loss = total_loss / len(X_train_tensor)
    loss_history.append(avg_loss)
# Оцінюємо точність на тестових
model.eval()
y_pred_cnn = []
for tensor in X_test_tensor:
    with torch.no_grad():
        logits = model(tensor.unsqueeze(0))
    pred = int(torch.argmax(logits, dim=1))
    y_pred_cnn.append(pred)
cnn_acc = accuracy_score(y_test, y_pred_cnn)

# 3. Порівняльний аналіз ознак: MI для класичних vs глибоких ознак
# Отримуємо глибокі ознаки для всіх зображень (після навчання моделі)
deep_features = []
for img in all_images:
    # пропускаємо через model.features (без класифікатора) щоб отримати 1280-вектор
    with torch.no_grad():
        feat = model.features(transform(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)).unsqueeze(0))
    deep_features.append(feat.squeeze().numpy())
deep_features = np.array(deep_features)
all_feats_classical = np.array([extract_classical_feats(img) for img in all_images])
# Обчислюємо взаємну інформацію
mi_deep_all = mutual_info_classif(deep_features, labels)
mi_classical_all = mutual_info_classif(all_feats_classical, labels)
top_idxs = np.argsort(mi_deep_all)[-10:][::-1]
top_features = [f"deep_{int(i)}" for i in top_idxs]
top_mi_scores = mi_deep_all[top_idxs].tolist()

# 4. Збереження моделі
model_path = "models/latest_model.pth"
torch.save(model.state_dict(), model_path)

# 5. Вивід результатів
result = {
    "cnn_accuracy": cnn_acc,
    "logistic_accuracy": baseline_acc,
    "loss_history": loss_history,
    "features_classical": ["avg_b", "avg_g", "avg_r", "std_gray"],
    "mi_classical": mi_classical_all.tolist(),
    "features_deep": top_features,
    "mi_deep": top_mi_scores,
    "model_path": model_path
}
print(json.dumps(result))
