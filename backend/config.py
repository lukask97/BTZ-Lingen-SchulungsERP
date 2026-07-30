import os


class PreviewConfig:
    SECRET_KEY = os.environ.get("ERP_SECRET_KEY", os.environ.get("ERP_PREVIEW_SECRET", "erp-preview-secret"))
    DEBUG = os.environ.get("FLASK_DEBUG", "1") == "1"
    PORT = int(os.environ.get("PORT", "5000"))
    CORS_ORIGINS = os.environ.get("ERP_CORS_ORIGINS", "*")
    DATA_MODE = os.environ.get("ERP_DATA_MODE", "postgres")
    DATABASE_DSN = os.environ.get(
        "DATABASE_DSN",
        "dbname=erp user=erp password=geheim host=postgres port=5432"
    )
