ALTER TABLE public.journal_entries
    ADD COLUMN latitude  double precision,
    ADD COLUMN longitude double precision;

ALTER TABLE public.journal_entries
    ADD CONSTRAINT chk_location_coords_pair
        CHECK (
            (latitude IS NULL AND longitude IS NULL)
            OR (latitude IS NOT NULL AND longitude IS NOT NULL)
        ),
    ADD CONSTRAINT chk_latitude_range
        CHECK (latitude BETWEEN -90 AND 90),
    ADD CONSTRAINT chk_longitude_range
        CHECK (longitude BETWEEN -180 AND 180);

CREATE INDEX idx_journal_entries_location
    ON public.journal_entries (user_id)
    WHERE latitude IS NOT NULL
      AND deleted_at IS NULL;
