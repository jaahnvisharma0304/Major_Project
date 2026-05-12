from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import torch
import torch.nn as nn
import re
import pickle
from nltk.tokenize import word_tokenize
import nltk

nltk.download('punkt',     quiet=True)
nltk.download('punkt_tab', quiet=True)

# ─── CONFIG — must exactly match notebook ─────────────────────
MAX_LEN    = 40
EMBED_DIM  = 100
HIDDEN_DIM = 192
IMG_SIZE   = 224

DISASTER_KEYWORDS = [
    "earthquake", "flood", "wildfire", "cyclone", "hurricane", "storm",
    "landslide", "disaster", "damage", "evacuation", "trapped", "rescue",
    "emergency", "dead", "injured", "tsunami", "tornado", "fire", "collapse"
]

# ─── TEXT CLEANING ────────────────────────────────────────────
def clean_text(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z\s]", "", text)
    return text

# ─── LOAD VOCAB ───────────────────────────────────────────────
with open("word2idx.pkl", "rb") as f:
    word2idx = pickle.load(f)

# ─── MODEL COMPONENTS ─────────────────────────────────────────

class SEBlock(nn.Module):
    """Squeeze-and-Excitation channel attention."""
    def __init__(self, ch, reduction=8):
        super().__init__()
        self.fc = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(ch, ch // reduction), nn.ReLU(),
            nn.Linear(ch // reduction, ch), nn.Sigmoid()
        )

    def forward(self, x):
        w = self.fc(x).unsqueeze(-1).unsqueeze(-1)
        return x * w


class ResidualCNNBlock(nn.Module):
    """Custom residual conv block: Conv→BN→ReLU→Conv→BN + SE + skip."""
    def __init__(self, in_ch, out_ch, stride=1):
        super().__init__()
        self.conv1 = nn.Conv2d(in_ch,  out_ch, 3, stride=stride, padding=1, bias=False)
        self.bn1   = nn.BatchNorm2d(out_ch)
        self.conv2 = nn.Conv2d(out_ch, out_ch, 3, padding=1, bias=False)
        self.bn2   = nn.BatchNorm2d(out_ch)
        self.se    = SEBlock(out_ch)
        self.relu  = nn.ReLU(inplace=True)
        self.proj  = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 1, stride=stride, bias=False),
            nn.BatchNorm2d(out_ch)
        ) if (in_ch != out_ch or stride != 1) else nn.Identity()

    def forward(self, x):
        h = self.relu(self.bn1(self.conv1(x)))
        h = self.bn2(self.conv2(h))
        h = self.se(h)
        return self.relu(h + self.proj(x))


class CustomCNN(nn.Module):
    """
    5-stage custom CNN with residual + SE blocks.
    Input:  (B, 3, 224, 224)
    Output: (B, 512)
    No pretrained weights.
    """
    def __init__(self):
        super().__init__()
        # Stem: 224 → 56
        self.stem = nn.Sequential(
            nn.Conv2d(3, 32, 7, stride=2, padding=3, bias=False),
            nn.BatchNorm2d(32), nn.ReLU(inplace=True),
            nn.MaxPool2d(3, stride=2, padding=1)
        )
        # Stage 1: ch 32→64
        self.stage1 = nn.Sequential(
            ResidualCNNBlock(32,  64),
            ResidualCNNBlock(64,  64),
        )
        # Stage 2: ch 64→128
        self.stage2 = nn.Sequential(
            ResidualCNNBlock(64,  128, stride=2),
            ResidualCNNBlock(128, 128),
            ResidualCNNBlock(128, 128),
        )
        # Stage 3: ch 128→256
        self.stage3 = nn.Sequential(
            ResidualCNNBlock(128, 256, stride=2),
            ResidualCNNBlock(256, 256),
            ResidualCNNBlock(256, 256),
        )
        # Stage 4: ch 256→512
        self.stage4 = nn.Sequential(
            ResidualCNNBlock(256, 512, stride=2),
            ResidualCNNBlock(512, 512),
        )
        self.pool = nn.AdaptiveAvgPool2d(1)

    def forward(self, x):
        x = self.stem(x)
        x = self.stage1(x)
        x = self.stage2(x)
        x = self.stage3(x)
        x = self.stage4(x)
        return self.pool(x).flatten(1)   # (B, 512)


