import chromadb
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from chromadb.config import Settings


DB_LOCATION = "./chroma_langchain_db"
COLLECTION_NAME = "pdf_extracts"

embeddings = OllamaEmbeddings(model="mxbai-embed-large")


client = chromadb.PersistentClient(
    path="./chroma_langchain_db",
    settings=Settings(allow_reset=True)
)

def reset_db():
    client.reset()
    return {"status":"complete"}

def get_vector_store() ->Chroma:
    return Chroma(
        collection_name=COLLECTION_NAME,
        persist_directory=DB_LOCATION,
        embedding_function=embeddings,
        client=client
    )


def vectorize(
    chunks: list[dict], vector_store: Chroma, source_id: str = "document",)->None:
    documents = []
    ids = []

    for chunk in chunks:
        page = chunk["page"]
        start_index = chunk["start_index"]

        document = Document(
            page_content=chunk["text"],
            metadata={
                "page": page,
                "start_index": start_index,
                "source": source_id,
            },
        )
        
        documents.append(document)
        ids.append(f"{source_id}:{page}:{start_index}")

    if documents:
        vector_store.add_documents(documents=documents, ids=ids)


def retrieve(
    question: str, vector_store: Chroma, k: int = 5, source_id: str | None = None) -> list[Document]:
    
    search_kwargs = {"k": k}
     
    if source_id is not None:
        search_kwargs["filter"] = {
            "source": source_id
        }
    retriever = vector_store.as_retriever(
        search_kwargs=search_kwargs
    )

    return retriever.invoke(question)