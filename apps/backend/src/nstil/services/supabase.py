from supabase import AsyncClient, create_async_client


async def create_supabase_client(url: str, service_key: str) -> AsyncClient:
    return await create_async_client(url, service_key)
