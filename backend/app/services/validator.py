from collections import defaultdict, deque
from typing import Dict, Any, List
from app.schemas.process_graph import AutoBPMNGraph

def validate_process_graph(graph: AutoBPMNGraph) -> Dict[str, Any]:
    issues: List[str] = []
    deadlocks: List[str] = []
    orphan_nodes: List[str] = []

    node_map = {n.id: n for n in graph.nodes}
    node_ids = set(node_map.keys())

    # 1. Validasi Keberadaan Start dan End Event
    start_nodes = [n for n in graph.nodes if n.type == "startEvent"]
    end_nodes = [n for n in graph.nodes if n.type == "endEvent"]

    if not start_nodes:
        issues.append("Proses tidak memiliki 'startEvent'.")
    if not end_nodes:
        issues.append("Proses tidak memiliki 'endEvent'.")

    # Inisialisasi struktur graf
    adj_out = defaultdict(list)
    adj_in = defaultdict(list)

    for edge in graph.edges:
        if edge.from_node not in node_ids:
            issues.append(f"Edge merujuk 'from_node' yang tidak terdefinisi: {edge.from_node}")
        if edge.to_node not in node_ids:
            issues.append(f"Edge merujuk 'to_node' yang tidak terdefinisi: {edge.to_node}")

        adj_out[edge.from_node].append(edge.to_node)
        adj_in[edge.to_node].append(edge.from_node)

    # 2. Deteksi Deadlock & Orphan Nodes
    for node in graph.nodes:
        # Deadlock: Bukan endEvent, tetapi tidak memiliki alur keluar
        if node.type != "endEvent" and len(adj_out[node.id]) == 0:
            deadlocks.append(node.id)
            issues.append(f"Deadlock pada node '{node.name}' ({node.id}): tidak ada alur keluar.")

        # Orphan: Bukan startEvent, tetapi tidak dapat dijangkau dari alur masuk manapun
        if node.type != "startEvent" and len(adj_in[node.id]) == 0:
            orphan_nodes.append(node.id)
            issues.append(f"Orphan node '{node.name}' ({node.id}): tidak memiliki alur masuk.")

    # 3. Reachability Check (BFS dari Start Event menuju End Event)
    if start_nodes and end_nodes:
        visited = set()
        queue = deque([s.id for s in start_nodes])
        while queue:
            curr = queue.popleft()
            if curr not in visited:
                visited.add(curr)
                for neighbor in adj_out[curr]:
                    if neighbor not in visited:
                        queue.append(neighbor)

        unreachable = node_ids - visited
        for unreach_id in unreachable:
            node_name = node_map[unreach_id].name
            if unreach_id not in orphan_nodes:
                issues.append(f"Node '{node_name}' ({unreach_id}) tidak dapat dicapai dari Start Event.")

    is_valid = len(issues) == 0

    return {
        "is_valid": is_valid,
        "issues": issues,
        "deadlocks": deadlocks,
        "orphan_nodes": orphan_nodes
    }