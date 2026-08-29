import os
import sys
from config import gemini_client
from models import DraftRule

def extract_rule_from_text(text: str, source_ref: str = "Gazette Document") -> DraftRule:
    prompt = f"""You are an expert legal and policy analyst. Analyze the following government gazette, scheme notification, or policy text and extract the eligibility rules and details to create a draft rule.
    
Source Gazette/Document Reference: {source_ref}

Text to Analyze:
---
{text}
---

Extract all details accurately into the required JSON schema. 
Analyze the rules thoroughly to output explicit field constraints (e.g. state names, income limits, land holding sizes, age limits).
Assess your extraction confidence on a scale of 0 to 100 based on how complete, unambiguous, and clear the rules are in the text.
"""
    response = gemini_client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": DraftRule,
        },
    )
    return response.parsed

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_rule.py <path_to_txt_or_pdf> [source_reference]")
        sys.exit(1)
    
    file_path = sys.argv[1]
    source_ref = sys.argv[2] if len(sys.argv) > 2 else os.path.basename(file_path)
    
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' not found.")
        sys.exit(1)
        
    try:
        # Read text or upload PDF
        if file_path.endswith('.pdf'):
            print(f"Uploading PDF '{file_path}' for analysis...")
            uploaded_file = gemini_client.files.upload(file=file_path)
            prompt = f"""Analyze the uploaded government gazette or scheme document.
Extract the eligibility rules and details to create a structured draft rule.
Source Gazette Reference: {source_ref}
"""
            response = gemini_client.models.generate_content(
                model="gemini-3.5-flash",
                contents=[uploaded_file, prompt],
                config={
                    "response_mime_type": "application/json",
                    "response_schema": DraftRule,
                },
            )
            draft_rule = response.parsed
        else:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            draft_rule = extract_rule_from_text(text, source_ref)
            
        print("\nExtracted Draft Rule:")
        print(draft_rule.model_dump_json(indent=2))
        
    except Exception as e:
        print(f"Error during rule extraction: {e}", file=sys.stderr)
        sys.exit(1)
