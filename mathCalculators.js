/**
 * 3D Interactive Data Centre Water Consumption, Cooling and Conservation Simulation
 * Module: Math Calculators (src/mathCalculators.js)
 * 
 * Implements rigorous engineering and scientific formulas from:
 * 1. David Mytton (2021) "Data centre water consumption", npj Clean Water
 * 2. Bora Ristic et al. (2015) "The Water Footprint of Data Centers", Sustainability
 * 3. ITU-T L Suppl. 55 (10/2022) "Water management of data centres"
 * 4. Semenov & Oganesyan (2021) "Impact of Fuel Diversity on Energy Water Intensity"
 * 5. Ugruymova et al. (2026) "Artificial intelligence and water consumption"
 */

export class MathCalculators {
  constructor() {
    // Default baseline parameters (1 MW modular hyperscale / enterprise DC)
    this.defaults = {
      itLoadKw: 1000,              // 1 MW IT capacity (200 racks @ 5 kW)
      annualHours: 8760,           // 365 days * 24 hours = 8,760,000 kWh/yr IT energy
      pue: 1.25,                   // Power Usage Effectiveness
      siteWaterLitersPerYear: 25500000, // 25.5 million L/year (David Mytton 2021 baseline for 1 MW evaporative)
      coolingTechnology: 'evaporative', // 'evaporative', 'air_cooled', 'liquid_immersion'
      cyclesOfConcentration: 4.0,  // Standard industrial cooling tower cycles
      driftRateFraction: 0.001,    // 0.1% circulation rate (typical mist drift loss)
      gridEwif: 1.80,              // Indirect Energy-Water Intensity Factor (L/kWh) - average coal/gas mix
      reductionPercent: 35.0,      // Water conservation target %
      storageTankCapacityLiters: 150000, // 150 m3 on-site emergency/buffer tank
      currentStorageLiters: 120000       // Current level
    };

    // Regional grid EWIF presets (Liters of water consumed per kWh generated at the power plant)
    // Sources: Semenov (2021), Bora Ristic (2015), NREL, CEA India
    this.ewifDatabase = {
      us_average: { name: 'US National Grid Average', ewif: 1.80, description: 'Mix of gas, coal, nuclear, hydro, renewables' },
      india_thermal: { name: 'India Grid (Thermal Dominant)', ewif: 2.45, description: 'High subcritical coal share with wet cooling towers' },
      eu_average: { name: 'EU Grid Average', ewif: 1.20, description: 'Higher nuclear, wind, and solar PV share' },
      hydro_heavy: { name: 'Pacific NW / Nordic (Hydro Heavy)', ewif: 0.25, description: 'Run-of-river hydro and wind power' },
      solar_wind: { name: '100% Dedicated Solar PV / Wind', ewif: 0.05, description: 'Panel cleaning and life-cycle manufacturing only' }
    };

    // State
    this.state = { ...this.defaults };
  }

  /**
   * Set inputs and trigger updates
   */
  updateInputs(newParams) {
    this.state = { ...this.state, ...newParams };
    return this.calculateAll();
  }

  /**
   * Calculate all metrics and return a structured report
   */
  calculateAll() {
    const itEnergyKwh = (this.state.itLoadKw * this.state.annualHours);
    const totalEnergyKwh = itEnergyKwh * this.state.pue;

    // 1. WUE Calculations (David Mytton 2021; The Green Grid standard)
    const wueSite = this.calculateWueSite(this.state.siteWaterLitersPerYear, itEnergyKwh);
    const wueSource = this.calculateWueSource(wueSite, this.state.gridEwif, this.state.pue);
    const indirectWaterLiters = totalEnergyKwh * this.state.gridEwif;
    const totalWaterFootprintLiters = this.state.siteWaterLitersPerYear + indirectWaterLiters;

    // 2. Cooling Tower Evaporation & Blowdown (Bora Ristic 2015; ASHRAE)
    const towerBalance = this.calculateCoolingTowerBalance(
      this.state.siteWaterLitersPerYear,
      this.state.cyclesOfConcentration,
      this.state.coolingTechnology
    );

    // 3. Water-Saving Conservation Calculator
    const conservation = this.calculateConservation(
      this.state.siteWaterLitersPerYear,
      this.state.reductionPercent,
      itEnergyKwh
    );

    // 4. Overall Mass Balance Equation:
    // Water Input = Evaporation + Blowdown + Drift + Reused + Storage Change
    const waterBalance = this.calculateOverallWaterBalance(towerBalance);

    return {
      inputs: { ...this.state, itEnergyKwh, totalEnergyKwh },
      wue: {
        wueSite,
        wueSource,
        indirectWaterLiters,
        totalWaterFootprintLiters,
        unit: 'L/kWh',
        rating: this.getWueRating(wueSite)
      },
      coolingTower: towerBalance,
      conservation,
      waterBalance,
      citations: this.getAcademicCitations()
    };
  }

