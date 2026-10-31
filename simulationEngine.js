/**
 * 3D Interactive Data Centre Water Consumption, Cooling and Conservation Simulation
 * Module: Simulation Engine (src/simulationEngine.js)
 * 
 * Orchestrates the 7-stage water journey:
 * Stage 1: Water Intake
 * Stage 2: Water Storage
 * Stage 3: Water Pumping
 * Stage 4: Heat Exchange
 * Stage 5: Heat Rejection
 * Stage 6: Water Return & Reuse
 * Stage 7: Water Loss (Evaporation vs. Blowdown vs. Drift)
 */

export class SimulationEngine {
  constructor(sceneManager, model, particleEngine, mathCalculators) {
    this.scene = sceneManager;
    this.model = model;
    this.particles = particleEngine;
    this.math = mathCalculators;

    // Simulation states
    this.isPlaying = false;
    this.currentStageIndex = 0; // 0 to 6 (Stages 1 to 7)
    this.playbackSpeed = 1.0;
    this.autoAdvance = false;
    this.stageElapsedTime = 0;
    this.stageDuration = 8.0; // Seconds per stage when auto-advancing

    // Stage Definitions with engineering explanations, research connections, and camera targets
    this.stages = [
      {
        id: 1,
        name: 'Stage 1: Water Intake',
        subtitle: 'Potable / Raw Water Supply & Pre-Treatment',
        cameraPreset: 'intake',
        cameraPos: { x: 12, y: 8, z: 22 },
        targetPos: { x: 14, y: 1.5, z: 12 },
        activeLoops: ['intake'],
        description: 'Raw water enters the data centre from the municipal utility main, on-site borewells, or treated rainwater harvesting basins. Water enters through the intake manifold at ~15°C - 20°C.',
        engineeringPrinciple: 'Water quality is critical. Pre-treatment skids (reverse osmosis, sand filtration, and anti-scalant dosing) prepare the water to prevent bio-fouling and mineral scaling (CaCO3, silica) in heat exchangers.',
        paperConnection: 'David Mytton (2021) highlights that direct water intake competes with local municipal supply, especially in water-stressed regions like Phoenix, AZ or Hyderabad, India. Data centres must quantify incoming liters rigorously.',
        metrics: {
          flowRate: '120 L/min',
          pressure: '4.5 bar',
          temperature: '18.2 °C',
          sourceType: 'Municipal Main + Rainwater Skid'
        }
      },
      {
        id: 2,
        name: 'Stage 2: Water Storage',
        subtitle: 'Hydronic Buffer & Emergency Reserve Reservoir',
        cameraPreset: 'tank',
        cameraPos: { x: 18, y: 10, z: 18 },
        targetPos: { x: 14, y: 3, z: 4 },
        activeLoops: ['intake', 'storage'],
        description: 'Water is stored in insulated on-site storage tanks (150 m³ / 150,000 L capacity). The tank acts as a hydronic buffer to decouple utility supply fluctuations from instantaneous peak cooling demand.',
        engineeringPrinciple: 'Maintains required static head for booster pumps and provides 24 to 48 hours of emergency ride-through autonomy in case of municipal water supply outage, ensuring continuous IT uptime.',
        paperConnection: 'ITU-T L.Suppl.55 mandates on-site water retention buffers and recommends dual-source supply to improve resilience without relying solely on high-pressure city mains.',
        metrics: {
          flowRate: '120 L/min (Filling)',
          tankLevel: '85% (127,500 L)',
          bufferAutonomy: '32 Hours @ 100% Load',
          temperature: '19.0 °C'
        }
      },
      {
        id: 3,
        name: 'Stage 3: Water Pumping',
        subtitle: 'Primary & Secondary Hydronic Circulation',
        cameraPreset: 'pumps',
        cameraPos: { x: 16, y: 7, z: 5 },
        targetPos: { x: 12, y: 1.5, z: -2 },
        activeLoops: ['condenser_supply', 'chilled_supply'],
        description: 'High-efficiency dual variable-frequency drive (VFD) centrifugal pumps pressurize and circulate cooling water across the primary and secondary distribution loops.',
        engineeringPrinciple: 'VFD controllers modulate pump RPM based on thermal load and differential pressure sensors (ΔP). Variable flow saves up to 40% pump electrical energy compared to constant-speed systems.',
        paperConnection: 'Semenov & Oganesyan (2021) note that pump electrical draw contributes directly to facility PUE, which in turn increases indirect (power plant) water consumption through the grid EWIF multiplier.',
        metrics: {
          flowRate: '450,000 L/hr (Recirculation)',
          pumpHead: '32 m H2O',
          vfdFrequency: '44.8 Hz',
          pumpPower: '38.5 kW'
        }
      },
      {
        id: 4,
        name: 'Stage 4: Heat Exchange',
        subtitle: 'Chiller Evaporator, CRAH & Rack Thermal Transfer',
        cameraPreset: 'server_room',
        cameraPos: { x: -3, y: 6, z: 8 },
        targetPos: { x: -4, y: 2.5, z: 0 },
        activeLoops: ['chilled_supply', 'chilled_return'],
        description: 'Chilled water at 12°C - 18°C enters the Computer Room Air Handler (CRAH) coils and plate heat exchangers. Cold air is pushed through perforated floor tiles into the cold aisles.',
        engineeringPrinciple: 'Server fans pull cold air across CPU/GPU heat sinks. The air absorbs IT thermal dissipation, heating up to 35°C - 40°C in the enclosed hot aisle before returning to CRAH cooling coils to transfer thermal energy into the closed water loop.',
        paperConnection: 'David Mytton (2021) shows that elevating the chilled water supply setpoint from legacy 7°C to modern 18°C-22°C reduces chiller refrigeration compressor work by over 30%, unlocking extended hours of economizer free cooling.',
        metrics: {
          heatExtracted: '1,000 kWth (IT Heat)',
          chilledSupplyTemp: '14.0 °C',
          chilledReturnTemp: '22.5 °C',
          rackDeltaT: '12.8 °C'
        }
      },
      {
        id: 5,
        name: 'Stage 5: Heat Rejection',
        subtitle: 'Evaporative Cooling Tower / Dry Cooler Latent Heat Transfer',
        cameraPreset: 'cooling_tower',
        cameraPos: { x: 18, y: 12, z: -10 },
        targetPos: { x: 14, y: 4, z: -10 },
        activeLoops: ['condenser_supply', 'condenser_return'],
        description: 'The hot condenser water (32°C - 35°C) is pumped to the rooftop cooling tower. Water is sprayed over PVC fill pack while induced-draft fans pull ambient air counter-currently upward.',
        engineeringPrinciple: 'Heat is rejected through latent heat of vaporization (approx. 2,400 kJ per kg of water evaporated). This phase change cools the remaining liquid water down to the ambient wet-bulb temperature (~24°C).',
        paperConnection: 'Bora Ristic et al. (2015) explain that evaporative towers provide superior thermal efficiency compared to dry chillers, but account for 75-85% of total on-site data centre water consumption through pure atmospheric evaporation.',
        metrics: {
          heatRejected: '1,250 kWth (IT + Compressor)',
          towerInletTemp: '35.0 °C',
          towerOutletTemp: '27.0 °C',
          airApproachTemp: '3.2 °C'
        }
      },
      {
        id: 6,
        name: 'Stage 6: Water Return & Reuse',
        subtitle: 'Closed-Loop Recirculation & Condensate Recovery',
        cameraPreset: 'mechanical_room',
        cameraPos: { x: 8, y: 9, z: -2 },
        targetPos: { x: 11, y: 2, z: -5 },
        activeLoops: ['condenser_return', 'chilled_return'],
        description: 'The cooled water collects in the cooling tower basin and returns through the insulated cold return pipe back to the chiller condenser. Within the closed chilled loop, 100% of the water is recirculated continuously.',
        engineeringPrinciple: 'Water in the server loop is NEVER consumed or discarded; it circulates perpetually in a closed hydronic circuit. Air handler dehumidification coils capture condensed atmospheric moisture, which is routed into the cooling tower make-up sump.',
        paperConnection: 'ITU-T L.Suppl.55 highlights water circularity: recovering 100% of CRAH dehumidification condensate and recycling graywater reduces potable water intake by up to 15-25%.',
        metrics: {
          closedLoopRecirculation: '100% Reused',
          condensateRecovered: '4,500 L/day',
          internalWaterVolume: '45,000 L',
          returnPressure: '3.2 bar'
        }
      },
      {
        id: 7,
        name: 'Stage 7: Water Loss Breakdown',
        subtitle: 'Scientific Accounting: Evaporation vs. Blowdown vs. Drift',
        cameraPreset: 'loss_analysis',
        cameraPos: { x: 22, y: 14, z: -6 },
        targetPos: { x: 14, y: 5, z: -10 },
        activeLoops: ['condenser_supply'],
        description: 'Rigorous engineering differentiation between the three loss pathways: Evaporation (pure H2O vapor plume), Blowdown (mineral bleed-off to sewer), and Drift (droplets carried by exhaust air).',
        engineeringPrinciple: 'As pure water evaporates, dissolved solids remain, increasing mineral concentration. Blowdown water is intentionally purged to prevent scale encrustation. At 4 Cycles of Concentration, 75% of consumed water evaporates, 24.9% is blowdown, and 0.1% is drift.',
        paperConnection: 'David Mytton (2021) and Bora Ristic (2015) stress that blowdown water is NOT consumed forever—it can be treated with Reverse Osmosis or reused for irrigation. Only evaporated water undergoes local watershed displacement.',
        metrics: {
          evaporationLoss: '75.0% (~19.1M L/yr)',
          blowdownPurge: '24.9% (~6.3M L/yr)',
          driftMistLoss: '0.1% (~0.025M L/yr)',
          cyclesOfConcentration: '4.0 CoC'
        }
      }
    ];

    this.callbacks = {
      onStageChange: null,
      onTick: null
    };
  }

