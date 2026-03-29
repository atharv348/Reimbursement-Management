from pydantic import BaseModel
from typing import Dict, Any

class RuleCreate(BaseModel):
    name: str
    rule_type: str
    config: Dict[str, Any]

class RuleOut(RuleCreate):
    id: int
    company_id: int
    is_active: bool

    class Config:
        from_attributes = True
