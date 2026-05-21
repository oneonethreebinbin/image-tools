"""
AI 去水印后端服务
基于 LaMa (Large Mask Inpainting) 模型 — SOTA 图像修复
对半透明文字/Logo 水印效果最佳，速度与质量平衡

启动方式: python server.py
API 地址: http://localhost:8765
"""

import io
import base64
import traceback
from contextlib import asynccontextmanager

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# --- 全局模型实例 ---
lama_model = None

def load_model():
    """加载 LaMa 模型（首次启动时自动下载约 200MB 权重文件）"""
    global lama_model
    try:
        from simple_lama_inpainting import SimpleLama
        print("[模型] 正在加载 LaMa 模型...")
        lama_model = SimpleLama()
        print("[模型] LaMa 模型加载完成！")
    except ImportError:
        print("[错误] simple-lama-inpainting 未安装，请运行: pip install simple-lama-inpainting")
        raise
    except Exception as e:
        print(f"[错误] 模型加载失败: {e}")
        raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时加载模型"""
    load_model()
    yield


app = FastAPI(
    title="AI 去水印服务",
    description="基于 LaMa 模型的智能水印去除 API",
    version="1.0.0",
    lifespan=lifespan,
)

# 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- 健康检查 ---
@app.get("/api/health")
async def health_check():
    """检查服务状态"""
    return {
        "status": "ok",
        "model": "LaMa (Large Mask Inpainting)",
        "model_loaded": lama_model is not None,
    }


# --- 去水印接口 ---
@app.post("/api/remove-watermark")
async def remove_watermark(
    image: UploadFile = File(..., description="原始图片"),
    mask: UploadFile = File(..., description="遮罩图片（白色=需去除区域，黑色=保留区域）"),
):
    """
    AI 智能去水印

    - **image**: 原始图片文件（支持 JPEG/PNG/WebP/BMP）
    - **mask**: 遮罩图片，白色区域将被 AI 修复，黑色区域保持不变
       遮罩必须与原始图片尺寸一致！

    返回: base64 编码的处理后图片
    """
    if lama_model is None:
        raise HTTPException(status_code=503, detail="模型尚未加载完成，请稍后重试")

    try:
        # 读取图片
        image_bytes = await image.read()
        mask_bytes = await mask.read()

        # 验证文件
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="图片文件为空")
        if len(mask_bytes) == 0:
            raise HTTPException(status_code=400, detail="遮罩文件为空")

        # 转换为 PIL Image
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        mask_img = Image.open(io.BytesIO(mask_bytes)).convert("L")  # 灰度

        # 验证尺寸
        if img.size != mask_img.size:
            # 自动调整遮罩尺寸以匹配原图
            mask_img = mask_img.resize(img.size, Image.LANCZOS)
            print(f"[提示] 遮罩尺寸已自动调整: {mask_img.size}")

        print(f"[处理] 图片尺寸: {img.size}, 开始 AI 修复...")

        # 调用 LaMa 模型进行修复
        result = lama_model(img, mask_img)

        print(f"[处理] AI 修复完成！")

        # 转换为 base64 返回
        buffer = io.BytesIO()
        result.save(buffer, format="PNG")
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return JSONResponse({
            "success": True,
            "image_base64": img_base64,
            "format": "png",
            "width": result.width,
            "height": result.height,
        })

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")


@app.post("/api/remove-watermark-by-coords")
async def remove_watermark_by_coords(
    image: UploadFile = File(..., description="原始图片"),
    x: int = Form(..., description="选中区域 X 坐标（原图坐标）"),
    y: int = Form(..., description="选中区域 Y 坐标（原图坐标）"),
    width: int = Form(..., description="选中区域宽度（原图坐标）"),
    height: int = Form(..., description="选中区域高度（原图坐标）"),
    padding: int = Form(default=5, description="向外扩展的像素数，增加边缘效果"),
):
    """
    AI 去水印（坐标模式）

    前端传递框选坐标，后端自动生成遮罩并修复。
    坐标应为原始图片（非缩略图）上的坐标。
    """
    if lama_model is None:
        raise HTTPException(status_code=503, detail="模型尚未加载完成，请稍后重试")

    try:
        image_bytes = await image.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="图片文件为空")

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_w, img_h = img.size

        # 扩展选中区域（带 padding，增加修复质量）
        x1 = max(0, x - padding)
        y1 = max(0, y - padding)
        x2 = min(img_w, x + width + padding)
        y2 = min(img_h, y + height + padding)

        # 创建遮罩（白色=修复区域）
        mask = Image.new("L", img.size, 0)  # 全黑
        mask_np = np.array(mask)
        mask_np[y1:y2, x1:x2] = 255  # 选中区域设为白色
        mask = Image.fromarray(mask_np)

        print(f"[处理] 图片: {img.size}, 修复区域: ({x1},{y1}) → ({x2},{y2})")

        # LaMa 修复
        result = lama_model(img, mask)

        # 返回 base64
        buffer = io.BytesIO()
        result.save(buffer, format="PNG")
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return JSONResponse({
            "success": True,
            "image_base64": img_base64,
            "format": "png",
            "width": result.width,
            "height": result.height,
            "region": {"x": x1, "y": y1, "width": x2 - x1, "height": y2 - y1},
        })

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")


# --- 启动 ---
if __name__ == "__main__":
    print("=" * 60)
    print("  🖌️  AI 去水印服务 - LaMa 模型")
    print("  API 地址: http://localhost:8765")
    print("  API 文档: http://localhost:8765/docs")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8765, log_level="info")
