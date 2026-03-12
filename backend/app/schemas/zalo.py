from pydantic import BaseModel

class ZaloPhoneRequest(BaseModel):
    token: str
    access_token: str
    tenant_id: int

class ZaloPhoneResponse(BaseModel):
    number: str
