#!/usr/bin/env python3
"""
Add career/jobs tracking fields to the CSV schema
"""

import csv
from pathlib import Path

def add_jobs_fields():
    script_dir = Path(__file__).parent
    csv_path = script_dir.parent / "data" / "datacenters.csv"

    # New fields to add
    new_fields = [
        'careers_page_url',
        'jobs_last_checked',
        'open_positions_count',
        'job_categories',
        'hiring_status'
    ]

    # Read existing data
    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        header = reader.fieldnames
        rows = list(reader)

    # Insert new fields before 'notes'
    notes_index = header.index('notes')
    new_header = list(header[:notes_index]) + new_fields + [header[notes_index]]

    # Write updated CSV
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=new_header)
        writer.writeheader()

        for row in rows:
            # Add empty values for new fields
            for field in new_fields:
                row[field] = ''
            writer.writerow(row)

    print(f"✓ Added {len(new_fields)} career-related fields to CSV")
    print(f"  New fields: {', '.join(new_fields)}")
    print(f"  Total fields now: {len(new_header)}")

if __name__ == "__main__":
    add_jobs_fields()
