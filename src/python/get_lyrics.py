import sys, json
from syrics.api import Spotify

if len(sys.argv) < 3:
    print(json.dumps({"error": "Usage: get_lyrics.py <track_id> <sp_dc>"}))
    sys.exit(1)

track_id = sys.argv[1]
sp_dc = sys.argv[2]

try:
    sp = Spotify(sp_dc)
    lyrics = sp.get_lyrics(track_id)
    print(json.dumps(lyrics))
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
