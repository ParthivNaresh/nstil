import logging

logger = logging.getLogger(__name__)


async def placeholder_task(ctx: dict[str, object]) -> str:
    logger.info("Placeholder task executed")
    return "done"
