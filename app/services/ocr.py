import os
from dotenv import load_dotenv
from groq import Groq
import json
import base64

# Load from project root
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(base_dir, ".env"), override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize client only if key exists
client = None
if GROQ_API_KEY:
    client = Groq(api_key=GROQ_API_KEY)

import mimetypes

def encode_image(image_path):
    mime_type, _ = mimetypes.guess_type(image_path)
    if not mime_type:
        mime_type = "image/jpeg"
    with open(image_path, "rb") as image_file:
        base64_data = base64.b64encode(image_file.read()).decode('utf-8')
        return f"data:{mime_type};base64,{base64_data}"

async def extract_receipt_data(file_path: str):
    # Using Llama-4-Scout for OCR on Groq
    print(f"Starting OCR for file: {file_path}")
    try:
        if not GROQ_API_KEY or not client:
            print("Error: GROQ_API_KEY is missing or client not initialized!")
            return {"error": "GROQ_API_KEY is missing in backend configuration."}
            
        image_data_url = encode_image(file_path)
        print(f"Image encoded (length: {len(image_data_url)})")
        
        prompt = """
        Analyze the attached receipt and extract the following information into a valid JSON format:
        - amount: (float) total amount on the receipt
        - currency: (string) 3-letter currency code (e.g., USD, INR, EUR)
        - date: (string) date in YYYY-MM-DD format
        - description: (string) what was purchased
        - merchant_name: (string) name of the store or restaurant
        - category: (string) one of: "Meals", "Travel", "Supplies", "Other"
        
        Return ONLY the JSON object. If a field is not found, use null.
        """
        
        print("Sending request to Groq...")
        try:
            # Llama 4 Scout is the recommended vision model as of 2026
            completion = client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_data_url,
                                },
                            },
                        ],
                    }
                ],
                temperature=0
            )
        except Exception as groq_err:
            print(f"Groq API Direct Error: {str(groq_err)}")
            return {"error": f"Groq API Error: {str(groq_err)}"}
        
        content = completion.choices[0].message.content
        if not content:
            print("Groq returned empty content.")
            return None
            
        # Clean potential markdown JSON formatting
        cleaned_content = content.strip()
        if cleaned_content.startswith("```json"):
            cleaned_content = cleaned_content[7:-3].strip()
        elif cleaned_content.startswith("```"):
            cleaned_content = cleaned_content[3:-3].strip()
            
        result = json.loads(cleaned_content)
        print(f"OCR successful: {result}")
        return result
    except Exception as e:
        import traceback
        print(f"Groq OCR Error: {str(e)}")
        traceback.print_exc()
        return {"error": f"OCR failed: {str(e)}"}
