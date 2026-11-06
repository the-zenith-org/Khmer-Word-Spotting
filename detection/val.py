import argparse

from ultralytics import YOLO

from utils import DEFAULT_DATA, make_data_yaml

p = argparse.ArgumentParser()
p.add_argument("--weights", required=True)
p.add_argument("--data-dir", default=DEFAULT_DATA)
p.add_argument("--split", default="test", choices=["val", "test"])
p.add_argument("--imgsz", type=int, default=640)
p.add_argument("--device", default="0")
a = p.parse_args()

m = YOLO(a.weights).val(data=make_data_yaml(a.data_dir), split=a.split, imgsz=a.imgsz, device=a.device, iou=0.5)
print(f"P={m.box.mp:.3f} R={m.box.mr:.3f} mAP50={m.box.map50:.3f}")
