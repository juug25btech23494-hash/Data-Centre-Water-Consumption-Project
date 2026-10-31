/**
 * 3D Interactive Data Centre Water Consumption, Cooling and Conservation Simulation
 * Module: Cooling Technology Manager (src/coolingTechManager.js)
 * 
 * Manages the three distinct cooling architectures:
 * 1. WATER-BASED EVAPORATIVE COOLING (Chiller + Induced Draft Cooling Tower + CRAH)
 * 2. AIR-BASED COOLING (Direct Expansion / Free-cooling Dry Coolers + CRAH)
 * 3. LIQUID / IMMERSION COOLING (Dielectric Fluid Immersion Tanks + CDU + Dry Coolers)
 * 
 * Accurately updates 3D models, pipelines, flow dynamics, water balance, and academic trade-offs.
 */

export class CoolingTechManager {
  constructor(model, particleEngine, mathCalculators, sceneManager) {
    this.model = model;
    this.particles = particleEngine;
    this.math = mathCalculators;
    this.scene = sceneManager;

    this.currentTech = 'evaporative'; // 'evaporative' | 'air_cooled' | 'liquid_immersion'

    this.technologies = {
      evaporative: {
        id: 'evaporative',
        name: 'Water-Based Evaporative Cooling',
        subtitle: 'Induced-Draft Cooling Tower + Water-Cooled Centrifugal Chiller + CRAH Units',
        badge: 'Water-Intensive / High Energy Efficiency',
        color: '#00d2ff',
        typicalWueSite: 1.80,       // L/kWh (David Mytton 2021)
        typicalPue: 1.22,           // Very efficient electrical PUE due to latent wet-bulb cooling
        annualSiteWaterLiters: 25500000, // 25.5 Million L/year per 1 MW IT
        operatingPrinciple: 'Water absorbs thermal energy from the server room CRAH units via a closed chilled water circuit (12°C/18°C). The chiller evaporator transfers this heat to the open condenser water loop, which pumps warm water (35°C) to the rooftop cooling tower. Water is sprayed over PVC fill while counter-current air evaporates ~1-2% of the water stream, discharging latent heat into the atmosphere. Cooled water (27°C) is collected in the sump and returned to the chiller.',
        waterConsumptionCharacteristics: {
          evaporationLoss: '75 - 85% of total site water intake',
          blowdownLoss: '15 - 25% to purge accumulated dissolved minerals',
          driftLoss: '0.05 - 0.1% fine droplet aerosol entrainment',
          makeupRequired: 'Continuous municipal or treated supply (~50 - 75 L/min per MW)',
          cyclesOfConcentration: 'Typically 3.0 to 6.0 CoC depending on water hardness'
        },
        advantages: [
          'Superior thermodynamic heat rejection using ambient wet-bulb temperature (typically 5-10°C lower than dry-bulb).',
          'Enables exceptionally low chiller compressor power consumption (PUE ~1.20 - 1.25).',
          'Well-understood, mature industrial technology with widely available components and maintenance procedures.',
          'High heat rejection density in compact physical footprint.'
        ],
        limitations: [
          'High continuous on-site water consumption (25-30 million litres annually per 1 MW load).',
          'Severe vulnerability to regional droughts, water scarcity, and municipal tariff increases.',
          'Requires extensive chemical water treatment (biocides, scale inhibitors, corrosion inhibitors) to prevent Legionella.',
          'Blowdown effluent contains concentrated salts and must be discharged to municipal wastewater sewers.'
        ],
        researchCitation: 'David Mytton (2021), npj Clean Water: "Direct evaporative cooling consumes large quantities of drinking-quality municipal water in water-stressed regions, creating acute competition with local communities."',
        cameraPreset: {
          position: { x: 18, y: 14, z: -12 },
          target: { x: 14, y: 4, z: -10 }
        }
      },

      air_cooled: {
        id: 'air_cooled',
        name: 'Air-Based Dry Cooling',
        subtitle: 'Air-Cooled Chillers & Rooftop Dry Coolers (No Continuous Evaporative Water)',
        badge: 'Zero-Site-Water / Higher Energy Draw',
        color: '#ffaa00',
        typicalWueSite: 0.05,       // Negligible site water (only periodic coil washing or adiabatic trim)
        typicalPue: 1.45,           // Higher electrical PUE due to higher condensing temperatures in summer
        annualSiteWaterLiters: 450000, // < 0.5 Million L/year (maintenance / washdown only)
        operatingPrinciple: 'Server heat is transferred into a closed chilled hydronic loop via CRAH air handlers. Instead of an open evaporative tower, the warm hydronic fluid is pumped through finned-tube rooftop dry coolers. High-velocity variable-speed axial fans blow ambient dry air across the finned coil banks, rejecting heat through pure sensible convection without any water phase change.',
        waterConsumptionCharacteristics: {
          evaporationLoss: '0% (Completely sealed closed-loop hydronic system)',
          blowdownLoss: '0% (No open sump, no mineral concentration)',
          driftLoss: '0%',
          makeupRequired: 'Zero operational make-up water required during normal running',
          cyclesOfConcentration: 'Not applicable (closed circuit)'
        },
        advantages: [
          'Virtually zero on-site water consumption (near-zero WUE_site = 0.0 - 0.05 L/kWh).',
          'Completely eliminates cooling tower chemical biocides, scaling, and Legionella disease risk.',
          'Immune to municipal water rationing, water scarcity, or local watershed extraction regulations.',
          'Simplified permitting and infrastructure design.'
        ],
        limitations: [
          'Limited by dry-bulb ambient temperature; suffers from "cooling penalty" in hot climates (>38°C).',
          'Chiller compressors must work at significantly higher discharge pressures, driving up electrical PUE to 1.40 - 1.55.',
          'Indirect water consumption at thermoelectric power plants (WUE_source) often increases because the facility consumes more MWh of grid electricity (Mytton 2021).',
          'Requires substantially larger rooftop surface area for dry cooler fan coils.'
        ],
        researchCitation: 'Bora Ristic et al. (2015), Sustainability: "Switching from wet cooling towers to air-cooled chillers eliminates direct water consumption but increases electricity consumption by 15-20%, effectively shifting the water burden to regional thermoelectric power stations."',
        cameraPreset: {
          position: { x: -8, y: 15, z: 20 },
          target: { x: -6, y: 4, z: 12 }
        }
      },

      liquid_immersion: {
        id: 'liquid_immersion',
        name: 'Direct Liquid / Immersion Cooling',
        subtitle: 'Single/Two-Phase Dielectric Liquid Immersion Tanks + Warm-Water CDU Loop',
        badge: 'Next-Gen AI / Ultra-Low WUE & PUE',
        color: '#00ff88',
        typicalWueSite: 0.02,       // Closed loop warm water dry cooler (no evaporation)
        typicalPue: 1.05,           // Chiller-free year-round operation
        annualSiteWaterLiters: 180000, // Near zero (<0.2 Million L/year)
        operatingPrinciple: 'High-density server hardware (GPUs/CPUs) is submerged directly in non-conductive, dielectric hydrocarbon or synthetic fluorochemical fluid. The fluid contacts electronic components directly, achieving heat transfer coefficients 1,000x greater than air. Warm dielectric fluid is circulated through a Coolant Distribution Unit (CDU) brazed-plate heat exchanger, transferring thermal energy to an external warm water loop (45°C - 55°C) that is cooled purely by ambient dry air without chillers.',
        waterConsumptionCharacteristics: {
          evaporationLoss: '0% (Warm water dry cooling loop operates year-round without evaporative towers)',
          blowdownLoss: '0% (Completely closed secondary hydronic loop)',
          driftLoss: '0%',
          makeupRequired: 'Zero operational water consumption',
          cyclesOfConcentration: 'Not applicable'
        },
        advantages: [
          'Extreme thermal density: Supports >100 kW per tank/rack (essential for modern AI clusters like NVIDIA H100/B200).',
          'Eliminates server chassis fans and CRAH units, reducing data centre energy overhead by 90% (PUE ~1.03 - 1.05).',
          'High coolant return temperature (50°C) allows year-round water-free free cooling via dry coolers anywhere on Earth.',
          'Provides high-grade waste heat suitable for municipal district heating, water desalination, or greenhouse agriculture (ITU-T L.Suppl.55).'
        ],
        limitations: [
          'Higher initial capital expenditure (CapEx) for sealed immersion tanks and specialized dielectric fluid.',
          'Hardware modifications required: removal of thermal paste, fan modules, and warranty validation.',
          'Maintenance procedures require overhead hoists and fluid-drip containment protocols for server servicing.',
          'Dielectric fluid replenishment and environmental stewardship considerations.'
        ],
        researchCitation: 'David Mytton (2021) & ITU-T L.Suppl.55 (2022): "Liquid immersion cooling captures over 96% of IT heat directly into the liquid phase at elevated temperatures (45-55°C), completely eliminating the need for evaporative cooling towers and chillers."',
        cameraPreset: {
          position: { x: 5, y: 7, z: 2 },
          target: { x: 2, y: 2, z: -3 }
        }
      }
    };
  }

