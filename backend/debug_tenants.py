#!/usr/bin/env python
from app.db.session_local import SessionLocal
from app.models.models import TblTenants

db = SessionLocal()
tenants = db.query(TblTenants).all()
print(f"Tenants found: {len(tenants)}")

if tenants:
    t = tenants[0]
    print(f"First tenant fields: {t.__dict__}")
else:
    print("No tenants in database")

db.close()
