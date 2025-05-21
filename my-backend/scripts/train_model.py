import sys, json, base64, cv2, numpy as np
import torch, torch.nn as nn, torchvision.models as models
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

# Вхідні дані
data = json.loads(sys.stdin.read() or "{}")
images_b64 = data.get('images', [])
labels = np.array(data.get('labels', []), dtype=np.int64)
classnames = data.get('classnames', [])

def decode_image(b64_str):
    arr = np.frombuffer(base64.b64decode(b64_str), np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Не вдалося декодувати зображення. Перевірте формат і цілісність файлу.")
    return cv2.resize(img, (224, 224))

# Перевіряємо кількість labels і images
if len(images_b64) != len(labels):
    print(json.dumps({"error": f"Кількість зображень ({len(images_b64)}) не збігається з кількістю міток ({len(labels)})"}))
    sys.exit(1)

# Декодуємо всі зображення з контролем
all_images = []
good_labels = []
bad_idx = []
for i, b64 in enumerate(images_b64):
    try:
        img = decode_image(b64)
        all_images.append(img)
        good_labels.append(labels[i])
    except Exception as e:
        print(f"[WARN] Image #{i}: {e}", file=sys.stderr)
        bad_idx.append(i)

if len(all_images) == 0:
    print(json.dumps({"error": "Жодне зображення не вдалося декодувати!"}))
    sys.exit(1)

labels = np.array(good_labels, dtype=np.int64)

# Перевіряємо наявність хоча б 2 класів
if len(np.unique(labels)) < 2:
    print(json.dumps({"error": "У датасеті має бути щонайменше 2 класи для тренування!"}))
    sys.exit(1)

# Розбивка на train/test
X_train_img, X_test_img, y_train, y_test = train_test_split(
    all_images, labels, test_size=0.2, stratify=labels, random_state=42
)

# 1. Класичні ознаки
def extract_classical_feats(img):
    avg_color = img.mean(axis=(0,1)).tolist()
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray_std = float(gray.std())
    return avg_color + [gray_std]

X_train_feats = np.array([extract_classical_feats(img) for img in X_train_img])
X_test_feats  = np.array([extract_classical_feats(img) for img in X_test_img])
clf = LogisticRegression(max_iter=1000).fit(X_train_feats, y_train)
y_pred_baseline = clf.predict(X_test_feats)
baseline_acc = accuracy_score(y_test, y_pred_baseline)

# 2. CNN-підхід
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = models.mobilenet_v2(pretrained=True)
model.classifier[1] = nn.Linear(model.classifier[1].in_features, len(np.unique(labels)))
model = model.to(device)
for param in model.features.parameters():
    param.requires_grad = False

import torchvision.transforms as T
transform = T.Compose([
    T.ToTensor(),
    T.Normalize(mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225])
])
X_train_tensor = [transform(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)) for img in X_train_img]
X_test_tensor  = [transform(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)) for img in X_test_img]

# Навчальний цикл
model.train()
epochs = 30
optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
criterion = nn.CrossEntropyLoss()
loss_history = []
for epoch in range(epochs):
    total_loss = 0.0
    for i, tensor in enumerate(X_train_tensor):
        optimizer.zero_grad()
        outputs = model(tensor.unsqueeze(0).to(device))
        loss = criterion(outputs, torch.tensor([y_train[i]], device=device))
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    loss_history.append(total_loss / len(X_train_tensor))

# Тестування
model.eval()
y_pred_cnn = []
for tensor in X_test_tensor:
    with torch.no_grad():
        logits = model(tensor.unsqueeze(0).to(device))
    pred = int(torch.argmax(logits, dim=1))
    y_pred_cnn.append(pred)
cnn_acc = accuracy_score(y_test, y_pred_cnn)

# Зберігаємо модель, якщо потрібно
model_path = "models/latest_model.pth"
torch.save(model.state_dict(), model_path)

result = {
    "cnn_accuracy": cnn_acc,
    "logistic_accuracy": baseline_acc,
    "loss_history": loss_history,
    "model_path": model_path,
    "classnames": classnames,
    "bad_images": bad_idx
}
print(json.dumps(result))
