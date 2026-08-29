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

class DraftRule(BaseModel):
    scheme_id: str = Field(description="Unique lowercase kebab-case identifier, e.g. 'pm-kisan-v2'")
    name: str = Field(description="Official English name of the scheme")
    name_hindi: Optional[str] = Field(default=None, description="Official Hindi name of the scheme if applicable")
    category: List[str] = Field(default_factory=list, description="e.g. ['Agriculture', 'Direct Benefit Transfer']")
    target_groups: List[str] = Field(default_factory=list, description="e.g. ['Farmers', 'BPL Families']")
    eligibility_occupation: List[str] = Field(default_factory=list, description="Eligible occupations, e.g. ['Farmer'] or ['All']")
    eligibility_gender: str = Field(default="All", description="Male, Female, or All")
    eligibility_marital_status: List[str] = Field(default_factory=list, description="e.g. ['Single', 'Married'] or ['All']")
    eligibility_min_land_acres: float = Field(default=0.0, description="Minimum land requirement in acres")
    eligibility_max_land_acres: float = Field(default=9999.0, description="Maximum land limit in acres")
    eligibility_states: List[str] = Field(default_factory=list, description="States where applicable, e.g. ['Madhya Pradesh'] or ['All']")
    eligibility_max_annual_income: float = Field(default=9999999.0, description="Maximum annual income ceiling in Rupees")
    eligibility_caste_category: List[str] = Field(default_factory=list, description="e.g. ['SC', 'ST', 'OBC'] or ['All']")
    benefits: str = Field(description="Detailed benefits in English")
    benefits_hindi: Optional[str] = Field(default=None, description="Detailed benefits in Hindi if applicable")
    documents: List[str] = Field(default_factory=list, description="Required documents")
    application_url: Optional[str] = Field(default=None, description="Official apply URL")
    helpline_number: Optional[str] = Field(default=None, description="Helpline phone number")
    description: str = Field(description="Brief overview of the scheme")
    description_hindi: Optional[str] = Field(default=None, description="Brief overview of the scheme in Hindi")
    ministry: Optional[str] = Field(default=None, description="Administrative ministry")
    source_url: Optional[str] = Field(default=None, description="Official source web page link")
    confidence_score: int = Field(ge=0, le=100, description="AI extraction confidence score between 0 and 100")
    source_gazette_reference: str = Field(description="Name or citation of the source gazette document")
    explicit_field_constraints: List[str] = Field(default_factory=list, description="List of explicit constraints found, e.g. ['Age must be 18-50 years', 'Income ceiling 2.5L']")