  /**
   * Set event listeners
   */
  on(event, callback) {
    if (event === 'stageChange' || event === 'onStageChange') {
      this.callbacks.onStageChange = callback;
    } else if (event === 'tick' || event === 'onTick') {
      this.callbacks.onTick = callback;
    } else if (this.callbacks[event] !== undefined) {
      this.callbacks[event] = callback;
    }
  }

  /**
   * Start / Resume simulation
   */
  start() {
    this.isPlaying = true;
    this.applyCurrentStage();
  }

  /**
   * Pause simulation
   */
  pause() {
    this.isPlaying = false;
  }

  /**
   * Reset simulation to Stage 1
   */
  reset() {
    this.isPlaying = false;
    this.currentStageIndex = 0;
    this.stageElapsedTime = 0;
    this.applyCurrentStage();
  }

  /**
   * Navigate to next stage
   */
  nextStage() {
    if (this.currentStageIndex < this.stages.length - 1) {
      this.setStage(this.currentStageIndex + 1);
    } else {
      // Loop back or stop
      if (this.autoAdvance) {
        this.setStage(0);
      } else {
        this.pause();
      }
    }
  }

  /**
   * Navigate to previous stage
   */
  prevStage() {
    if (this.currentStageIndex > 0) {
      this.setStage(this.currentStageIndex - 1);
    }
  }