  /**
   * Switch cooling technology
   */
  setTechnology(techId) {
    if (!this.technologies[techId]) {
      console.warn(`Technology ${techId} not recognized`);
      return;
    }

    this.currentTech = techId;
    const techData = this.technologies[techId];

    // 1. Update 3D Equipment Visibility
    this.update3DVisibility(techId);

    // 2. Update Particle Flow Systems
    if (this.particles) {
      this.particles.setCoolingMode(techId);
    }

    // 3. Update Math Calculators
    if (this.math) {
      this.math.updateInputs({
        coolingTechnology: techId,
        siteWaterLitersPerYear: techData.annualSiteWaterLiters,
        pue: techData.typicalPue
      });
    }

    return techData;
  }

  /**
   * Toggle 3D equipment groups based on chosen technology
   */
  update3DVisibility(techId) {
    if (!this.model) return;

    if (this.model.setCoolingTechnology) {
      if (techId === 'air_cooled') {
        this.model.setCoolingTechnology('air');
      } else if (techId === 'liquid_immersion') {
        this.model.setCoolingTechnology('liquid');
      } else {
        this.model.setCoolingTechnology('evaporative');
      }
    }

    if (this.model.equipment) {
      const eq = this.model.equipment;
      if (techId === 'evaporative') {
        if (eq.coolingTower) eq.coolingTower.visible = true;
        if (eq.dryCoolers) eq.dryCoolers.forEach(dc => dc.visible = false);
        if (eq.immersionTanks) eq.immersionTanks.forEach(tank => tank.visible = false);
        if (eq.cdu) eq.cdu.visible = false;
        if (eq.chiller) eq.chiller.visible = true;
      } else if (techId === 'air_cooled') {
        if (eq.coolingTower) eq.coolingTower.visible = false;
        if (eq.dryCoolers) eq.dryCoolers.forEach(dc => dc.visible = true);
        if (eq.immersionTanks) eq.immersionTanks.forEach(tank => tank.visible = false);
        if (eq.cdu) eq.cdu.visible = false;
        if (eq.chiller) eq.chiller.visible = true;
      } else if (techId === 'liquid_immersion') {
        if (eq.coolingTower) eq.coolingTower.visible = false;
        if (eq.dryCoolers) eq.dryCoolers.forEach(dc => dc.visible = true);
        if (eq.immersionTanks) eq.immersionTanks.forEach(tank => tank.visible = true);
        if (eq.cdu) eq.cdu.visible = true;
        if (eq.chiller) eq.chiller.visible = false;
      }
    }
  }

  /**
   * Get current technology data
   */
  getCurrentTechnology() {
    return this.technologies[this.currentTech];
  }

  /**
   * Get all technologies for UI rendering
   */
  getAllTechnologies() {
    return Object.values(this.technologies);
  }
}
