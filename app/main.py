from uuid import uuid4
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session
from services.ingestion import extractPages
from services.chunking import chunkPages
from services.vectorize import (get_vector_store,retrieve,vectorize,reset_db)
from models.search import SearchRequest 
from models.ask import AskRequest
from services.olllama import (llm, prompt)
from database import get_db
from models.user import User
from models.document import Document
from auth.utils import get_current_user
from api.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="DocuMind API")
app.include_router(auth_router)
db = get_vector_store()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"health": "ok"}


@app.post("/documents")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db)
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Not a PDF file",
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="File is empty",
        )

    try:
        pages = extractPages(content)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Unable to extract PDF content",
        ) from exc

    if not pages:
        raise HTTPException(
            status_code=422,
            detail="No extractable text found",
        )

    chunks = chunkPages(pages)
    source_id = str(uuid4())

    vectorize(chunks, db    , source_id=source_id, user_id=current_user.id)
    
    new_doc = Document(
        user_id=current_user.id,
        source_id=source_id,
        filename=file.filename,
        pages=len(pages),
        chunk_count=len(chunks)
    )
    session.add(new_doc)
    session.commit()
    session.refresh(new_doc)
    
    return {
        "message": "Document indexed successfully",
        "sourceId": source_id,
        "fileName": file.filename,
        "pages": len(pages),
        "chunkCount": len(chunks),
    }

@app.get("/documents")
def list_documents(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db)
):
    documents = (
        session.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.uploaded_at.desc())
        .all()
    )
    return {
        "documents": [
            {
                "id": doc.id,
                "sourceId": doc.source_id,
                "fileName": doc.filename,
                "pages": doc.pages,
                "chunkCount": doc.chunk_count,
                "uploadedAt": doc.uploaded_at,
            }
            for doc in documents
        ]
    }


@app.post("/search")
async def search_documents(
    request: SearchRequest,
    current_user: User = Depends(get_current_user)
):
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="user not authenticated")
    results = retrieve(
        request.question,
        db,
        k=request.k,
        user_id=current_user.id
    )
    return {
        "question": request.question,
        "resultCount": len(results),
        "results": [
            {
                "content": result.page_content,
                "metadata": result.metadata,
            }
            for result in results
        ],
    }
    
    
@app.post("/ask")
async def getResponse(
    request: AskRequest,
    current_user: User = Depends(get_current_user)
):
    results = retrieve(
        request.question,
        db,
        k=request.k,
        user_id=current_user.id,
        source_id=request.source_id        
    )
    if not results:
        return {
            "question": request.question,
            "answer": (
                "I couldn't find relevant information "
                "in the indexed documents."
            ),
            "sources": [],
        }
    
    context = "\n\n".join(
        f"Page {result.metadata.get('page', 'unknown')}:\n"
        f"{result.page_content}"
        for result in results
    )
    
    chain = prompt | llm
    
    response = chain.invoke({
        "context": context,
        "question": request.question,
    })
    
    return {
        "question": request.question,
        "answer": response.content,
        "sources": [
            {
                "page": result.metadata.get("page"),
                "source_id": result.metadata.get("source"),
                "content": result.page_content,
            }
            for result in results
        ],
    }
    
@app.delete("/reset_db")
def reset():
    status = reset_db()
    if status["status"]!="complete":
        raise HTTPException(status_code=500,detail="Failed to reset")
    
    return{
        "message":"DB reset complete"
    }