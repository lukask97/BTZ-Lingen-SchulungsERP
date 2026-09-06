from flask import Flask
from flask_cors import CORS

from article_images import ArticleImageStore
from config import AppConfig
from events import events_bp
from routes.auth import auth_bp
from routes.admin_classes import admin_classes_bp
from routes.article_images import article_images_bp
from routes.meta import meta_bp
from routes.resources import resources_bp
from routes.tagesversand import tagesversand_bp
from store_manager import StoreManager
from tagesversand_scheduler import start_tagesversand_scheduler


def parse_cors_origins(value):
    if isinstance(value, (list, tuple)):
        return list(value)
    if str(value or "").strip() == "*":
        return "*"
    return [
        item.strip()
        for item in str(value or "").split(",")
        if item.strip()
    ] or ["http://localhost:5173", "http://localhost:5174"]

def create_store(app):
    return StoreManager(app.config["DATABASE_DSN"])


def create_app():
    app = Flask(__name__)
    app.config.from_object(AppConfig)
    app.config.setdefault("SECRET_KEY", AppConfig.SECRET_KEY)
    app.config.setdefault("DEBUG", AppConfig.DEBUG)
    app.config.setdefault("PORT", AppConfig.PORT)
    app.config.setdefault("CORS_ORIGINS", AppConfig.CORS_ORIGINS)
    app.config.setdefault("SERVER_CONFIG_PATH", AppConfig.SERVER_CONFIG_PATH)
    app.config.setdefault("DATABASE_DSN", AppConfig.DATABASE_DSN)
    app.config.setdefault("ARTICLE_IMAGE_STORAGE_PATH", AppConfig.ARTICLE_IMAGE_STORAGE_PATH)
    app.config.setdefault("ARTICLE_IMAGE_MAX_COUNT", AppConfig.ARTICLE_IMAGE_MAX_COUNT)
    cors_origins = parse_cors_origins(app.config["CORS_ORIGINS"])

    CORS(
        app,
        resources={r"/api/*": {"origins": cors_origins}},
        supports_credentials=True
    )

    app.extensions["store_manager"] = create_store(app)
    app.extensions["article_image_store"] = ArticleImageStore(
        app.config["ARTICLE_IMAGE_STORAGE_PATH"],
        app.config["ARTICLE_IMAGE_MAX_COUNT"]
    )

    app.register_blueprint(meta_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_classes_bp)
    app.register_blueprint(article_images_bp)
    app.register_blueprint(resources_bp)
    app.register_blueprint(tagesversand_bp)
    app.register_blueprint(events_bp)

    @app.before_request
    def refresh_active_session():
        from flask import session

        # Keep logged-in users active while they continue using the app/API.
        if session.get("user_id"):
            session.permanent = True
            session.modified = True

    start_tagesversand_scheduler(app)
    return app
