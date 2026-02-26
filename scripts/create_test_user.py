from __future__ import annotations

import random
import sys
import time
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import httpx

BACKEND_ENV_PATH = Path(__file__).resolve().parent.parent / "apps" / "backend" / ".env"
PASSWORD = "Test1234"
BASE_EMAIL = "test@gmail.com"
MAX_EMAIL_ATTEMPTS = 100
LOOKBACK_DAYS = 180

DAY_HAS_ENTRIES_PROBABILITY = 0.85
ENTRIES_PER_DAY_WEIGHTS: list[tuple[int, float]] = [
    (1, 0.25),
    (2, 0.50),
    (3, 0.15),
    (4, 0.07),
    (5, 0.03),
]
TITLE_PROBABILITY = 0.85
MOOD_PROBABILITY = 0.90
SUBMOOD_PROBABILITY = 0.80
TAG_PROBABILITY = 0.90
SINGLE_TAG_PROBABILITY = 0.20
MIN_BODY_WORDS = 5
MAX_BODY_WORDS = 300

EXTRA_JOURNALS_MIN = 2
EXTRA_JOURNALS_MAX = 6

ENTRY_TYPES: list[str] = ["journal", "reflection", "gratitude", "freewrite"]
ENTRY_TYPE_WEIGHTS: list[float] = [0.50, 0.20, 0.20, 0.10]

MOOD_SPECIFICS: dict[str, list[str]] = {
    "happy": ["joyful", "grateful", "excited", "proud"],
    "calm": ["peaceful", "content", "relaxed", "hopeful"],
    "sad": ["down", "lonely", "disappointed", "nostalgic"],
    "anxious": ["stressed", "worried", "overwhelmed", "restless"],
    "angry": ["frustrated", "irritated", "hurt", "resentful"],
}

TITLES: list[str] = [
    "Morning thoughts",
    "Grateful for today",
    "A tough day",
    "Feeling inspired",
    "Late night reflections",
    "Weekend vibes",
    "Work stress",
    "Family time",
    "New beginnings",
    "Letting go",
    "Small wins",
    "Rainy day mood",
    "Unexpected joy",
    "Quiet evening",
    "Pushing through",
    "Creative energy",
    "Feeling stuck",
    "Good conversation",
    "Self-care day",
    "Looking ahead",
    "Milestone reached",
    "Overthinking again",
    "Peaceful morning",
    "Tough conversation",
    "Grateful for friends",
    "Restless night",
    "Productive day",
    "Needed this break",
    "Feeling lighter",
    "End of the week",
]

TAGS: list[str] = [
    "work",
    "family",
    "health",
    "gratitude",
    "anxiety",
    "exercise",
    "sleep",
    "friends",
    "creativity",
    "nature",
    "meditation",
    "reading",
    "cooking",
    "music",
    "travel",
    "goals",
    "therapy",
    "self-care",
    "relationships",
    "growth",
    "stress",
    "productivity",
    "mindfulness",
    "journaling",
    "learning",
]

SENTENCES: list[str] = [
    "Today was a good day overall.",
    "I woke up feeling refreshed and ready to take on the world.",
    "Had a really productive morning at work.",
    "Spent some quality time with family this evening.",
    "I need to remember to be kinder to myself.",
    "The weather was beautiful today and I took a long walk.",
    "Feeling grateful for the small things in life.",
    "Had a difficult conversation but I'm glad I had it.",
    "I've been thinking a lot about my goals lately.",
    "Sometimes it's okay to just do nothing.",
    "Made progress on a project I've been putting off.",
    "Feeling a bit overwhelmed with everything going on.",
    "Took some time to meditate and it really helped.",
    "I'm learning to set better boundaries.",
    "Had a great workout today and feeling energized.",
    "Missing some old friends and thinking about reaching out.",
    "Read a chapter of my book before bed.",
    "Cooked a new recipe and it turned out amazing.",
    "Feeling anxious about tomorrow but trying to stay present.",
    "Had a moment of clarity about something that's been bothering me.",
    "The sunset was incredible tonight.",
    "I need to prioritize sleep more.",
    "Grateful for my health and the people around me.",
    "Spent the afternoon in nature and it was exactly what I needed.",
    "Feeling creative and inspired after listening to some music.",
    "Had a tough meeting but handled it well.",
    "I'm proud of how far I've come this year.",
    "Need to remember that progress isn't always linear.",
    "Enjoyed a quiet morning with coffee and my thoughts.",
    "Feeling hopeful about the future.",
    "Struggled with motivation today but still showed up.",
    "Had a meaningful conversation with a friend.",
    "Trying to be more intentional with my time.",
    "The little moments are what matter most.",
    "Feeling a sense of accomplishment after finishing a task.",
    "I'm learning to embrace uncertainty.",
    "Took a mental health day and it was much needed.",
    "Reflecting on what truly makes me happy.",
    "Had some unexpected good news today.",
    "Feeling connected and present in the moment.",
]

