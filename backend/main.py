import uvicorn
import os
import uuid
import jwt
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
import shutil
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
import requests

load_dotenv()

app = FastAPI()

security = HTTPBearer()

# JWT Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

if not SUPABASE_JWT_SECRET:
    print("WARNING: SUPABASE_JWT_SECRET not set. JWT verification will fail!")

# Cache for JWKS
jwks_cache = None

def get_jwks():
    """Fetch JWKS from Supabase (cached)"""
    global jwks_cache
    if jwks_cache:
        return jwks_cache
    
    try:
        jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        response = requests.get(jwks_url, timeout=5)
        if response.status_code == 200:
            jwks_cache = response.json()
            return jwks_cache
    except Exception as e:
        print(f"[JWT] Failed to fetch JWKS: {e}")
    
    return None

async def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify JWT token from Supabase (supports both HS256 and RS256)
    """
    try:
        token = credentials.credentials
        
        # First, try to decode without verification to get the algorithm
        unverified_header = jwt.get_unverified_header(token)
        algorithm = unverified_header.get('alg', 'HS256')
        
        print(f"[JWT] Token algorithm: {algorithm}")
        
        # Try HS256 first (Legacy JWT Secret)
        if algorithm == 'HS256':
            try:
                payload = jwt.decode(
                    token,
                    SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    audience="authenticated"
                )
                print(f"[JWT] Verified with HS256: user_id={payload.get('sub')}")
                
                user_id = payload.get("sub")
                if not user_id:
                    raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
                
                return {
                    "user_id": user_id,
                    "role": payload.get("role"),
                    "email": payload.get("email")
                }
            except jwt.InvalidTokenError as e:
                print(f"[JWT] HS256 verification failed: {e}")
                raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
        
        # For RS256, try to get public key from JWKS
        elif algorithm == 'RS256':
            jwks = get_jwks()
            if not jwks:
                raise HTTPException(status_code=401, detail="Unable to fetch JWKS for RS256 verification")
            
            # Get the key ID from token header
            kid = unverified_header.get('kid')
            if not kid:
                raise HTTPException(status_code=401, detail="Token missing 'kid' header")
            
            # Find the matching key in JWKS
            key = None
            for jwk in jwks.get('keys', []):
                if jwk.get('kid') == kid:
                    key = jwk
                    break
            
            if not key:
                raise HTTPException(status_code=401, detail=f"Key ID '{kid}' not found in JWKS")
            
            # Convert JWK to PEM format for verification
            from jwt.algorithms import RSAAlgorithm
            public_key = RSAAlgorithm.from_jwk(key)
            
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                audience="authenticated"
            )
            print(f"[JWT] Verified with RS256: user_id={payload.get('sub')}")
            
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
            
            return {
                "user_id": user_id,
                "role": payload.get("role"),
                "email": payload.get("email")
            }
        
        # For ES256 (Elliptic Curve), get public key from JWKS
        elif algorithm == 'ES256':
            jwks = get_jwks()
            if not jwks:
                raise HTTPException(status_code=401, detail="Unable to fetch JWKS for ES256 verification")
            
            # Get the key ID from token header
            kid = unverified_header.get('kid')
            if not kid:
                raise HTTPException(status_code=401, detail="Token missing 'kid' header")
            
            # Find the matching key in JWKS
            key = None
            for jwk in jwks.get('keys', []):
                if jwk.get('kid') == kid:
                    key = jwk
                    break
            
            if not key:
                raise HTTPException(status_code=401, detail=f"Key ID '{kid}' not found in JWKS")
            
            # Convert JWK to PEM format for verification
            from jwt.algorithms import ECAlgorithm
            public_key = ECAlgorithm.from_jwk(key)
            
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["ES256"],
                audience="authenticated"
            )
            print(f"[JWT] Verified with ES256: user_id={payload.get('sub')}")
            
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
            
            return {
                "user_id": user_id,
                "role": payload.get("role"),
                "email": payload.get("email")
            }
        
        else:
            raise HTTPException(status_code=401, detail=f"Unsupported algorithm: {algorithm}")
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[JWT] Unexpected error: {e}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

async def verify_admin(user: dict = Depends(verify_jwt_token)):
    """
    Verify user is admin by checking profiles table
    """
    try:
        # Query profiles table to check role
        response = supabase.table('profiles').select('role').eq('id', user['user_id']).single().execute()
        
        if not response.data or response.data.get('role') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying admin status: {str(e)}")

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
async def upload_image(image: UploadFile = File(...), current_user: dict = Depends(verify_admin)):
    """
    Upload gambar ke folder library/items dan return URL-nya
    Requires admin authentication via JWT
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
async def delete_image(filename: str, current_user: dict = Depends(verify_admin)):
    """
    Delete image file from backend storage
    Requires admin authentication via JWT
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
async def delete_product(product_id: str, current_user: dict = Depends(verify_admin)):
    """
    Delete product dan cleanup image file
    Requires admin authentication via JWT
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
async def update_product(product_id: str, product_data: ProductUpdate, current_user: dict = Depends(verify_admin)):
    """
    Update product menggunakan REST API untuk menghindari race condition
    Requires admin authentication via JWT
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