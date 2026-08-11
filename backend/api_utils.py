from flask import current_app, jsonify


def get_store():
    return current_app.extensions["store"]


def json_response(payload, status_code=200):
    response = jsonify(payload)
    if status_code == 200:
        return response
    return response, status_code


def build_error_response(status_code, message, **payload):
    return json_response({
        "ok": False,
        "message": message,
        **payload,
    }, status_code)