JOURNAL_TEMPLATES: list[dict[str, str]] = [
    {"name": "Work & Career", "description": "Professional growth and daily work reflections", "color": "#6A89CC"},
    {"name": "Health & Fitness", "description": "Workouts, nutrition, and wellness tracking", "color": "#34D399"},
    {"name": "Gratitude", "description": "Things I'm thankful for", "color": "#F6B93B"},
    {"name": "Creative Writing", "description": "Stories, poems, and creative ideas", "color": "#9B59B6"},
    {"name": "Travel Log", "description": "Adventures and places I've been", "color": "#38ADA9"},
    {"name": "Relationships", "description": "Thoughts on friendships and family", "color": "#EB7A68"},
    {"name": "Goals & Dreams", "description": "Tracking progress toward my aspirations", "color": "#E55039"},
    {"name": "Mindfulness", "description": "Meditation notes and present-moment awareness", "color": "#5EC4C0"},
    {"name": "Reading Notes", "description": "Book highlights and takeaways", "color": "#8DA4DB"},
    {"name": "Late Night Thoughts", "description": "When the mind won't quiet down", "color": "#F8C96B"},
]


@dataclass(frozen=True)
class EnvConfig:
    supabase_url: str
    service_key: str
    backend_url: str


@dataclass(frozen=True)
class JournalInfo:
    id: str
    name: str


@dataclass(frozen=True)
class CreatedUser:
    email: str
    user_id: str
    access_token: str
    journals: list[JournalInfo]


@dataclass(frozen=True)
class CreationStats:
    email: str
    user_id: str
    journal_count: int
    total_entries: int
    days_with_entries: int
    total_days: int
    elapsed_seconds: float


def load_env() -> EnvConfig:
    if not BACKEND_ENV_PATH.exists():
        print(f"ERROR: Backend .env not found at {BACKEND_ENV_PATH}")
        sys.exit(1)

    env_vars: dict[str, str] = {}
    for line in BACKEND_ENV_PATH.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        key, _, value = line.partition("=")
        env_vars[key.strip()] = value.strip()

    supabase_url = env_vars.get("SUPABASE_URL", "")
    service_key = env_vars.get("SUPABASE_SERVICE_KEY", "")

    if not supabase_url or not service_key:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend .env")
        sys.exit(1)

    host = supabase_url.split("://")[1].split(":")[0] if "://" in supabase_url else "localhost"
    backend_url = f"http://{host}:8000"

    return EnvConfig(
        supabase_url=supabase_url,
        service_key=service_key,
        backend_url=backend_url,
    )


def generate_email(attempt: int) -> str:
    if attempt == 0:
        return BASE_EMAIL
    local, domain = BASE_EMAIL.split("@")
    return f"{local}{attempt}@{domain}"


def signup_user(client: httpx.Client, config: EnvConfig) -> tuple[str, str]:
    for attempt in range(MAX_EMAIL_ATTEMPTS):
        email = generate_email(attempt)
        response = client.post(
            f"{config.supabase_url}/auth/v1/signup",
            headers={
                "apikey": config.service_key,
                "Content-Type": "application/json",
            },
            json={"email": email, "password": PASSWORD},
        )

        if response.status_code == 200:
            data: dict[str, Any] = response.json()
            user_id: str = data["id"]
            print(f"  ✓ Signed up {email} (id: {user_id})")
            return email, user_id

        if response.status_code == 422 or response.status_code == 400:
            continue

        response.raise_for_status()

    print(f"ERROR: Could not find available email after {MAX_EMAIL_ATTEMPTS} attempts")
    sys.exit(1)


