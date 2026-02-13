from pydantic import BaseModel


class UserPayload(BaseModel):
    model_config = {"extra": "ignore"}

    sub: str
    email: str | None = None
    role: str
    exp: int
    iss: str | None = None
    aud: str
