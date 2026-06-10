import uuid
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field

Kind = Literal["task", "event", "outing"]

class ItemCreate(BaseModel):
    kind: Kind
    title: str
    description: str | None = None
    status: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    meta: dict = Field(default_factory=dict)

class ItemUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    meta: dict | None = None

class CreatorOut(BaseModel):
    id: uuid.UUID
    display_name: str
    class Config:
        from_attributes = True

class ItemOut(BaseModel):
    id: uuid.UUID
    kind: str
    title: str
    description: str | None
    status: str | None
    start_at: datetime | None
    end_at: datetime | None
    meta: dict
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
    creator: CreatorOut
