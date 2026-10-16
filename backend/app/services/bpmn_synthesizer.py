import xml.etree.ElementTree as ET
from app.schemas.process_graph import AutoBPMNGraph

def generate_bpmn_xml(graph: AutoBPMNGraph) -> str:
    """Mengonversi AutoBPMNGraph menjadi string BPMN 2.0 XML standar industri."""
    
    # Root definitions
    bpmn_def = ET.Element("bpmn:definitions", {
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "xmlns:bpmn": "http://www.omg.org/spec/BPMN/20100524/MODEL",
        "xmlns:bpmndi": "http://www.omg.org/spec/BPMN/20100524/DI",
        "xmlns:dc": "http://www.omg.org/spec/DD/20100524/DC",
        "xmlns:di": "http://www.omg.org/spec/DD/20100524/DI",
        "id": f"Definitions_{graph.process_id}",
        "targetNamespace": "http://autobpmn.org/schema"
    })

    # Elemen Process
    process = ET.SubElement(bpmn_def, "bpmn:process", {
        "id": graph.process_id,
        "name": graph.process_name,
        "isExecutable": "true"
    })

    # Pemetaan elemen Node
    for node in graph.nodes:
        tag_name = f"bpmn:{node.type}"
        node_attrib = {
            "id": node.id,
            "name": node.name
        }
        
        elem = ET.SubElement(process, tag_name, node_attrib)

        # Tambahkan Sequence Flow Ref masuk & keluar
        for edge in graph.edges:
            flow_id = f"flow_{edge.from_node}_{edge.to_node}"
            if edge.from_node == node.id:
                ET.SubElement(elem, "bpmn:outgoing").text = flow_id
            if edge.to_node == node.id:
                ET.SubElement(elem, "bpmn:incoming").text = flow_id

    # Pemetaan Sequence Flow (Edges)
    for edge in graph.edges:
        flow_id = f"flow_{edge.from_node}_{edge.to_node}"
        flow_attrib = {
            "id": flow_id,
            "sourceRef": edge.from_node,
            "targetRef": edge.to_node
        }
        if edge.condition:
            flow_attrib["name"] = edge.condition

        ET.SubElement(process, "bpmn:sequenceFlow", flow_attrib)

    # Serialisasi ke XML dengan deklarasi UTF-8
    xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_string = ET.tostring(bpmn_def, encoding="utf-8", method="xml").decode("utf-8")
    
    return xml_declaration + xml_string