  /**
   * Part 3A: WUE (Water Usage Effectiveness) Site
   * WUE_site = Total On-Site Annual Water Consumption (L) / IT Equipment Energy Consumption (kWh)
   */
  calculateWueSite(annualWaterLiters, itEnergyKwh) {
    if (!itEnergyKwh || itEnergyKwh <= 0) return 0;
    if (!annualWaterLiters || annualWaterLiters < 0) return 0;
    const val = annualWaterLiters / itEnergyKwh;
    return parseFloat(val.toFixed(3));
  }

  /**
   * Part 3A: WUE Source (Lifecycle / Scopes 1 & 2 water footprint)
   * WUE_source = WUE_site + (EWIF * PUE)
   * Where EWIF = Energy-Water Intensity Factor of electrical grid (L/kWh)
   * PUE = Power Usage Effectiveness = Total Facility Power / IT Power
   */
  calculateWueSource(wueSite, gridEwif, pue) {
    const indirectContribution = gridEwif * pue;
    const total = wueSite + indirectContribution;
    return {
      value: parseFloat(total.toFixed(3)),
      wueSiteComponent: parseFloat(wueSite.toFixed(3)),
      indirectComponent: parseFloat(indirectContribution.toFixed(3)),
      breakdownPercentSite: total > 0 ? parseFloat(((wueSite / total) * 100).toFixed(1)) : 0,
      breakdownPercentIndirect: total > 0 ? parseFloat(((indirectContribution / total) * 100).toFixed(1)) : 0
    };
  }

  /**
   * Evaluates the environmental sustainability of the site WUE
   */
  getWueRating(wue) {
    if (wue === 0) return { category: 'Zero-Site-Water (Dry/Air-Only)', color: '#00f3ff', tag: 'Exceptional' };
    if (wue < 0.2) return { category: 'Ultra-Low (Immersion / Hybrid Free Cooling)', color: '#00ff88', tag: 'Pioneering' };
    if (wue < 1.0) return { category: 'Efficient (Modern Economizer / Closed Loop)', color: '#39ff14', tag: 'High Efficiency' };
    if (wue <= 2.0) return { category: 'Industry Average (Traditional Chilled-Water + Evap Tower)', color: '#ffaa00', tag: 'Standard' };
    return { category: 'Water Intensive (High ambient heat / Low CoC evaporative)', color: '#ff3366', tag: 'Suboptimal' };
  }

