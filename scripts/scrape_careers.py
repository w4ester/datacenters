#!/usr/bin/env python3
"""
Scrape career/job openings for data center operators
Real-time integration to show active hiring at each facility

Sources:
- Company career pages
- LinkedIn Jobs
- Indeed
- Greenhouse/Lever APIs where available
"""

import json
import csv
from datetime import datetime
from pathlib import Path
from urllib.parse import quote_plus

# Example career page patterns for major operators
CAREER_PAGES = {
    'Amazon Web Services': {
        'url': 'https://www.amazon.jobs/en/search?base_query=data+center&loc_query=',
        'api_url': 'https://www.amazon.jobs/en/search.json?base_query=data+center&loc_query=',
        'type': 'json'
    },
    'Google': {
        'url': 'https://www.google.com/about/careers/applications/jobs/results/?q=data%20center',
        'api_url': 'https://careers.google.com/api/v3/search/?q=data%20center',
        'type': 'json'
    },
    'Microsoft': {
        'url': 'https://careers.microsoft.com/us/en/search-results?keywords=data%20center',
        'api_url': 'https://gcsservices.careers.microsoft.com/search/api/v1/search?q=data%20center',
        'type': 'json'
    },
    'Meta': {
        'url': 'https://www.metacareers.com/jobs?q=data%20center',
        'type': 'greenhouse'
    },
    'Equinix': {
        'url': 'https://careers.equinix.com/jobs',
        'type': 'workday'
    },
    'Digital Realty': {
        'url': 'https://www.digitalrealty.com/careers',
        'type': 'workday'
    },
    'CoreSite': {
        'url': 'https://www.coresite.com/careers',
        'type': 'workday'
    },
    'Switch': {
        'url': 'https://www.switch.com/careers/',
        'type': 'custom'
    },
    'CyrusOne': {
        'url': 'https://www.cyrusone.com/careers/',
        'type': 'custom'
    }
}

# Job aggregator patterns
AGGREGATOR_PATTERNS = {
    'linkedin': 'https://www.linkedin.com/jobs/search/?keywords={operator}%20{city}&location={city}%2C%20{state}',
    'indeed': 'https://www.indeed.com/jobs?q={operator}%20{city}&l={city}%2C%20{state}',
    'glassdoor': 'https://www.glassdoor.com/Job/jobs.htm?sc.keyword={operator}%20{city}&locT=C&locId={city}',
}

def get_career_page_url(operator, city=None, state=None):
    """Generate career page URL for an operator"""
    if operator in CAREER_PAGES:
        base = CAREER_PAGES[operator]['url']
        if city and '{city}' in base:
            base = base.replace('{city}', quote_plus(city))
        if state and '{state}' in base:
            base = base.replace('{state}', quote_plus(state))
        return base
    return None

def get_aggregator_urls(operator, city, state):
    """Generate job aggregator URLs"""
    urls = {}
    for name, pattern in AGGREGATOR_PATTERNS.items():
        url = pattern.format(
            operator=quote_plus(operator),
            city=quote_plus(city),
            state=state
        )
        urls[name] = url
    return urls

def scrape_operator_jobs(operator, city=None, state=None):
    """
    Scrape jobs for a specific operator/location

    In production, this would:
    1. Check if operator has a public API (Greenhouse, Lever, etc.)
    2. Fall back to HTML parsing with BeautifulSoup/Selenium
    3. Cache results for performance
    4. Return structured job data
    """
    career_url = get_career_page_url(operator, city, state)
    aggregator_urls = get_aggregator_urls(operator, city, state) if city and state else {}

    # Mock data structure that would be returned
    result = {
        'operator': operator,
        'location': f"{city}, {state}" if city and state else "All locations",
        'career_page': career_url,
        'aggregator_urls': aggregator_urls,
        'last_checked': datetime.now().isoformat(),
        'jobs_found': 0,  # Would be populated by actual scraping
        'job_categories': [],  # e.g., ["Engineering", "Operations", "Sustainability"]
        'hiring_status': 'Unknown',  # Active / Limited / Not Hiring
        'sample_jobs': []  # First 5 job titles
    }

    return result

def update_csv_with_careers(csv_path):
    """
    Update CSV with career data
    Reads existing data, scrapes jobs, adds career fields
    """
    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        header = list(reader.fieldnames)
        rows = list(reader)

    # Check if career fields exist
    career_fields = ['careers_page_url', 'jobs_last_checked', 'open_positions_count', 'job_categories', 'hiring_status']
    has_career_fields = all(f in header for f in career_fields)

    if not has_career_fields:
        print("❌ CSV missing career fields. Add them first.")
        return

    # Update each row with career data
    updated = 0
    for row in rows:
        operator = row.get('operator')
        city = row.get('city')
        state = row.get('state')

        if operator:
            job_data = scrape_operator_jobs(operator, city, state)
            row['careers_page_url'] = job_data['career_page'] or ''
            row['jobs_last_checked'] = job_data['last_checked']
            row['open_positions_count'] = str(job_data['jobs_found'])
            row['job_categories'] = ','.join(job_data['job_categories'])
            row['hiring_status'] = job_data['hiring_status']
            updated += 1
            print(f"  ✓ Updated careers for {operator}")

    # Write back
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=header)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n✓ Updated {updated} facilities with career data")

def generate_jobs_json(csv_path, output_path):
    """
    Generate a jobs.json file for real-time map integration
    This would be regenerated periodically (daily/weekly)
    """
    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    jobs_data = {}
    for row in rows:
        facility_id = row.get('id')
        operator = row.get('operator')
        city = row.get('city')
        state = row.get('state')

        if facility_id and operator:
            job_info = scrape_operator_jobs(operator, city, state)
            jobs_data[facility_id] = {
                'operator': operator,
                'location': f"{city}, {state}",
                'career_page': job_info['career_page'],
                'aggregator_urls': job_info['aggregator_urls'],
                'open_positions': job_info['jobs_found'],
                'last_updated': job_info['last_checked'],
                'hiring_status': job_info['hiring_status']
            }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(jobs_data, f, indent=2)

    print(f"✓ Generated jobs data: {output_path}")
    print(f"  {len(jobs_data)} facilities with career information")

if __name__ == "__main__":
    import sys

    script_dir = Path(__file__).parent
    csv_path = script_dir.parent / "data" / "datacenters.csv"
    jobs_json_path = script_dir.parent / "data" / "jobs.json"

    print("📊 Data Center Jobs Scraper")
    print("=" * 50)

    # For now, just generate the jobs.json as proof of concept
    print("\nGenerating jobs data (proof-of-concept)...")
    generate_jobs_json(csv_path, jobs_json_path)

    print("\n💡 Integration:")
    print("  - jobs.json can be loaded by the map")
    print("  - Shows 'X openings' badge on each facility")
    print("  - Links to career pages and job boards")
    print("  - Regenerate daily/weekly for fresh data")
