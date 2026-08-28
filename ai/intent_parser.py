from config import gemini_client
from models import UserIntent

def parse_intent(raw_query: str) -> UserIntent:
    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"""Extract structured intent from this user query. Be generous in inference but don't invent details that aren't implied.
User query: "{raw_query}"
""",
        config={
            "response_mime_type": "application/json",
            "response_schema": UserIntent,
        },
    )
    return response.parsed
