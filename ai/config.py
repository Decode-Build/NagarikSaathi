import os
from dotenv import load_dotenv
from google import genai
from tavily import TavilyClient

# Load env variables from .env file
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# Reusable clients
gemini_client = genai.Client(api_key=GOOGLE_API_KEY)
tavily_client = TavilyClient(api_key=TAVILY_API_KEY)
