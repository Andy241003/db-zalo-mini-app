from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional, List
import os
import uuid
from datetime import datetime
import shutil
from pathlib import Path

from app.core.deps import get_db, get_current_admin_user
from app.core.config import settings
from app.models.models import TblAdminUsers

router = APIRouter()

# Allowed file extensions
ALLOWED_EXTENSIONS = {
    'image': {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'},
    'video': {'.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'},
    'document': {'.pdf', '.doc', '.docx', '.txt', '.xlsx', '.xls'}
}

# Maximum file size (in bytes)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename: str, file_type: str = 'image') -> bool:
    """Check if the uploaded file has allowed extension"""
    if '.' not in filename:
        return False
    
    extension = '.' + filename.rsplit('.', 1)[1].lower()
    return extension in ALLOWED_EXTENSIONS.get(file_type, set())

def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename to prevent conflicts"""
    file_extension = os.path.splitext(original_filename)[1]
    unique_id = str(uuid.uuid4())
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{timestamp}_{unique_id}{file_extension}"

@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    folder: str = Form("general"),
    current_user: TblAdminUsers = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Upload image file
    folder options: rooms, facilities, merchants, general
    """
    try:
        # Validate file type
        if not allowed_file(file.filename, 'image'):
            raise HTTPException(status_code=400, detail="File type not allowed. Only images are accepted.")
        
        # Check file size
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
        
        # Create directory structure
        tenant_folder = f"tenant_{current_user.tenant_id}" if current_user.tenant_id else "global"
        upload_dir = Path(settings.UPLOAD_DIR) / tenant_folder / folder / "images"
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        unique_filename = generate_unique_filename(file.filename)
        file_path = upload_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
        
        # Return file URL
        file_url = f"/uploads/{tenant_folder}/{folder}/images/{unique_filename}"
        
        return {
            "success": True,
            "message": "File uploaded successfully",
            "data": {
                "filename": unique_filename,
                "original_filename": file.filename,
                "url": file_url,
                "size": len(contents),
                "uploaded_by": current_user.username,
                "uploaded_at": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/upload/video")
async def upload_video(
    file: UploadFile = File(...),
    folder: str = Form("general"),
    current_user: TblAdminUsers = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Upload video file
    """
    try:
        # Validate file type
        if not allowed_file(file.filename, 'video'):
            raise HTTPException(status_code=400, detail="File type not allowed. Only videos are accepted.")
        
        # Check file size (larger limit for videos - 50MB)
        contents = await file.read()
        if len(contents) > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")
        
        # Create directory structure
        tenant_folder = f"tenant_{current_user.tenant_id}" if current_user.tenant_id else "global"
        upload_dir = Path(settings.UPLOAD_DIR) / tenant_folder / folder / "videos"
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        unique_filename = generate_unique_filename(file.filename)
        file_path = upload_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
        
        # Return file URL
        file_url = f"/uploads/{tenant_folder}/{folder}/videos/{unique_filename}"
        
        return {
            "success": True,
            "message": "Video uploaded successfully",
            "data": {
                "filename": unique_filename,
                "original_filename": file.filename,
                "url": file_url,
                "size": len(contents),
                "uploaded_by": current_user.username,
                "uploaded_at": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/upload/multiple")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    folder: str = Form("general"),
    file_type: str = Form("image"),
    current_user: TblAdminUsers = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Upload multiple files at once
    """
    try:
        if len(files) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 files allowed per upload.")
        
        uploaded_files = []
        errors = []
        
        for file in files:
            try:
                # Validate file type
                if not allowed_file(file.filename, file_type):
                    errors.append(f"{file.filename}: File type not allowed")
                    continue
                
                # Check file size
                contents = await file.read()
                max_size = 50 * 1024 * 1024 if file_type == 'video' else MAX_FILE_SIZE
                if len(contents) > max_size:
                    errors.append(f"{file.filename}: File too large")
                    continue
                
                # Create directory structure
                tenant_folder = f"tenant_{current_user.tenant_id}" if current_user.tenant_id else "global"
                upload_dir = Path(f"uploads/{tenant_folder}/{folder}/{file_type}s")
                upload_dir.mkdir(parents=True, exist_ok=True)
                
                # Generate unique filename
                unique_filename = generate_unique_filename(file.filename)
                file_path = upload_dir / unique_filename
                
                # Save file
                with open(file_path, "wb") as buffer:
                    buffer.write(contents)
                
                # Add to successful uploads
                file_url = f"/uploads/{tenant_folder}/{folder}/{file_type}s/{unique_filename}"
                uploaded_files.append({
                    "filename": unique_filename,
                    "original_filename": file.filename,
                    "url": file_url,
                    "size": len(contents)
                })
                
            except Exception as e:
                errors.append(f"{file.filename}: {str(e)}")
        
        return {
            "success": True,
            "message": f"Uploaded {len(uploaded_files)} files successfully",
            "data": {
                "uploaded_files": uploaded_files,
                "errors": errors,
                "uploaded_by": current_user.username,
                "uploaded_at": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multiple upload failed: {str(e)}")

@router.delete("/upload/delete")
async def delete_file(
    file_url: str,
    current_user: TblAdminUsers = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete uploaded file
    """
    try:
        # Extract file path from URL
        if file_url.startswith("/uploads/"):
            file_path = Path(file_url[1:])  # Remove leading slash
        else:
            raise HTTPException(status_code=400, detail="Invalid file URL")
        
        # Check if file exists
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        # Check if user has permission (can only delete files from their tenant)
        if current_user.tenant_id:
            expected_tenant_folder = f"tenant_{current_user.tenant_id}"
            if expected_tenant_folder not in str(file_path):
                raise HTTPException(status_code=403, detail="No permission to delete this file")
        
        # Delete file
        file_path.unlink()
        
        return {
            "success": True,
            "message": "File deleted successfully",
            "data": {
                "deleted_file": file_url,
                "deleted_by": current_user.username,
                "deleted_at": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

@router.get("/upload/list")
async def list_uploaded_files(
    folder: str = "general",
    file_type: str = "image",
    current_user: TblAdminUsers = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    List uploaded files in a folder
    """
    try:
        tenant_folder = f"tenant_{current_user.tenant_id}" if current_user.tenant_id else "global"
        upload_dir = Path(f"uploads/{tenant_folder}/{folder}/{file_type}s")
        
        if not upload_dir.exists():
            return {
                "success": True,
                "message": "No files found",
                "data": {
                    "files": [],
                    "total": 0
                }
            }
        
        files = []
        for file_path in upload_dir.iterdir():
            if file_path.is_file():
                stat = file_path.stat()
                files.append({
                    "filename": file_path.name,
                    "url": f"/uploads/{tenant_folder}/{folder}/{file_type}s/{file_path.name}",
                    "size": stat.st_size,
                    "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
        
        # Sort by creation time (newest first)
        files.sort(key=lambda x: x['created_at'], reverse=True)
        
        return {
            "success": True,
            "message": "Files retrieved successfully",
            "data": {
                "files": files,
                "total": len(files),
                "folder": folder,
                "file_type": file_type
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"List files failed: {str(e)}")