  /**
   * Set specific stage by index (0 - 6)
   */
  setStage(index) {
    if (index < 0 || index >= this.stages.length) return;
    this.currentStageIndex = index;
    this.stageElapsedTime = 0;
    this.applyCurrentStage();
  }

  /**
   * Apply visual state, camera position, and particles for the active stage
   */
  applyCurrentStage() {
    const stage = this.stages[this.currentStageIndex];

    // Smoothly animate camera to the stage perspective
    if (this.scene && stage.cameraPos && stage.targetPos) {
      this.scene.animateCamera(stage.cameraPos, stage.targetPos, 1400);
    }

    // Configure 3D particle streams based on the stage
    if (this.particles) {
      this.particles.setStageVisibility(stage.id);
    }

    // Trigger UI update callback
    if (this.callbacks.onStageChange) {
      this.callbacks.onStageChange(stage, this.currentStageIndex, this.stages.length);
    }
  }

  /**
   * Per-frame update loop called from main render loop
   */
  update(delta) {
    if (!this.isPlaying) return;

    this.stageElapsedTime += delta * this.playbackSpeed;

    if (this.autoAdvance && this.stageElapsedTime >= this.stageDuration) {
      this.stageElapsedTime = 0;
      this.nextStage();
    }

    if (this.callbacks.onTick) {
      this.callbacks.onTick({
        stage: this.stages[this.currentStageIndex],
        progress: Math.min(1.0, this.stageElapsedTime / this.stageDuration),
        elapsed: this.stageElapsedTime
      });
    }
  }

  /**
   * Get current stage data
   */
  getCurrentStage() {
    return this.stages[this.currentStageIndex];
  }
}