  /**
   * Part 3C & 3D: Cooling Tower Mass Balance and Cycles of Concentration (CoC)
   * Make-up Water (M) = Evaporation (E) + Blowdown (B) + Drift (D)
   * In steady state: Blowdown (B) = Evaporation / (CoC - 1)
   * Make-up = E * [CoC / (CoC - 1)]
   */
  calculateCoolingTowerBalance(totalSiteWater, cyclesOfConcentration, technology) {
    const coc = Math.max(1.2, cyclesOfConcentration);

    if (technology === 'air_cooled') {
      // Air-cooled systems consume virtually zero on-site operational water (only seasonal adiabatic trims or maintenance)
      const maintenanceWater = totalSiteWater * 0.02; // ~2% of evaporative baseline
      return {
        technology: 'air_cooled',
        makeupLiters: maintenanceWater,
        evaporationLiters: 0,
        blowdownLiters: 0,
        driftLiters: 0,
        reusedRecirculatedLiters: 150000000, // Closed circuit internal loop recirculation (glycol/water)
        recirculatingPumpingLitersPerHour: 180000,
        coc: 1,
        evapFraction: 0,
        blowdownFraction: 0,
        notes: 'Air-cooled dry condensers discard heat via forced air convection fans. Negligible site water consumed.'
      };
    }

    if (technology === 'liquid_immersion') {
      // Liquid immersion systems (e.g. Submer, GRC) capture heat at high temperatures (45°C-60°C), allowing warm-water dry coolers year-round.
      const incidentalWater = totalSiteWater * 0.05; // 5% baseline (occasional closed-loop make-up)
      return {
        technology: 'liquid_immersion',
        makeupLiters: incidentalWater,
        evaporationLiters: incidentalWater * 0.6,
        blowdownLiters: incidentalWater * 0.4,
        driftLiters: 0,
        reusedRecirculatedLiters: 350000000, // Dielectric fluid loop + secondary water loop
        recirculatingPumpingLitersPerHour: 220000,
        coc: 5.0,
        evapFraction: 0.6,
        blowdownFraction: 0.4,
        notes: 'Direct Immersion cooling yields high rejection temps (45-55°C), enabling water-free dry cooling even in warm climates.'
      };
    }

    // Default: Water-Based Evaporative Cooling Tower
    // Standard evaporative loss is ~75% - 85% of make-up water; blowdown is 15% - 25% depending on CoC.
    // Mathematical derivation: B = E / (CoC - 1) => E = M * (CoC - 1) / CoC
    const evapRatio = (coc - 1) / coc;
    const blowdownRatio = 1 / coc;
    const driftRatio = 0.001; // 0.1% drift loss

    const evaporationLiters = totalSiteWater * (evapRatio - driftRatio);
    const blowdownLiters = totalSiteWater * blowdownRatio;
    const driftLiters = totalSiteWater * driftRatio;

    // Recirculation flow rate in the condenser loop is typically 50 to 100 times make-up water
    const recirculatedLoopLiters = totalSiteWater * 65; 

    return {
      technology: 'evaporative',
      makeupLiters: totalSiteWater,
      evaporationLiters: Math.max(0, evaporationLiters),
      blowdownLiters: Math.max(0, blowdownLiters),
      driftLiters: Math.max(0, driftLiters),
      reusedRecirculatedLiters: recirculatedLoopLiters,
      recirculatingPumpingLitersPerHour: 450000,
      coc: coc,
      evapFraction: parseFloat(((evaporationLiters / totalSiteWater) * 100).toFixed(1)),
      blowdownFraction: parseFloat(((blowdownLiters / totalSiteWater) * 100).toFixed(1)),
      driftFraction: parseFloat(((driftLiters / totalSiteWater) * 100).toFixed(2)),
      notes: `At ${coc.toFixed(1)} Cycles of Concentration, blowdown comprises ${((1/coc)*100).toFixed(1)}% of make-up water.`
    };
  }

  /**
   * Part 3B: Water-Saving Calculator
   * Water Saved = Baseline Water Consumption * Reduction Percentage / 100
   * New Water Consumption = Baseline - Water Saved
   */
  calculateConservation(baselineLiters, reductionPercent, itEnergyKwh) {
    const percent = Math.min(100, Math.max(0, reductionPercent));
    const savedLiters = (baselineLiters * percent) / 100;
    const newConsumptionLiters = baselineLiters - savedLiters;

    const baselineWue = this.calculateWueSite(baselineLiters, itEnergyKwh);
    const newWue = this.calculateWueSite(newConsumptionLiters, itEnergyKwh);
    const wueReduction = baselineWue - newWue;

    // Real world equivalent metrics:
    // Average Olympic swimming pool = 2,500,000 Liters
    // Average Indian / US daily household consumption = 150 - 300 Liters/person/day
    const olympicPoolsSaved = savedLiters / 2500000;
    const householdYearsEquivalent = savedLiters / (200 * 365); // 200 L/day/person

    return {
      baselineLiters,
      reductionPercent: percent,
      savedLiters,
      newConsumptionLiters,
      baselineWue,
      newWue,
      wueReduction: parseFloat(wueReduction.toFixed(3)),
      olympicPoolsSaved: parseFloat(olympicPoolsSaved.toFixed(2)),
      householdYearsEquivalent: Math.round(householdYearsEquivalent),
      strategies: [
        { name: 'Increasing Cycles of Concentration (3x -> 6x)', savingPercent: 12.5, mechanism: 'Reduces cooling tower blowdown frequency' },
        { name: 'Rainwater Harvesting & RO Treatment', savingPercent: 20.0, mechanism: 'Replaces municipal potable intake with captured site runoff' },
        { name: 'Chilled Water Setpoint Optimization (7°C -> 18°C)', savingPercent: 35.0, mechanism: 'Enables extended hours of waterless free-cooling (Mytton 2021)' },
        { name: 'Direct-to-Chip / Immersion Liquid Cooling', savingPercent: 88.0, mechanism: 'Transfers server heat to high-temp closed water/air loop' }
      ]
    };
  }

