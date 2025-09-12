from pydantic import BaseModel

class ZaloPhoneRequest(BaseModel):
    token: str
    access_token: str

class ZaloPhoneResponse(BaseModel):
    number: str
