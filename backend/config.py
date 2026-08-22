import os
from datetime import timedelta


class AppConfig:
    SECRET_KEY = os.environ.get("ERP_SECRET_KEY", "erp-secret")
    DEBUG = os.environ.get("FLASK_DEBUG", "1") == "1"
    PORT = int(os.environ.get("PORT", "5000"))
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=int(os.environ.get("ERP_SESSION_TIMEOUT_MINUTES", "30")))
    SESSION_REFRESH_EACH_REQUEST = True
    SESSION_COOKIE_HTTPONLY = True
    CORS_ORIGINS = os.environ.get(
        "ERP_CORS_ORIGINS",
        "*"
    )
    SERVER_CONFIG_PATH = os.environ.get("ERP_SERVER_CONFIG_PATH", "/tmp/erp-server-config.json")
    DATABASE_DSN = os.environ.get(
        "DATABASE_DSN",
        "dbname=erp user=erp password=geheim host=postgres port=5432"
    )
    ARTICLE_IMAGE_STORAGE_PATH = os.environ.get(
        "ERP_ARTICLE_IMAGE_STORAGE_PATH",
        "/app_data/artikelbilder"
    )
    ARTICLE_IMAGE_MAX_COUNT = int(os.environ.get("ERP_ARTICLE_IMAGE_MAX_COUNT", "10"))
