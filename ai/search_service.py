from typing import Dict, Any
from config import tavily_client
from models import UserIntent

def search_schemes(intent: UserIntent, max_results: int = 8) -> Dict[str, Any]:
    query = intent.reformulated_query
    if intent.state:
        query += f" {intent.state} government scheme"
    else:
        query += " India government scheme"
    
    results = tavily_client.search(
        query=query,
        search_depth="advanced",
        max_results=max_results,
        include_answer=True,
        include_domains=["india.gov.in", "myscheme.gov.in"],
    )
    return results
