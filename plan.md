# Sales Floor Digital Twin Implementation Plan

## 1. Objective

Build a web-based Sales Floor Digital Twin that allows users to:

* Create a 2D sales-floor layout using drag-and-drop components similar to draw.io
* Add, move, resize, rotate, and remove retail fixtures
* Maintain physical and business properties for each component
* Automatically render the same floor layout in 3D
* Compare different floor-layout scenarios
* Prepare the architecture for future customer-flow simulation, optimization, AI, and mobile applications

The initial product should focus on accurate floor modeling and usability rather than photorealistic 3D graphics.

---

## 2. Target Architecture

```text
                       WEB APPLICATION
                    Next.js + React + TypeScript
                              │
               ┌──────────────┴──────────────┐
               │                             │
          2D Floor Editor                3D Viewer
          React Konva               React Three Fiber
               │                             │
               └──────────────┬──────────────┘
                              │
                       Shared Floor Model
                              │
                       Zustand State
                              │
                         API Layer
                              │
                         FastAPI
                              │
                    PostgreSQL + PostGIS
                              │
              ┌───────────────┴───────────────┐
              │                               │
       Simulation Engine                 Asset Storage
         Python / OR-Tools                 GLB / glTF
```

The 2D and 3D views must use the same underlying floor object model.

There should be no separate "2D data" and "3D data".

---

# 3. Phase 1: Foundation and Floor Data Model

## Objective

Establish the core architecture before developing the graphical editor.

## Deliverables

### 3.1 Project Structure

Create a monorepo:

```text
sales-floor/
│
├── apps/
│   ├── web/
│   └── mobile/             Future
│
├── packages/
│   ├── floor-model/
│   ├── component-library/
│   ├── business-rules/
│   ├── api-client/
│   ├── state/
│   └── 3d-core/
│
└── backend/
    └── FastAPI
```

Recommended tools:

* Next.js
* React
* TypeScript
* Zustand
* Zod
* FastAPI
* PostgreSQL
* PostGIS
* Docker

### 3.2 Define Floor Model

Define the basic hierarchy:

```text
Store
 └── Floor
      ├── Boundary
      ├── Walls
      ├── Zones
      ├── Entrances
      ├── Exits
      └── Fixtures
```

Example fixture model:

```typescript
interface Fixture {
  id: string
  componentType: string

  position: {
    x: number
    z: number
  }

  rotation: number

  dimensions: {
    width: number
    depth: number
    height: number
  }

  properties: Record<string, unknown>

  model3D?: string
}
```

### 3.3 Coordinate Standard

Define one coordinate system for the entire application.

Recommended:

```text
X = horizontal floor direction
Z = vertical floor direction on 2D plan
Y = height in 3D
```

Use meters as the internal unit.

Example:

```text
x = 12.50 m
z = 8.20 m
height = 1.80 m
```

This must remain consistent across 2D, 3D, database, simulation, and mobile.

---

# 4. Phase 2: Component Library

## Objective

Create reusable floor components similar to the shape library in draw.io.

## Initial Components

### Building

* Wall
* Door
* Entrance
* Exit
* Column
* Escalator
* Elevator

### Retail

* Gondola shelf
* Wall shelf
* Rack
* Freezer
* Refrigerator
* Promotion island
* Display stand

### Checkout

* POS counter
* Self-checkout
* Queue barrier

### Simulation

* Customer entrance point
* Customer exit point
* Restricted area
* Service area

Each component must contain both visual and business metadata.

Example:

```json
{
  "type": "gondola",
  "name": "Standard Gondola",
  "defaultWidth": 4,
  "defaultDepth": 0.8,
  "defaultHeight": 1.8,
  "renderer2D": "rectangle",
  "model3D": "gondola-standard.glb"
}
```

---

# 5. Phase 3: 2D Floor Editor MVP

## Objective

Develop the primary design interface.

Technology:

**React Konva**

## User Interface

```text
┌────────────────┬───────────────────────────┬──────────────────┐
│ Component      │                           │ Properties       │
│ Library        │        Floor Editor       │                  │
│                │                           │ Width            │
│ Wall           │                           │ Depth            │
│ Shelf          │                           │ Height           │
│ Freezer        │                           │ Rotation         │
│ Checkout       │                           │ Category         │
│ Promo          │                           │ Capacity         │
│                │                           │                  │
└────────────────┴───────────────────────────┴──────────────────┘
```

## Required Functions

