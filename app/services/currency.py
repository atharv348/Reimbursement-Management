import httpx
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

EXCHANGERATE_API_KEY = os.getenv("EXCHANGERATE_API_KEY")

async def get_exchange_rate(base_currency: str, target_currency: str):
    """
    Fetches exchange rate using ExchangeRate-API.
    Formula: base_currency_amount = target_currency_amount / rate
    """
    if not EXCHANGERATE_API_KEY:
        print("Warning: EXCHANGERATE_API_KEY not found in .env")
        return 1.0

    try:
        url = f"https://v6.exchangerate-api.com/v6/{EXCHANGERATE_API_KEY}/latest/{base_currency}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                if data.get("result") == "success":
                    rates = data.get("conversion_rates", {})
                    rate = rates.get(target_currency)
                    return rate
                else:
                    print(f"API Error: {data.get('error-type')}")
            else:
                print(f"HTTP Error: {response.status_code}")
    except Exception as e:
        print(f"Currency Conversion Error: {e}")
    
    return 1.0 # Fallback
