import pymupdf

def extractPages(pdf_bytes:bytes)->list[dict]:
    pages=[]
    
    with pymupdf.open(stream=pdf_bytes,filetype='pdf') as doc:
        for page_number, page in enumerate(doc,start=1):
            text =page.get_text("text", sort=True).strip()
            
            if text:
                pages.append({
                    "page":page_number,
                    "text":text
                })
    return pages