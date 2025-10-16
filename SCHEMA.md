# Data Center Database Schema v2.0

## Overview
Comprehensive 47-field schema tracking US data centers across sustainability, investment, network, education, and operational dimensions.

## Field Categories (47 total fields)

### 1. Core Identity (6 fields)
- `id` - Unique identifier
- `name` - Facility name
- `operator` - Company/organization
- `city` - City location
- `state` - State/province
- `country` - Country code

### 2. Geographic (3 fields)
- `latitude` - Decimal degrees
- `longitude` - Decimal degrees
- `nearest_university_miles` - Distance to nearest university

### 3. Facility Details (6 fields)
- `status` - Existing / Under Construction / Permitted
- `facility_type` - Hyperscale / Colocation / HPC/AI / Hyperscale AI
- `capacity_mw` - Power capacity (megawatts)
- `year_opened` - Year operational
- `size_sqft` - Square footage
- `url` - Facility website

### 4. Sustainability Metrics (7 fields)
- `pue` - Power Usage Effectiveness (1.0 = perfect)
- `renewable_energy_pct` - % renewable energy (0-100)
- `water_usage_mgd` - Million gallons per day
- `water_stress` - Low / Medium / High / Extremely High
- `cooling_type` - Technology used
- `carbon_intensity_gco2_kwh` - gCO2 per kWh
- `certifications` - LEED, Uptime Tier, ISO, etc.

### 5. Network & Connectivity (3 fields)
- `connectivity_providers` - ISPs and carriers
- `network_exchanges` - Peering points
- `latency_zone_ms` - Latency to major metros

### 6. Investment & Real Estate (2 fields)
- `cost_tier` - Low / Medium / High
- `min_commitment_months` - Minimum contract length

### 7. Education & Data Sovereignty (5 fields)
- `data_sovereignty` - US-Only / US-Regional / US-West / Flexible
- `education_pricing` - Yes / No / Possible
- `api_access` - Programmatic access available
- `edge_compute` - Edge computing support
- `suitable_small_workloads` - Good for schools/small orgs

### 8. Power & Backup Infrastructure (5 fields) 🆕
- `diesel_generators_count` - Number of backup generators on site
- `generator_capacity_mw` - Total backup power capacity (megawatts)
- `diesel_fuel_capacity_gallons` - Total diesel fuel storage
- `ups_capacity_mw` - Uninterruptible Power Supply capacity
- `battery_backup_minutes` - Battery runtime at full load

### 9. Energy Operations (3 fields) 🆕
- `grid_operator` - Utility company providing power
- `energy_sources` - Primary energy sources (grid, solar, wind, nuclear, etc.)
- `onsite_renewable_generation_mw` - On-site renewable capacity

### 10. Tenant & Occupancy Data (6 fields) 🆕
- `ownership_model` - Single-tenant / Multi-tenant / Hybrid
- `tenant_count` - Number of distinct tenants
- `rack_count_total` - Total racks available
- `rack_count_occupied` - Racks currently in use
- `rack_utilization_pct` - Percentage of racks occupied (0-100)
- `major_tenants` - Comma-separated list of known major tenants

### 11. Notes (1 field)
- `notes` - Additional contextual information

## Use Cases

### 1. Sustainability Analysis
Track environmental impact, PUE, renewable energy, water usage, and carbon footprint. **New additions** enable tracking of backup power infrastructure and fossil fuel dependency.

### 2. Investment & Real Estate
Market analysis, construction pipeline, operator trends. **New additions** provide occupancy rates and tenant diversification metrics for investment analysis.

### 3. Network Infrastructure
Connectivity mapping, latency optimization, peering strategy.

### 4. Education Data Sovereignty
Local AI model hosting, student data ownership, cost-effective options for schools. **New additions** help identify facilities with available capacity and tenant-friendly models.

### 5. Operational Intelligence 🆕
**Enabled by new fields:**
- Generator dependency analysis (diesel vs. battery)
- Energy source diversification
- Tenant concentration risk
- Capacity planning and utilization
- Backup power readiness

## Data Collection Strategy

### Tier 1: Publicly Available (Most fields)
- Facility name, location, operator
- Status, capacity, year opened
- Certifications
- Website data

### Tier 2: Industry Reports & Filings
- PUE, renewable energy %
- Major tenants (for public colocation)
- Network connectivity

### Tier 3: Requires Outreach 🔒
- Exact generator counts
- Diesel fuel capacity
- Rack-level occupancy
- Education pricing
- Tenant breakdowns

Many Tier 3 fields may remain null initially but can be populated through:
- Direct facility contact
- RFPs and quotes
- Industry partnerships
- Public permit databases

## Schema Updates

**v1.0** (Initial) - 33 fields
**v2.0** (Current) - 47 fields
- Added: Power & Backup Infrastructure (5)
- Added: Energy Operations (3)
- Added: Tenant & Occupancy Data (6)

## Vision: Educational AI Sovereignty

This schema enables schools to:
1. **Find capacity** - Identify facilities with available racks
2. **Assess readiness** - Verify backup power and reliability
3. **Evaluate costs** - Compare tenant models and pricing
4. **Ensure sovereignty** - Keep student data within geographic boundaries
5. **Plan operations** - Understand energy sources and sustainability

**"Carbon capture for educational data"** - Keeping student-generated data working for students, not corporations.
