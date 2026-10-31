# 3D Interactive Data Centre Water Consumption, Cooling and Conservation Simulation

An academic, interactive, 3D WebGL scientific simulation developed to accompany the research paper:
> **"Why Data Centres Consume So Much Water and How Water Consumption Can Be Reduced"**

---

## 📑 Project Overview

As cloud computing and artificial intelligence workloads expand exponentially, data centres have become critical national infrastructure. However, their enormous thermal dissipation necessitates massive cooling systems, making data centres one of the fastest-growing consumers of potable municipal water and regional freshwater resources.

This simulation provides a **rigorous engineering visualization** designed for university faculty, researchers, and data centre infrastructure engineers to explore:
1. **Physical Architecture**: Complete industrial building, 45U server racks, hot/cold aisle containment, CRAH units, centrifugal chillers, plate-and-frame economizers, VFD circulation pumps, and rooftop heat rejection equipment.
2. **7-Stage Animated Water Journey**: From raw water intake, storage buffer, and hydronic pumping to heat absorption, evaporative phase-change rejection, closed-loop recirculation, and scientific water loss accounting.
3. **Live Mathematical Panel**: Real-time evaluation of:
   - **Direct Water Usage Effectiveness** ($\text{WUE}_{site}$) per ISO/IEC 30134-9 and The Green Grid.
   - **Lifecycle Water Footprint** ($\text{WUE}_{source}$) integrating power grid thermoelectric water intensity (EWIF).
   - **Cooling Tower Mass Balance** ($M = E + B + D$) and Cycles of Concentration ($CoC$).
   - **Water Conservation Calculations** with tangible ecological equivalents (Olympic pools, household annual consumption).
4. **Cooling Technology Switcher**: Real-time dynamic swapping between:
   - **Water-Based Evaporative Cooling** (Cooling tower + Chiller + CRAH).
   - **Air-Based Dry Cooling** (Rooftop dry coolers + DX chiller, zero site water).
   - **Direct Liquid / Immersion Cooling** (Dielectric fluid immersion tanks + CDU, high-density AI clusters).
5. **Interactive Component Inspection**: Raycasting-enabled selection of any 3D asset displaying working principles, purpose, water relevance, and literature citations.
6. **Guided Faculty Presentation Mode**: A 10-slide automated academic tour with smooth camera waypoints, visual highlights, equations, and research citations.

---

## 🔬 Academic Research Grounding & Citations

This simulation adheres strictly to empirical data, thermodynamics, and published literature from the uploaded research papers:

### 1. David Mytton (2021)
- **Publication**: *npj Clean Water* (Nature Portfolio), 4(1), 1–11.
- **Title**: *"Data centre water consumption"*
- **Key Findings Implemented**:
  - A standard **1 MW IT capacity data centre consumes ~25.5 million litres of water annually** under evaporative cooling.
  - Formulates the vital distinction between **direct on-site water** ($\text{WUE}_{site}$) and **indirect thermoelectric water** ($\text{WUE}_{source}$).
  - Elevating chilled water supply setpoints from 7°C to 18°C improves chiller COP, saving over **35% chiller compressor electrical power** and extending free-cooling hours.
  - Liquid immersion cooling achieves **96% heat capture directly into fluid**, enabling chiller-free operation.

### 2. Bora Ristic, Madani, & Castillo (2015)
- **Publication**: *Sustainability*, 7(8), 10748–10773.
- **Title**: *"The Water Footprint of Data Centers"*
- **Key Findings Implemented**:
  - Derives the cooling tower mass balance: $\text{Make-up} = \text{Evaporation} + \text{Blowdown} + \text{Drift}$.
  - Demonstrates that increasing **Cycles of Concentration (CoC) from 3x to 7x slashes blowdown water by 67%**.
  - Identifies the regional trade-off: Air-cooled chillers in arid climates (e.g., Phoenix, AZ) eliminate direct water consumption but increase electrical consumption by 15–20%, shifting water consumption back to the electrical power plant.

