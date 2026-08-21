import json
from queue import Empty, Queue
from threading import Lock

from flask import Blueprint, Response, stream_with_context

events_bp = Blueprint("events", __name__, url_prefix="/api")

_subscribers: set[Queue] = set()
_subscribers_lock = Lock()


def _format_sse(event_name, payload):
    body = json.dumps(payload, ensure_ascii=True)
    return f"event: {event_name}\ndata: {body}\n\n"


def publish_event(event_name, payload):
    with _subscribers_lock:
        subscribers = list(_subscribers)

    for subscriber in subscribers:
        subscriber.put((event_name, payload))


@events_bp.get("/events")
def stream_events():
    subscriber = Queue()

    with _subscribers_lock:
        _subscribers.add(subscriber)

    def event_stream():
        try:
            while True:
                try:
                    event_name, payload = subscriber.get(timeout=15)
                    yield _format_sse(event_name, payload)
                except Empty:
                    yield ": keepalive\n\n"
        finally:
            with _subscribers_lock:
                _subscribers.discard(subscriber)

    response = Response(stream_with_context(event_stream()), mimetype="text/event-stream")
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"
    return response
