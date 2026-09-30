"""Serve this teaching app on localhost using the Python standard library."""
from __future__ import annotations

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript; charset=utf-8",
        ".mjs": "text/javascript; charset=utf-8",
        ".R": "text/plain; charset=utf-8",
        ".md": "text/plain; charset=utf-8",
        ".css": "text/css; charset=utf-8",
    }
    isolated = True

    def end_headers(self):
        if self.isolated:
            self.send_header("Cross-Origin-Opener-Policy", "same-origin")
            self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description="WebR teaching app (localhost only)")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--no-isolation", action="store_true", help="Test PostMessage fallback")
    args = parser.parse_args()
    Handler.isolated = not args.no_isolation
    root = Path(__file__).resolve().parent
    server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(Handler, directory=str(root)))
    print(f"WebR: http://127.0.0.1:{args.port}/", flush=True)
    print("Stop: Ctrl+C", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
