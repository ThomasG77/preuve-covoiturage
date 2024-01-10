CREATE SCHEMA IF NOT EXISTS fraudcheck;

CREATE TABLE IF NOT EXISTS fraudcheck.phone_insights_detailed (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    phone_trunc VARCHAR(20),
    operator_user_id UUID,
    departure_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    num_days INTEGER,
    average_duration FLOAT,
    average_distance FLOAT,
    total_incentives FLOAT,
    average_trip_count FLOAT,
    num_operators INTEGER,
    driver_trip_percentage FLOAT,
    role_change BOOLEAN,
    intraday_change_count INTEGER,
    total_change_count INTEGER,
    intraday_change_percentage FLOAT,
    total_change_percentage FLOAT,
    carpool_days INTEGER,
    carpool_day_list VARCHAR(255),
    trip_id_list VARCHAR(255),
    operator_list VARCHAR(255),
    average_seats FLOAT,
    night_time_count_21_6 INTEGER,
    has_night_time_21_6 BOOLEAN,
    night_time_percentage_21_6 FLOAT,
    night_time_count_21_5 INTEGER,
    has_night_time_21_5 BOOLEAN,
    night_time_percentage_21_5 FLOAT,
    night_time_count_22_5 INTEGER,
    has_night_time_22_5 BOOLEAN,
    night_time_percentage_22_5 FLOAT,
    occupancy_rate_exceeded BOOLEAN,
    triangular_level_1 BOOLEAN,
    triangular_level_2 BOOLEAN,
    traveled_with_level_1 BOOLEAN,
    traveled_with_level_2 BOOLEAN,
    phone_trunc_changed FLOAT
);
CREATE UNIQUE INDEX ON fraudcheck.phone_insights_detailed('phone_trunc', 'departure_date', 'end_date');
