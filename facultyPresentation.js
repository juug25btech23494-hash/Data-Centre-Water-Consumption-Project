/**
 * 3D Interactive Data Centre Water Consumption, Cooling and Conservation Simulation
 * Module: Guided Faculty Presentation Mode (src/facultyPresentation.js)
 * 
 * Provides an automated academic guided tour with smooth camera waypoints,
 * 3D component spotlights, academic narrations, equations, and literature citations.
 */

export class FacultyPresentation {
  constructor(sceneManager, model, particleEngine, mathCalculators, coolingManager) {
    this.scene = sceneManager;
    this.model = model;
    this.particles = particleEngine;
    this.math = mathCalculators;
    this.cooling = coolingManager;

    this.isActive = false;
    this.currentStepIndex = 0;
    this.onStepChangeCallback = null;

    // 10 Academic Presentation Steps
    this.steps = [
      {
        number: 1,
        title: '1. Introduction: Data Centre Architecture & Water Nexus',
        subtitle: 'The Global Water Footprint of Digital Infrastructure',
        cameraPos: { x: 28, y: 22, z: 28 },
        targetPos: { x: 0, y: 3, z: 0 },
        roofVisible: true,
        coolingTech: 'evaporative',
        stageId: 1,
        narration: 'Welcome to the 3D Interactive Data Centre Water Consumption and Cooling Simulation. As highlighted in David Mytton (2021, npj Clean Water), data centres worldwide consumed over 500 billion litres of water in 2020. This facility represents a standard 1 MW IT capacity modular data centre housing 200 server racks. We will examine how electrical energy is converted to heat, why water-based cooling is used, and where every litre goes.',
        academicFormula: 'IT Load = 1,000 kW \\quad | \\quad \\text{Annual Energy} = 8,760,000 \\text{ kWh} \\quad | \\quad \\text{Baseline Water} = 25.5\\text{M Litres/yr}',
        citation: 'David Mytton (2021) "Data centre water consumption", npj Clean Water 4:11; Semenov & Oganesyan (2021).'
      },
      {
        number: 2,
        title: '2. IT Whitespace: Joule Heating & Server Thermal Dissipation',
        subtitle: 'Conversion of Electricity to Heat in Server Aisles',
        cameraPos: { x: -3, y: 5.5, z: 6 },
        targetPos: { x: -3.5, y: 2, z: 0 },
        roofVisible: false,
        coolingTech: 'evaporative',
        stageId: 4,
        narration: 'Looking inside the server hall: 200 server racks consume 1 MW of continuous power. Under thermodynamic laws, nearly 100% of this electrical energy is converted into heat via Joule heating ($P = I^2 R$). Cold air at 18°C enters from the perforated tiles in the cold aisle, passes through the server blades, and is exhausted at 35°C into the enclosed hot aisle. Notice the red thermal particles rising in the hot aisle.',
        academicFormula: 'Q_{thermal} = P_{IT} = \\dot{m} \\cdot c_p \\cdot (T_{hot\\_aisle} - T_{cold\\_aisle}) \\approx 1,000 \\text{ kW}_{th}',
        citation: 'ASHRAE TC 9.9 Thermal Guidelines for Data Processing Environments.'
      },
      {
        number: 3,
        title: '3. Mechanical Equipment Room: Chiller, Heat Exchanger & Pumps',
        subtitle: 'The Hydronic Core of the Cooling Infrastructure',
        cameraPos: { x: 14, y: 7, z: -2 },
        targetPos: { x: 10, y: 2, z: -4 },
        roofVisible: false,
        coolingTech: 'evaporative',
        stageId: 3,
        narration: 'In the mechanical plant room, CRAH cooling coils transfer heat from the hot room air into the closed chilled water loop (blue/sky blue pipes). A centrifugal water-cooled chiller uses vapor-compression refrigeration to chill water to 14°C while dumping heat into the condenser loop (green/red pipes). Plate-and-frame heat exchangers provide economizer free-cooling when outdoor weather permits.',
        academicFormula: '\\text{COP}_{chiller} = \\frac{Q_{evaporator}}{W_{compressor}} = 6.2 \\quad | \\quad W_{compressor} \\approx 160 \\text{ kW}_{e}',
        citation: 'Bora Ristic et al. (2015) Sustainability: "The Water Footprint of Data Centers".'
      },
      {
        number: 4,
        title: '4. The Water Journey: Intake, Storage Buffer & Pumping',
        subtitle: 'Hydronic Circulation and Municipal Decoupling',
        cameraPos: { x: 18, y: 9, z: 14 },
        targetPos: { x: 13, y: 2.5, z: 4 },
        roofVisible: false,
        coolingTech: 'evaporative',
        stageId: 2,
        narration: 'Water enters from the municipal supply or rainwater skid and fills the 150 m³ storage reservoir. The storage tank decouples the facility from city water fluctuations and provides emergency reserve. Redundant VFD pumps circulate up to 450,000 litres per hour through the pipes. Importantly, the internal loops recirculate water perpetually; water is NOT consumed in the pipes.',
        academicFormula: '\\Delta V_{stored} = \\int (Q_{intake} - Q_{consumed}) dt \\quad | \\quad V_{tank} = 150\\text{ m}^3 \\approx 32\\text{ hrs autonomy}',
        citation: 'ITU-T L.Suppl.55 (2022) Water management of data centres; ISO/IEC 30134-9.'
      },
      {
        number: 5,
        title: '5. Heat Rejection: Evaporative Cooling Tower Mechanics',
        subtitle: 'Latent Heat of Vaporization Discharges Thermal Load',
        cameraPos: { x: 18, y: 12, z: -12 },
        targetPos: { x: 14, y: 4.5, z: -10 },
        roofVisible: true,
        coolingTech: 'evaporative',
        stageId: 5,
        narration: 'Condenser water at 35°C is pumped to the rooftop cooling tower. As water cascades through the fill pack, the induced draft fan draws ambient air upward. Approximately 1.5% of the water evaporates into the air stream. The latent heat of vaporization (~2,400 kJ/kg) cools the remaining water down to 27°C, which collects in the cold basin for reuse. Notice the animated vapor plume rising from the tower.',
        academicFormula: 'Q_{latent} = \\dot{m}_{evap} \\cdot h_{fg} \\quad | \\quad h_{fg} \\approx 2,400 \\text{ kJ/kg} \\quad | \\quad \\dot{m}_{evap} \\approx 50\\text{ L/min per MW}',
        citation: 'David Mytton (2021); Ugruymova et al. (2026) "Artificial intelligence and water consumption".'
      },
      {
        number: 6,
        title: '6. Water Loss Accounting: Evaporation vs. Blowdown vs. Drift',
        subtitle: 'Dispelling Misconceptions: Where Does the Water Go?',
        cameraPos: { x: 20, y: 14, z: -8 },
        targetPos: { x: 14, y: 5, z: -10 },
        roofVisible: true,
        coolingTech: 'evaporative',
        stageId: 7,
        narration: 'Faculty review: It is critical to differentiate water loss mechanisms. At 4.0 Cycles of Concentration (CoC): 75% of consumed water is pure atmospheric evaporation ($E$). 24.9% is blowdown discharge ($B$) purged to sewers to prevent calcium carbonate scale. Only 0.1% is aerodynamic drift mist ($D$). Blowdown water is NOT destroyed; it returns to municipal treatment and can be reclaimed with Reverse Osmosis.',
        academicFormula: 'M = E + B + D \\quad | \\quad B = \\frac{E}{CoC - 1} \\quad | \\quad E = 75.0\\%, \\; B = 24.9\\%, \\; D = 0.1\\%',
        citation: 'Bora Ristic et al. (2015); ASHRAE Guideline 12-2020 on Legionellosis.'
      },
      {
        number: 7,
        title: '7. Water Circularity: Condensate Capture & Treatment Skid',
        subtitle: 'Harvesting Atmospheric Moisture and Closed-Loop Recycling',
        cameraPos: { x: 10, y: 5, z: 12 },
        targetPos: { x: 12, y: 1.5, z: 10 },
        roofVisible: false,
        coolingTech: 'evaporative',
        stageId: 6,
        narration: 'Examining conservation on-site: The automated pre-treatment skid conditions make-up water and filters blowdown effluent. Furthermore, cold CRAH coils naturally condense moisture out of ambient air. Capturing this ultra-pure condensate yields 3,000 to 8,000 litres of high-purity water daily, reducing potable municipal intake by up to 15%.',
        academicFormula: '\\text{Water Circularity Ratio (WCR)} = \\frac{\\text{Reused Water}}{\\text{Total Water Discharged}} \\ge 0.65',
        citation: 'ITU-T L.Suppl.55 (2022) Water circularity metrics in telecommunication facilities.'
      },
      {
        number: 8,
        title: '8. Mathematical Rigor: WUEsite vs. WUEsource Calculations',
        subtitle: 'The Direct vs. Indirect Water Footprint Dilemma',
        cameraPos: { x: 22, y: 16, z: 18 },
        targetPos: { x: 0, y: 2, z: 0 },
        roofVisible: true,
        coolingTech: 'evaporative',
        stageId: 1,
        narration: 'The live mathematics panel implements the standard The Green Grid WUE formula: $\\text{WUE}_{site} = \\text{Site Water (L)} / \\text{IT Energy (kWh)}$. For this 1 MW facility using 25.5M L/yr and 8.76M kWh/yr, $\\text{WUE}_{site} = 2.91$ L/kWh. However, Mytton (2021) shows we must also account for grid thermoelectric water via $\\text{WUE}_{source} = \\text{WUE}_{site} + (\\text{EWIF} \\times \\text{PUE})$. If the grid uses coal (EWIF 2.45), total water impact is over 5.9 L/kWh!',
        academicFormula: '\\text{WUE}_{source} = \\text{WUE}_{site} + (\\text{EWIF} \\cdot \\text{PUE}) = 2.91 + (1.80 \\cdot 1.25) = 5.16 \\text{ L/kWh}',
        citation: 'David Mytton (2021); Semenov & Oganesyan (2021) Applied Thermal Engineering.'
      },
      {
        number: 9,
        title: '9. Alternative Technologies: Air-Cooled & Liquid Immersion',
        subtitle: 'Technological Paradigms for Water Conservation',
        cameraPos: { x: 5, y: 6, z: 0 },
        targetPos: { x: 2, y: 2, z: -3 },
        roofVisible: false,
        coolingTech: 'liquid_immersion',
        stageId: 4,
        narration: 'Comparing alternatives: Air-cooled dry chillers eliminate site water consumption ($\text{WUE}_{site} \\approx 0$), but increase electrical PUE to 1.45. Next-generation Two-Phase Liquid Immersion cooling (shown here) submerges servers directly in dielectric fluid. Immersion captures 96% of heat at 50°C, enabling waterless dry cooling year-round, cutting energy overhead by 90% (PUE 1.05), and reducing water use by 98%!',
        academicFormula: '\\Delta \\text{Water} = -98.5\\% \\quad | \\quad \\text{PUE}_{immersion} = 1.05 \\quad | \\quad \\text{WUE}_{immersion} = 0.02 \\text{ L/kWh}',
        citation: 'David Mytton (2021); ITU-T L.Suppl.55 (2022); Submer Immersion Whitepaper.'
      },
      {
        number: 10,
        title: '10. Research Summary & Conservation Recommendations',
        subtitle: 'Engineering Pathway to Sustainable Hyperscale Infrastructure',
        cameraPos: { x: 26, y: 20, z: 24 },
        targetPos: { x: 0, y: 2, z: 0 },
        roofVisible: true,
        coolingTech: 'evaporative',
        stageId: 6,
        narration: 'Conclusion of Faculty Tour: 1) Increasing cooling tower Cycles of Concentration from 3x to 6x cuts blowdown water by 50%. 2) Raising chilled water setpoints from 7°C to 18°C saves 35% chiller compressor energy and maximizes free cooling. 3) Harvesting rainwater and recovering condensate improves water circularity. 4) For high-density AI clusters, liquid immersion cooling eliminates on-site evaporative cooling entirely.',
        academicFormula: '\\text{Annual Water Saved} \\ge 15.5 \\text{ Million Litres} \\quad (61\\% \\text{ Reduction}) \\quad | \\quad 6.2 \\text{ Olympic Pools}',
        citation: 'Research Paper: "Why Data Centres Consume So Much Water and How Water Consumption Can Be Reduced".'
      }
    ];
  }

