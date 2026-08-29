from config import gemini_client
from models import UserIntent, MatchResults

def find_matches(intent: UserIntent, search_results: dict) -> MatchResults:
    context_chunks = []
    for r in search_results.get("results", []):
        context_chunks.append(f"Source: {r['url']}\nTitle: {r['title']}\nContent: {r['content']}\n")
    context = "\n---\n".join(context_chunks)
    
    prompt = f"""User profile:
- Category of need: {intent.category}
- Occupation: {intent.occupation}
- State: {intent.state}
- Income bracket: {intent.income_bracket}
- Special criteria: {intent.special_criteria}

Here is live search data about relevant government schemes:
{context}

Task: Identify which schemes genuinely match this user. For each match, score fit 0-100, explain why in 1-2 sentences, and list any eligibility gaps (things the user may not qualify for or hasn't confirmed).
Only include schemes actually supported by the search data above — do not invent schemes.
"""
    response = gemini_client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": MatchResults,
        },
    )
    return response.parsed
