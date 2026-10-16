from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional
import json

from app.schemas.pipeline import TextInputRequest, PipelineResponse, ValidationReport
from app.schemas.process_graph import AutoBPMNGraph
from app.services.ingestion import extract_text_from_file
from app.services.extractor import extract_sop_to_graph
from app.services.validator import validate_process_graph
from app.services.bpmn_synthesizer import generate_bpmn_xml

router = APIRouter(prefix="/pipeline", tags=["Pipeline"])

@router.post("/process-text", response_model=PipelineResponse)
async def process_sop_text(payload: TextInputRequest):
    """
    Pipeline lengkap dari teks narasi SOP mentah:
    Ekstraksi LLM -> Validasi Graf -> Sintesis BPMN 2.0 XML
    """
    # 1. Extraction (LLM -> Structured JSON Graph)
    try:
        graph: AutoBPMNGraph = extract_sop_to_graph(payload.text_content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gagal melakukan ekstraksi LLM: {str(e)}"
        )

    # 2. Validation (Verifikasi Logika Graf & Integritas Alur)
    val_result = validate_process_graph(graph)
    if not val_result["is_valid"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Validasi graf gagal: terdeteksi cacat logika",
                "errors": val_result
            }
        )

    # 3. Synthesis (Intermediate Graph -> BPMN 2.0 XML)
    try:
        bpmn_xml = generate_bpmn_xml(graph)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal mensintesis BPMN XML: {str(e)}"
        )

    return PipelineResponse(
        process_id=graph.process_id,
        process_name=graph.process_name,
        validation=ValidationReport(**val_result),
        intermediate_graph=graph,
        bpmn_xml=bpmn_xml
    )

@router.post("/process-file", response_model=PipelineResponse)
async def process_sop_file(file: UploadFile = File(...)):
    """
    Pipeline lengkap dari berkas dokumen (PDF/TXT):
    File Parsing (Ingestion) -> Ekstraksi LLM -> Validasi Graf -> Sintesis BPMN 2.0 XML
    """
    # 0. Ingestion (Baca berkas menjadi teks mentah)
    raw_text = await extract_text_from_file(file)
    if len(raw_text.strip()) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Berkas tidak memuat teks SOP yang cukup untuk diproses."
        )

    # Lanjutkan ke alur parsing teks
    return await process_sop_text(TextInputRequest(title=file.filename, text_content=raw_text))