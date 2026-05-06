# 🚀 Disaster Damage Detection API

This project provides a FastAPI backend for detecting disaster damage using pre/post images.

---

# 🖥️ Mac Setup Guide (Step-by-Step)

## 🔹 1. Clone the Repository

Open Terminal and run:

```bash
git clone <YOUR_GITHUB_LINK>
cd disaster-damage-api
```

---

## 🔹 2. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 🔹 3. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 🔹 4. Download Model File

Download the trained model from the link below:

https://drive.google.com/file/d/1AyRncbzsUXcFvozfp0xpEu50t6hr3zer/view?usp=sharing

After downloading:

```bash
mkdir models
```

Move the downloaded file into the folder:

```bash
models/disaster_damage_model.pth
```

---

## 🔹 5. Run the API Server

```bash
uvicorn api:app --reload
```

---

## 🔹 6. Open API in Browser

Go to:

```
http://127.0.0.1:8000/docs
```

This opens Swagger UI where you can test the API.

---

# 📤 How to Test

1. Go to `/predict`
2. Upload:

   * **pre-disaster image**
   * **post-disaster image**
3. Click **Execute**

---

# 📁 Expected Folder Structure

```
disaster-damage-api/
│
├── api.py
├── requirements.txt
├── README.md
│
├── models/
│   └── disaster_damage_model.pth   ✅ (you must add this)
│
├── outputs/
└── scripts/
```

---

# ⚠️ Common Errors & Fixes

## ❌ Model not found

Error:

```
No such file or directory: models/disaster_damage_model.pth
```

✔ Fix:

* Ensure file is inside `models/` folder

---

## ❌ Module not found

✔ Fix:

```bash
pip install -r requirements.txt
```

---

## ❌ Command not found: uvicorn

✔ Fix:

```bash
pip install uvicorn
```

---

## ❌ Python not found

✔ Fix:
Use:

```bash
python3
```

instead of `python`

---

# 💡 Notes

* Model file is NOT included in GitHub due to size limits
* Always activate virtual environment before running
* Outputs will be saved in `outputs/` folder

---

# 🎯 You're Ready!

Now the API should run successfully on your Mac 🚀
