from pathlib import Path

import yaml

DEFAULT_DATA = Path(__file__).resolve().parents[1] / "data" / "khmer-detection"


def make_data_yaml(data_dir: Path) -> str:
    """Write an absolute-path data.yaml (Ultralytics resolves relative paths against its own datasets dir)."""
    data_dir = Path(data_dir).resolve()
    for sub in ("images/train", "images/val"):
        if not (data_dir / sub).is_dir():
            raise SystemExit(f"missing {data_dir / sub}; expected YOLO layout images/{{train,val,test}}, labels/{{train,val,test}}")
    cfg = {
        "path": data_dir.as_posix(),
        "train": "images/train",
        "val": "images/val",
        "names": {0: "khmer_word"},
    }
    if (data_dir / "images/test").is_dir():
        cfg["test"] = "images/test"
    out = data_dir / "data.yaml"
    out.write_text(yaml.safe_dump(cfg, sort_keys=False))
    return str(out)
