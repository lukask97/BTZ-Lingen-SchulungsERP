from flask import current_app, jsonify, session


def get_store(table_name=None):
    return current_app.extensions["store_manager"].get_store(table_name, session.get("active_class_db"))


def get_common_store():
    return current_app.extensions["store_manager"].get_common_store()


def get_store_manager():
    return current_app.extensions["store_manager"]


def get_article_image_store():
    return current_app.extensions["article_image_store"]


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
