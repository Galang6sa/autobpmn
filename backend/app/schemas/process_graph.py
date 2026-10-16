from typing import List, Optional, Literal
from pydantic import BaseModel, Field

# Tipe elemen BPMN 2.0 standar yang didukung oleh AutoBPMN
NodeType = Literal[
    "startEvent",
    "userTask",
    "serviceTask",
    "exclusiveGateway",
    "parallelGateway",
    "endEvent",
]


class Node(BaseModel):
    id: str = Field(
        ...,
        description="Pengidentifikasi unik untuk node (contoh: 'start_1', 'task_1', 'gw_1', 'end_1')",
        examples=["task_1"],
    )
    type: NodeType = Field(
        ...,
        description="Tipe elemen proses bisnis BPMN",
        examples=["userTask"],
    )
    name: str = Field(
        ...,
        description="Label deskriptif aktivitas atau nama gerbang keputusan",
        examples=["Verifikasi Kelengkapan Dokumen"],
    )
    actor: str = Field(
        default="System",
        description="Peran, divisi, atau sistem pelaksana tugas",
        examples=["Finance Admin"],
    )


class Edge(BaseModel):
    from_node: str = Field(
        ...,
        description="ID simpul asal (source node ID)",
        examples=["task_1"],
    )
    to_node: str = Field(
        ...,
        description="ID simpul tujuan (target node ID)",
        examples=["gw_1"],
    )
    condition: Optional[str] = Field(
        default=None,
        description="Kondisi logika percabangan jika berasal dari gateway (contoh: 'Lengkap', 'Tidak Lengkap')",
        examples=["Berkas Lengkap"],
    )


class AutoBPMNGraph(BaseModel):
    process_id: str = Field(
        ...,
        description="ID unik proses dalam format snake_case tanpa spasi",
        examples=["sop_verifikasi_tagihan_vendor"],
    )
    process_name: str = Field(
        ...,
        description="Nama judul SOP operasional proses bisnis",
        examples=["SOP Verifikasi Tagihan Vendor"],
    )
    actors: List[str] = Field(
        default_factory=list,
        description="Daftar seluruh entitas aktor/role yang terlibat dalam SOP",
        examples=[["Vendor", "Finance Admin", "Finance Manager", "Treasury"]],
    )
    nodes: List[Node] = Field(
        ...,
        description="Daftar simpul (start, tasks, gateways, end) dalam proses",
    )
    edges: List[Edge] = Field(
        ...,
        description="Daftar relasi berarah (sequence flows) antar-simpul",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "process_id": "sop_pengadaan_atk",
                "process_name": "SOP Pengadaan Alat Tulis Kantor",
                "actors": ["Staff Pemohon", "Kepala Bagian", "Vendor"],
                "nodes": [
                    {"id": "start_1", "type": "startEvent", "name": "Mulai Permintaan", "actor": "Staff Pemohon"},
                    {"id": "task_1", "type": "userTask", "name": "Isi Form Pengadaan", "actor": "Staff Pemohon"},
                    {"id": "gw_1", "type": "exclusiveGateway", "name": "Disetujui?", "actor": "Kepala Bagian"},
                    {"id": "task_2", "type": "userTask", "name": "Pemesanan Barang", "actor": "Kepala Bagian"},
                    {"id": "end_1", "type": "endEvent", "name": "Selesai", "actor": "Kepala Bagian"}
                ],
                "edges": [
                    {"from_node": "start_1", "to_node": "task_1"},
                    {"from_node": "task_1", "to_node": "gw_1"},
                    {"from_node": "gw_1", "to_node": "task_2", "condition": "Ya"},
                    {"from_node": "gw_1", "to_node": "end_1", "condition": "Tidak"},
                    {"from_node": "task_2", "to_node": "end_1"}
                ]
            }
        }
    }