def confirm_email(client: httpx.Client, config: EnvConfig, user_id: str) -> None:
    response = client.put(
        f"{config.supabase_url}/auth/v1/admin/users/{user_id}",
        headers={
            "apikey": config.service_key,
            "Authorization": f"Bearer {config.service_key}",
            "Content-Type": "application/json",
        },
        json={"email_confirm": True},
    )
    response.raise_for_status()
    print("  ✓ Email confirmed")


def sign_in(client: httpx.Client, config: EnvConfig, email: str) -> str:
    response = client.post(
        f"{config.supabase_url}/auth/v1/token?grant_type=password",
        headers={
            "apikey": config.service_key,
            "Content-Type": "application/json",
        },
        json={"email": email, "password": PASSWORD},
    )
    response.raise_for_status()
    data: dict[str, Any] = response.json()
    token: str = data["access_token"]
    print("  ✓ Signed in")
    return token


def fetch_default_journal(client: httpx.Client, config: EnvConfig, token: str) -> JournalInfo:
    response = client.get(
        f"{config.backend_url}/api/v1/journals",
        headers={"Authorization": f"Bearer {token}"},
    )
    response.raise_for_status()
    data: dict[str, Any] = response.json()
    items: list[dict[str, Any]] = data["items"]
    if not items:
        print("ERROR: No journals found for user")
        sys.exit(1)
    journal = items[0]
    journal_info = JournalInfo(id=journal["id"], name=journal["name"])
    print(f"  ✓ Found default journal: {journal_info.name} ({journal_info.id})")
    return journal_info


def create_extra_journals(
    client: httpx.Client,
    config: EnvConfig,
    token: str,
) -> list[JournalInfo]:
    extra_count = random.randint(EXTRA_JOURNALS_MIN, EXTRA_JOURNALS_MAX)
    templates = random.sample(JOURNAL_TEMPLATES, extra_count)
    created: list[JournalInfo] = []

    for template in templates:
        response = client.post(
            f"{config.backend_url}/api/v1/journals",
            headers={"Authorization": f"Bearer {token}"},
            json=template,
        )
        response.raise_for_status()
        data: dict[str, Any] = response.json()
        journal_info = JournalInfo(id=data["id"], name=data["name"])
        created.append(journal_info)

    print(f"  ✓ Created {len(created)} additional journals: {', '.join(j.name for j in created)}")
    return created


def create_user(client: httpx.Client, config: EnvConfig) -> CreatedUser:
    print("\n→ Creating user")
    email, user_id = signup_user(client, config)
    confirm_email(client, config, user_id)
    token = sign_in(client, config, email)

    print("\n→ Setting up journals")
    default_journal = fetch_default_journal(client, config, token)
    extra_journals = create_extra_journals(client, config, token)
    all_journals = [default_journal, *extra_journals]

    return CreatedUser(
        email=email,
        user_id=user_id,
        access_token=token,
        journals=all_journals,
    )


def pick_weighted(items: list[tuple[int, float]]) -> int:
    values = [v for v, _ in items]
    weights = [w for _, w in items]
    return random.choices(values, weights=weights, k=1)[0]


def generate_body() -> str:
    word_target = random.randint(MIN_BODY_WORDS, MAX_BODY_WORDS)
    parts: list[str] = []
    word_count = 0
    while word_count < word_target:
        sentence = random.choice(SENTENCES)
        parts.append(sentence)
        word_count += len(sentence.split())
    return " ".join(parts)


def generate_title() -> str:
    return random.choice(TITLES)


def generate_mood() -> tuple[str | None, str | None]:
    if random.random() > MOOD_PROBABILITY:
        return None, None
    category = random.choice(list(MOOD_SPECIFICS.keys()))
    specific: str | None = None
    if random.random() < SUBMOOD_PROBABILITY:
        specific = random.choice(MOOD_SPECIFICS[category])
    return category, specific


def generate_tags() -> list[str]:
    if random.random() > TAG_PROBABILITY:
        return []
    if random.random() < SINGLE_TAG_PROBABILITY:
        return [random.choice(TAGS)]
    count = random.randint(2, 5)
    return random.sample(TAGS, min(count, len(TAGS)))


def generate_entry_type() -> str:
    return random.choices(ENTRY_TYPES, weights=ENTRY_TYPE_WEIGHTS, k=1)[0]


