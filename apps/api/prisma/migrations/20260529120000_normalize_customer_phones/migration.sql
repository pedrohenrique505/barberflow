DO $$
DECLARE
    duplicate_groups TEXT;
BEGIN
    SELECT string_agg(
        format(
            'barbershopId=%s normalizedPhone=%s customerIds=%s',
            "barbershopId",
            normalized_phone,
            customer_ids
        ),
        E'\n'
    )
    INTO duplicate_groups
    FROM (
        SELECT
            "barbershopId",
            regexp_replace("phone", '\D', '', 'g') AS normalized_phone,
            string_agg("id", ', ' ORDER BY "id") AS customer_ids,
            count(*) AS customer_count
        FROM "Customer"
        GROUP BY "barbershopId", regexp_replace("phone", '\D', '', 'g')
        HAVING count(*) > 1
    ) AS duplicates;

    IF duplicate_groups IS NOT NULL THEN
        RAISE EXCEPTION 'Customer phone duplicates after normalization:%', E'\n' || duplicate_groups;
    END IF;
END $$;

UPDATE "Customer"
SET "phone" = regexp_replace("phone", '\D', '', 'g')
WHERE "phone" <> regexp_replace("phone", '\D', '', 'g');
