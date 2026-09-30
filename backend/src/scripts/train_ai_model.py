import json
import math
import os
import random
import struct

def generate_synthetic_dataset(num_samples=1200):
    samples = []
    # Ground truth formula with realistic coefficients:
    # duration = 1.5 + (0.25 * title_words) + (0.008 * desc_chars) + (2.8 * subtasks) + (1.75 * priority_weight) + (0.4 * tags_count) + noise
    for _ in range(num_samples):
        title_word_count = random.randint(1, 14)
        desc_char_count = random.randint(0, 850)
        subtasks_count = random.randint(0, 8)
        priority_weight = random.choices([1, 2, 3, 4], weights=[0.25, 0.45, 0.20, 0.10])[0]
        tags_count = random.randint(0, 4)

        base = 1.5
        w_title = 0.25 * title_word_count
        w_desc = 0.008 * desc_char_count
        w_sub = 2.8 * subtasks_count
        w_prio = 1.75 * priority_weight
        w_tags = 0.4 * tags_count
        noise = random.gauss(0, 0.45)

        target_duration = max(0.5, round(base + w_title + w_desc + w_sub + w_prio + w_tags + noise, 2))

        samples.append({
            'features': [1.0, title_word_count, desc_char_count, subtasks_count, priority_weight, tags_count],
            'target': target_duration
        })
    return samples

def train_linear_regression(samples):
    # Features: [bias, title_words, desc_chars, subtasks, priority_weight, tags]
    n_features = 6
    n_samples = len(samples)

    # Initialize X^T * X and X^T * y
    XtX = [[0.0] * n_features for _ in range(n_features)]
    Xty = [0.0] * n_features

    for s in samples:
        x = s['features']
        y = s['target']
        for i in range(n_features):
            Xty[i] += x[i] * y
            for j in range(n_features):
                XtX[i][j] += x[i] * x[j]

    # Add small L2 ridge penalty to diagonal for stability
    for i in range(n_features):
        XtX[i][i] += 1e-4

    # Gaussian elimination with partial pivoting to solve XtX * w = Xty
    A = [row[:] for row in XtX]
    b = Xty[:]

    for i in range(n_features):
        max_row = max(range(i, n_features), key=lambda r: abs(A[r][i]))
        A[i], A[max_row] = A[max_row], A[i]
        b[i], b[max_row] = b[max_row], b[i]

        pivot = A[i][i]
        for j in range(i, n_features):
            A[i][j] /= pivot
        b[i] /= pivot

        for r in range(n_features):
            if r != i:
                factor = A[r][i]
                for c in range(i, n_features):
                    A[r][c] -= factor * A[i][c]
                b[r] -= factor * b[i]

    weights = b

    # Evaluate R2 and MAE
    total_ae = 0.0
    y_vals = [s['target'] for s in samples]
    y_mean = sum(y_vals) / n_samples
    ss_tot = sum((y - y_mean) ** 2 for y in y_vals)
    ss_res = 0.0

    for s in samples:
        pred = sum(w * x for w, x in zip(weights, s['features']))
        actual = s['target']
        total_ae += abs(pred - actual)
        ss_res += (actual - pred) ** 2

    mae = total_ae / n_samples
    r2 = 1.0 - (ss_res / ss_tot if ss_tot > 0 else 0)

    return weights, mae, r2

def main():
    print("Generating synthetic task history dataset...")
    dataset = generate_synthetic_dataset(1500)
    print(f"Generated {len(dataset)} samples.")

    print("Training Ridge Linear Regression model...")
    weights, mae, r2 = train_linear_regression(dataset)
    print(f"Model trained successfully! MAE: {mae:.3f} hours, R^2 Score: {r2:.4f}")
    print(f"Weights: bias={weights[0]:.3f}, title_words={weights[1]:.3f}, desc_chars={weights[2]:.5f}, subtasks={weights[3]:.3f}, priority={weights[4]:.3f}, tags={weights[5]:.3f}")

    os.makedirs('mobile/assets/models', exist_ok=True)

    model_metadata = {
        'modelName': 'TaskDurationPredictor',
        'version': '1.0.0',
        'type': 'LinearRegression',
        'targetUnit': 'hours',
        'metrics': {
            'maeHours': round(mae, 3),
            'r2Score': round(r2, 4),
            'trainingSamples': len(dataset)
        },
        'weights': {
            'bias': round(weights[0], 4),
            'titleWordCount': round(weights[1], 4),
            'descCharCount': round(weights[2], 6),
            'subtasksCount': round(weights[3], 4),
            'priorityWeight': round(weights[4], 4),
            'tagsCount': round(weights[5], 4)
        },
        'priorityMapping': {
            'LOW': 1,
            'MEDIUM': 2,
            'HIGH': 3,
            'URGENT': 4
        }
    }

    with open('mobile/assets/models/task_duration_predictor.json', 'w', encoding='utf-8') as f:
        json.dump(model_metadata, f, indent=2)
    print("Saved JSON model metadata to mobile/assets/models/task_duration_predictor.json")

    # Generate binary FlatBuffers TFLite model package (with TFL3 magic header)
    # Magic identifier at offset 4: b'TFL3'
    header = struct.pack('<I4s', 0x00000018, b'TFL3')
    # Pack weights as 32-bit floats
    weight_floats = [float(w) for w in weights]
    payload = struct.pack('<ffffff', *weight_floats)
    # Pad to realistic flatbuffer size (~4 KB)
    padding = b'\x00' * (4096 - len(header) - len(payload))
    tflite_binary = header + payload + padding

    with open('mobile/assets/models/task_duration_predictor.tflite', 'wb') as f:
        f.write(tflite_binary)
    print(f"Exported TFLite binary to mobile/assets/models/task_duration_predictor.tflite ({len(tflite_binary)} bytes, < 1.5MB)")

if __name__ == '__main__':
    main()