class CrossModalAttention(nn.Module):
    """
    Query: text vector → attends over image features.
    Returns a weighted image summary the same dim as img.
    """
    def __init__(self, text_dim, img_dim, hidden=64):
        super().__init__()
        self.Wq = nn.Linear(text_dim, hidden, bias=False)
        self.Wk = nn.Linear(img_dim,  hidden, bias=False)
        self.Wv = nn.Linear(img_dim,  img_dim, bias=False)

    def forward(self, text_vec, img_vec):
        q     = self.Wq(text_vec)
        k     = self.Wk(img_vec)
        score = (q * k).sum(dim=-1, keepdim=True)
        alpha = torch.sigmoid(score)
        v     = self.Wv(img_vec)
        return alpha * v


class CrisisModel(nn.Module):
    def __init__(self, vocab_size):
        super().__init__()

        # ── Text Branch ──────────────────────────────────────
        self.embed = nn.Embedding(vocab_size + 1, EMBED_DIM, padding_idx=0)

        self.gru = nn.GRU(
            EMBED_DIM, HIDDEN_DIM,
            batch_first=True,
            bidirectional=True,
            num_layers=2,
            dropout=0.3
        )

        # Self-attention over GRU outputs (hidden=128)
        self.attn = nn.Sequential(
            nn.Linear(HIDDEN_DIM * 2, 128),
            nn.Tanh(),
            nn.Linear(128, 1)
        )

        # ── Image Branch — CustomCNN (no pretrained weights) ──
        self.cnn = CustomCNN()                      # → (B, 512)
        self.img_fc = nn.Sequential(
            nn.Linear(512, 256), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(256, HIDDEN_DIM * 2)          # → (B, 384)
        )

        TEXT_DIM  = HIDDEN_DIM * 2                  # 384
        IMG_DIM   = HIDDEN_DIM * 2                  # 384

        # ── Cross-Modal Attention ─────────────────────────────
        self.cross_attn = CrossModalAttention(TEXT_DIM, IMG_DIM)

        # ── Gated Fusion ──────────────────────────────────────
        FUSED_DIM = TEXT_DIM + IMG_DIM              # 768
        self.gate  = nn.Linear(FUSED_DIM, FUSED_DIM)
        self.bn    = nn.LayerNorm(FUSED_DIM)

        self.fc = nn.Sequential(
            nn.Linear(FUSED_DIM, 256), nn.ReLU(), nn.Dropout(0.4),
            nn.Linear(256, 64),        nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(64,  2)
        )

        # ── Text-only head ────────────────────────────────────
        self.fc_text = nn.Sequential(
            nn.Linear(TEXT_DIM, 128), nn.ReLU(), nn.Dropout(0.4),
            nn.Linear(128, 2)
        )

    def forward(self, text, img=None):
        emb = self.embed(text)
        gru_out, _ = self.gru(emb)
        weights = torch.softmax(self.attn(gru_out), dim=1)
        t = torch.sum(weights * gru_out, dim=1)         # (B, 384)

        if img is None:
            return self.fc_text(t)

        i_raw = self.img_fc(self.cnn(img))              # (B, 384)
        i     = self.cross_attn(t, i_raw)               # (B, 384)

        fused = torch.cat((t, i), dim=1)                # (B, 768)
        gate  = torch.sigmoid(self.gate(fused))
        fused = self.bn(fused + gate * fused)

        return self.fc(fused)

# ─── LOAD MODEL ───────────────────────────────────────────────
device = torch.device("cpu")
model  = CrisisModel(len(word2idx))
model.load_state_dict(torch.load("model_best.pt", map_location=device, weights_only=True))
model.eval()

