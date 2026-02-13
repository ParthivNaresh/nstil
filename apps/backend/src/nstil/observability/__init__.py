from nstil.observability.config import LoggingConfig
from nstil.observability.context import bind_context, clear_context, get_context, unbind_context
from nstil.observability.logger import Logger, get_logger
from nstil.observability.middleware import REQUEST_ID_HEADER, RequestLoggingMiddleware

__all__ = [
    "REQUEST_ID_HEADER",
    "Logger",
    "LoggingConfig",
    "RequestLoggingMiddleware",
    "bind_context",
    "clear_context",
    "configure_logging",
    "get_context",
    "get_logger",
    "unbind_context",
]


def configure_logging(
    log_level: str = "INFO",
    log_format: str = "console",
    service_name: str = "nstil",
    service_version: str = "0.1.0",
) -> None:
    config = LoggingConfig(
        log_level=log_level,
        log_format=log_format,
        service_name=service_name,
        service_version=service_version,
    )
    config.configure()
