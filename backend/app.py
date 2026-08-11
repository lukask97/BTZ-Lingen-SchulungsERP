from app_factory import create_app
from schema_migrations import run_pending_migrations

run_pending_migrations()
app = create_app()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=app.config["PORT"],
        debug=app.config["DEBUG"]
    )
