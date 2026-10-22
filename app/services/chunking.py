from langchain_text_splitters import RecursiveCharacterTextSplitter

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=150,
    length_function=len,
    add_start_index=True,
)


def chunkPages(pages: list[dict]) -> list[dict]:
    chunks = []

    for page in pages:
        page_number = page["page"]
        text = page["text"].strip()

        if not text:
            continue

        split_chunks = text_splitter.create_documents(
            texts=[text],
            metadatas=[{"page": page_number}],
        )

        for chunk in split_chunks:
            chunks.append({
                "page": chunk.metadata["page"],
                "start_index": chunk.metadata["start_index"],
                "text": chunk.page_content,
            })

    return chunks