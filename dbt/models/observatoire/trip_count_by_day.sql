{{ config(materialized='incremental') }}

SELECT
  c.start_geo_code,
  c.end_geo_code,
  TO_CHAR(a.start_datetime, 'YYYY-MM-DD')::date AS start_date,
  COUNT(*) AS count
FROM {{ source('carpool', 'carpools') }} AS a
LEFT JOIN {{ source('carpool', 'status') }} AS b ON a._id = b.carpool_id
LEFT JOIN {{ source('carpool','geo') }} AS c ON a._id = c.carpool_id
WHERE
  c.start_geo_code IS NOT null AND c.end_geo_code IS NOT null
{% if is_incremental() %}
  AND start_datetime::date >= (SELECT MAX(start_date) FROM {{ this }})::date
{% endif %}
GROUP BY
  c.start_geo_code, c.end_geo_code, TO_CHAR(a.start_datetime, 'YYYY-MM-DD')::date
