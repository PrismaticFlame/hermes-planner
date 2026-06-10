import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models import User, Item
from ..auth.router import get_current_user
from .schemas import ItemCreate, ItemUpdate, ItemOut, Kind
from ..realtime import broadcaster

router = APIRouter(prefix="/items", tags=["items"])

@router.post("", response_model=ItemOut, status_code=201)
async def create_item(data: ItemCreate, db: AsyncSession = Depends(get_db),
                      user: User = Depends(get_current_user)):
    item = Item(**data.model_dump(), creator=user)
    db.add(item)
    await db.commit()
    await broadcaster.publish({"type": "items_changed"})
    await db.refresh(item, ["created_at", "updated_at", "creator"])
    return item

@router.get("", response_model=list[ItemOut])
async def list_items(kind: Kind | None = Query(default=None),
                     db: AsyncSession = Depends(get_db),
                     user: User = Depends(get_current_user)):
    query = select(Item).order_by(Item.created_at.desc())
    if kind:
        query = query.where(Item.kind == kind)
    result = await db.scalars(query)
    return result.all()

@router.get("/{item_id}", response_model=ItemOut)
async def get_item(item_id: uuid.UUID, db: AsyncSession = Depends(get_db),
                   user: User = Depends(get_current_user)):
    item = await db.get(Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.patch("/{item_id}", response_model=ItemOut)
async def update_item(item_id: uuid.UUID, data: ItemUpdate,
                      db: AsyncSession = Depends(get_db),
                      user: User = Depends(get_current_user)):
    item = await db.get(Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.created_by != user.id:
        raise HTTPException(status_code=403, detail="Not your item")  # only the creator can edit
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    await db.commit()
    await broadcaster.publish({"type": "items_changed"})
    await db.refresh(item, ["updated_at"])
    return item

@router.delete("/{item_id}", status_code=204)
async def delete_item(item_id: uuid.UUID, db: AsyncSession = Depends(get_db),
                      user: User = Depends(get_current_user)):
    item = await db.get(Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.created_by != user.id:
        raise HTTPException(status_code=403, detail="Not your item")  # only the creator can delete
    await db.delete(item)
    await db.commit()
    await broadcaster.publish({"type": "items_changed"})