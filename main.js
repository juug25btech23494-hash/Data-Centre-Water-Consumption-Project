/**
 * 3D Interactive Data Centre Water Consumption, Cooling and Conservation Simulation
 * Module: Main Application Controller (src/main.js)
 * 
 * Ties together:
 * - SceneManager (Three.js WebGL viewport & camera)
 * - DatacenterModel (3D building, mechanical plant, server racks, piping)
 * - WaterFlowParticles (Hydronic flow, steam plumes, heat shimmer)
 * - MathCalculators (WUEsite, WUEsource, Water Balance, CoC, Conservation)
 * - SimulationEngine (7-Stage animated water journey)
 * - CoolingTechManager (Evaporative, Air-Cooled, Liquid Immersion)
 * - ComponentInspector (Raycasting 3D component inspection)
 * - FacultyPresentation (10-Step academic guided tour)
 */

import { SceneManager } from './scene.js';
import { DatacenterModel } from './datacenterModel.js';
import { WaterFlowParticles } from './waterFlowParticles.js';
import { MathCalculators } from './mathCalculators.js';
import { SimulationEngine } from './simulationEngine.js';
import { CoolingTechManager } from './coolingTechManager.js';
import { ComponentInspector } from './componentInspector.js';
import { FacultyPresentation } from './facultyPresentation.js';

class DataCenterSimulationApp {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    if (!this.canvas) {
      console.error('Canvas element #webgl-canvas not found!');
      return;
    }

    // 1. Initialize Core Subsystems
    this.sceneManager = new SceneManager(this.canvas);
    this.datacenterModel = new DatacenterModel(this.sceneManager);
    this.particleEngine = new WaterFlowParticles(this.sceneManager);
    this.mathCalculators = new MathCalculators();
    this.coolingTechManager = new CoolingTechManager(
      this.datacenterModel,
      this.particleEngine,
      this.mathCalculators,
      this.sceneManager
    );
    this.simulationEngine = new SimulationEngine(
      this.sceneManager,
      this.datacenterModel,
      this.particleEngine,
      this.mathCalculators
    );
    this.componentInspector = new ComponentInspector(
      this.sceneManager,
      this.datacenterModel
    );
    this.facultyPresentation = new FacultyPresentation(
      this.sceneManager,
      this.datacenterModel,
      this.particleEngine,
      this.mathCalculators,
      this.coolingTechManager
    );

    // 2. Register Subsystem Callbacks
    this.setupSubsystemCallbacks();

    // 3. Register UI DOM Event Handlers
    this.setupUIEventHandlers();

    // 4. Initial Computations and UI Sync
    this.syncMathUI();
    this.syncStageUI(this.simulationEngine.getCurrentStage(), 0, 7);

    // 5. Connect to Animation Loop
    this.sceneManager.onUpdate((delta, elapsed) => {
      this.onRenderFrame(delta, elapsed);
    });