### 3. ITU-T L.Suppl.55 (10/2022)
- **Publication**: *ITU Telecommunication Standardization Sector Recommendation*
- **Title**: *"Water management of data centres for UN Sustainable Development Goal 6"*
- **Key Findings Implemented**:
  - Establishes the **Water Circularity Ratio (WCR)** and standards for rainwater harvesting.
  - Quantifies CRAH coil **condensate recovery** (capturing 2,000 to 10,000 L/day of pure water per MW).
  - Outlines waste heat export from liquid cooling loops (45°C–55°C) to municipal district heating networks.

### 4. Semenov & Oganesyan (2021)
- **Publication**: *Applied Thermal Engineering*
- **Title**: *"Impact of Fuel Diversity on Energy Water Intensity"*
- **Key Findings Implemented**:
  - Quantifies Energy Water Intensity Factors (EWIF):
    - Subcritical Coal (Wet Cooling): **2.45 L/kWh**
    - Natural Gas Combined Cycle: **0.95 L/kWh**
    - US National Average: **1.80 L/kWh**
    - EU Grid Mix: **1.20 L/kWh**
    - Solar PV / Wind PPA: **0.05 L/kWh**

### 5. Indian Data Centre Growth & Water Scarcity Context
- **Context**: Rapid expansion from 375 MW (2020) to 1,500 MW (2025) and projected **13.56 GW by 2031–32** (Indian CEA).
- **Water Stress**: Megawatt hyperscale hubs in Chennai, Mumbai, Hyderabad, and Bengaluru face acute seasonal water stress. In Mekaguda (Telangana) and Visakhapatnam, massive local pushback underscores the urgency of zero-water cooling architectures and rainwater reclamation skids.

---

## 🧮 Mathematical Formulations Implemented

### A. Water Usage Effectiveness (WUE)

$$\text{WUE}_{site} = \frac{\text{Annual Site Water Consumption (Litres)}}{\text{Annual IT Equipment Energy Consumption (kWh)}} \quad [\text{L/kWh}]$$

For our 1 MW baseline facility (8,760,000 kWh/yr IT load):
$$\text{WUE}_{site} = \frac{25,500,000 \text{ L}}{8,760,000 \text{ kWh}} = 2.911 \text{ L/kWh}$$

### B. Lifecycle Source Water Footprint

$$\text{WUE}_{source} = \text{WUE}_{site} + (\text{EWIF} \times \text{PUE}) \quad [\text{L/kWh}]$$

Where:
- $\text{EWIF}$ = Energy-Water Intensity Factor of electrical grid (L/kWh)
- $\text{PUE}$ = Power Usage Effectiveness ($\text{Total Facility Power} / \text{IT Power}$)

$$\text{WUE}_{source} = 2.911 + (1.80 \times 1.25) = 2.911 + 2.250 = 5.161 \text{ L/kWh}$$

### C. Cooling Tower Mass Balance & Cycles of Concentration

$$\text{Make-up Water } (M) = \text{Evaporation } (E) + \text{Blowdown } (B) + \text{Drift } (D)$$

In steady-state chemical equilibrium:
$$B = \frac{E}{\text{CoC} - 1}$$
$$M = E \left[ \frac{\text{CoC}}{\text{CoC} - 1} \right] + D$$

At $\text{CoC} = 4.0$:
- $\text{Evaporation } (E) = 75.0\%$ of make-up
- $\text{Blowdown } (B) = 24.9\%$ of make-up
- $\text{Drift } (D) = 0.1\%$ of make-up

### D. Water Conservation & Reduction

$$\text{Water Saved (L)} = \text{Baseline Consumption} \times \frac{\text{Reduction \%}}{100}$$
$$\text{New Consumption (L)} = \text{Baseline} - \text{Water Saved}$$

---

## 🛠️ Software Architecture & Tech Stack