  /**
   * Part 3C: Water Balance Conservation Equation
   * Water Input = Water Reused/Returned + Evaporation Loss + Blowdown + Drift + Delta Stored
   */
  calculateOverallWaterBalance(towerBalance) {
    const input = towerBalance.makeupLiters;
    const evaporation = towerBalance.evaporationLiters;
    const blowdown = towerBalance.blowdownLiters;
    const drift = towerBalance.driftLiters;
    const storageChange = 0; // In steady-state operation
    const accountedLosses = evaporation + blowdown + drift;
    const balanceError = Math.abs(input - accountedLosses);

    return {
      equationFormula: 'Water Input = Evaporation + Blowdown + Drift + ΔStored Water',
      inputLiters: Math.round(input),
      evaporationLiters: Math.round(evaporation),
      blowdownLiters: Math.round(blowdown),
      driftLiters: Math.round(drift),
      storageChangeLiters: storageChange,
      sumOfOutputs: Math.round(accountedLosses),
      isConserved: balanceError < 1.0,
      breakdown: [
        { label: 'Evaporative Vapor Loss (To Atmosphere)', volume: Math.round(evaporation), percent: ((evaporation / (input || 1)) * 100).toFixed(1) },
        { label: 'Blowdown Discharge (High Mineral Water)', volume: Math.round(blowdown), percent: ((blowdown / (input || 1)) * 100).toFixed(1) },
        { label: 'Drift & Mist Losses (Mechanical Entrainment)', volume: Math.round(drift), percent: ((drift / (input || 1)) * 100).toFixed(2) }
      ]
    };
  }

  /**
   * Exact Academic Citations and Principles from the User's Research Papers
   */
  getAcademicCitations() {
    return [
      {
        source: 'David Mytton (2021)',
        publication: 'npj Clean Water, 4(1), 1-11',
        title: 'Data centre water consumption',
        keyFact: 'A typical 1 MW data centre consumes 25.5 million litres of water annually. Direct water is evaporated in cooling towers; indirect water is consumed at the thermoelectric power plants supplying the grid.'
      },
      {
        source: 'Bora Ristic et al. (2015)',
        publication: 'Sustainability, 7(8), 10748-10773',
        title: 'The Water Footprint of Data Centers',
        keyFact: 'In arid climates (e.g. Phoenix, AZ), direct evaporative cooling consumes 1.6 to 2.0 L/kWh, but saves significant electricity. Life cycle water balances must evaluate both site and source water.'
      },
      {
        source: 'ITU-T L.Suppl.55 (2022)',
        publication: 'International Telecommunication Union Recommendation',
        title: 'Water management of data centres',
        keyFact: 'Defines ISO/IEC 30134-9 WUE metrics, Water Circularity Ratio (WCR), and mandates stormwater harvesting, wastewater recycling, and condensate reclamation.'
      },
      {
        source: 'Semenov & Oganesyan (2021)',
        publication: 'Applied Thermal Engineering',
        title: 'Impact of Fuel Diversity on Energy Water Intensity',
        keyFact: 'Grid Energy Water Intensity Factors (EWIF) range from 0.05 L/kWh for solar/wind to 2.45 L/kWh for coal with wet cooling, making renewable PPA procurement an effective water conservation strategy.'
      }
    ];
  }
}
