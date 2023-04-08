CREATE TABLE public.animals (
	id numeric NULL,
	"timestamp" timestamp NULL,
	long float8 NULL,
	lat float8 NULL,
	taxonomical_name text NULL,
	tag_local_identifier text NULL,
	individual_local_identifier text NULL,
	study_name text NULL
);

COPY animals(id,timestamp,long,lat,taxonomical_name,tag_local_identifier,individual_local_identifier,study_name) FROM '/app/data/3D flights of European free-tailed bats.csv' DELIMITER ',' CSV HEADER;
COPY animals(id,timestamp,long,lat,taxonomical_name,tag_local_identifier,individual_local_identifier,study_name) FROM '/app/data/Andean Condor Vultur gryphus Bariloche, Argentina, 2013-2018.csv' DELIMITER ',' CSV HEADER;
COPY animals(id,timestamp,long,lat,taxonomical_name,tag_local_identifier,individual_local_identifier,study_name) FROM '/app/data/Bald Eagle (Haliaeetus leucocephalus) in the Pacific Northwest.csv' DELIMITER ',' CSV HEADER;
COPY animals(id,timestamp,long,lat,taxonomical_name,tag_local_identifier,individual_local_identifier,study_name) FROM '/app/data/Baltic Seabird Stora Karls (Uria aalge _ Alca torda).csv' DELIMITER ',' CSV HEADER;

COPY animals(id,timestamp,long,lat,taxonomical_name,tag_local_identifier,individual_local_identifier,study_name) FROM '/app/data/Black-backed jackal, Etosha National Park, Namibia.csv' DELIMITER ',' CSV HEADER;
COPY animals(id,timestamp,long,lat,taxonomical_name,tag_local_identifier,individual_local_identifier,study_name) FROM '/app/data/Blue and fin whales Southern California 2014-2015 - Fastloc GPS data.csv' DELIMITER ',' CSV HEADER;
COPY animals(id,timestamp,long,lat,taxonomical_name,tag_local_identifier,individual_local_identifier,study_name) FROM '/app/data/Caspian Gulls - Poland.csv' DELIMITER ',' CSV HEADER;
COPY animals(id,timestamp,long,lat,taxonomical_name,tag_local_identifier,individual_local_identifier,study_name) FROM '/app/data/Common Crane Lithuania GPS, 2016.csv' DELIMITER ',' CSV HEADER;
COPY animals(id,timestamp,long,lat,taxonomical_name,tag_local_identifier,individual_local_identifier,study_name) FROM '/app/data/Eurasian Griffon Vultures 1 Hz HUJ (Israel).csv' DELIMITER ',' CSV HEADER;
COPY animals(id,timestamp,long,lat,taxonomical_name,tag_local_identifier,individual_local_identifier,study_name) FROM '/app/data/Fin whales Gulf of California 2001 - Argos data.csv' DELIMITER ',' CSV HEADER;
COPY animals(id,timestamp,long,lat,taxonomical_name,tag_local_identifier,individual_local_identifier,study_name) FROM '/app/data/Galapagos Albatrosses.csv' DELIMITER ',' CSV HEADER;
COPY animals(id,timestamp,long,lat,taxonomical_name,tag_local_identifier,individual_local_identifier,study_name) FROM '/app/data/Long-tailed ducks GLS 2018.csv' DELIMITER ',' CSV HEADER;


delete from animals where lat is null;
create index study_name_idx on animals(study_name);

