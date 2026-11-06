"""Pull training outputs from the school Jupyter into models/khmer_word_det. Run on the laptop (Tailscale on).

    python scripts/pull_weights.py            # once
    python scripts/pull_weights.py --watch 10 # repeat every 10 min while training
"""
import argparse
import shutil
import time
import urllib.error
import urllib.request
from pathlib import Path

HOST = 'http://100.84.224.107:9090'
FILES = ['weights/best.pt', 'weights/last.pt', 'results.csv', 'results.png', 'BoxPR_curve.png',
         'BoxF1_curve.png', 'confusion_matrix.png', 'args.yaml']
DST = Path(__file__).resolve().parents[1] / 'models' / 'khmer_word_det'

p = argparse.ArgumentParser()
p.add_argument('--token', default='khmer2026')
p.add_argument('--watch', type=float, default=0, help='minutes between pulls; 0 = once')
a = p.parse_args()


def pull():
    for f in FILES:
        out = DST / f
        tmp = out.parent / (out.name + '.part')  # shortcut: last.pt can be mid-write on the server, rerun if it fails to load
        out.parent.mkdir(parents=True, exist_ok=True)
        print('get ', f, flush=True)
        try:
            r = urllib.request.urlopen(f'{HOST}/files/khmer-models/khmer_word_det/{f}?token={a.token}', timeout=60)
        except urllib.error.HTTPError as e:
            print('skip', f, e.code, flush=True)
            continue
        except OSError as e:
            raise SystemExit(f'cannot reach {HOST}: {e}')
        with r, open(tmp, 'wb') as w:
            shutil.copyfileobj(r, w)
        tmp.replace(out)
        print('ok  ', f, f'{out.stat().st_size / 1e6:.1f} MB', flush=True)


while True:
    pull()
    if not a.watch:
        break
    time.sleep(a.watch * 60)
