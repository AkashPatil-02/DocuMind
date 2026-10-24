from uuid import uuid4
from fastapi import FastAPI, File, UploadFile, HTTPException
from services.ingestion import extractPages
from services.chunking import chunkPages
from services.vectorize import (get_vector_store,retrieve,vectorize,reset_db)
from models.search import SearchRequest 
from models.ask import AskRequest
from services.olllama import (llm, prompt)

app = FastAPI(title="DocuMind API")
db = get_vector_store()

@app.get("/")
def health():
    return {"health": "ok"}


@app.post("/documents")
async def upload_document(file: UploadFile = File(...)):
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
    print(source_id)

    vectorize(chunks, db, source_id=source_id)
    
    return {
        "message": "Document indexed successfully",
        "sourceId": source_id,
        "fileName": file.filename,
        "pages": len(pages),
        "chunkCount": len(chunks),
    }

@app.post("/search")
def search_documents(request: SearchRequest):
    print(request)
    results = retrieve(
        request.question,
        db,
        k=request.k,
    )
    print(results)
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
async def getResponse(request: AskRequest):
    results = retrieve(
        request.question,
        db,
        k=request.k,
    )
    print("results:\n")
    print(results)
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