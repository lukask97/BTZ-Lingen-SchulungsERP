from threading import Event, Thread

from events import publish_event
from tagesversand import run_tagesversand


def start_tagesversand_scheduler(app):
    if app.extensions.get("tagesversand_scheduler"):
        return

    stop_event = Event()

    def run():
        while not stop_event.is_set():
            try:
                with app.app_context():
                    result = run_tagesversand(app.extensions["store"])
                    if result.get("protocol") and not result.get("alreadyRun"):
                        for table_name in ("angebote", "nachrichten", "tagesversandprotokolle"):
                            publish_event("table-changed", {"table": table_name, "action": "tagesversand"})
            except Exception:
                app.logger.exception("Automatischer Tagesversand konnte nicht ausgeführt werden.")

            stop_event.wait(30)

    thread = Thread(target=run, name="tagesversand-scheduler", daemon=True)
    thread.start()
    app.extensions["tagesversand_scheduler"] = stop_event