- **Rendering Engine**: Three.js (WebGL, r160)
- **Programming Language**: Modern ECMAScript (ES2022+ Modules)
- **Styling**: Responsive CSS3 with glassmorphism HUD, CSS Grid, Flexbox, custom sliders
- **Math Engine**: KaTeX LaTeX typesetting and analytical numerical balance
- **Zero-Dependency Direct Browser Mode**: Built with standard ES import maps linking to official CDN mirrors (`three.module.js`), allowing direct double-click or local server execution without mandatory NPM compilation.

### Directory Structure
```
datacenter-simulation/
├── index.html                   # Main application entry point & HUD layout
├── package.json                 # Project configuration (Vite, Three.js)
├── README.md                    # Technical documentation & research mapping
├── css/
│   └── styles.css               # Engineering dark theme stylesheet
└── src/
    ├── main.js                  # Application orchestrator & DOM event bus
    ├── scene.js                 # Three.js viewport, camera tweening, lights
    ├── datacenterModel.js       # Procedural 3D industrial building & equipment
    ├── waterFlowParticles.js    # Particle simulation (pipe flows, plumes, heat)
    ├── mathCalculators.js       # WUE, mass balance, CoC, conservation math
    ├── simulationEngine.js      # 7-stage animated water journey state machine
    ├── coolingTechManager.js    # 3-way cooling technology switcher & 3D swap
    ├── componentInspector.js    # Raycasting interactive component clicker
    └── facultyPresentation.js   # 10-slide guided faculty walkthrough tour
```

---

## 🚀 How to Run the Simulation

### Option 1: Direct Browser Launch (Fastest & Zero Setup)
1. Navigate to the project folder:
   `c:\Users\Gourav Naha\Downloads\REsearch papers\datacenter-simulation\`
2. Double-click or open **`index.html`** in any modern web browser (Google Chrome, Microsoft Edge, Firefox, Brave, Safari).
   *(Note: Modern WebGL and ES module security requires loading via `http://` or a local file server for certain browser cross-origin configurations).*

### Option 2: Using Node.js / Vite (Recommended for Development)
```bash
# 1. Open terminal in the project directory
cd "c:\Users\Gourav Naha\Downloads\REsearch papers\datacenter-simulation"

# 2. Install dependencies
npm install

# 3. Launch local development server
npm run dev
```
Open the provided URL (typically `http://localhost:5173`) in your browser.