def build_entry_payload(
    journal_id: str,
    entry_date: datetime,
) -> dict[str, Any]:
    now = datetime.now(UTC)
    is_today = entry_date.date() == now.date()

    if is_today:
        if now.hour < 1:
            hour = 0
            minute = 0
        else:
            hour = random.randint(0, now.hour - 1)
            minute = random.randint(0, 59)
    else:
        hour = random.randint(6, 23)
        minute = random.randint(0, 59)

    created_at = entry_date.replace(hour=hour, minute=minute, second=0, microsecond=0)

    mood_category, mood_specific = generate_mood()

    payload: dict[str, Any] = {
        "journal_id": journal_id,
        "body": generate_body(),
        "entry_type": generate_entry_type(),
        "tags": generate_tags(),
        "created_at": created_at.isoformat(),
    }

    if random.random() < TITLE_PROBABILITY:
        payload["title"] = generate_title()

    if mood_category is not None:
        payload["mood_category"] = mood_category
        if mood_specific is not None:
            payload["mood_specific"] = mood_specific

    return payload


def build_journal_weights(journal_count: int) -> list[float]:
    raw = [random.uniform(0.3, 1.0) for _ in range(journal_count)]
    total = sum(raw)
    return [w / total for w in raw]


def pick_journal(journals: list[JournalInfo], weights: list[float]) -> JournalInfo:
    return random.choices(journals, weights=weights, k=1)[0]


def create_entries(
    client: httpx.Client,
    config: EnvConfig,
    user: CreatedUser,
) -> tuple[int, int]:
    print("\n→ Generating journal entries")
    today = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = today - timedelta(days=LOOKBACK_DAYS)

    journal_weights = build_journal_weights(len(user.journals))
    total_entries = 0
    days_with_entries = 0
    total_days = LOOKBACK_DAYS + 1
    entries_per_journal: dict[str, int] = {j.id: 0 for j in user.journals}

    for day_offset in range(total_days):
        current_date = start_date + timedelta(days=day_offset)

        if random.random() > DAY_HAS_ENTRIES_PROBABILITY:
            continue

        days_with_entries += 1
        entry_count = pick_weighted(ENTRIES_PER_DAY_WEIGHTS)

        for _ in range(entry_count):
            journal = pick_journal(user.journals, journal_weights)
            payload = build_entry_payload(journal.id, current_date)
            response = client.post(
                f"{config.backend_url}/api/v1/entries",
                headers={"Authorization": f"Bearer {user.access_token}"},
                json=payload,
            )
            response.raise_for_status()
            total_entries += 1
            entries_per_journal[journal.id] += 1

    print(f"  ✓ Created {total_entries} entries across {days_with_entries} days")
    for journal in user.journals:
        count = entries_per_journal[journal.id]
        print(f"    • {journal.name}: {count} entries")

    return total_entries, days_with_entries


def print_summary(stats: CreationStats) -> None:
    print("\n" + "=" * 50)
    print("  Test User Created Successfully")
    print("=" * 50)
    print(f"  Email:          {stats.email}")
    print(f"  Password:       {PASSWORD}")
    print(f"  User ID:        {stats.user_id}")
    print(f"  Journals:       {stats.journal_count}")
    print(f"  Total entries:  {stats.total_entries}")
    print(f"  Days w/ entries: {stats.days_with_entries}/{stats.total_days}")
    print(f"  Time elapsed:   {stats.elapsed_seconds:.1f}s")
    print("=" * 50)


def main() -> None:
    start = time.monotonic()
    config = load_env()

    print("NStil Test User Creator")
    print(f"  Supabase: {config.supabase_url}")
    print(f"  Backend:  {config.backend_url}")

    with httpx.Client(timeout=30.0) as client:
        user = create_user(client, config)
        total_entries, days_with_entries = create_entries(client, config, user)

    elapsed = time.monotonic() - start
    total_days = LOOKBACK_DAYS + 1

    print_summary(
        CreationStats(
            email=user.email,
            user_id=user.user_id,
            journal_count=len(user.journals),
            total_entries=total_entries,
            days_with_entries=days_with_entries,
            total_days=total_days,
            elapsed_seconds=elapsed,
        )
    )


if __name__ == "__main__":
    main()
