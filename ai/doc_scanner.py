from config import gemini_client
from models import DocumentCheck

def scan_document(file_path: str, required_for_scheme: str) -> DocumentCheck:
    uploaded_file = gemini_client.files.upload(file=file_path)
    prompt = f"""This document was submitted as proof of eligibility for: {required_for_scheme}
Inspect it and assess:
- What type of document is this?
- Is it legible (readable, not blurry/cut off)?
- Does it appear complete (no missing sections/fields)?
- List any fields that are missing, unclear, or blank.
- Give a one-line summary of whether this document is ready to submit.
"""
    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[uploaded_file, prompt],
        config={
            "response_mime_type": "application/json",
            "response_schema": DocumentCheck,
        },
    )
    return response.parsed