    console.log('Data Centre Water Consumption Simulation initialized successfully.');
  }

  /**
   * Per-frame render update callback
   */
  onRenderFrame(delta, elapsed) {
    if (this.datacenterModel) {
      this.datacenterModel.update(delta, elapsed);
    }
    if (this.particleEngine) {
      this.particleEngine.update(delta, elapsed);
    }
    if (this.simulationEngine) {
      this.simulationEngine.update(delta);
    }
  }

  /**
   * Setup communication callbacks between engines and UI
   */
  setupSubsystemCallbacks() {
    // Stage Change
    this.simulationEngine.on('stageChange', (stage, index, total) => {
      this.syncStageUI(stage, index, total);
    });

    // Simulation Tick
    this.simulationEngine.on('tick', (data) => {
      const progressBar = document.getElementById('stage-progress-bar');
      if (progressBar) {
        progressBar.style.width = `${data.progress * 100}%`;
      }
    });

    // Component Inspection Click
    this.componentInspector.onSelect((componentData) => {
      this.showComponentModal(componentData);
    });

    // Faculty Tour Step Change
    this.facultyPresentation.onStepChange((step, index, total, isActive) => {
      this.syncFacultyTourUI(step, index, total, isActive);
    });
  }

  /**
   * Setup UI DOM Event Handlers (Buttons, Sliders, Tabs)
   */
  setupUIEventHandlers() {
    // --- Header & Global Controls ---
    const btnTour = document.getElementById('btn-faculty-tour');
    if (btnTour) {
      btnTour.addEventListener('click', () => {
        this.facultyPresentation.start();
      });
    }

    const btnResetView = document.getElementById('btn-reset-view');
    if (btnResetView) {
      btnResetView.addEventListener('click', () => {
        this.sceneManager.resetView();
      });
    }

    const toggleRoof = document.getElementById('toggle-roof');
    if (toggleRoof) {
      toggleRoof.addEventListener('change', (e) => {
        this.datacenterModel.setRoofVisibility(e.target.checked);
      });
    }

    const toggleWireframe = document.getElementById('toggle-wireframe');
    if (toggleWireframe) {
      toggleWireframe.addEventListener('change', (e) => {
        this.datacenterModel.setWireframe(e.target.checked);
      });
    }

    const toggleHeatmap = document.getElementById('toggle-heatmap');
    if (toggleHeatmap) {
      toggleHeatmap.addEventListener('change', (e) => {
        this.datacenterModel.setHeatMapMode(e.target.checked);
      });
    }

    // --- Left Panel: Camera View Presets ---
    const presetButtons = document.querySelectorAll('[data-camera-preset]');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-camera-preset');
        this.applyCameraPreset(preset);
      });
    });

    // --- Left Panel: Cooling Technology Selector ---
    const techButtons = document.querySelectorAll('[data-tech-id]');
    techButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        techButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const techId = btn.getAttribute('data-tech-id');
        this.coolingTechManager.setTechnology(techId);
        this.syncMathUI();
        this.syncTechnologyUI(this.coolingTechManager.getCurrentTechnology());
      });
    });

    // --- Left Panel: Quick Component Inspection Buttons ---
    const inspectButtons = document.querySelectorAll('[data-inspect-key]');
    inspectButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-inspect-key');
        this.componentInspector.inspectByKey(key);
      });
    });

    // --- Right Panel: Tabs Navigation ---
    const tabButtons = document.querySelectorAll('.tab-btn, .panel-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-content, .panel-tab-pane');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const pane = document.getElementById(`tab-${targetTab}`);
        if (pane) pane.classList.add('active');
      });
    });

    // --- Right Panel: Math Inputs & Sliders ---
    const inputWater = document.getElementById('input-annual-water');
    const inputItLoad = document.getElementById('input-it-load');
    const inputPue = document.getElementById('input-pue');
    const sliderCoc = document.getElementById('slider-coc');
    const selectGrid = document.getElementById('select-grid-ewif');
    const sliderReduction = document.getElementById('slider-water-reduction');

    const onMathInputChanged = () => {
      const waterLiters = parseFloat(inputWater?.value || 25500000);
      const itLoadKw = parseFloat(inputItLoad?.value || 1000);
      const pue = parseFloat(inputPue?.value || 1.25);
      const coc = parseFloat(sliderCoc?.value || 4.0);
      const gridKey = selectGrid?.value || 'us_average';
      const gridEwif = this.mathCalculators.ewifDatabase[gridKey]?.ewif || 1.80;
      const reduction = parseFloat(sliderReduction?.value || 35.0);

      // Display live slider labels
      const cocValLabel = document.getElementById('val-coc');
      if (cocValLabel) cocValLabel.textContent = `${coc.toFixed(1)}x`;

      const redValLabel = document.getElementById('val-reduction');
      if (redValLabel) redValLabel.textContent = `${reduction.toFixed(0)}%`;

      this.mathCalculators.updateInputs({
        siteWaterLitersPerYear: waterLiters,
        itLoadKw: itLoadKw,
        pue: pue,
        cyclesOfConcentration: coc,
        gridEwif: gridEwif,
        reductionPercent: reduction
      });

      this.syncMathUI();
    };

    if (inputWater) inputWater.addEventListener('input', onMathInputChanged);
    if (inputItLoad) inputItLoad.addEventListener('input', onMathInputChanged);
    if (inputPue) inputPue.addEventListener('input', onMathInputChanged);
    if (sliderCoc) sliderCoc.addEventListener('input', onMathInputChanged);
    if (selectGrid) selectGrid.addEventListener('change', onMathInputChanged);
    if (sliderReduction) sliderReduction.addEventListener('input', onMathInputChanged);

    // --- Bottom Panel: Simulation Timeline Controls ---
    const btnPlayPause = document.getElementById('btn-sim-play-pause');
    if (btnPlayPause) {
      btnPlayPause.addEventListener('click', () => {
        if (this.simulationEngine.isPlaying) {
          this.simulationEngine.pause();
          btnPlayPause.innerHTML = '<span class="icon">▶</span> Play';
          btnPlayPause.classList.remove('btn-pause');
        } else {
          this.simulationEngine.start();
          btnPlayPause.innerHTML = '<span class="icon">⏸</span> Pause';
          btnPlayPause.classList.add('btn-pause');
        }
      });
    }

    const btnReset = document.getElementById('btn-sim-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.simulationEngine.reset();
        if (btnPlayPause) {
          btnPlayPause.innerHTML = '<span class="icon">▶</span> Play';
          btnPlayPause.classList.remove('btn-pause');
        }
      });
    }

    const btnPrev = document.getElementById('btn-sim-prev');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        this.simulationEngine.prevStage();
      });
    }

    const btnNext = document.getElementById('btn-sim-next');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        this.simulationEngine.nextStage();
      });
    }

    const stagePills = document.querySelectorAll('[data-stage-index]');
    stagePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const index = parseInt(pill.getAttribute('data-stage-index'), 10);
        this.simulationEngine.setStage(index);
      });
    });

    const chkAutoAdvance = document.getElementById('chk-auto-advance');
    if (chkAutoAdvance) {
      chkAutoAdvance.addEventListener('change', (e) => {
        this.simulationEngine.autoAdvance = e.target.checked;
      });
    }

    // --- Faculty Tour Overlay Controls ---
    const btnTourNext = document.getElementById('btn-tour-next');
    if (btnTourNext) {
      btnTourNext.addEventListener('click', () => {
        this.facultyPresentation.next();
      });
    }

    const btnTourPrev = document.getElementById('btn-tour-prev');
    if (btnTourPrev) {
      btnTourPrev.addEventListener('click', () => {
        this.facultyPresentation.prev();
      });
    }

    const btnTourExit = document.getElementById('btn-tour-exit');
    if (btnTourExit) {
      btnTourExit.addEventListener('click', () => {
        this.facultyPresentation.stop();
      });
    }

    // --- Component Inspection Modal Close ---
    const btnCloseModal = document.getElementById('btn-modal-close');
    const modalBackdrop = document.getElementById('component-modal-backdrop');
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => {
        this.hideComponentModal();
      });
    }
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
          this.hideComponentModal();
        }
      });
    }
  }

  /**
   * Apply Camera View Presets
   */
  applyCameraPreset(preset) {
    const presets = {
      isometric: { pos: { x: 26, y: 20, z: 26 }, target: { x: 0, y: 2, z: 0 } },
      server_room: { pos: { x: -3.5, y: 5.5, z: 6 }, target: { x: -4, y: 2, z: 0 } },
      mechanical_room: { pos: { x: 14, y: 7, z: -2 }, target: { x: 10, y: 2, z: -4 } },
      cooling_tower: { pos: { x: 18, y: 14, z: -12 }, target: { x: 14, y: 4, z: -10 } },
      storage_tank: { pos: { x: 18, y: 10, z: 18 }, target: { x: 14, y: 3, z: 4 } },
      hot_aisle: { pos: { x: -3.5, y: 3.5, z: 3 }, target: { x: -3.5, y: 2, z: -2 } }
    };

    if (presets[preset]) {
      this.sceneManager.animateCamera(presets[preset].pos, presets[preset].target, 1200);
    }
  }

  /**
   * Synchronize UI with Mathematical Calculators
   */
  syncMathUI() {
    const report = this.mathCalculators.calculateAll();

    // 1. WUE Site & Rating
    const wueVal = document.getElementById('metric-wue-site');
    const hudWueVal = document.getElementById('hud-wue-val');
    const wueRating = document.getElementById('badge-wue-rating');
    if (wueVal) wueVal.textContent = report.wue.wueSite.toFixed(3);
    if (hudWueVal) hudWueVal.textContent = report.wue.wueSite.toFixed(3);
    if (wueRating) {
      wueRating.textContent = report.wue.rating.tag;
      wueRating.style.backgroundColor = `${report.wue.rating.color}22`;
      wueRating.style.color = report.wue.rating.color;
      wueRating.style.borderColor = report.wue.rating.color;
    }

    // 2. Step-by-Step Derivation Box
    const derivationBox = document.getElementById('math-wue-derivation');
    if (derivationBox) {
      const itKwh = report.inputs.itEnergyKwh.toLocaleString();
      const waterL = report.inputs.siteWaterLitersPerYear.toLocaleString();
      derivationBox.innerHTML = `
        <div style="margin-bottom:4px;"><strong>1. Standard Formula:</strong> <code>WUE<sub>site</sub> = Water (L) / IT Energy (kWh)</code></div>
        <div style="margin-bottom:4px;"><strong>2. Inputs:</strong> Water = ${waterL} L &nbsp;|&nbsp; IT Energy = ${itKwh} kWh</div>
        <div style="margin-bottom:4px;"><strong>3. Site WUE:</strong> <code>${waterL} / ${itKwh}</code> = <strong style="color:var(--accent-cyan); font-size:12px;">${report.wue.wueSite} L/kWh</strong></div>
        <div><strong>4. Lifecycle WUE<sub>source</sub>:</strong> <code>${report.wue.wueSite} + (${report.inputs.gridEwif} × ${report.inputs.pue})</code> = <strong style="color:var(--accent-emerald); font-size:12px;">${report.wue.wueSource.value} L/kWh</strong></div>
      `;
    }

    // 3. WUE Source Breakdown
    const sourceVal = document.getElementById('metric-wue-source');
    if (sourceVal) sourceVal.textContent = report.wue.wueSource.value.toFixed(3);

    const indirectLiters = document.getElementById('metric-indirect-water');
    if (indirectLiters) {
      indirectLiters.textContent = `${(report.wue.indirectWaterLiters / 1000000).toFixed(2)}M L`;
    }

    // 4. Cooling Tower Water Balance & CoC
    const valEvap = document.getElementById('val-evap-loss');
    const valBlowdown = document.getElementById('val-blowdown-loss');
    const valDrift = document.getElementById('val-drift-loss');
    const valRecirc = document.getElementById('val-recirc-rate');

    if (valEvap) {
      valEvap.textContent = `${(report.coolingTower.evaporationLiters / 1000000).toFixed(2)}M L (${report.coolingTower.evapFraction}%)`;
    }
    if (valBlowdown) {
      valBlowdown.textContent = `${(report.coolingTower.blowdownLiters / 1000000).toFixed(2)}M L (${report.coolingTower.blowdownFraction}%)`;
    }
    if (valDrift) {
      valDrift.textContent = `${(report.coolingTower.driftLiters / 1000).toFixed(1)}k L (${report.coolingTower.driftFraction}%)`;
    }
    if (valRecirc) {
      valRecirc.textContent = `${(report.coolingTower.recirculatingPumpingLitersPerHour / 1000).toLocaleString()} m³/hr`;
    }

    // 5. Water-Saving & Conservation Tab
    const savedLiters = document.getElementById('metric-water-saved');
    const newConsumption = document.getElementById('metric-new-consumption');
    const poolsSaved = document.getElementById('metric-pools-saved');
    const householdsSaved = document.getElementById('metric-households-saved');

    if (savedLiters) {
      savedLiters.textContent = `${(report.conservation.savedLiters / 1000000).toFixed(2)}M L`;
    }
    if (newConsumption) {
      newConsumption.textContent = `${(report.conservation.newConsumptionLiters / 1000000).toFixed(2)}M L`;
    }
    if (poolsSaved) {
      poolsSaved.textContent = `${report.conservation.olympicPoolsSaved} Pools`;
    }
    if (householdsSaved) {
      householdsSaved.textContent = `${report.conservation.householdYearsEquivalent.toLocaleString()} People-Yrs`;
    }

    // 6. Water Balance Visual Progress Bars
    const barEvap = document.getElementById('bar-evap-loss');
    const barBlowdown = document.getElementById('bar-blowdown-loss');
    const barDrift = document.getElementById('bar-drift-loss');
    if (barEvap) barEvap.style.width = `${report.coolingTower.evapFraction}%`;
    if (barBlowdown) barBlowdown.style.width = `${report.coolingTower.blowdownFraction}%`;
    if (barDrift) barDrift.style.width = `${Math.max(1, report.coolingTower.driftFraction * 10)}%`;
  }

  /**
   * Synchronize Bottom Stage Stepper UI
   */
  syncStageUI(stage, index, total) {
    if (!stage) return;

    // Update active pill indicator
    const pills = document.querySelectorAll('[data-stage-index]');
    pills.forEach((p, idx) => {
      if (idx === index) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    // Update Stage Info Card
    const titleEl = document.getElementById('stage-title');
    const subtitleEl = document.getElementById('stage-subtitle');
    const descEl = document.getElementById('stage-description');
    const principleEl = document.getElementById('stage-principle');
    const paperEl = document.getElementById('stage-paper');
    const metricsEl = document.getElementById('stage-metrics-grid');

    if (titleEl) titleEl.textContent = stage.name;
    if (subtitleEl) subtitleEl.textContent = stage.subtitle;
    if (descEl) descEl.textContent = stage.description;
    if (principleEl) principleEl.innerHTML = `<strong>Engineering Principle:</strong> ${stage.engineeringPrinciple}`;
    if (paperEl) paperEl.innerHTML = `<strong>Research Paper Connection:</strong> ${stage.paperConnection}`;

    if (metricsEl && stage.metrics) {
      metricsEl.innerHTML = Object.entries(stage.metrics)
        .map(([k, v]) => `
          <div class="stage-metric-box">
            <span class="metric-key">${this.formatKey(k)}</span>
            <span class="metric-val">${v}</span>
          </div>
        `).join('');
    }
  }

  /**
   * Synchronize Faculty Tour UI Overlay
   */
  syncFacultyTourUI(step, index, total, isActive) {
    const tourCard = document.getElementById('faculty-tour-overlay');
    if (!tourCard) return;

    if (!isActive || !step) {
      tourCard.classList.remove('active', 'visible');
      return;
    }

    tourCard.classList.add('active', 'visible');

    const stepNum = document.getElementById('tour-step-num');
    const stepTitle = document.getElementById('tour-step-title');
    const stepSubtitle = document.getElementById('tour-step-subtitle');
    const narration = document.getElementById('tour-narration');
    const formula = document.getElementById('tour-formula');
    const citation = document.getElementById('tour-citation');

    if (stepNum) stepNum.textContent = `Slide ${index + 1} of ${total}`;
    if (stepTitle) stepTitle.textContent = step.title;
    if (stepSubtitle) stepSubtitle.textContent = step.subtitle;
    if (narration) narration.textContent = step.narration;
    if (formula) {
      if (window.katex && step.academicFormula) {
        try {
          formula.innerHTML = window.katex.renderToString(step.academicFormula, { displayMode: true, throwOnError: false });
        } catch (e) {
          formula.innerHTML = `<code>${step.academicFormula}</code>`;
        }
      } else {
        formula.innerHTML = `<code>${step.academicFormula}</code>`;
      }
    }
    if (citation) citation.innerHTML = `<em>Source:</em> ${step.citation}`;
  }

  /**
   * Synchronize Technology Information
   */
  syncTechnologyUI(tech) {
    const badge = document.getElementById('hud-tech-badge');
    if (badge && tech) {
      badge.textContent = tech.name;
      badge.style.color = tech.color;
      badge.style.borderColor = tech.color;
    }

    const techCard = document.getElementById('tech-specs-card');
    if (techCard && tech) {
      techCard.innerHTML = `
        <h4 style="color:${tech.color}">${tech.name}</h4>
        <p class="tech-sub">${tech.subtitle}</p>
        <div class="tech-badge" style="border-color:${tech.color}; color:${tech.color}">${tech.badge}</div>
        <p style="margin-top:10px;">${tech.operatingPrinciple}</p>
        <h5>Water Characteristics</h5>
        <ul>
          <li><strong>Evaporation:</strong> ${tech.waterConsumptionCharacteristics.evaporationLoss}</li>
          <li><strong>Blowdown:</strong> ${tech.waterConsumptionCharacteristics.blowdownLoss}</li>
          <li><strong>Make-up:</strong> ${tech.waterConsumptionCharacteristics.makeupRequired}</li>
        </ul>
        <h5>Key Advantages</h5>
        <ul>${tech.advantages.map(a => `<li>${a}</li>`).join('')}</ul>
        <h5>Limitations</h5>
        <ul>${tech.limitations.map(l => `<li>${l}</li>`).join('')}</ul>
        <div class="paper-quote"><strong>Research Citation:</strong> ${tech.researchCitation}</div>
      `;
    }
  }

  /**
   * Show Component Inspection Dialog
   */
  showComponentModal(data) {
    const modal = document.getElementById('component-modal-backdrop');
    if (!modal) return;

    const title = document.getElementById('modal-component-title');
    const category = document.getElementById('modal-component-category');
    const principle = document.getElementById('modal-component-principle');
    const purpose = document.getElementById('modal-component-purpose');
    const water = document.getElementById('modal-component-water');
    const citation = document.getElementById('modal-component-citation');

    if (title) title.innerHTML = `${data.icon || '🔧'} ${data.name}`;
    if (category) category.textContent = data.category;
    if (principle) principle.textContent = data.workingPrinciple;
    if (purpose) purpose.textContent = data.purpose;
    if (water) water.textContent = data.waterRelevance;
    if (citation) citation.innerHTML = `<strong>Literature Citation:</strong> ${data.researchCitation}`;

    modal.classList.add('active', 'visible');
  }

  /**
   * Hide Component Inspection Dialog
   */
  hideComponentModal() {
    const modal = document.getElementById('component-modal-backdrop');
    if (modal) modal.classList.remove('active', 'visible');
  }

  /**
   * Format camelCase keys into Human Readable strings
   */
  formatKey(str) {
    return str.replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase());
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.simulationApp = new DataCenterSimulationApp();
});
