import sys, json, base64, cv2, torch, torchvision.models as models
# Читаємо вхідний JSON із stdin
data = json.loads(sys.stdin.read() or "{}")
b64_str = data.get('image')
if not b64_str:
    print(json.dumps({ "error": "No image" }))
    sys.exit(0)
# Декодуємо зображення
arr = bytearray(base64.b64decode(b64_str))
img = cv2.imdecode(np.frombuffer(arr, np.uint8), cv2.IMREAD_COLOR)
img_resized = cv2.resize(img, (224,224))
# Завантажуємо модель (структуру)
model = models.mobilenet_v2(pretrained=False)
model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, 2)
model.load_state_dict(torch.load("models/latest_model.pth", map_location='cpu'))
model.eval()
# Підготовка тензора
import torchvision.transforms as T
transform = T.Compose([
    T.ToTensor(),
    T.Normalize(mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225])
])
tensor = transform(cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB))
# Передбачення класу
with torch.no_grad():
    output = model(tensor.unsqueeze(0))
    pred_class = int(torch.argmax(output, dim=1))
print(json.dumps({ "predicted_class": pred_class }))
