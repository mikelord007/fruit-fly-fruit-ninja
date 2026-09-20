#!/usr/bin/env python3
"""Extract a compact, one-hemisphere mushroom-body circuit from MaleCNS v1.0.

The 1 GB edge table is scanned as Arrow IPC record batches. It is never loaded
as one Python or Arrow table. Requires pyarrow; pandas is not used.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import pyarrow as pa
import pyarrow.compute as pc
import pyarrow.feather as feather
import pyarrow.ipc as ipc


RELEASE = "MaleCNS v1.0"
ANNOTATION_URL = "https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/flat-connectome/body-annotations-male-cns-v1.0-minconf-0.5.feather"
WEIGHTS_URL = "https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/flat-connectome/connectome-weights-male-cns-v1.0-minconf-0.5.feather"
MBON_ID, PPL1_ID, APL_ID = 10704, 11900, 10977


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def batches(path: Path):
    source = pa.memory_map(str(path), "r")
    reader = ipc.open_file(source)
    expected_names = ["body_pre", "body_post", "weight"]
    if reader.schema.names != expected_names:
        raise ValueError(f"Unexpected edge schema: expected {expected_names}, got {reader.schema.names}")
    if any(reader.schema.field(name).type != pa.int64() for name in expected_names):
        raise ValueError(f"Unexpected edge types: expected three int64 columns, got {reader.schema}")
    for index in range(reader.num_record_batches):
        yield reader.get_batch(index)


def ids_where(table: pa.Table, expression) -> set[int]:
    return set(table.filter(expression)["bodyId"].to_pylist())


def append_matches(out: list[dict], batch: pa.RecordBatch, pre_ids: set[int], post_ids: set[int], relation: str) -> None:
    if not pre_ids or not post_ids:
        return
    pre = batch.column(0)
    post = batch.column(1)
    mask = pc.and_(pc.is_in(pre, value_set=pa.array(sorted(pre_ids))), pc.is_in(post, value_set=pa.array(sorted(post_ids))))
    indices = pc.indices_nonzero(mask)
    if len(indices) == 0:
        return
    selected = pc.take(batch, indices)
    for a, b, count in zip(selected.column(0).to_pylist(), selected.column(1).to_pylist(), selected.column(2).to_pylist()):
        out.append({"pre": str(a), "post": str(b), "count": int(count), "relation": relation})


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--annotations", type=Path, required=True)
    parser.add_argument("--weights", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--kc-count", type=int, default=192)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    columns = ["bodyId", "type", "instance", "somaSide", "class", "superclass", "status"]
    annotations = feather.read_table(args.annotations, columns=columns, memory_map=True)
    kc_candidates = ids_where(
        annotations,
        pc.and_(pc.equal(annotations["type"], "KCg-m"), pc.equal(annotations["somaSide"], "L")),
    )
    left_alpns = ids_where(
        annotations,
        pc.and_(pc.equal(annotations["class"], "ALPN"), pc.equal(annotations["somaSide"], "L")),
    )

    # First pass: rank gamma-main KCs by their observed contact count onto MBON11.
    kc_to_mbon: dict[int, int] = {}
    for batch in batches(args.weights):
        mask = pc.and_(
            pc.is_in(batch.column(0), value_set=pa.array(sorted(kc_candidates))),
            pc.equal(batch.column(1), MBON_ID),
        )
        selected = pc.take(batch, pc.indices_nonzero(mask))
        for pre, count in zip(selected.column(0).to_pylist(), selected.column(2).to_pylist()):
            kc_to_mbon[int(pre)] = int(count)
    selected_kcs = set(k for k, _ in sorted(kc_to_mbon.items(), key=lambda item: (-item[1], item[0]))[: args.kc_count])
    if not selected_kcs:
        raise RuntimeError("No KCg-m_L -> MBON11_L connections were found")

    # Second pass: retain raw pairwise contact counts for the modeled motifs.
    edges: list[dict] = []
    for batch in batches(args.weights):
        append_matches(edges, batch, left_alpns, selected_kcs, "pn_to_kc")
        append_matches(edges, batch, selected_kcs, {MBON_ID}, "kc_to_mbon")
        append_matches(edges, batch, {PPL1_ID}, selected_kcs, "ppl1_to_kc")
        append_matches(edges, batch, {APL_ID}, selected_kcs, "apl_to_kc")
        append_matches(edges, batch, selected_kcs, {APL_ID}, "kc_to_apl")

    connected_pns = {int(edge["pre"]) for edge in edges if edge["relation"] == "pn_to_kc"}
    pn_innervated_kcs = {int(edge["post"]) for edge in edges if edge["relation"] == "pn_to_kc"}
    if pn_innervated_kcs != selected_kcs:
        missing = sorted(selected_kcs - pn_innervated_kcs)
        raise RuntimeError(f"Selected KCs without retained ALPN input: {missing}")
    directed_pairs = [(edge["pre"], edge["post"]) for edge in edges]
    if len(directed_pairs) != len(set(directed_pairs)):
        raise RuntimeError("Duplicate directed neuron pairs found in extracted edge set")
    neuron_ids = selected_kcs | connected_pns | {MBON_ID, PPL1_ID, APL_ID}
    by_id = {int(row["bodyId"]): row for row in annotations.filter(pc.is_in(annotations["bodyId"], value_set=pa.array(sorted(neuron_ids)))).to_pylist()}
    roles = {MBON_ID: "output", PPL1_ID: "teaching", APL_ID: "feedback_inhibition"}
    neurons = []
    for neuron_id in sorted(neuron_ids):
        row = by_id[neuron_id]
        role = roles.get(neuron_id, "kenyon_cell" if neuron_id in selected_kcs else "projection_neuron")
        neurons.append({
            "id": str(neuron_id), "type": row["type"], "instance": row["instance"],
            "side": row["somaSide"], "role": role,
        })
    edges.sort(key=lambda edge: (edge["relation"], int(edge["pre"]), int(edge["post"])))
    relation_counts = {name: sum(edge["relation"] == name for edge in edges) for name in sorted({edge["relation"] for edge in edges})}
    circuit = {
        "schema_version": "1.0",
        "dataset": {"name": RELEASE, "side": "L", "edge_measure": "raw_synaptic_contact_count"},
        "selection": {
            "kc_annotation": {"type": "KCg-m", "somaSide": "L"},
            "pn_annotation": {"class": "ALPN", "somaSide": "L"},
            "method": "top KCg-m_L cells by descending raw KC-to-MBON11_L contact count; all connected ALPN_L inputs retained",
            "requested_kc_count": args.kc_count,
            "candidate_kc_count": len(kc_candidates),
            "selected_kc_count": len(selected_kcs),
            "selection_bias": "Enriches KCs strongly connected to MBON11 and is not a random or complete KC population.",
            "pn_scope_note": "ALPN is a source-native anatomical class. It includes projection-neuron types whose sensory modality and transmitter/sign are not resolved by the two extracted source tables; it must not be read as a guarantee of purely olfactory, cholinergic input.",
        },
        "neurons": neurons,
        "edges": edges,
        "summary": {"neuron_count": len(neurons), "projection_neuron_count": len(connected_pns), "edge_count": len(edges), "edges_by_relation": relation_counts},
    }
    (args.output_dir / "circuit.json").write_text(json.dumps(circuit, separators=(",", ":")), encoding="utf-8")

    provenance = {
        "schema_version": "1.0",
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "release": RELEASE,
        "official_download_page": "https://male-cns.janelia.org/download/",
        "license": {"name": "Creative Commons Attribution 4.0 International", "spdx": "CC-BY-4.0", "url": "https://creativecommons.org/licenses/by/4.0/"},
        "attribution": "FlyEM at HHMI Janelia, University of Cambridge, MRC Laboratory of Molecular Biology, and Google Research",
        "sources": [
            {"role": "annotations", "url": ANNOTATION_URL, "filename": args.annotations.name, "bytes": args.annotations.stat().st_size, "sha256": sha256(args.annotations)},
            {"role": "connectome_weights", "url": WEIGHTS_URL, "filename": args.weights.name, "bytes": args.weights.stat().st_size, "sha256": sha256(args.weights)},
        ],
        "edge_semantics": "weight is the MaleCNS pairwise raw synaptic contact count; it is not a physiological strength, conductance, sign, or probability. This pair table contains only body_pre, body_post, and weight, so it has no synapse coordinates or compartment locations.",
        "interpretation_limits": "The retained class=ALPN population includes VP-family and ilPN/ivPN types. Sensory modality and neurotransmitter/sign were not checked from a neurotransmitter or synapse-location table. Any model that treats all pn_to_kc edges as excitatory odor channels adds an explicit modeling assumption not established by this extraction.",
        "reproduce": "python tools/extract_data.py --annotations ../../work/annotations.feather --weights ../../work/weights.feather --output-dir data --kc-count 192",
        "output": {"file": "circuit.json", "sha256": sha256(args.output_dir / "circuit.json"), **circuit["summary"]},
    }
    (args.output_dir / "provenance.json").write_text(json.dumps(provenance, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
