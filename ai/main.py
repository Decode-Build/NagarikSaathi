import os
import sys
from intent_parser import parse_intent
from search_service import search_schemes
from match_engine import find_matches
from doc_scanner import scan_document

def run_pipeline(raw_query: str, document_path: str = None):
    print("==================================================")
    print(f"Processing Query: '{raw_query}'")
    print("==================================================")
    
    # 1. Understand what the user wants
    intent = parse_intent(raw_query)
    print("\n[Step 1] Parsed Intent:")
    print(intent.model_dump_json(indent=2))
    
    # 2. Search live web for relevant schemes
    print(f"\n[Step 2] Searching live web for: '{intent.reformulated_query}'...")
    search_results = search_schemes(intent)
    results_list = search_results.get("results", [])
    print(f"Found {len(results_list)} raw search results.")
    
    # 3. Reason over results to find real matches
    print("\n[Step 3] Matching schemes via Gemini reasoning...")
    matches = find_matches(intent, search_results)
    
    print("\nMatched Schemes:")
    if not matches.matches:
        print("No matching schemes found.")
    for m in matches.matches:
        print(f"- {m.scheme_name} ({m.match_score}% fit)")
        print(f"  Reasoning: {m.reasoning}")
        if m.eligibility_gaps:
            print(f"  Gaps identified: {', '.join(m.eligibility_gaps)}")
        if m.source_url:
            print(f"  Source URL: {m.source_url}")
        print()
        
    # 4. Optionally check a submitted document
    if document_path and matches.matches:
        top_scheme = matches.matches[0].scheme_name
        print(f"\n[Step 4] Scanning document '{document_path}' for scheme '{top_scheme}'...")
        if not os.path.exists(document_path):
            print(f"Warning: File '{document_path}' not found, skipping document scan.")
        else:
            doc_check = scan_document(document_path, top_scheme)
            print("\nDocument Verification Result:")
            print(doc_check.model_dump_json(indent=2))
            
    return intent, matches

if __name__ == "__main__":
    query = "i am a farmer in mp with 2 acre land need loan help"
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
    run_pipeline(query)
