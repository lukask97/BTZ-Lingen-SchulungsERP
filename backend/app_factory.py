from flask import Flask
from flask_cors import CORS

from article_images import ArticleImageStore
from config import PreviewConfig
from events import events_bp
from repositories.memory_store import MemoryStore
from repositories.postgres_store import PostgresStore
from routes.auth import auth_bp
from routes.article_images import article_images_bp
from routes.meta import meta_bp
from routes.resources import resources_bp


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
    if app.config["DATA_MODE"] == "postgres":
        return PostgresStore(app.config["DATABASE_DSN"])
    return MemoryStore()


def create_app():
    app = Flask(__name__)
    app.config.from_object(PreviewConfig)
    app.config.setdefault("SECRET_KEY", PreviewConfig.SECRET_KEY)
    app.config.setdefault("DEBUG", PreviewConfig.DEBUG)
    app.config.setdefault("PORT", PreviewConfig.PORT)
    app.config.setdefault("CORS_ORIGINS", PreviewConfig.CORS_ORIGINS)
    app.config.setdefault("DATA_MODE", PreviewConfig.DATA_MODE)
    app.config.setdefault("SERVER_CONFIG_PATH", PreviewConfig.SERVER_CONFIG_PATH)
    app.config.setdefault("DATABASE_DSN", PreviewConfig.DATABASE_DSN)
    app.config.setdefault("ARTICLE_IMAGE_STORAGE_PATH", PreviewConfig.ARTICLE_IMAGE_STORAGE_PATH)
    app.config.setdefault("ARTICLE_IMAGE_MAX_COUNT", PreviewConfig.ARTICLE_IMAGE_MAX_COUNT)
    cors_origins = parse_cors_origins(app.config["CORS_ORIGINS"])

    CORS(
        app,
        resources={r"/api/*": {"origins": cors_origins}},
        supports_credentials=True
    )

    app.extensions["store"] = create_store(app)
    app.extensions["article_image_store"] = ArticleImageStore(
        app.config["ARTICLE_IMAGE_STORAGE_PATH"],
        app.config["ARTICLE_IMAGE_MAX_COUNT"]
    )

    app.register_blueprint(meta_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(article_images_bp)
    app.register_blueprint(resources_bp)
    app.register_blueprint(events_bp)

    return app
