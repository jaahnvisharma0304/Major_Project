Clone Repository

git clone https://github.com/ananya584/crisis-api.git

Move into project folder:

cd crisis-api

Create Virtual Environment

python3 -m venv venv

Activate virtual environment:

Mac/Linux

source venv/bin/activate

Windows

venv\Scripts\activate

Install Dependencies

pip install -r requirements.txt

Download GloVe Embeddings

Download:

https://nlp.stanford.edu/data/glove.6B.zip

Extract:

glove.6B.100d.txt

Place it inside the project root folder.

Run FastAPI Server

uvicorn app:app --host 0.0.0.0 --port 8000 --reload

Server will start at:

http://0.0.0.0:8000

Swagger API Documentation

Open:

http://127.0.0.1:8000/docs

Swagger UI provides interactive API testing.

Public Deployment Using ngrok

Install ngrok

Mac

brew install ngrok/ngrok/ngrok

Create ngrok Account

Create account:

https://dashboard.ngrok.com/signup

Copy authtoken:

https://dashboard.ngrok.com/get-started/your-authtoken

Add ngrok Token

ngrok config add-authtoken YOUR_TOKEN

Generate Public URL

Open another terminal and run:

ngrok http 8000

You will get:

https://xxxx.ngrok-free.app

Public Swagger docs:

https://xxxx.ngrok-free.app/docs

API Endpoints

Root Endpoint

GET /

Health Check

GET /health

Single Prediction

POST /predict

Author

Ananya Gupta

License

This project is for educational and research purposes.
