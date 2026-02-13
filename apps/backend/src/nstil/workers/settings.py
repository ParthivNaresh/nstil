from arq.connections import RedisSettings

from nstil.config import Settings
from nstil.workers.tasks import placeholder_task

_settings = Settings()


class WorkerSettings:
    functions = [placeholder_task]
    redis_settings = RedisSettings.from_dsn(_settings.redis_url)