* Drag component from palette
* Drop component onto floor
* Select object
* Move object
* Resize object
* Rotate object
* Delete object
* Duplicate object
* Multi-select
* Zoom
* Pan
* Snap to grid
* Snap to nearby components
* Undo
* Redo
* Copy/paste
* Keyboard shortcuts

## Measurement Functions

Display:

* Width
* Depth
* Position
* Distance between objects
* Aisle width

Example:

```text
Shelf A          Shelf B
████████         ████████
       < 1.8 m >
```

---

# 6. Phase 4: Floor and Scenario Management

## Objective

Allow users to save and manage layouts.

## Main Entities

```text
Store
Floor
Layout
Scenario
Component
Component Version
```

Example:

```text
Central Store A
│
└── Floor 1
     │
     ├── Current Layout
     │
     ├── Scenario A
     │
     ├── Scenario B
     │
     └── Scenario C
```

## Functions

* Save floor layout
* Auto-save changes
* Create new scenario
* Clone existing scenario
* Rename scenario
* Compare scenarios
* Restore previous version
* Publish approved scenario

---

# 7. Phase 5: 3D Viewer

## Objective

Automatically represent the 2D layout as a 3D environment.

Technology:

* Three.js
* React Three Fiber
* GLB / glTF

## Core Principle

Do not convert the 2D image into 3D.

Instead:

```text
                 Floor Object

        x = 10
        z = 12
        width = 4
        depth = 0.8
        height = 1.8
        rotation = 90

             /             \
            /               \
           ▼                 ▼

       2D Renderer        3D Renderer
       Rectangle          GLB Shelf
```

## Initial 3D Functions

* Orbit camera
* Zoom
* Pan
* Walkthrough camera
* Select object
* Highlight selected object
* Show object properties
* Hide/show categories
* Switch between 2D and 3D

Later implement split view:

```text
┌─────────────────────────┬─────────────────────────┐
│          2D             │           3D            │
│                         │                         │
│ ████      ████          │  Shelf      Shelf      │
│                         │                         │
│      ███████            │      Promo Area         │
│                         │                         │
└─────────────────────────┴─────────────────────────┘
```

Changes made in 2D should immediately appear in 3D.

---

# 8. Phase 6: Business Rules

## Objective

Make the application understand retail-floor constraints.

Initial rules should include:

### Physical Rules

* Minimum aisle width
* Component overlap
* Component outside floor boundary
* Blocked entrance
* Blocked emergency exit
* Restricted zone violation

Example:

```text
WARNING

Aisle between:

Shelf A
Shelf B

Width: 1.15 m

Minimum required: 1.50 m
```

### Retail Rules

Later rules can include:

* Required distance between categories
* Maximum shelf density
* Checkout queue space
* Promotion visibility
* Category adjacency
* Fixture compatibility

---

# 9. Phase 7: Simulation Foundation

## Objective

Prepare the application for customer-flow simulation.

Technologies:

* Python
* NumPy
* Shapely
* NetworkX
* PostGIS

Create a navigable representation of the floor.

```text
Entrance
   │
   ▼
Fresh Food
   │
   ├──── Beverage
   │
   ▼
Promotion
   │
   ▼
Checkout
```

Initial simulation should calculate:

* Walking distance
* Accessible areas
* Dead zones
* Path obstruction
* Potential congestion areas

Do not start with complex AI-based customer simulation.

Start with deterministic rules and pathfinding.

---

# 10. Phase 8: Customer Traffic Simulation

## Objective

Simulate multiple customer journeys through the store.

Example:

```text
Customer 001
Entrance
→ Fresh Food
→ Beverage
→ Checkout

Customer 002
Entrance
→ Promotion
→ Snack
→ Beverage
→ Checkout
```

Outputs:

* Heatmap
* Traffic density
* Average walking distance
* Congestion
* Zone visits
* Shelf exposure

Example:

```text
Traffic Heatmap

LOW                    HIGH

░░░░░░▒▒▒▒▓▓████
```

Users should be able to compare:

```text
Current Layout
vs
Scenario A
```

---

# 11. Phase 9: Data Integration

## Objective

Connect the digital twin with real enterprise data.

Potential data sources:

### POS

* Sales
* Transactions
* Category performance
* SKU performance

### Product Master

* SKU
* Category
* Brand
* Shelf requirements

### Store Master

* Store
* Floor
* Area
* Format

### Traffic Data

Potential sources:

* CCTV analytics
* Wi-Fi
* Sensors
* Mobile application
* People counters

The architecture should support data integration through APIs rather than direct database coupling.

---

# 12. Phase 10: Scenario Comparison

Create an analysis screen:

