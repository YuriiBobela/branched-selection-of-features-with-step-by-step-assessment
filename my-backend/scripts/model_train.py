# scripts/model_train.py
import sys, os, json, base64
import numpy as np
import cv2
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
import joblib

def load_images(b64_list, size=(128, 128)):
    """Decode a list of base64-encoded images into OpenCV images."""
    imgs = []
    for b64 in b64_list:
        try:
            data = base64.b64decode(b64)
        except Exception as e:
            continue
        arr = np.frombuffer(data, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            continue
        img = cv2.resize(img, size)
        imgs.append(img)
    return imgs

def extract_features(images):
    """Extract the same features as in branch_selection.py for given images."""
    features = []
    for img in images:
        avg_colors = img.mean(axis=(0, 1)).tolist()  # [B, G, R]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        std_gray = float(gray.std())
        # Reorder BGR to RGB for naming consistency
        avg_r = avg_colors[2]; avg_g = avg_colors[1]; avg_b = avg_colors[0]
        features.append([avg_r, avg_g, avg_b, std_gray])
    feature_names = ['avg_r', 'avg_g', 'avg_b', 'std_gray']
    X = np.array(features, dtype=float)
    return X, feature_names

def train_model(X, y, feature_idx=None):
    """Train a Logistic Regression model on the provided feature subset. Returns trained model and accuracy."""
    if feature_idx is not None:
        X_train = X[:, feature_idx]
    else:
        X_train = X
        feature_idx = list(range(X.shape[1]))
    # Define and train the model
    model = LogisticRegression(max_iter=1000)
    # Perform cross-validation to estimate accuracy
    try:
        scores = cross_val_score(model, X_train, y, cv=5)
        accuracy = round(scores.mean(), 4)
    except Exception as e:
        # In case cross_val_score fails (e.g., insufficient classes), fallback to training score
        model.fit(X_train, y)
        accuracy = round(model.score(X_train, y), 4)
    # Train final model on full data
    model.fit(X_train, y)
    return model, accuracy, feature_idx

def main():
    # Determine mode from command-line argument
    mode = 'train'
    if len(sys.argv) > 1 and sys.argv[1] == 'predict':
        mode = 'predict'

    # Read input JSON from stdin
    raw_input = sys.stdin.read()
    if not raw_input:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)
    try:
        data = json.loads(raw_input)
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON: {e}"}))
        sys.exit(1)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, "model.pkl")

    if mode == 'train':
        # Training mode: expect images and labels, and optional selected feature list
        images_b64 = data.get('images', [])
        labels_list = data.get('labels', [])
        selected_feat_names = data.get('selected', None)  # list of feature names to use, or None for all
        if not images_b64 or not labels_list or len(images_b64) != len(labels_list):
            print(json.dumps({"error": "Images and labels must be provided for training"}))
            sys.exit(1)
        # Load and extract features
        images = load_images(images_b64)
        if len(images) != len(labels_list) or len(images) == 0:
            print(json.dumps({"error": "Failed to decode images for training"}))
            sys.exit(1)
        X, feature_names = extract_features(images)
        y = np.array(labels_list)
        # Determine feature indices to use for training
        if selected_feat_names:
            # Map feature names to indices
            feature_idx = [feature_names.index(name) for name in selected_feat_names if name in feature_names]
        else:
            feature_idx = None  # use all features
        # Train model on selected features and get accuracy
        model, accuracy, used_idx = train_model(X, y, feature_idx)
        # Save the trained model (with info about used feature indices/names)
        model_object = {
            "model": model,
            "features": [feature_names[i] for i in used_idx]  # store feature names used by the model
        }
        try:
            joblib.dump(model_object, model_path)
        except Exception as e:
            # If model saving fails, output an error
            print(json.dumps({"error": f"Failed to save model: {e}"}))
            sys.exit(1)
        # Output the training accuracy
        result = {"accuracy": accuracy}
        print(json.dumps(result), flush=True)

    elif mode == 'predict':
        # Prediction mode: expect a single image (no labels)
        b64_image = data.get('image', None)
        if not b64_image:
            print(json.dumps({"error": "No image provided for classification"}))
            sys.exit(1)
        # Load and extract features from the single image
        images = load_images([b64_image])
        if len(images) == 0:
            print(json.dumps({"error": "Failed to decode image"}))
            sys.exit(1)
        X, feature_names = extract_features(images)
        # Load the previously trained model
        try:
            saved = joblib.load(model_path)
        except Exception as e:
            print(json.dumps({"error": f"Failed to load model: {e}"}))
            sys.exit(1)
        model = saved.get("model")
        used_features = saved.get("features")  # list of feature names the model was trained on
        if model is None or used_features is None:
            print(json.dumps({"error": "No trained model available"}))
            sys.exit(1)
        # Select the same feature columns from X that the model was trained on
        try:
            # Map feature names to indices for the current feature set
            used_idx = [feature_names.index(name) for name in used_features]
            X_selected = X[:, used_idx]
        except Exception as e:
            # If for some reason features don't match, just use all features
            X_selected = X
        # Predict the label
        try:
            pred = model.predict(X_selected)
            # If prediction is a numpy array or list, take first element
            predicted_label = int(pred[0]) if hasattr(pred, '__iter__') else int(pred)
        except Exception as e:
            print(json.dumps({"error": f"Prediction failed: {e}"}))
            sys.exit(1)
        result = {"predicted_label": predicted_label}
        print(json.dumps(result), flush=True)

if __name__ == "__main__":
    main()
