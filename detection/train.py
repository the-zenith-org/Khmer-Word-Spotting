import argparse
from pathlib import Path

from ultralytics import YOLO

from utils import DEFAULT_DATA, make_data_yaml

ROOT = Path(__file__).resolve().parents[1]

p = argparse.ArgumentParser()
p.add_argument("--data-dir", default=DEFAULT_DATA)
p.add_argument("--model", default="yolov8l.pt")  # paper baseline; try yolo11l.pt
p.add_argument("--epochs", type=int, default=100)
p.add_argument("--imgsz", type=int, default=640)  # paper baseline; raise (e.g. 1024) if small words are missed
p.add_argument("--batch", type=int, default=16)
p.add_argument("--device", default="0")
p.add_argument("--name", default="khmer_word_det")
a = p.parse_args()

YOLO(a.model).train(
    data=make_data_yaml(a.data_dir),
    epochs=a.epochs,
    imgsz=a.imgsz,
    batch=a.batch,
    device=a.device,
    project=str(ROOT / "models"),
    name=a.name,
)
