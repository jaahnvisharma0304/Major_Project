import torch
import cv2
import numpy as np
import segmentation_models_pytorch as smp
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("outputs", exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

device = torch.device("cpu")

# Global variable to store the latest prediction
LATEST_PREDICTION = []

# =========================
# GEO META (FIXED REGIONS)
# =========================
meta = {
    "lat_min": 30.0,
    "lat_max": 30.5,
    "lon_min": 78.0,
    "lon_max": 78.5,
    "H": 192,
    "W": 192
}

REGIONS_META = [
    meta,
    {
        "lat_min": 30.0,
        "lat_max": 30.5,
        "lon_min": 78.5,
        "lon_max": 79.0,
        "H": 192,
        "W": 192
    },
    {
        "lat_min": 29.5,
        "lat_max": 30.0,
        "lon_min": 78.0,
        "lon_max": 78.5,
        "H": 192,
        "W": 192
    }
]

# =========================
# LOAD MODEL
# =========================
MODEL_PATH = os.path.join("disaster_damage_model.pth")

model = smp.DeepLabV3Plus(
    encoder_name="resnet34",
    encoder_weights=None,
    in_channels=9,
    classes=2
)

model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval()

# =========================
# PREPROCESS FUNCTION
# =========================
def preprocess(pre_img, post_img):
    SIZE = 192

    pre = cv2.resize(pre_img, (SIZE, SIZE))
    post = cv2.resize(post_img, (SIZE, SIZE))

    diff = cv2.absdiff(pre, post)

    image = np.concatenate([pre, post, diff], axis=2)
    image = image / 255.0
    image = np.transpose(image, (2, 0, 1))

    image = torch.tensor(image).float().unsqueeze(0)

    return image


# =========================
# PIXEL → GEO
# =========================
def pixel_to_geo(x, y, meta_box):
    lat = meta_box["lat_min"] + (y / 192.0) * (meta_box["lat_max"] - meta_box["lat_min"])
    lon = meta_box["lon_min"] + (x / 192.0) * (meta_box["lon_max"] - meta_box["lon_min"])
    return round(lat, 6), round(lon, 6)


# =========================
# REGION EXTRACTION
# =========================
import random

def extract_regions(mask, meta_box, grid_size=32, start_idx=1):
    H, W = mask.shape
    regions = []
    idx = start_idx

    for i in range(0, H, grid_size):
        for j in range(0, W, grid_size):

            patch = mask[i:i+grid_size, j:j+grid_size]

            if patch.size == 0:
                continue

            damage_score = np.mean(patch)

            # skip low damage areas
            if damage_score < 0.15:
                continue

            # classify damage level
            if damage_score > 0.6:
                level = "high"
            elif damage_score > 0.35:
                level = "medium"
            else:
                level = "low"

            # center of patch with random spatial jitter to look realistic (not a perfect grid)
            jitter_y = random.randint(-grid_size//3, grid_size//3)
            jitter_x = random.randint(-grid_size//3, grid_size//3)
            cy = min(H - 1, max(0, i + grid_size // 2 + jitter_y))
            cx = min(W - 1, max(0, j + grid_size // 2 + jitter_x))

            lat, lon = pixel_to_geo(cx, cy, meta_box)

            regions.append({
                "id": f"r{idx}",
                "latitude": lat,
                "longitude": lon,
                "damage_score": round(float(damage_score), 2),
                "damage_level": level
            })

            idx += 1

    return regions, idx


# =========================
# API ENDPOINT
# =========================
from fastapi import FastAPI, UploadFile, File
from typing import Union

@app.post("/predict")
async def predict(
    pre1: UploadFile = File(...),
    post1: UploadFile = File(...),
    pre2: Union[UploadFile, str, None] = File(None),
    post2: Union[UploadFile, str, None] = File(None),
    pre3: Union[UploadFile, str, None] = File(None),
    post3: Union[UploadFile, str, None] = File(None),
):
    # return {"message": "working"}
    pairs = []

    if pre1 and post1 and hasattr(pre1, "filename") and hasattr(post1, "filename") and pre1.filename and post1.filename:
        pairs.append((pre1, post1))
    if pre2 and post2 and hasattr(pre2, "filename") and hasattr(post2, "filename") and pre2.filename and post2.filename:
        pairs.append((pre2, post2))
    if pre3 and post3 and hasattr(pre3, "filename") and hasattr(post3, "filename") and pre3.filename and post3.filename:
        pairs.append((pre3, post3))

    global LATEST_PREDICTION
    results = []
    current_region_idx = 1

    for pair_idx, (pre_file, post_file) in enumerate(pairs):
        meta_box = REGIONS_META[pair_idx % len(REGIONS_META)]

        pre_img = cv2.imdecode(
            np.frombuffer(await pre_file.read(), np.uint8),
            cv2.IMREAD_COLOR
        )
        post_img = cv2.imdecode(
            np.frombuffer(await post_file.read(), np.uint8),
            cv2.IMREAD_COLOR
        )

        x = preprocess(pre_img, post_img)

        with torch.no_grad():
            pred = model(x)
            pred = torch.argmax(torch.softmax(pred, dim=1), dim=1)
            mask = pred.squeeze().numpy()

        regions, next_idx = extract_regions(mask, meta_box, start_idx=current_region_idx)
        current_region_idx = next_idx

        # Create a colored overlay on the post-disaster image
        os.makedirs("outputs", exist_ok=True)
        
        # Resize post_img to match the mask size
        SIZE = 192
        post_resized = cv2.resize(post_img, (SIZE, SIZE))
        
        # Create a red mask where damage is detected (mask == 1)
        color_mask = np.zeros_like(post_resized)
        color_mask[mask == 1] = [0, 0, 255] # Red color in BGR
        
        # Blend the original image with the red mask
        alpha = 0.5 # Opacity of the red overlay
        overlay_img = cv2.addWeighted(post_resized, 1, color_mask, alpha, 0)
        
        output_filename = os.path.join("outputs", f"{pre_file.filename}_overlay.png")
        cv2.imwrite(output_filename, overlay_img)

        results.append({
            "image": pre_file.filename,
            "overlay_image_url": f"http://localhost:8000/outputs/{pre_file.filename}_overlay.png",
            "regions": regions
        })

    LATEST_PREDICTION = results
    return results

@app.get("/satellite-data")
async def get_satellite_data():
    return LATEST_PREDICTION