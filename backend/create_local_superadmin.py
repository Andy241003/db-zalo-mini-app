from app.db.session_local import SessionLocal
from app.crud.crud_admin_users import crud_admin_user
from app.schemas.admin_users import AdminUserCreate


def main():
    username = "superadmin"
    email = "admin@hotel-saas.com"
    password = "admin123"

    db = SessionLocal()
    try:
        existing = crud_admin_user.get_by_username(db, username=username)
        if existing:
            print(f"⚠️  User '{username}' already exists (id={existing.id}).")
            return

        obj = AdminUserCreate(username=username, email=email, password=password, role="super_admin", tenant_id=None)
        user = crud_admin_user.create(db, obj_in=obj, created_by="init_script")
        print("✅ Superadmin created:")
        print(f"   username: {username}")
        print(f"   password: {password}")
        print(f"   id: {user.id}")
    except Exception as e:
        print("❌ Error creating user:", e)
    finally:
        db.close()


if __name__ == '__main__':
    main()
