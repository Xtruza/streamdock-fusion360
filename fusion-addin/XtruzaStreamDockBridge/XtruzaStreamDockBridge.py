"""Xtruza StreamDock bridge for Autodesk Fusion.

The HTTP server runs on a background thread. Fusion API calls are marshalled
onto Fusion's main thread through a CustomEvent, as required by the API.
"""
import adsk.core
import json
import os
import secrets
import threading
import traceback
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

EVENT_ID = 'com.xtruza.streamdock.fusion360.execute'
BRIDGE_DIR = Path.home() / '.xtruza' / 'streamdock-fusion360'
BRIDGE_FILE = BRIDGE_DIR / 'bridge.json'
DEFAULT_PORT = 32188

_app = None
_ui = None
_event = None
_server = None
_server_thread = None
_token = None
_handlers = []
_pending = {}
_pending_lock = threading.Lock()


class ExecuteCommandHandler(adsk.core.CustomEventHandler):
    def notify(self, args):
        request_id = ''
        try:
            request_id = json.loads(args.additionalInfo)['requestId']
            with _pending_lock:
                request = _pending.get(request_id)
            if not request:
                return
            command_id = request['commandId']
            command = _ui.commandDefinitions.itemById(command_id)
            if not command:
                raise ValueError(f'Fusion command not found: {command_id}')
            if not command.execute():
                raise RuntimeError(f'Fusion did not execute command: {command_id}')
            request['result'] = {'ok': True, 'commandId': command_id}
        except Exception as error:
            if request_id:
                with _pending_lock:
                    request = _pending.get(request_id)
                if request:
                    request['result'] = {'ok': False, 'error': str(error)}
        finally:
            if request_id:
                with _pending_lock:
                    request = _pending.get(request_id)
                if request:
                    request['done'].set()


class BridgeRequestHandler(BaseHTTPRequestHandler):
    server_version = 'XtruzaFusionBridge/0.1'

    def log_message(self, _format, *_args):
        return

    def _send(self, status, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def _authorized(self):
        return secrets.compare_digest(self.headers.get('X-Xtruza-Token', ''), _token or '')

    def do_GET(self):
        if not self._authorized():
            return self._send(401, {'error': 'Unauthorized'})
        if self.path == '/v1/health':
            return self._send(200, {'status': 'ok', 'version': '0.1.0', 'application': 'Fusion'})
        self._send(404, {'error': 'Not found'})

    def do_POST(self):
        if not self._authorized():
            return self._send(401, {'error': 'Unauthorized'})
        if self.path != '/v1/commands/execute':
            return self._send(404, {'error': 'Not found'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length < 2 or length > 4096:
                raise ValueError('Invalid request size')
            payload = json.loads(self.rfile.read(length).decode('utf-8'))
            command_id = payload.get('commandId', '')
            if not isinstance(command_id, str) or not command_id or len(command_id) > 160:
                raise ValueError('Invalid commandId')
            request_id = str(uuid.uuid4())
            request = {'commandId': command_id, 'done': threading.Event(), 'result': None}
            with _pending_lock:
                _pending[request_id] = request
            if not _app.fireCustomEvent(EVENT_ID, json.dumps({'requestId': request_id})):
                raise RuntimeError('Fusion rejected the custom event')
            if not request['done'].wait(2.5):
                raise TimeoutError('Fusion command timed out')
            result = request['result'] or {'ok': False, 'error': 'No result'}
            self._send(200 if result.get('ok') else 422, result)
        except Exception as error:
            self._send(400, {'error': str(error)})
        finally:
            if 'request_id' in locals():
                with _pending_lock:
                    _pending.pop(request_id, None)


def _write_bridge_file(port):
    BRIDGE_DIR.mkdir(parents=True, exist_ok=True)
    payload = {'port': port, 'token': _token, 'pid': os.getpid(), 'version': '0.1.0'}
    BRIDGE_FILE.write_text(json.dumps(payload, indent=2), encoding='utf-8')
    try:
        os.chmod(BRIDGE_FILE, 0o600)
    except OSError:
        pass


def run(_context):
    global _app, _ui, _event, _server, _server_thread, _token
    try:
        _app = adsk.core.Application.get()
        _ui = _app.userInterface
        _token = secrets.token_urlsafe(32)
        _event = _app.registerCustomEvent(EVENT_ID)
        handler = ExecuteCommandHandler()
        _event.add(handler)
        _handlers.append(handler)
        _server = ThreadingHTTPServer(('127.0.0.1', DEFAULT_PORT), BridgeRequestHandler)
        _server.daemon_threads = True
        _write_bridge_file(_server.server_port)
        _server_thread = threading.Thread(target=_server.serve_forever, name='XtruzaFusionBridge', daemon=True)
        _server_thread.start()
    except Exception:
        if _ui:
            _ui.messageBox('Xtruza StreamDock Bridge failed to start:\n' + traceback.format_exc())


def stop(_context):
    global _server, _server_thread, _event
    if _server:
        _server.shutdown()
        _server.server_close()
        _server = None
    if _server_thread:
        _server_thread.join(timeout=2)
        _server_thread = None
    if _event and _app:
        _app.unregisterCustomEvent(EVENT_ID)
        _event = None
    _handlers.clear()
    with _pending_lock:
        _pending.clear()
    try:
        BRIDGE_FILE.unlink(missing_ok=True)
    except OSError:
        pass
