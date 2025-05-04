# scripts/branch_selection.py
import sys, json, base64
import numpy as np
import cv2
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score

def load_images(b64_list, size=(128, 128)):
    """Decode a list of base64-encoded images into OpenCV images of given size."""
    imgs = []
    for b64 in b64_list:
        try:
            data = base64.b64decode(b64)
        except Exception as e:
            continue  # skip invalid base64
        arr = np.frombuffer(data, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            continue
        img = cv2.resize(img, size)
        imgs.append(img)
    return imgs

def extract_features(images):
    """
    Extract feature vector for each image:
    - Average R, G, B channel values
    - Standard deviation of grayscale values
    Returns a feature matrix (numpy array) and feature names.
    """
    features = []
    for img in images:
        # Compute average color channels
        avg_colors = img.mean(axis=(0, 1)).tolist()  # [avgB, avgG, avgR] in OpenCV (BGR order)
        # Compute grayscale std deviation
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        std_gray = float(gray.std())
        # Note: reorder avg_colors to [R, G, B] naming
        avg_r, avg_g, avg_b = avg_colors[2], avg_colors[1], avg_colors[0]
        features.append([avg_r, avg_g, avg_b, std_gray])
    feature_names = ['avg_r', 'avg_g', 'avg_b', 'std_gray']
    X = np.array(features, dtype=float)
    return X, feature_names

def main():
    # Read all input from stdin
    raw_input = sys.stdin.read()
    if not raw_input:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)
    try:
        data = json.loads(raw_input)
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON: {e}"}))
        sys.exit(1)

    images_b64 = data.get('images', [])
    labels_list = data.get('labels', [])
    # Basic validation
    if not images_b64 or not labels_list or len(images_b64) != len(labels_list):
        print(json.dumps({"error": "Images and labels must be provided in equal number"}))
        sys.exit(1)

    # Decode images and prepare data
    images = load_images(images_b64)
    if len(images) != len(labels_list) or len(images) == 0:
        print(json.dumps({"error": "Failed to decode images"}))
        sys.exit(1)
    X, feature_names = extract_features(images)
    y = np.array(labels_list)
    # Ensure labels are in numeric form or string; (LogisticRegression can handle string classes as categories)

    # Perform step-by-step (greedy forward) feature selection
    selected_indices = []     # indices of features selected
    selected_features = []    # names of features selected
    accuracies = []           # accuracy after each feature addition

    current_best_acc = 0.0
    remaining_indices = list(range(X.shape[1]))  # all feature indices initially
    # Use 5-fold cross-validation for accuracy evaluation
    cv_folds = 5
    model = LogisticRegression(max_iter=1000)

    while remaining_indices:
        best_idx = None
        best_acc = current_best_acc
        # Try adding each remaining feature and evaluate via cross-validation
        for idx in remaining_indices:
            candidate_features = selected_indices + [idx]
            # Compute cross-validated accuracy using the candidate feature set
            try:
                scores = cross_val_score(model, X[:, candidate_features], y, cv=cv_folds)
            except Exception as e:
                # If model fails (e.g., singular matrix or other), skip this feature
                continue
            acc = scores.mean()
            if acc > best_acc:
                best_acc = acc
                best_idx = idx
        # If no feature improves accuracy, break out
        if best_idx is None:
            break
        # Select the best feature of this iteration
        selected_indices.append(best_idx)
        remaining_indices.remove(best_idx)
        selected_features.append(feature_names[best_idx])
        current_best_acc = best_acc
        accuracies.append(round(best_acc, 4))  # store accuracy (rounded for clarity)
        # Continue to next feature until no remaining improves

    result = {
        "selected_features": selected_features,
        "accuracies": accuracies,
        "final_accuracy": round(current_best_acc, 4)
    }
    print(json.dumps(result), flush=True)

if __name__ == "__main__":
    main()