# ─── PREPROCESS ───────────────────────────────────────────────
def preprocess(text: str) -> torch.Tensor:
    tokens = word_tokenize(clean_text(text))
    seq    = [word2idx.get(w, 0) for w in tokens][:MAX_LEN]
    seq   += [0] * (MAX_LEN - len(seq))
    return torch.tensor([seq], dtype=torch.long)

# ─── INFERENCE CORE ───────────────────────────────────────────
def run_prediction(text: str) -> dict:
    text_tensor = preprocess(text)
    dummy_img   = torch.zeros((1, 3, IMG_SIZE, IMG_SIZE))   # 224×224

    with torch.no_grad():
        output     = model(text_tensor, dummy_img)
        prob       = torch.softmax(output, dim=1)
        pred       = torch.argmax(prob, dim=1).item()
        confidence = round(prob.max().item(), 3)

    # Keyword override — matches notebook predict_label logic
    keyword_hit = any(kw in text.lower() for kw in DISASTER_KEYWORDS)
    if pred == 0 and keyword_hit and prob[0][0].item() < 0.70:
        pred = 1

    label = "informative" if pred == 1 else "not_informative"
    return {
        "tweet_label": text[:80],
        "prediction":  label,
        "confidence":  confidence
    }

# ─── FASTAPI ──────────────────────────────────────────────────
app = FastAPI(
    title="CrisisEye API",
    description="Classifies crisis-related text as informative or not.",
    version="3.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InputText(BaseModel):
    text: str

class BatchInput(BaseModel):
    texts: List[str]

@app.get("/health")
def health():
    return {"status": "ok", "model": "CrisisModel v3 (CustomCNN + BiGRU + CrossModalAttn)"}

@app.get("/latest-tweets")
def latest_tweets():
    return {
      "total_samples": 30,
      "results": [
        {
          "text": "Massive earthquake strikes the coast of California, tsunami warning issued for the bay area. Please seek higher ground immediately.",
          "prediction": "informative",
          "confidence": 0.501
        },
        {
          "text": "Severe flooding in the lower valleys has displaced over 2,000 residents. Emergency shelters are opening at the high school.",
          "prediction": "informative",
          "confidence": 0.509
        },
        {
          "text": "The wildfire has crossed the highway and is spreading rapidly towards the residential zone. Evacuation orders are now in place.",
          "prediction": "informative",
          "confidence": 0.503
        },
        {
          "text": "Category 4 hurricane is expected to make landfall by midnight. Stock up on water and secure your windows.",
          "prediction": "informative",
          "confidence": 0.5
        },
        {
          "text": "Terrible landslide has completely blocked the main road into the city. Emergency vehicles are unable to pass.",
          "prediction": "informative",
          "confidence": 0.501
        },
        {
          "text": "Multiple casualties reported after the factory explosion earlier today. Medics are on the scene.",
          "prediction": "informative",
          "confidence": 0.511
        },
        {
          "text": "A tornado touched down in the suburbs, causing significant damage to homes and knocking out power grids.",
          "prediction": "informative",
          "confidence": 0.503
        },
        {
          "text": "Volcanic ash is raining down on the city. Residents are advised to stay indoors and wear masks if going outside.",
          "prediction": "not_informative",
          "confidence": 0.505
        },
        {
          "text": "The bridge collapsed during rush hour traffic. Search and rescue operations are ongoing.",
          "prediction": "informative",
          "confidence": 0.503
        },
        {
          "text": "Flash flood warning in effect until 6 PM. Do not attempt to drive through flooded roads.",
          "prediction": "informative",
          "confidence": 0.504
        },
        {
          "text": "A massive pile-up on the interstate involving 20 vehicles. Highway patrol is diverting traffic.",
          "prediction": "not_informative",
          "confidence": 0.505
        },
        {
          "text": "Firefighters are struggling to contain the blaze due to heavy winds. The fire is now 0% contained.",
          "prediction": "informative",
          "confidence": 0.503
        },
        {
          "text": "Red Cross is distributing emergency supplies and blankets at the central stadium for those affected by the storm.",
          "prediction": "informative",
          "confidence": 0.503
        },
        {
          "text": "Avalanche warning for the northern mountain passes. Several skiers are reported missing.",
          "prediction": "not_informative",
          "confidence": 0.503
        },
        {
          "text": "Power lines are down across the entire neighborhood due to the severe storm. Please avoid touching any fallen wires.",
          "prediction": "informative",
          "confidence": 0.5
        },
        {
          "text": "Helicopters are airlifting stranded survivors from the rooftops after the dam broke.",
          "prediction": "informative",
          "confidence": 0.506
        },
        {
          "text": "A chemical spill has occurred near the industrial park. Hazmat teams are evacuating a 5-mile radius.",
          "prediction": "not_informative",
          "confidence": 0.506
        },
        {
          "text": "Just had the best cup of coffee at this new cafe down the street! Highly recommend it.",
          "prediction": "not_informative",
          "confidence": 0.506
        },
        {
          "text": "Can't believe my favorite team lost the championship game last night. So disappointed.",
          "prediction": "not_informative",
          "confidence": 0.501
        },
        {
          "text": "The new superhero movie was absolutely amazing! The visual effects were out of this world.",
          "prediction": "not_informative",
          "confidence": 0.509
        },
        {
          "text": "I've been trying to learn how to play the guitar, but my fingers hurt so much.",
          "prediction": "not_informative",
          "confidence": 0.503
        },
        {
          "text": "Does anyone know a good recipe for homemade pizza dough? Mine always turns out too dense.",
          "prediction": "not_informative",
          "confidence": 0.503
        },
        {
          "text": "The weather is absolutely perfect today! Going to the park for a picnic with my dog.",
          "prediction": "not_informative",
          "confidence": 0.5
        },
        {
          "text": "Just finished reading a fantastic sci-fi novel. Let me know if you want the recommendation.",
          "prediction": "not_informative",
          "confidence": 0.508
        },
        {
          "text": "Traffic is a nightmare on the way to work today. Going to be late again.",
          "prediction": "not_informative",
          "confidence": 0.502
        },
        {
          "text": "Excited to announce that I just got promoted to Senior Developer at my company!",
          "prediction": "not_informative",
          "confidence": 0.506
        },
        {
          "text": "Why is it so hard to wake up early on Mondays? Need more sleep.",
          "prediction": "not_informative",
          "confidence": 0.506
        },
        {
          "text": "The tech conference is going great so far. Attended some really insightful sessions.",
          "prediction": "not_informative",
          "confidence": 0.502
        },
        {
          "text": "Thinking about upgrading my phone next month. Are the new models worth the price?",
          "prediction": "not_informative",
          "confidence": 0.5
        },
        {
          "text": "Can't wait for the weekend! Planning to binge-watch that new series everyone is talking about.",
          "prediction": "not_informative",
          "confidence": 0.505
        }
      ]
    }

@app.post("/predict")
def predict(data: InputText):
    if not data.text.strip():
        raise HTTPException(status_code=400, detail="Empty text input")
    return run_prediction(data.text)

# ─────────────────────────────────────────────
# Batch Input Schema
# ─────────────────────────────────────────────
class BatchInput(BaseModel):
    texts: list[str]

# ─────────────────────────────────────────────
# Batch Prediction Endpoint
# ─────────────────────────────────────────────
@app.post("/predict_batch")
def predict_batch(data: BatchInput):

    if len(data.texts) == 0:
        raise HTTPException(
            status_code=400,
            detail="No texts provided"
        )

    results = []

    for text in data.texts:

        result = run_prediction(text)

        results.append({
            "text": text,
            "prediction": result["prediction"],
            "confidence": result["confidence"]
        })

    return {
        "total_samples": len(results),
        "results": results
    }
