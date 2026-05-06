import torch
import numpy as np
from torch.utils.data import DataLoader
import segmentation_models_pytorch as smp
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score
from dataset import DamageDataset

device = torch.device("cpu")

dataset = DamageDataset(
    pre_dir="data/pre",
    post_dir="data/post",
    mask_dir="data/mask",
    size=192,
    limit=500
)

loader = DataLoader(dataset, batch_size=8)

model = smp.DeepLabV3Plus(
    encoder_name="resnet34",
    encoder_weights=None,
    in_channels=9,
    classes=2
).to(device)

model.load_state_dict(torch.load("models/disaster_damage_model.pth", map_location=device))
model.eval()

TP = TN = FP = FN = 0

all_preds = []
all_gt = []

with torch.no_grad():

    for x, y in loader:

        x = x.to(device)
        y = y.to(device)

        pred = model(x)
        pred = torch.argmax(pred, dim=1)

        pred = pred.cpu().numpy()
        y = y.cpu().numpy()

        pred_flat = pred.flatten()
        y_flat = y.flatten()

        all_preds.extend(pred_flat)
        all_gt.extend(y_flat)

# CONFUSION MATRIX
cm = confusion_matrix(all_gt, all_preds)

TN, FP, FN, TP = cm.ravel()

# METRICS
iou = TP / (TP + FP + FN + 1e-6)
precision = precision_score(all_gt, all_preds)
recall = recall_score(all_gt, all_preds)
f1 = f1_score(all_gt, all_preds)
accuracy = (TP + TN) / (TP + TN + FP + FN)

# RDI
rdi = np.sum(all_preds) / (np.sum(all_gt) + 1e-6)

print("\nEvaluation Results")
print("-------------------")
print("IoU:", iou)
print("Precision:", precision)
print("Recall (R1):", recall)
print("F1 Score:", f1)
print("Accuracy:", accuracy)
print("Regional Damage Index:", rdi)

print("\nConfusion Matrix")
print(cm)