| Metric                   |  Current | Scenario A | Difference |
| ------------------------ | -------: | ---------: | ---------: |
| Selling area             | 1,200 m² |   1,230 m² |      +2.5% |
| Shelf capacity           |   24,000 |     25,200 |      +5.0% |
| Average walking distance |    186 m |      171 m |      -8.1% |
| Promo exposure           |      32% |        43% |     +11 pp |
| Congestion score         |       72 |         58 |       -19% |

This is where the product starts becoming a decision-support tool rather than a drawing application.

---

# 13. Phase 11: Layout Optimization

## Objective

Automatically generate layout alternatives.

Technology:

**Google OR-Tools**

Input constraints:

```text
Keep aisle >= 1.8 m
Keep all current shelves
Increase beverage capacity
Increase promotion space
Do not move checkouts
Do not block emergency exits
```

Output:

```text
Option A
Option B
Option C
```

Each option should be evaluated using the simulation engine.

---

# 14. Phase 12: AI Assistant

AI should be added after the floor model, rules, and simulation are reliable.

Example request:

> Move beverage closer to snacks, increase promotional exposure, and maintain a minimum aisle width of 1.8 meters.

Flow:

```text
User Request
     │
     ▼
LLM
     │
     ▼
Structured Constraints
     │
     ▼
Optimization Engine
     │
     ▼
Candidate Layouts
     │
     ▼
Simulation
     │
     ▼
Comparison
```

The LLM should interpret intent.

The simulation and optimization engines should determine whether the proposed design is valid.

---

# 15. Mobile-Ready Architecture

The web product should be developed so that the business logic can later support:

```text
Desktop Web
     │
     ├── Full Floor Editor
     ├── Administration
     ├── Simulation
     └── Scenario Analysis


iPad
     │
     ├── Floor Review
     ├── Move / Edit Fixtures
     ├── 3D View
     ├── Store Walkthrough
     └── Apple Pencil


iPhone
     │
     ├── View Layout
     ├── 3D Walkthrough
     ├── Approval
     └── Store Inspection
```

Recommended future mobile stack:

* Expo
* React Native
* TypeScript
* Zustand
* React Three Fiber Native
* React Native Skia

Shared packages should include:

```text
floor-model
business-rules
api-client
state
simulation-types
component definitions
3d-core
```

---

# 16. Recommended Delivery Roadmap

## Release 1: Floor Planner MVP

Target capabilities:

* Create floor
* Component library
* Drag/drop
* Move
* Resize
* Rotate
* Properties
* Save/load
* Grid
* Measurement
* Undo/redo

This release should already be usable for basic sales-floor planning.

---

## Release 2: Digital Twin

Add:

* 3D representation
* GLB component models
* 2D/3D synchronization
* Walkthrough
* Split view

At this stage, the product becomes a true digital floor representation.

---

## Release 3: Smart Floor Planner

Add:

* Minimum aisle validation
* Collision detection
* Restricted zones
* Business rules
* Floor quality checks

---

## Release 4: Simulation

Add:

* Customer paths
* Heatmaps
* Traffic density
* Congestion
* Exposure
* Scenario comparison

---

## Release 5: Data-Driven Digital Twin

Integrate:

* POS
* Product master
* Customer traffic
* Store data

Use real-world data to calibrate simulation.

---

## Release 6: AI Layout Optimizer

Add:

* Natural-language commands
* Constraint generation
* Automatic layout alternatives
* Optimization
* Scenario ranking based on selected business metrics

---

# 17. Recommended Initial Scope

The first MVP should deliberately remain small.

Build only:

```text
1. Store / floor creation
2. Component library
3. 2D drag-and-drop editor
4. Component properties
5. Save/load layout
6. Measurement
7. Basic rule validation
8. Simple 3D rendering
```

Do not initially build:

* AI
* Realistic customer simulation
* AR
* LiDAR
* Photorealistic graphics
* Full BIM integration
* Complex SKU-level planograms

Those capabilities should be added after the underlying floor model proves stable.

---

# 18. Suggested Development Sequence

```text
Floor Data Model
      ↓
Component Library
      ↓
2D Editor
      ↓
Save / Load
      ↓
Measurements
      ↓
Rules / Collision
      ↓
3D Renderer
      ↓
Scenario Management
      ↓
Simulation
      ↓
Enterprise Data
      ↓
Optimization
      ↓
AI
      ↓
Mobile / AR
```

The most important milestone is not 3D.

The most important milestone is creating a reliable **structured floor model**.

Once that exists, 2D, 3D, simulation, AI, mobile, and future AR become different ways of interacting with the same digital representation.
