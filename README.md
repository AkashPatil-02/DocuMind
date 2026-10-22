# DocuMind 🧠

**A document intelligence API built with FastAPI, LangChain, Ollama, and ChromaDB.**

DocuMind is an ongoing project to build a Retrieval-Augmented Generation (RAG) system that allows users to upload PDF documents and retrieve relevant information through semantic search.

The current implementation focuses on the document ingestion and retrieval pipeline, providing the foundation for question answering over uploaded documents.

## 🚀 Current Features

- **PDF Upload:** Upload PDF documents through a FastAPI endpoint.
- **Text Extraction:** Extract page-wise text from PDFs using PyMuPDF.
- **Text Chunking:** Split extracted text into manageable chunks using LangChain's `RecursiveCharacterTextSplitter`.
- **Embeddings:** Generate vector embeddings locally using Ollama and `mxbai-embed-large`.
- **Vector Storage:** Store document chunks and their metadata in a persistent ChromaDB collection.
- **Semantic Search:** Retrieve relevant chunks based on the semantic similarity of a query.
- **Document-Specific Search:** Filter search results by document using a unique UUID assigned during upload.
- **Global Search:** Search across all indexed documents without specifying a document ID.
- **REST API:** Expose ingestion and retrieval functionality through FastAPI endpoints.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Python | Core programming language |
| FastAPI | REST API framework |
| PyMuPDF | PDF text extraction |
| LangChain | Text splitting and retrieval integration |
| Ollama | Local embedding generation |
| `mxbai-embed-large` | Embedding model |
| ChromaDB | Persistent vector database |
| Pydantic | Request validation |
| Uvicorn | ASGI development server |

## 🏗️ Current Pipeline

```text
PDF Upload
    ↓
Text Extraction (PyMuPDF)
    ↓
Page-wise Text Processing
    ↓
Recursive Text Chunking
    ↓
Embedding Generation (Ollama)
    ↓
Persistent Vector Storage (ChromaDB)
    ↓
Semantic Retrieval
    ↓
Relevant Text Chunks + Metadata
```

## 📡 API Endpoints


### `POST /documents`

Uploads a PDF, extracts its text, chunks the content, and indexes the resulting chunks in ChromaDB.

**Request:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | PDF file | The document to upload and index |

**Example response**

```json
{
  "message": "Document indexed successfully",
  "sourceId": "generated-document-uuid",
  "fileName": "example.pdf",
  "pages": 12,
  "chunkCount": 35
}
```

The values above are illustrative. The actual page and chunk counts depend on the uploaded document.

Save the returned `sourceId` to search within that specific document.

### `POST /search`

Performs semantic search across all indexed documents.

**Example request**

```json
{
  "question": "What is a REST API?",
  "k": 5,
  "source_id": "your-document-uuid-here"  -- optional
}
```

search endpoint returns matching text chunks along with their metadata, including page numbers and document identifiers.

> Note: The API currently retrieves relevant text chunks. Generating natural-language answers from those chunks with an LLM is a planned extension.

## ⚙️ Getting Started

### Prerequisites

- Python 3.11 or newer, subject to dependency compatibility
- [Ollama](https://ollama.com/)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/DocuMind.git
cd DocuMind
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Create and activate a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate
```

On Windows:

```powershell
.venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Pull the embedding model

```bash
ollama pull mxbai-embed-large
```

Ensure Ollama is installed and running before using the API.

### 5. Start the API

If your `main.py` is inside the `app/` directory:

```bash
cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

The API will be available at:

- API root: `http://localhost:8080/`
- Interactive Swagger documentation: `http://localhost:8080/docs`
- ReDoc documentation: `http://localhost:8080/redoc`

## 🗂️ Project Structure

The current project is organized around separate services for ingestion, chunking, and vector operations.

```text
DocuMind/
├── app/
│   ├── main.py
│   └── services/
│       ├── ingestion.py
│       ├── chunking.py
│       └── vectorize.py
├── .venv/
├── .gitignore
├── requirements.txt
└── README.md
```

This is a representative structure; adjust it to match the actual files in your repository. The virtual environment should be excluded from version control.

## 🔒 Current Limitations

- Retrieval returns text chunks rather than generated answers.
- Scanned PDFs without an extractable text layer are not currently supported through OCR.
- Document management features such as listing, deleting, and re-indexing documents are not yet complete.
- Authentication and per-user document access controls are not implemented.
- Search quality depends on the embedding model, chunking strategy, and document content.
- The API is currently intended for development and experimentation, not production deployment.

## 🗺️ Roadmap

- [ ] Generate contextual answers using a local LLM.
- [ ] Add source citations and page references to generated answers.
- [ ] Improve document lifecycle management.
- [ ] Add support for multiple file formats.
- [ ] Introduce conversational follow-up questions.
- [ ] Build a frontend for document upload and question answering.
- [ ] Add automated tests for ingestion, chunking, and retrieval.
- [ ] Add authentication and document-level access controls.
- [ ] Improve deployment and production configuration.

## 🎯 Project Goal

The goal of DocuMind is to develop a practical document intelligence system while exploring the core components of a RAG architecture: document processing, embedding generation, vector storage, semantic retrieval, and eventually grounded LLM-powered question answering.

This project is actively under development.

## 📄 License

A license has not yet been selected. Licensing will be added in a future update.
