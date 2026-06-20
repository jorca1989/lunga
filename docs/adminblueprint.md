Administrators

Next.js Web Dashboard

Accessed through browser.

Examples:

municipality.yourapp.co.ao
admin.yourapp.co.ao

or

app.yourapp.co.ao/admin

No EXE.

No Electron.

No desktop software.

Why?

Because:

Government offices already have browsers.
Easier deployment.
Easier updates.
Easier support.
Lower development cost.
You're Correct About Admin Structure

This is NOT:

Citizen
↓
Admin

This is more like:

Super Admin
    ↓
Tenant Admin
    ↓
Department Manager
    ↓
Supervisor
    ↓
Field Operator
Government Hierarchy Blueprint

Think of it like this:

National Government

├── Ministry of Public Works
├── Ministry of Energy & Water
├── Ministry of Environment
├── Provincial Governments
└── Municipal Administrations
Tenant Structure

Example:

Luanda Municipality

├── Waste Department
├── Roads Department
├── Water Department
├── Electricity Department
└── Public Safety Department

Each department manages only its category.

User Roles
Citizen

Can:

Report
Comment
Follow
View Map

Cannot:

Modify reports
Assign tasks
Field Operator

Examples:

Waste Collector
Road Contractor
Utility Worker

Can:

View assignments
Upload proof
Update progress

Cannot:

Approve work
Supervisor

Can:

Assign tasks
Review submissions
Approve work
Reject work

Example:

Waste Department Supervisor

Department Manager

Can:

View all department reports
Manage supervisors
Track KPIs

Example:

Director of Waste Operations

Municipality Admin

Can:

Access all departments
Configure workflows
View municipality analytics

Example:

Municipal Administrator

Provincial Admin

Can:

View all municipalities in province

Example:

Governor's Office Dashboard

Ministry Admin

Can:

View national statistics
Compare municipalities
Generate reports

Example:

Ministry of Public Works

Super Admin

You.

Can:

Manage tenants
Manage subscriptions
Configure platform
View everything
Dashboard Structure
Dashboard

KPIs

Total Reports
Open Reports
Resolved Reports
Response Time
Resolution Time
Map
Heatmaps
Clusters
Hotspots
Live Issues
Reports
Open
Assigned
In Progress
Resolved
Rejected
Tasks
Assignments
Field Operations
Work Orders
Waste Operations
Collectors
Jobs
Verification
Before/After Photos
Payments
Analytics
Category Trends
Department Performance
Municipality Rankings
Users
Citizens
Operators
Supervisors
Admins
Settings
Roles
Permissions
Departments
Integrations
Database Architecture

This is where many AI-generated projects fail.

Every table should include:

tenantId
departmentId
createdBy

Example:

reports

{
  _id,
  tenantId,
  departmentId,
  citizenId,
  category,
  status,
  location,
  createdAt
}

Without this you'll regret it later.

Most Important File You Don't Have Yet

Create:

ADMIN_ARCHITECTURE.md

Give the LLM this file.

ADMIN_ARCHITECTURE.md
Philosophy

Administrators are not a single role.

The platform serves multiple government levels and departments.

Permissions must be role-based and tenant-aware.

Hierarchy

Super Admin

↓

National Ministry Admin

↓

Provincial Admin

↓

Municipality Admin

↓

Department Manager

↓

Supervisor

↓

Field Operator

↓

Citizen

Department Examples

Waste Management

Road Maintenance

Electricity

Water

Drainage

Public Safety

Traffic Signals

Environment

Rules

Every user belongs to:

Tenant
Department
Role

Permissions must always be checked against all three.

Super Admin

Can access all tenants.

Can create tenants.

Can manage subscriptions.

Can manage platform configuration.

Ministry Admin

Can access all provinces and municipalities under ministry authority.

Can generate national reports.

Cannot access platform billing.

Provincial Admin

Can access all municipalities within a province.

Can view province-wide analytics.

Municipality Admin

Can access all departments within municipality.

Can configure local workflows.

Can manage users.

Department Manager

Can access only assigned department.

Can monitor KPIs.

Can assign supervisors.

Supervisor

Can assign field operators.

Can approve work.

Can reject work.

Field Operator

Can only access assigned tasks.

Can upload evidence.

Can update task status.

Citizen

Can submit reports.

Can comment.

Can follow reports.

Cannot access administration tools.

My biggest architectural recommendation

Build:

1 Mobile App

Citizens
Field Operators

1 Web Dashboard

Supervisors
Managers
Municipalities
Ministries
You (Super Admin)

Don't build separate apps for every role.