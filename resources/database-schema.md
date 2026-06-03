# Pelagic — Database Schema

> Co-located SQL + TypeScript reference for code generation. Schema v9, SQLite (bundled).  
> Notation: `NN`=NOT NULL, `PK`=PRIMARY KEY, `AUTO`=AUTOINCREMENT, `?`=nullable, `timestamps`=`created_at/updated_at TEXT NN DEFAULT now`.

## Contents
- [Dive Data](#dive-data) — trips, dives, samples, events, tanks
- [Photos](#photos)
- [Tags](#tags) — species, general
- [Sites](#sites)
- [Gear & Equipment](#gear--equipment)
- [Citizen Science](#citizen-science)
- [Operational](#operational)
- [Derived Types](#derived-types)
- [Indexes](#indexes)
- [Migrations](#migrations)

---

## Dive Data

### trips
**Cols:** `id PK AUTO | name TEXT NN | location TEXT NN DEFAULT '' | resort TEXT? | date_start TEXT NN | date_end TEXT NN | notes TEXT? | timestamps`  
**TS:** `Trip { id: number; name: string; location: string; resort?: string; date_start: string; date_end: string; notes?: string; created_at: string; updated_at: string; }`

### dives
**Cols:** `id PK AUTO | trip_id INT? FK→trips(id) SET NULL | dive_number INT NN | date TEXT NN | time TEXT NN | duration_seconds INT NN | max_depth_m REAL NN | mean_depth_m REAL NN DEFAULT 0 | water_temp_c REAL? | air_temp_c REAL? | surface_pressure_bar REAL? | otu INT? | cns_percent REAL? | dive_computer_model TEXT? | dive_computer_serial TEXT? | location TEXT? | ocean TEXT? | visibility_m REAL? | gear_profile_id INT? | buddy TEXT? | divemaster TEXT? | guide TEXT? | instructor TEXT? | comments TEXT? | is_fresh_water INT NN DEFAULT 0 | is_boat_dive INT NN DEFAULT 0 | is_drift_dive INT NN DEFAULT 0 | is_night_dive INT NN DEFAULT 0 | is_training_dive INT NN DEFAULT 0 | latitude REAL? | longitude REAL? | dive_site_id INT? FK→dive_sites(id) SET NULL | timestamps`  
**TS:** `Dive { id: number; trip_id: number|null; dive_number: number; date: string; time: string; duration_seconds: number; max_depth_m: number; mean_depth_m: number; water_temp_c?: number; air_temp_c?: number; surface_pressure_bar?: number; otu?: number; cns_percent?: number; dive_computer_model?: string; dive_computer_serial?: string; location?: string; ocean?: string; visibility_m?: number; gear_profile_id?: number; buddy?: string; divemaster?: string; guide?: string; instructor?: string; comments?: string; is_fresh_water: boolean; is_boat_dive: boolean; is_drift_dive: boolean; is_night_dive: boolean; is_training_dive: boolean; latitude?: number; longitude?: number; dive_site_id?: number; created_at: string; updated_at: string; }`  
> Boolean flags stored as INT (0/1) in SQL, mapped to `boolean` in TS.

### dive_samples
**Cols:** `id PK AUTO | dive_id INT NN FK→dives(id) CASCADE | time_seconds INT NN | depth_m REAL NN | temp_c REAL? | pressure_bar REAL? | ndl_seconds INT? | rbt_seconds INT?`  
**TS:** `DiveSample { id: number; dive_id: number; time_seconds: number; depth_m: number; temp_c?: number; pressure_bar?: number; ndl_seconds?: number; rbt_seconds?: number; }`

### dive_events
**Cols:** `id PK AUTO | dive_id INT NN FK→dives(id) CASCADE | time_seconds INT NN | event_type INT NN | name TEXT NN | flags INT? | value INT?`  
**TS:** `DiveEvent { id: number; dive_id: number; time_seconds: number; event_type: number; name: string; flags?: number; value?: number; }`

### tank_pressures
**Cols:** `id PK AUTO | dive_id INT NN FK→dives(id) CASCADE | sensor_id INT NN | sensor_name TEXT? | time_seconds INT NN | pressure_bar REAL NN`  
**TS:** `TankPressure { id: number; dive_id: number; sensor_id: number; sensor_name?: string; time_seconds: number; pressure_bar: number; }`  
> `sensor_id` matches Garmin sensor serial numbers (i64).

### dive_tanks
**Cols:** `id PK AUTO | dive_id INT NN FK→dives(id) CASCADE | sensor_id INT NN DEFAULT 0 | sensor_name TEXT? | gas_index INT NN DEFAULT 0 | o2_percent REAL? | he_percent REAL? | start_pressure_bar REAL? | end_pressure_bar REAL? | volume_used_liters REAL?`  
**TS:** `DiveTank { id: number; dive_id: number; sensor_id: number; sensor_name?: string; gas_index: number; o2_percent?: number; he_percent?: number; start_pressure_bar?: number; end_pressure_bar?: number; volume_used_liters?: number; }`  
> `gas_index`: 0=primary, 1=secondary. `o2_percent`: 21=air, 32=EAN32. `he_percent` > 0 = trimix.

---

## Photos

### photos
**Cols:** `id PK AUTO | trip_id INT NN FK→trips(id) CASCADE | dive_id INT? FK→dives(id) SET NULL | file_path TEXT NN UNIQUE | thumbnail_path TEXT? | filename TEXT NN | capture_time TEXT? | width INT? | height INT? | file_size_bytes INT? | is_processed INT NN DEFAULT 0 | raw_photo_id INT? FK→photos(id) SET NULL | rating INT DEFAULT 0 | camera_make TEXT? | camera_model TEXT? | lens_info TEXT? | focal_length_mm REAL? | aperture REAL? | shutter_speed TEXT? | iso INT? | exposure_compensation REAL? | white_balance TEXT? | flash_fired INT DEFAULT 0 | metering_mode TEXT? | gps_latitude REAL? | gps_longitude REAL? | caption TEXT? | metadata_dirty INT NN DEFAULT 1 | timestamps`  
**TS:** `Photo { id: number; trip_id: number; dive_id?: number; file_path: string; thumbnail_path?: string; filename: string; capture_time?: string; width?: number; height?: number; file_size_bytes?: number; is_processed: boolean; raw_photo_id?: number; rating?: number; camera_make?: string; camera_model?: string; lens_info?: string; focal_length_mm?: number; aperture?: number; shutter_speed?: string; iso?: number; exposure_compensation?: number; white_balance?: string; flash_fired?: boolean; metering_mode?: string; gps_latitude?: number; gps_longitude?: number; caption?: string; created_at: string; updated_at: string; }`  
> `raw_photo_id` self-FK: processed JPEG → parent RAW. `metadata_dirty=1` triggers background EXIF write-back.

### photo_species_tags *(junction)*
`photo_id INT NN FK→photos(id) CASCADE | species_tag_id INT NN FK→species_tags(id) CASCADE | PK(photo_id, species_tag_id)`  
**TS:** `PhotoSpeciesTag { photo_id: number; species_tag_id: number; }`

### photo_general_tags *(junction)*
`photo_id INT NN FK→photos(id) CASCADE | general_tag_id INT NN FK→general_tags(id) CASCADE | PK(photo_id, general_tag_id)`  
**TS:** `PhotoGeneralTag { photo_id: number; general_tag_id: number; }`

---

## Tags

### species_tags
**Cols:** `id PK AUTO | name TEXT NN UNIQUE | category TEXT? | scientific_name TEXT?`  
**TS:** `SpeciesTag { id: number; name: string; category?: string; scientific_name?: string; }`  
> `category`: e.g. "Fish", "Invertebrate", "Coral"

### general_tags
**Cols:** `id PK AUTO | name TEXT NN UNIQUE`  
**TS:** `GeneralTag { id: number; name: string; }`

---

## Sites

### dive_sites
**Cols:** `id PK AUTO | name TEXT NN | lat REAL NN | lon REAL NN | is_user_created INT NN DEFAULT 0`  
**TS:** `DiveSite { id: number; name: string; lat: number; lon: number; is_user_created: boolean; }`  
> Pre-seeded with 1,934+ sites from `divesites_filtered.csv`.

---

## Gear & Equipment

### gear_profiles *(legacy — superseded by equipment system)*
**Cols:** `id PK AUTO | name TEXT NN | bcd TEXT? | wetsuit TEXT? | fins TEXT? | weights_kg REAL? | cylinder_liters REAL? | cylinder_material TEXT? | notes TEXT? | timestamps`  
**TS:** `GearProfile { id: number; name: string; bcd?: string; wetsuit?: string; fins?: string; weights_kg?: number; cylinder_liters?: number; cylinder_material?: 'steel'|'aluminium'; notes?: string; created_at: string; updated_at: string; }`

### equipment_categories
**Cols:** `id PK AUTO | name TEXT NN UNIQUE | icon TEXT? | sort_order INT NN DEFAULT 0 | category_type TEXT NN DEFAULT 'dive'`  
**TS:** `EquipmentCategory { id: number; name: string; icon?: string; sort_order: number; category_type: 'dive'|'camera'|'both'; }`

### equipment
**Cols:** `id PK AUTO | category_id INT NN FK→equipment_categories(id) CASCADE | name TEXT? | brand TEXT? | model TEXT? | serial_number TEXT? | purchase_date TEXT? | notes TEXT? | is_retired INT NN DEFAULT 0 | timestamps`  
**TS:** `Equipment { id: number; category_id: number; name?: string; brand?: string; model?: string; serial_number?: string; purchase_date?: string; notes?: string; is_retired: boolean; created_at: string; updated_at: string; }`

### equipment_sets
**Cols:** `id PK AUTO | name TEXT NN | description TEXT? | set_type TEXT NN DEFAULT 'dive' | is_default INT NN DEFAULT 0 | timestamps`  
**TS:** `EquipmentSet { id: number; name: string; description?: string; set_type: 'dive'|'camera'; is_default: boolean; created_at: string; updated_at: string; }`

### equipment_set_items *(junction)*
`equipment_set_id INT NN FK→equipment_sets(id) CASCADE | equipment_id INT NN FK→equipment(id) CASCADE | PK(equipment_set_id, equipment_id)`

### dive_equipment_sets *(junction)*
`dive_id INT NN FK→dives(id) CASCADE | equipment_set_id INT NN FK→equipment_sets(id) CASCADE | PK(dive_id, equipment_set_id)`

---

## Citizen Science

### external_submissions
**Cols:** `id PK AUTO | photo_id INT? FK→photos(id) CASCADE | dive_id INT? FK→dives(id) SET NULL | platform TEXT NN | external_url TEXT? | external_id TEXT? | status TEXT NN DEFAULT 'submitted' | submitted_at TEXT NN DEFAULT now`  
**TS:** `ExternalSubmission { id: number; photo_id?: number; dive_id?: number; platform: string; external_url?: string; external_id?: string; status: string; submitted_at: string; }`  
> `platform`: 'inaturalist' | 'sharkbook' | etc.

### species_enrichment_cache
**Cols:** `species_tag_id INT PK FK→species_tags(id) CASCADE | gbif_taxon_key INT? | iucn_status TEXT? | kingdom TEXT? | phylum TEXT? | class_name TEXT? | order_name TEXT? | family TEXT? | genus TEXT? | fetched_at TEXT NN DEFAULT now`  
**TS:** `SpeciesEnrichmentCache { species_tag_id: number; gbif_taxon_key?: number; iucn_status?: string; kingdom?: string; phylum?: string; class_name?: string; order_name?: string; family?: string; genus?: string; fetched_at: string; }`  
> `iucn_status`: LC | NT | VU | EN | CR | EW | EX | DD | NE

---

## Operational

### caption_templates
**Cols:** `id PK AUTO | name TEXT NN | template TEXT NN | content_type TEXT NN CHECK('photo'|'dive'|'trip') | created_at TEXT NN DEFAULT now`  
> No TS type — internal only.

### device_fingerprints
**Cols:** `id PK AUTO | device_key TEXT NN UNIQUE | fingerprint BLOB NN | device_serial TEXT? | device_model TEXT? | updated_at TEXT NN DEFAULT now`  
> Incremental dive computer sync tracking. No TS type.

### schema_version
`version INT PK | applied_at TEXT NN DEFAULT now`

---

## Derived Types

Composite types returned by query — not stored directly.

```ts
TripWithStats extends Trip {
  dive_count: number; photo_count: number; deepest_dive_m?: number;
  total_underwater_seconds: number; species_count: number;
}

DiveWithStats extends Dive {
  photo_count: number; species_count: number;
}

DiveWithDetails extends Dive {              // batch-loaded for dive cards (reduces IPC calls)
  photo_count: number; species_count: number; thumbnail_paths: string[];
}

EquipmentWithCategory extends Equipment {
  category_name: string; category_type: 'dive'|'camera'|'both';
}

EquipmentSetWithItems extends EquipmentSet {
  items: EquipmentWithCategory[];
}
```

---

## Indexes

```
idx_dives_trip_id              ON dives(trip_id)
idx_dive_samples_dive_id       ON dive_samples(dive_id)
idx_dive_events_dive_id        ON dive_events(dive_id)
idx_dive_tanks_dive            ON dive_tanks(dive_id)
idx_dive_tanks_sensor          ON dive_tanks(dive_id, sensor_id)
idx_photos_trip_id             ON photos(trip_id)
idx_photos_dive_id             ON photos(dive_id)
idx_photos_capture_time        ON photos(capture_time)
idx_equipment_category_id      ON equipment(category_id)
idx_equipment_set_items_set    ON equipment_set_items(equipment_set_id)
idx_dive_equipment_sets_dive   ON dive_equipment_sets(dive_id)
idx_caption_templates_type     ON caption_templates(content_type)
idx_external_submissions_photo ON external_submissions(photo_id)
idx_external_submissions_plat  ON external_submissions(platform)
```

---

## Migrations

| v | Change |
|---|--------|
| 1 | Initial schema |
| 2 | `dive_sites.is_user_created` added |
| 3 | `equipment_categories.category_type` added; accessory categories split; `equipment.name` made nullable |
| 4 | `caption_templates` table added (social sharing) |
| 5 | `device_fingerprints` table added (incremental dive computer sync) |
| 6 | `external_submissions` + `species_enrichment_cache` added (citizen science) |
| 7 | `photos.caption` added |
| 8 | `photos.metadata_dirty` added (background EXIF sync) |
| 9 | `dives.trip_id` made nullable (trip-less dives) |
