from flask import Blueprint
from flask import jsonify

kunden_bp = Blueprint("kunden", __name__)

@kunden_bp.route("/api/kunden")
def kunden():

    return jsonify([

        {
            "id":1,
            "firma":"Müller GmbH"
        },

        {
            "id":2,
            "firma":"Meier AG"
        }

    ])