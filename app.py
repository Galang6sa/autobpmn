# app.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import xml.etree.ElementTree as ET

app = FastAPI(title="AutoBPMN Engine API")

class Node(BaseModel):
    id: str
    type: str  # startEvent, userTask, exclusiveGateway, endEvent
    name: str
    actor: Optional[str] = "System"

class Edge(BaseModel):
    from_node: str
    to_node: str
    condition: Optional[str] = None

class ProcessGraph(BaseModel):
    process_id: str
    process_name: str
    nodes: List[Node]
    edges: List[Edge]

def validate_graph(graph: ProcessGraph):
    """Memverifikasi kebuntuan alur (dangling nodes, non-reachability)."""
    node_ids = {n.id for n in graph.nodes}
    sources = {e.from_node for e in graph.edges}
    targets = {e.to_node for e in graph.edges}
    
    # Validasi relasi node
    for edge in graph.edges:
        if edge.from_node not in node_ids or edge.to_node not in node_ids:
            raise ValueError(f"Edge merujuk pada node yang tidak terdefinisi: {edge}")

    # Validasi deadlock / node tak bertarget (selain endEvent)
    for node in graph.nodes:
        if node.type != "endEvent" and node.id not in sources:
            raise ValueError(f"Deadlock terdeteksi: Node '{node.name}' ({node.id}) tidak memiliki alur keluar.")
        if node.type != "startEvent" and node.id not in targets:
            raise ValueError(f"Orphan node terdeteksi: Node '{node.name}' ({node.id}) tidak dapat dicapai dari alur masuk.")
    return True

def generate_bpmn_xml(graph: ProcessGraph) -> str:
    """Mengonversi JSON Graph ke BPMN 2.0 XML standar industri."""
    bpmn_def = ET.Element("bpmn:definitions", {
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "xmlns:bpmn": "http://www.omg.org/spec/BPMN/20100524/MODEL",
        "xmlns:bpmndi": "http://www.omg.org/spec/BPMN/20100524/DI",
        "xmlns:dc": "http://www.omg.org/spec/DD/20100524/DC",
        "xmlns:di": "http://www.omg.org/spec/DD/20100524/DI",
        "id": "Definitions_AutoBPMN",
        "targetNamespace": "http://autobpmn.org/schema"
    })
    
    process = ET.SubElement(bpmn_def, "bpmn:process", {
        "id": graph.process_id,
        "name": graph.process_name,
        "isExecutable": "true"
    })
    
    # Render elemen node
    for node in graph.nodes:
        tag_name = f"bpmn:{node.type}"
        elem = ET.SubElement(process, tag_name, {"id": node.id, "name": node.name})
        # Hubungkan sequence flow masuk & keluar
        for idx, edge in enumerate(graph.edges):
            if edge.from_node == node.id:
                ET.SubElement(elem, "bpmn:outgoing").text = f"flow_{edge.from_node}_{edge.to_node}"
            if edge.to_node == node.id:
                ET.SubElement(elem, "bpmn:incoming").text = f"flow_{edge.from_node}_{edge.to_node}"

    # Render sequence flows (edges)
    for edge in graph.edges:
        flow_id = f"flow_{edge.from_node}_{edge.to_node}"
        flow_elem = ET.SubElement(process, "bpmn:sequenceFlow", {
            "id": flow_id,
            "sourceRef": edge.from_node,
            "targetRef": edge.to_node
        })
        if edge.condition:
            flow_elem.set("name", edge.condition)

    return ET.tostring(bpmn_def, encoding="utf-8", method="xml").decode("utf-8")

@app.post("/api/synthesize")
def synthesize_process(graph: ProcessGraph):
    try:
        validate_graph(graph)
        xml_result = generate_bpmn_xml(graph)
        return {"status": "success", "bpmn_xml": xml_result}
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))