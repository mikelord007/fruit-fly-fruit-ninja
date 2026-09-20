# Data provenance

`data/circuit.json` is a compact anatomical subset of the **MaleCNS v1.0** connectome. The source annotation and pairwise connectivity tables come from the [official MaleCNS download page](https://male-cns.janelia.org/download/).

The source data are licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Credit: FlyEM at HHMI Janelia, University of Cambridge, MRC Laboratory of Molecular Biology, and Google Research. Exact source URLs, byte sizes, SHA-256 hashes, generation time, output hash, and counts are recorded in `data/provenance.json`.

The circuit uses the left hemisphere. It selects 192 `KCg-m_L` Kenyon cells with the largest raw contact counts onto `MBON11_L` (body 10704), retains every annotated left antennal-lobe projection neuron (`class == ALPN`) with a nonzero connection into those cells, and includes observed connections involving `PPL101_L` (11900) and reciprocal `APL_L` (10977) connectivity. All 192 selected KCs receive at least one retained ALPN input, and the extracted directed neuron pairs are unique. This is an output-biased anatomical sample: it enriches KCs strongly connected to MBON11 and should not be treated as a random or complete KC population.

`ALPN` is the source annotation's anatomical class, not a guarantee that every retained input is a uniglomerular, cholinergic olfactory channel. The retained set includes VP-family types that may carry temperature or humidity information and `ilPN`/`ivPN` types whose transmitter sign is not established by the annotation and pair-weight files used here. This extraction did not use a neurotransmitter table. A downstream model that treats every `pn_to_kc` edge as an excitatory odor input makes an explicit modeling assumption beyond these data.

Every edge `count` is the source table's pairwise raw synaptic contact count. Counts are anatomical observations, not physiological strengths, conductances, signs, or probabilities. The pair table has only `body_pre`, `body_post`, and `weight`; it contains no synapse coordinates or compartment locations. Neuron IDs are strings to preserve identifiers safely across JSON consumers.

The JSON and its provenance are copied byte-for-byte from the Fly Preference Learning project. Its MIT extraction utility is included as `tools/extract_data.py`; its notice is preserved in `THIRD_PARTY_LICENSE`. The kitchen does not import the smell-learning controller. Only PN-to-KC relations are used for its fixed feature transform; the other relations remain in the unchanged data for provenance.

To reproduce separately, install `requirements-extraction.txt`, put the two official Feather files in a `work` directory inside this project, then run from this project folder (the downloads are large and not needed to play):

```powershell
python tools/extract_data.py --annotations work/annotations.feather --weights work/weights.feather --output-dir work/regenerated --kc-count 192
```
