from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

@app.post("/generate-summary")
async def generate_summary(request: Request):
    data = await request.json()
    
    # Extract just the essential parts to send to LLM (prevent token limit issues)
    simplified_data = []
    if isinstance(data, list):
        for region in data:
            simplified_data.append({
                "id": region.get("id"),
                "level": region.get("damage_level"),
                "score": region.get("damage_score"),
                "latitude": region.get("latitude"),
                "longitude": region.get("longitude")
            })
    
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_api_key_here":
        return {
            "summary": "GEMINI_API_KEY is not set. Please add your Gemini API key to the .env file in the `backend/jaahnvi_model` folder to see AI-generated summaries.",
            "data_received": len(data)
        }

    try:
        # Use gemini free chat model
        llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", google_api_key=GEMINI_API_KEY)
        
        prompt = PromptTemplate(
            input_variables=["data"],
            template="""
            You are an expert disaster response analyst. Review the following satellite damage data.
            Task 1: For each region, use its latitude and longitude to identify the approximate real-world location (e.g., 'Jammu, Jammu and Kashmir' or 'Dehradun, Uttarakhand').
            Task 2: Generate a clear, concise, and highly actionable summary (under 150 words) for a rescue team. Use the real-world location names in your summary instead of Region IDs.

            You MUST return ONLY a valid JSON object with exactly these two keys:
            "summary": "Your generated markdown text summary here",
            "region_names": {{"r1": "Location Name 1", "r2": "Location Name 2"}}

            Do not include any other text, markdown blocks, or explanations outside the JSON object.

            Data (damage scores are 0-1, 1 is worst):
            {data}
            """
        )
        
        chain = prompt | llm
        response = chain.invoke({"data": str(simplified_data)})
        
        # Extract content
        content = response.content
        if isinstance(content, list):
            texts = []
            for item in content:
                if isinstance(item, dict) and "text" in item:
                    texts.append(item["text"])
                else:
                    texts.append(str(item))
            content = "\n".join(texts)
        else:
            content = str(content)
            
        # Clean markdown code blocks from JSON output
        content = re.sub(r'^```json\n', '', content.strip())
        content = re.sub(r'```$', '', content.strip())
        content = content.strip()
        
        try:
            parsed = json.loads(content)
            summary_text = parsed.get("summary", content)
            region_names = parsed.get("region_names", {})
        except json.JSONDecodeError:
            # Fallback if the LLM didn't return valid JSON
            summary_text = content
            region_names = {}
            
    except Exception as e:
        summary_text = f"Error generating summary: {str(e)}"
        region_names = {}

    return {
        "summary": summary_text,
        "region_names": region_names
    }
