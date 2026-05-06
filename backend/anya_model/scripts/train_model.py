import torch
import numpy as np
from tqdm import tqdm
import os
import matplotlib.pyplot as plt
from torch.utils.data import DataLoader
import segmentation_models_pytorch as smp

from dataset import DamageDataset

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ==============================
# DATASET
# ==============================
dataset = DamageDataset(
    "data/pre",
    "data/post",
    "data/mask",
    size=192,        # better spatial detail
    limit=800        # enough for good training
)

loader = DataLoader(
    dataset,
    batch_size=8,
    shuffle=True,
    num_workers=0
)

# ==============================
# MODEL
# ==============================
model = smp.DeepLabV3Plus(
    encoder_name="resnet34",
    encoder_weights="imagenet",
    in_channels=9,
    classes=2
).to(device)

# ==============================
# LOSS (IMPORTANT FIX)
# ==============================
weights = torch.tensor([1.0, 8.0]).to(device)
ce_loss = torch.nn.CrossEntropyLoss(weight=weights)

def dice_loss(pred, target, eps=1e-6):
    pred = torch.softmax(pred, dim=1)[:, 1]
    target = target.float()

    inter = (pred * target).sum()
    union = pred.sum() + target.sum()

    return 1 - (2 * inter + eps) / (union + eps)

optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

epochs = 15

train_losses = []

# ==============================
# TRAIN
# ==============================
def train():

    model.train()

    for epoch in range(epochs):

        loop = tqdm(loader)
        epoch_loss = 0

        for x, y in loop:

            x = x.to(device)
            y = y.to(device)

            optimizer.zero_grad()

            pred = model(x)

            ce = ce_loss(pred, y)
            dl = dice_loss(pred, y)

            loss = ce + 0.5 * dl   # COMBINED LOSS

            loss.backward()
            optimizer.step()

            epoch_loss += loss.item()

        avg_loss = epoch_loss / len(loader)
        train_losses.append(avg_loss)

        print(f"\nEpoch {epoch+1}")
        print("Loss:", avg_loss)

    # SAVE MODEL
    os.makedirs("models", exist_ok=True)
    torch.save(model.state_dict(), "models/disaster_damage_model.pth")

    # SAVE LOSS GRAPH
    os.makedirs("results", exist_ok=True)

    plt.figure()
    plt.plot(train_losses)
    plt.title("Training Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.grid()
    plt.savefig("results/loss.png")
    plt.close()

    print("Model + Graph Saved")


if __name__ == "__main__":
    train()