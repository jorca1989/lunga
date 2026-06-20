# GUIDE.md

# Project Vision

This platform is not a complaints portal.

It is a Citizen Engagement and Urban Operations Platform designed for Angola.

The platform connects citizens, municipalities, ministries, utility providers, contractors, waste collectors, and public administrators through a single digital ecosystem.

The long-term objective is to become the digital infrastructure layer for reporting, managing, resolving, and analyzing urban issues across Angola.

The citizen application generates participation.

The operations layer coordinates execution.

The government dashboard generates intelligence.

Together they create accountability, transparency, and better public services.

---

# Core Problem

Urban issues are currently reported through fragmented channels:

* WhatsApp
* Phone calls
* Facebook posts
* Informal complaints
* Paper processes
* Physical visits to municipal offices

This creates:

* Lost complaints
* Duplicate reports
* Lack of transparency
* Slow response times
* Poor visibility for administrators
* Limited citizen trust

The platform creates a structured and transparent workflow from report creation to issue resolution.

---

# Platform Pillars

## Citizen Participation

Citizens should actively contribute to improving their communities.

The platform should encourage reporting, engagement, and accountability.

---

## Transparency

Citizens should be able to see:

* Existing reports
* Resolution progress
* Historical issues
* Municipal performance

Public visibility is a feature, not a side effect.

---

## Location First

Every report must have a geographic context.

Maps are a primary interface, not an optional feature.

---

## Evidence Based

Every report and resolution should be supported by:

* Photos
* GPS coordinates
* Timestamps
* Audit history

---

## Community Driven

Citizens should help validate priorities.

The community can signal importance through engagement and issue following.

---

# User Types

## Citizen

Can:

* Create reports
* Upload photos
* Share location
* Comment
* Follow reports
* Like reports
* Receive notifications
* Build reputation

---

## Waste Collector / Field Operator

Can:

* Accept jobs
* View assignments
* Navigate to locations
* Upload before photos
* Upload after photos
* Submit completion evidence

Examples:

* Waste collectors
* Contractors
* Utility workers
* Maintenance teams

---

## Supervisor

Can:

* Review evidence
* Approve work
* Reject work
* Assign operators
* Monitor performance

---

## Government Administrator

Can:

* Manage reports
* View analytics
* Generate reports
* Monitor KPIs
* Manage departments
* Manage operators
* Monitor SLAs

---

# Mobile App Navigation

## Feed

Purpose:

Community engagement.

Features:

* Reports feed
* Comments
* Likes
* Shares
* Updates
* Trending issues

The feed is the primary citizen engagement surface.

---

## Map

Purpose:

Public transparency.

Features:

* View nearby reports
* View resolved reports
* Heatmaps
* Category filters
* Municipality filters

Citizens and administrators both use maps.

---

## Report

Purpose:

Issue submission.

Features:

* Take photo
* Select category
* GPS capture
* Description
* Submit

This is the most important action in the application.

---

## My Activity

Purpose:

Track participation.

Features:

* My reports
* Followed reports
* Notifications
* Status updates
* Contribution history

---

## Profile

Purpose:

Identity and reputation.

Features:

* Badges
* Achievements
* Reputation score
* Contribution statistics

---

# Reputation & Gamification

Purpose:

Increase engagement and data quality.

Examples:

Badges:

* First Report
* Community Watcher
* Waste Hunter
* Road Guardian
* Top Contributor

Metrics:

* Reports submitted
* Reports verified
* Resolved reports contributed
* Community engagement

Citizens should feel recognized for participation.

---

# Core Modules

## Module 1 - Citizen Reporting

Status: MVP

Categories:

* Waste
* Potholes
* Water
* Electricity
* Drainage
* Public Safety
* Traffic Signals
* Environment
* Illegal Dumping
* Other

Features:

* Photo upload
* GPS capture
* Description
* Category selection

---

## Module 2 - Community Feed

Status: MVP

Features:

* Public feed
* Comments
* Likes
* Shares
* Follow report
* Trending reports

Reports become community discussions.

---

## Module 3 - Mapping Platform

Status: MVP

Features:

* Interactive map
* Heatmaps
* Clustering
* Filters
* Nearby issues

The map is available to both citizens and administrators.

---

## Module 4 - Complaint Lifecycle Management

Status: MVP

Statuses:

* Open
* Under Review
* Assigned
* In Progress
* Resolved
* Rejected

Every change must be logged.

Full audit trail required.

---

## Module 5 - Waste Management Marketplace

Status: Phase 2

Purpose:

Transform waste reports into actionable cleanup jobs.

Workflow:

Citizen reports waste.

↓

Issue approved.

↓

Cleanup task created.

↓

Operator accepts task.

↓

Before photo uploaded.

↓

Cleanup performed.

↓

After photo uploaded.

↓

Supervisor validates.

↓

Task completed.

---

## Module 6 - Operator Management

Status: Phase 2

Features:

* Operator profiles
* Performance metrics
* Job history
* Ratings
* Verification status

---

## Module 7 - Analytics Dashboard

Status: MVP

Metrics:

* Reports created
* Reports resolved
* Resolution times
* Category breakdown
* Geographic hotspots
* Municipality rankings

---

## Module 8 - SLA Monitoring

Status: Phase 2

Track:

* Assignment speed
* Response speed
* Resolution speed

Used by municipalities and ministries.

---

## Module 9 - Executive Reporting

Status: Phase 2

Generate:

* PDF reports
* Excel reports
* Monthly reports
* Quarterly reports
* Annual reports

Target:

* Municipal Administrators
* Provincial Governments
* Ministries

---

# Multi-Tenant Architecture

The platform must support:

* Municipalities
* Provinces
* Ministries
* Utility Providers

Each tenant has:

* Isolated data
* Isolated users
* Independent dashboards
* Independent permissions

All backend logic must be tenant-aware.

---

# Monetization

Primary Customers:

* Municipalities
* Provincial Governments
* Ministries
* Utility Companies

Revenue Sources:

* SaaS subscriptions
* Dashboard licenses
* Reporting modules
* Analytics modules
* Waste operations management

Citizens use the platform free of charge.

---

# Technical Architecture

Citizen App:

* React Native
* Expo

Admin Dashboard:

* Next.js

Backend:

* Convex

Maps:

* Mapbox

Authentication:

* Phone OTP

Storage:

* Convex Storage

Notifications:

* Push Notifications

---

# Success Metrics

Phase 1:

* 1,000 citizen registrations
* 500 reports submitted
* 100 active weekly users

Phase 2:

* First municipality onboarded
* Waste operations active
* First paid pilot

Phase 3:

* Multi-municipality deployment
* Provincial adoption
* National expansion

---

# Non Goals

The platform is not:

* A social media platform
* A political platform
* A news platform

Social features exist only to improve civic participation, transparency, and issue resolution.

The primary mission is to improve urban operations and public service delivery.