  /**
   * Set callback for step change
   */
  onStepChange(callback) {
    this.onStepChangeCallback = callback;
  }

  /**
   * Start faculty presentation from Step 1
   */
  start() {
    this.isActive = true;
    this.currentStepIndex = 0;
    this.applyCurrentStep();
  }

  /**
   * Stop / Exit presentation
   */
  stop() {
    this.isActive = false;
    if (this.onStepChangeCallback) {
      this.onStepChangeCallback(null, -1, this.steps.length, false);
    }
  }

  /**
   * Go to next step
   */
  next() {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.applyCurrentStep();
    } else {
      this.stop();
    }
  }

  /**
   * Go to previous step
   */
  prev() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.applyCurrentStep();
    }
  }

  /**
   * Go to specific step by index (0-9)
   */
  goToStep(index) {
    if (index >= 0 && index < this.steps.length) {
      this.currentStepIndex = index;
      this.applyCurrentStep();
    }
  }

  /**
   * Apply 3D visual state for the current step
   */
  applyCurrentStep() {
    const step = this.steps[this.currentStepIndex];

    // 1. Move camera smoothly
    if (this.scene && step.cameraPos && step.targetPos) {
      this.scene.animateCamera(step.cameraPos, step.targetPos, 1500);
    }

    // 2. Set roof visibility
    if (this.model) {
      this.model.setRoofVisibility(step.roofVisible);
    }

    // 3. Switch cooling technology if specified
    if (this.cooling && step.coolingTech) {
      this.cooling.setTechnology(step.coolingTech);
    }

    // 4. Set particle stage
    if (this.particles && step.stageId) {
      this.particles.setStageVisibility(step.stageId);
    }

    // 5. Notify UI
    if (this.onStepChangeCallback) {
      this.onStepChangeCallback(step, this.currentStepIndex, this.steps.length, true);
    }
  }
}