### Option 3: Using Python Built-in HTTP Server
```bash
cd "c:\Users\Gourav Naha\Downloads\REsearch papers\datacenter-simulation"
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your web browser.

---

## 🎮 Interactive Controls & Faculty Demonstration Guide

### 1. Viewport Navigation
- **Left-Click + Drag**: Orbit / Rotate 3D camera around building.
- **Right-Click + Drag**: Pan camera horizontally and vertically.
- **Scroll Wheel**: Zoom in / out.
- **Roof Toggle**: Check/uncheck "Roof" in the top bar to expose interior server hall and mechanical room.
- **Heat Map Toggle**: Visualizes thermal gradients (red hot aisle vs. blue cold aisle).

### 2. Guided Faculty Walkthrough
1. Click the **"🎓 Guided Faculty Tour"** button in the top navigation bar.
2. The simulation will smoothly navigate through **10 structured slides**:
   - Slide 1: Introduction to Data Centre Architecture & Water Nexus
   - Slide 2: IT Whitespace & Joule Heating ($P = I^2 R$)
   - Slide 3: Mechanical Room (Chiller, Heat Exchanger & Pumps)
   - Slide 4: Water Journey (Intake, 150m³ Storage Buffer & Pumping)
   - Slide 5: Heat Rejection (Cooling Tower Latent Vaporization)
   - Slide 6: Water Loss Accounting (Evaporation vs. Blowdown vs. Drift)
   - Slide 7: Water Circularity (Condensate Capture & Treatment Skid)
   - Slide 8: Mathematical Rigor ($\text{WUE}_{site}$ vs. $\text{WUE}_{source}$)
   - Slide 9: Alternative Technologies (Air-Cooled & Immersion)
   - Slide 10: Research Summary & Actionable Recommendations
3. Use **"Next Slide ▶"** and **"◀ Previous Slide"** to progress.

### 3. The 7-Stage Water Journey Stepper
Located at the bottom panel:
- Click **"▶ Play"** to watch the continuous animated cycle.
- Click any individual stage pill (1 to 7) to inspect specific hydronic phenomena.
- Check **"Auto-Advance"** for automated sequential playback.

### 4. Interactive Component Raycasting
- Click directly on any 3D equipment (Server Racks, CRAH units, Chiller, Plate Exchanger, Pumps, Water Tank, Cooling Tower, Dry Coolers, Immersion Tanks).
- An engineering modal pops up detailing its **Working Principle**, **Data Centre Purpose**, **Water Consumption Relevance**, and **Academic Citation**.

---

## 📊 Summary of Cooling Technology Trade-Offs

| Metric / Parameter | Water-Based Evaporative | Air-Based Dry Cooling | Two-Phase Liquid Immersion |
| :--- | :--- | :--- | :--- |
| **Primary Heat Sink** | Ambient Wet-Bulb Temp ($\sim 24^\circ\text{C}$) | Ambient Dry-Bulb Temp ($\sim 35^\circ\text{C}$) | Ambient Dry Air via High $\Delta T$ |
| **Site Water ($\text{WUE}_{site}$)** | **2.50 – 3.00 L/kWh** (High) | **0.00 – 0.05 L/kWh** (Zero site water) | **0.01 – 0.02 L/kWh** (Negligible) |
| **Annual Water (1 MW)** | **$\sim 25,500,000$ Litres** | **$< 450,000$ Litres** | **$< 180,000$ Litres** |
| **Electrical PUE** | **1.20 – 1.25** (Low compressor power) | **1.40 – 1.55** (High compressor power) | **1.03 – 1.05** (Chiller-free) |
| **Source Water ($\text{WUE}_{source}$)** | $\sim 5.16\text{ L/kWh}$ | $\sim 2.70\text{ L/kWh}$ (Higher MWh) | $\sim 1.90\text{ L/kWh}$ (Lowest lifecycle) |
| **Thermal Density Support** | Up to $15\text{ kW/rack}$ | Up to $12\text{ kW/rack}$ | **$> 100\text{ kW/tank}$ (AI/GPU Clusters)** |
| **Heat Reuse Capability** | Low grade ($30^\circ\text{C}$ condenser water) | Low grade ($35^\circ\text{C}$) | **High grade ($50^\circ - 60^\circ\text{C}$ district heating)** |

---

## 👨‍🏫 Evaluation Checklist for Faculty Presentation

- [x] **Realistic 3D Data Centre Structure**: Server hall, hot/cold aisles, CRAH, chiller, heat exchanger, pumps, storage tank, cooling tower, dry coolers, immersion tanks, color-coded ASME piping, transparent roof.
- [x] **Animated 7-Stage Water Journey**: Intake $\to$ Storage $\to$ Pumping $\to$ Heat Exchange $\to$ Heat Rejection $\to$ Return & Reuse $\to$ Water Loss Breakdown.
- [x] **Live Mathematical Calculations**: Live $\text{WUE}_{site}$ and $\text{WUE}_{source}$ calculators with step-by-step math derivations, Cycles of Concentration ($CoC$), mass balance equation, and water-saving calculator.
- [x] **Cooling Technology Switcher**: Instant switching between Evaporative, Air-Cooled, and Liquid Immersion with dynamic 3D equipment swapping.
- [x] **Water Conservation Demonstration**: Baseline vs. proposed scenario with Olympic pool and household-year equivalent metrics.
- [x] **Clickable 3D Components**: Raycasting inspector for every major component with literature grounding.
- [x] **Academic Rigor**: All formulas and baseline values strictly mapped to David Mytton (2021), Bora Ristic (2015), ITU-T L.55 (2022), and Semenov (2021).

---

## 📜 License & Academic Integrity
Developed for academic presentation and scientific visualization. All empirical figures cite respective peer-reviewed literature. Simulation parameters are labeled with illustrative ranges where operational conditions vary by climate.
