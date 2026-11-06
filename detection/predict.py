import argparse

from ultralytics import YOLO

p = argparse.ArgumentParser()
p.add_argument("--weights", required=True)
p.add_argument("--source", required=True)  # image, folder, or video
p.add_argument("--imgsz", type=int, default=640)
p.add_argument("--conf", type=float, default=0.25)
p.add_argument("--device", default="0")
a = p.parse_args()

YOLO(a.weights).predict(source=a.source, imgsz=a.imgsz, conf=a.conf, device=a.device, save=True, save_txt=True, save_conf=True)
