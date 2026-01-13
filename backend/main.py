import uvicorn
import os
import uuid
import secrets
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
import shutil
from pathlib import Path
from pydantic import BaseModel
from typing import Optional

load_dotenv()

app = FastAPI()

security = HTTPBasic()

BASIC_AUTH_USERNAME = os.environ.get("BASIC_AUTH_USERNAME", "admin")
BASIC_AUTH_PASSWORD = os.environ.get("BASIC_AUTH_PASSWORD", "password123")

def get_current_user(credentials: HTTPBasicCredentials = Depends(security)):
    """
    Verify basic auth credentials
    """
    is_correct_username = secrets.compare_digest(credentials.username, BASIC_AUTH_USERNAME)
    is_correct_password = secrets.compare_digest(credentials.password, BASIC_AUTH_PASSWORD)
    
    if not (is_correct_username and is_correct_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mendaftarkan Folder Assets
# Membuat folder 'assets' otomatis jika belum ada di direktori project
folders = ["library/assets", "library/items"]
for folder in folders:
    if not os.path.exists(folder):
        os.makedirs(folder)

# 'Mount' folder fisik 'assets' ke path URL '/assets'
# Ini yang bikin getAsset("logo.png") di Next.js bisa jalan
app.mount("/library", StaticFiles(directory="library"), name="library")

# 4. Inisialisasi Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    print("Peringatan: SUPABASE_URL atau SUPABASE_ANON_KEY belum diatur di .env")
else:
    supabase: Client = create_client(url, key)

# 5. Pydantic models untuk request/response
class ProductUpdate(BaseModel):
    name: str
    price: float
    description: Optional[str] = ""
    stock: int
    vehicle_type: Optional[str] = None
    item_type: Optional[str] = None

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "JAWS Custom API is Running",
        "storage_mode": "Local Assets"
    }

@app.post("/upload-image")
async def upload_image(image: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    """
    Upload gambar ke folder library/items dan return URL-nya
    """
    try:
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File harus berupa gambar")
        
        file_extension = Path(image.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        upload_path = Path("library/items") / unique_filename
        
        # Simpan file
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        base_url = os.environ.get("BACKEND_BASE_URL", "http://localhost:8000")
        image_url = f"{base_url}/library/items/{unique_filename}"
        
        return {
            "message": "Image uploaded successfully",
            "image_url": image_url,
            "filename": unique_filename
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")

@app.delete("/delete-image/{filename}")
async def delete_image(filename: str, current_user: str = Depends(get_current_user)):
    """
    Delete image file from backend storage
    """
    try:
        file_path = Path("library/items") / filename
        
        if file_path.exists():
            file_path.unlink()
            return {
                "success": True,
                "message": f"Image {filename} deleted successfully"
            }
        else:
            return {
                "success": False,
                "message": f"Image {filename} not found"
            }
            
    except Exception as e:
        print(f"Error deleting image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting image: {str(e)}")

@app.delete("/delete-product/{product_id}")
async def delete_product(product_id: str, current_user: str = Depends(get_current_user)):
    """
    Delete product dan cleanup image file
    """
    try:
        print(f"Deleting product {product_id}")
        
        product_response = supabase.table('products').select('*').eq('id', product_id).execute()
        
        if not product_response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product = product_response.data[0]
        image_url = product.get('image_url', '')
        
        delete_response = supabase.table('products').delete().eq('id', product_id).execute()
        
        if not delete_response.data:
            raise HTTPException(status_code=404, detail="Failed to delete product from database")
        
        if image_url:
            try:
                filename = image_url.split('/library/items/')[-1]
                file_path = Path("library/items") / filename
                
                if file_path.exists():
                    file_path.unlink()
                    print(f"Image file {filename} deleted successfully")
                else:
                    print(f"Image file {filename} not found, skipping")
                    
            except Exception as img_error:
                print(f"Error deleting image file: {str(img_error)}")
        
        return {
            "success": True,
            "message": "Product and associated image deleted successfully",
            "data": delete_response.data[0] if delete_response.data else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting product: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting product: {str(e)}")

@app.put("/update-product/{product_id}")
async def update_product(product_id: str, product_data: ProductUpdate, current_user: str = Depends(get_current_user)):
    """
    Update product menggunakan REST API untuk menghindari race condition
    """
    try:
        print(f"Updating product {product_id} with data: {product_data.dict()}")
        
        if not product_data.name.strip():
            raise HTTPException(status_code=400, detail="Nama produk tidak boleh kosong")
        
        if product_data.price <= 0:
            raise HTTPException(status_code=400, detail="Harga harus lebih dari 0")
        
        if product_data.stock < 0:
            raise HTTPException(status_code=400, detail="Stock tidak boleh negatif")
        
        response = supabase.table('products').update({
            'name': product_data.name.strip(),
            'price': product_data.price,
            'description': product_data.description.strip() if product_data.description else '',
            'stock': product_data.stock,
            'vehicle_type': product_data.vehicle_type,
            'item_type': product_data.item_type
        }).eq('id', product_id).execute()
        
        if response.data:
            print(f"Update successful: {response.data}")
            return {
                "success": True,
                "message": "Product updated successfully",
                "data": response.data[0] if response.data else None
            }
        else:
            raise HTTPException(status_code=404, detail="Product not found")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating product: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating product: {str(e)}")

if __name__ == "__main__":
    server_port = int(os.environ.get("SERVER_PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=server_port,
        reload=True
    )