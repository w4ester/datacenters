#!/usr/bin/env python3
"""
Convert datacenters.csv to datacenters.geojson
Preserves all fields and formats coordinates properly for mapping
"""

import csv
import json
import sys
from pathlib import Path

def convert_to_number(value):
    """Convert string to int or float if possible, otherwise return original"""
    if value == '' or value is None:
        return None
    try:
        # Try int first
        if '.' not in str(value):
            return int(value)
        return float(value)
    except (ValueError, TypeError):
        return value

def csv_to_geojson(csv_path, geojson_path):
    """Convert CSV to GeoJSON format"""
    features = []

    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            # Extract coordinates
            lat = convert_to_number(row.pop('latitude'))
            lon = convert_to_number(row.pop('longitude'))

            if lat is None or lon is None:
                print(f"Warning: Skipping row with missing coordinates: {row.get('name', 'Unknown')}")
                continue

            # Convert numeric fields
            numeric_fields = [
                'capacity_mw', 'year_opened', 'size_sqft', 'pue',
                'renewable_energy_pct', 'water_usage_mgd', 'carbon_intensity_gco2_kwh',
                'latency_zone_ms', 'min_commitment_months', 'nearest_university_miles'
            ]

            properties = {}
            for key, value in row.items():
                if key in numeric_fields:
                    properties[key] = convert_to_number(value)
                else:
                    # Keep as string, empty strings become empty
                    properties[key] = value if value != '' else None

            # Create GeoJSON feature
            feature = {
                "type": "Feature",
                "properties": properties,
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat]  # GeoJSON uses [lon, lat] order
                }
            }

            features.append(feature)

    # Create GeoJSON FeatureCollection
    geojson = {
        "type": "FeatureCollection",
        "name": "datacenters",
        "features": features
    }

    # Write to file with nice formatting
    with open(geojson_path, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, indent=2, ensure_ascii=False)

    print(f"✓ Converted {len(features)} data centers from CSV to GeoJSON")
    print(f"  Input:  {csv_path}")
    print(f"  Output: {geojson_path}")

if __name__ == "__main__":
    # Get script directory
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    # Define paths
    csv_path = project_root / "data" / "datacenters.csv"
    geojson_path = project_root / "data" / "datacenters.geojson"

    # Check if CSV exists
    if not csv_path.exists():
        print(f"Error: CSV file not found at {csv_path}")
        sys.exit(1)

    # Convert
    try:
        csv_to_geojson(csv_path, geojson_path)
    except Exception as e:
        print(f"Error during conversion: {e}")
        sys.exit(1)
