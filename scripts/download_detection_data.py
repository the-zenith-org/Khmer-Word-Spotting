"""Download the Kaggle detection dataset into data/khmer-detection (YOLO layout)."""
import shutil
from pathlib import Path

import kagglehub

dst = Path(__file__).resolve().parents[1] / "data" / "khmer-detection"
src = Path(kagglehub.dataset_download("emhengly/khmer-text-detection-dataset"))
shutil.copytree(src, dst, dirs_exist_ok=True)
print(dst)
