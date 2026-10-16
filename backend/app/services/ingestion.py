import io
from fastapi import UploadFile, HTTPException
import pypdf

async def extract_text_from_file(file: UploadFile) -> str:
    """Membaca isi berkas PDF atau TXT dan mengembalikan teks mentah."""
    filename = file.filename.lower()
    content = await file.read()

    if filename.endswith(".txt"):
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            return content.decode("latin-1")

    elif filename.endswith(".pdf"):
        try:
            pdf_reader = pypdf.PdfReader(io.BytesIO(content))
            extracted_pages = []
            for idx, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                if page_text:
                    extracted_pages.append(page_text.strip())
            
            full_text = "\n\n".join(extracted_pages)
            if not full_text.strip():
                raise HTTPException(
                    status_code=400, 
                    detail="Berkas PDF tidak memuat teks yang dapat diekstraksi (mungkin berupa scan/gambar)."
                )
            return full_text
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Gagal memproses berkas PDF: {str(e)}")

    else:
        raise HTTPException(
            status_code=400, 
            detail="Format berkas tidak didukung. Harap unggah berkas .pdf atau .txt."
        )