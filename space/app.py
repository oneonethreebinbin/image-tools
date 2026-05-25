import io
import base64
import traceback
from contextlib import asynccontextmanager

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

lama_model = None


def load_model():
    global lama_model
    from simple_lama_inpainting import SimpleLama
    print("[model] loading LaMa ...")
    lama_model = SimpleLama()
    print("[model] LaMa ready")


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    yield


app = FastAPI(
    title="AI Watermark Remover",
    description="LaMa-based watermark removal API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "model": "LaMa (Large Mask Inpainting)",
        "model_loaded": lama_model is not None,
    }


@app.post("/api/remove-watermark")
async def remove_watermark(
    image: UploadFile = File(...),
    mask: UploadFile = File(...),
):
    if lama_model is None:
        raise HTTPException(status_code=503, detail="model not loaded yet")

    image_bytes = await image.read()
    mask_bytes = await mask.read()

    if not image_bytes or not mask_bytes:
        raise HTTPException(status_code=400, detail="empty file")

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    mask_img = Image.open(io.BytesIO(mask_bytes)).convert("L")

    if img.size != mask_img.size:
        mask_img = mask_img.resize(img.size, Image.LANCZOS)

    result = lama_model(img, mask_img)

    buf = io.BytesIO()
    result.save(buf, format="PNG")
    buf.seek(0)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    return JSONResponse({
        "success": True,
        "image_base64": b64,
        "format": "png",
        "width": result.width,
        "height": result.height,
    })


@app.post("/api/remove-watermark-by-coords")
async def remove_watermark_by_coords(
    image: UploadFile = File(...),
    x: int = Form(...),
    y: int = Form(...),
    width: int = Form(...),
    height: int = Form(...),
    padding: int = Form(default=5),
):
    if lama_model is None:
        raise HTTPException(status_code=503, detail="model not loaded yet")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="empty file")

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    iw, ih = img.size

    x1, y1 = max(0, x - padding), max(0, y - padding)
    x2, y2 = min(iw, x + width + padding), min(ih, y + height + padding)

    mask = Image.new("L", img.size, 0)
    mask_arr = np.array(mask)
    mask_arr[y1:y2, x1:x2] = 255
    mask = Image.fromarray(mask_arr)

    result = lama_model(img, mask)

    buf = io.BytesIO()
    result.save(buf, format="PNG")
    buf.seek(0)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    return JSONResponse({
        "success": True,
        "image_base64": b64,
        "format": "png",
        "width": result.width,
        "height": result.height,
        "region": {"x": x1, "y": y1, "width": x2 - x1, "height": y2 - y1},
    })
