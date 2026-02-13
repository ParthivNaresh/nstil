import structlog

Logger = structlog.stdlib.BoundLogger


def get_logger(name: str | None = None) -> Logger:
    logger: Logger = structlog.stdlib.get_logger(name)
    return logger
