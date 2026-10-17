"""
PIXLE.AI backend
----------------
FastAPI server that connects the PIXLE.AI frontend to the Groq API.

Setup:
    pip install fastapi uvicorn pydantic python-dotenv groq
    echo GROQ_API_KEY=your_key_here > .env
    uvicorn main:app --reload

Then open http://127.0.0.1:8000
"""

import logging
import os
from pathlib import Path

import groq
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from groq import AsyncGroq
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
load_dotenv()  # Reads GROQ_API_KEY (and optional overrides) from the .env file

BASE_DIR = Path(__file__).resolve().parent
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Personality and ground rules sent with every request
SYSTEM_PROMPT = (
    "You are PIXLE.AI, a helpful, friendly and concise AI assistant. "
    "Answer clearly and accurately. Use Markdown code blocks for code. "
    "If you are unsure about something, say so instead of guessing."
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger("pixle-ai")

if not GROQ_API_KEY:
    logger.warning("GROQ_API_KEY is not set. Add it to your .env file.")

# Async client so a slow AI response never blocks other requests
client = AsyncGroq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# ---------------------------------------------------------------------------
# App + CORS
# ---------------------------------------------------------------------------
app = FastAPI(title="PIXLE.AI", version="1.0.0")

# Allow the frontend to call the API from any origin (local development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    """Body sent by the frontend: { "message": "..." }"""
    message: str = Field(..., min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    """Body returned to the frontend: { "reply": "..." }"""
    reply: str


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------
@app.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    """Send the user's message to Groq and return the model's reply."""
    user_message = payload.message.strip()
    if not user_message:
        raise HTTPException(status_code=422, detail="Message cannot be empty.")

    if client is None:
        raise HTTPException(
            status_code=500,
            detail="Server is missing GROQ_API_KEY. Add it to the .env file.",
        )

    try:
        completion = await client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        bot_reply = (completion.choices[0].message.content or "").strip()
        if not bot_reply:
            bot_reply = "I couldn't generate a response. Please try again."
        return ChatResponse(reply=bot_reply)

    # Map Groq errors to clear HTTP errors for the frontend
    except groq.AuthenticationError:
        logger.error("Groq rejected the API key.")
        raise HTTPException(status_code=401, detail="Invalid Groq API key.")
    except groq.RateLimitError:
        raise HTTPException(status_code=429, detail="Rate limit reached. Try again shortly.")
    except groq.APIConnectionError:
        raise HTTPException(status_code=503, detail="Could not reach the Groq API.")
    except groq.APIStatusError as exc:
        logger.error("Groq API error %s: %s", exc.status_code, exc.message)
        raise HTTPException(status_code=502, detail=f"Groq API error ({exc.status_code}).")
    except Exception:
        logger.exception("Unexpected error in /chat")
        raise HTTPException(status_code=500, detail="Something went wrong on the server.")


# ---------------------------------------------------------------------------
# Frontend serving
# ---------------------------------------------------------------------------
@app.get("/", include_in_schema=False)
async def serve_index() -> FileResponse:
    """Serve the chat interface."""
    index_path = BASE_DIR / "index.html"
    if not index_path.is_file():
        raise HTTPException(status_code=404, detail="index.html not found next to main.py.")
    return FileResponse(index_path)


class FrontendStaticFiles(StaticFiles):
    """
    Serves frontend assets from the current directory, but only safe file types.
    Because the folder also holds main.py and .env, anything that is not a
    web asset returns 404 so secrets and source code are never exposed.
    """

    ALLOWED_SUFFIXES = {
        ".css", ".js", ".map", ".png", ".jpg", ".jpeg", ".gif",
        ".svg", ".webp", ".ico", ".woff", ".woff2",
    }

    async def get_response(self, path, scope):
        if Path(path).suffix.lower() not in self.ALLOWED_SUFFIXES:
            raise HTTPException(status_code=404)
        return await super().get_response(path, scope)


# Mounted last so the "/" and "/chat" routes above take priority
app.mount("/", FrontendStaticFiles(directory=BASE_DIR), name="static")


# ---------------------------------------------------------------------------
# Run directly with: python main.py
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
