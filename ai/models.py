from pydantic import BaseModel, Field
from typing import Optional, List

class UserIntent(BaseModel):
    category: str = Field(description="Type of need, e.g. 'agricultural loan', 'education scholarship'")
    occupation: Optional[str] = Field(default=None, description="User's occupation if mentioned")
    state: Optional[str] = Field(default=None, description="Indian state, if mentioned")
    income_bracket: Optional[str] = Field(default=None, description="e.g. 'below 2.5 lakh', 'unspecified'")
    special_criteria: List[str] = Field(default_factory=list, description="e.g. 'woman', 'SC/ST', 'disabled', 'land ownership'")
    reformulated_query: str = Field(description="A clean, search-engine-ready version of what the user wants")

class SchemeMatch(BaseModel):
    scheme_name: str
    match_score: int = Field(ge=0, le=100, description="0-100 how well this fits the user")
    reasoning: str = Field(description="1-2 sentence explanation of why this matches or doesn't")
    eligibility_gaps: List[str] = Field(default_factory=list, description="What the user might be missing")
    source_url: Optional[str] = None

class MatchResults(BaseModel):
    matches: List[SchemeMatch]

class DocumentCheck(BaseModel):
    document_type_detected: str
    is_legible: bool
    appears_complete: bool
    missing_or_unclear_fields: List[str]
    readiness_summary: str
