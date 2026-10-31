/**
 * 3D Interactive Data Centre Water Consumption, Cooling and Conservation Simulation
 * Module: Component Inspector (src/componentInspector.js)
 * 
 * Provides raycasting interactive selection on 3D data centre components,
 * showing engineering working principles, purpose, water relevance, and academic citations.
 */

import * as THREE from 'three';

export class ComponentInspector {
  constructor(sceneManager, model) {
    this.scene = sceneManager;
    this.model = model;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.selectedObject = null;
    this.highlightMesh = null;
    this.onSelectCallback = null;

    // Component database with scientific descriptions
    this.componentDatabase = {
      'server_rack': {
        name: 'High-Density Server Rack (45U)',
        category: 'IT Equipment & Heat Generation',
        icon: '🖥️',
        workingPrinciple: 'Houses compute nodes, dual-socket CPUs, accelerators (GPUs/TPUs), and power supplies. Electrical power is converted almost 100% into thermal energy via Joule heating (P = I²R). Chassis axial fans pull 18°C-24°C air across heatsinks, exhausting hot air at 35°C-45°C into the enclosed hot aisle.',
        purpose: 'Executes computing workloads, cloud storage, virtualization, and AI neural network inference/training.',
        waterRelevance: 'The thermal output of the server racks dictates the cooling load that the water system must reject. Every 1 kWh of IT electrical dissipation produces 3,412 BTU (3.6 MJ) of heat requiring continuous dissipation.',
        researchCitation: 'David Mytton (2021): "Servers dissipate virtually all electrical power consumed as low-grade waste heat. A typical 1 MW IT hall houses 200 racks dissipating 5 kW each, demanding 25.5 million litres of cooling tower make-up water annually under standard evaporative cooling."'
      },
      'crah_unit': {
        name: 'Computer Room Air Handler (CRAH)',
        category: 'Air-Side Heat Transfer',
        icon: '❄️',
        workingPrinciple: 'Contains chilled water cooling coils and backward-curved EC centrifugal plug fans. Warm return air from the hot aisle passes over the finned copper/aluminum coils. Heat transfers from air to water via sensible convection, dropping air temperature to 18°C-22°C before supply under the raised floor.',
        purpose: 'Maintains ASHRAE TC 9.9 thermal and humidity environmental envelopes in the server whitespace.',
        waterRelevance: 'CRAH coils represent the primary interface between server room air and the internal hydronic loop. When dehumidification occurs, moisture condenses on coils and is recovered as high-purity water.',
        researchCitation: 'ITU-T L.Suppl.55 (2022): "Air handler condensate recovery systems capture between 2,000 to 10,000 litres of distilled water daily per MW, which should be routed to cooling tower make-up basins."'
      },
      'chiller': {
        name: 'Water-Cooled Centrifugal Chiller',
        category: 'Vapor-Compression Refrigeration',
        icon: '⚙️',
        workingPrinciple: 'Uses low-GWP refrigerant (R-1233zd(E) / R-514A) circulating through evaporator, centrifugal compressor, condenser, and expansion valve. The evaporator absorbs heat from the 22°C chilled water return, chilling it to 14°C. The compressor elevates refrigerant vapor pressure, and the condenser transfers heat to the 30°C-35°C condenser water loop.',
        purpose: 'Provides mechanical refrigeration when ambient temperatures exceed free-cooling thresholds.',
        waterRelevance: 'The chiller couples the indoor closed chilled water loop with the outdoor open cooling tower loop. High chiller coefficient of performance (COP 6.0 - 7.5) minimizes both electrical draw and indirect water footprint.',
        researchCitation: 'David Mytton (2021): "Elevating chilled water setpoints from 7°C to 18°C improves chiller COP by 3-4% per degree Celsius, saving over 35% chiller electrical power."'
      },
      'heat_exchanger': {
        name: 'Plate-and-Frame Heat Exchanger (Economizer)',
        category: 'Waterside Economization / Free Cooling',
        icon: '🔄',
        workingPrinciple: 'Constructed from corrugated stainless steel or titanium plates clamped together. Condenser water and chilled water flow in counter-current channels separated by thin conductive metal plates, allowing direct sensible heat exchange without fluid mixing.',
        purpose: 'Enables "waterside economizer" free cooling during cool ambient weather, rejecting server heat to the cooling tower without running energy-intensive chiller compressors.',
        waterRelevance: 'Waterside economizers save substantial electrical energy (lowering PUE), but maintain water consumption in the cooling tower. Balancing site water vs grid water is the central trade-off of free cooling.',
        researchCitation: 'Bora Ristic et al. (2015): "Waterside economizers dramatically lower facility PUE during winter and transitional seasons, but require continuous cooling tower operation and evaporative water consumption."'
      },
      'cooling_tower': {
        name: 'Induced-Draft Counterflow Cooling Tower',
        category: 'Heat Rejection & Evaporative Loss',
        icon: '💨',
        workingPrinciple: 'Warm condenser water (35°C) is pumped to top distribution nozzles and sprayed over PVC film fill. An induced-draft axial fan pulls outdoor ambient air counter-currently upward through the falling water droplets. A small fraction (~1.5%) of the water evaporates into the air stream, absorbing latent heat (~2,400 kJ/kg) and cooling the remaining water to 27°C.',
        purpose: 'Final heat sink discharging all server room and chiller compressor thermal energy into the atmosphere.',
        waterRelevance: 'Primary site of direct water consumption. Consumes ~75% of water via pure atmospheric evaporation, and purges ~25% as blowdown to prevent mineral scaling.',
        researchCitation: 'David Mytton (2021) & Ugruymova et al. (2026): "Cooling towers account for up to 85% of total on-site data centre water consumption through evaporation plume and blowdown purge."'
      },
      'circulation_pump': {
        name: 'Dual Centrifugal Circulation Pumps (N+1)',
        category: 'Hydronic Distribution',
        icon: '🌀',
        workingPrinciple: 'Variable Frequency Drive (VFD) driven centrifugal impellers impart kinetic energy to the water, converting velocity into static pressure head. Operating in lead-lag N+1 redundancy.',
        purpose: 'Circulates cooling water through underground pipelines between the mechanical hall, server racks, and rooftop cooling towers.',
        waterRelevance: 'Ensures uniform flow velocity (1.5 - 2.5 m/s) to prevent laminar stagnation, sedimentation, and air entrapment in cooling loops.',
        researchCitation: 'Semenov & Oganesyan (2021): "VFD pump modulation cuts pumping electrical energy by up to 40%, directly reducing indirect grid water consumption."'
      },
      'water_tank': {
        name: 'On-Site Water Storage Reservoir (150 m³)',
        category: 'Hydronic Storage & Resilience',
        icon: '🛢️',
        workingPrinciple: 'Heavy-gauge insulated cylindrical tank with epoxy lining, ultrasonic level telemetry, and automated fill solenoid valves. Maintains static water head and thermal buffer reserve.',
        purpose: 'Provides 24 to 48 hours of emergency cooling water ride-through in the event of municipal utility supply disruption.',
        waterRelevance: 'Stores harvested rainwater and treated condensate. Balances instantaneous peak evaporative demand against average intake rate.',
        researchCitation: 'ITU-T L.Suppl.55 (2022): "On-site storage buffers are essential for mission-critical facilities to absorb municipal supply volatility without interrupting cooling continuity."'
      },
      'water_treatment': {
        name: 'Automated Water Pre-Treatment Skid',
        category: 'Filtration & Chemical Conditioning',
        icon: '🧪',
        workingPrinciple: 'Multi-stage skid featuring multimedia sand filtration, 5-micron cartridge filters, Reverse Osmosis (RO) membranes, and automated chemical dosing (phosphonates, biocide, and corrosion inhibitors).',
        purpose: 'Condition incoming raw water to prevent calcium carbonate scale, silica buildup, and microbiological growth (e.g. Legionella pneumophila).',
        waterRelevance: 'Water purity directly determines the allowable Cycles of Concentration (CoC). Increasing incoming purity from 3 CoC to 6 CoC reduces blowdown water waste by over 50%.',
        researchCitation: 'Bora Ristic et al. (2015): "Advanced water treatment skids that boost cooling tower Cycles of Concentration from 3 to 7 reduce facility blowdown discharge by 67%."'
      },
      'dry_cooler': {
        name: 'Rooftop Dry Cooler (Air-Cooled Economizer)',
        category: 'Waterless Heat Rejection',
        icon: '🌀',
        workingPrinciple: 'Constructed from finned copper tubes with high-efficiency EC axial fans. Warm hydronic fluid circulates inside the tubes while fans force ambient air across the external aluminum fin surfaces.',
        purpose: 'Rejects heat via pure sensible convection without evaporating any water.',
        waterRelevance: 'Operates with 0% direct operational water consumption, achieving site WUE of 0.00 L/kWh.',
        researchCitation: 'David Mytton (2021): "Dry coolers completely eliminate on-site water consumption, making them the preferred solution in arid regions, despite higher summer electrical consumption."'
      },
      'immersion_tank': {
        name: 'Two-Phase / Single-Phase Dielectric Immersion Tank',
        category: 'Next-Gen Liquid Immersion Cooling',
        icon: '🌊',
        workingPrinciple: 'Specialized stainless steel tank filled with engineered dielectric fluid (polyalphaolefin or synthetic fluorochemical). Server blades are submerged completely; fluid circulates by natural convection and low-flow pumps across microchannel heat sinks.',
        purpose: 'Cools ultra-dense AI clusters (>50-100 kW per rack) with thermal transfer efficiency 1,000x greater than air.',
        waterRelevance: 'Eliminates cooling towers entirely. High coolant supply temperature (45°C - 55°C) enables year-round waterless dry cooling even in tropical climates.',
        researchCitation: 'David Mytton (2021) & ITU-T L.Suppl.55: "Liquid immersion cooling achieves 96% heat capture into fluid at high temperatures, allowing direct heat reuse in district heating networks with zero evaporative water consumption."'
      },
      'cdu_unit': {
        name: 'Coolant Distribution Unit (CDU)',
        category: 'Liquid Cooling Secondary Pumping & Control',
        icon: '🎛️',
        workingPrinciple: 'Houses redundant variable-speed circulating pumps, brazed plate liquid-to-liquid heat exchanger, 5-micron filtration, deionizing canisters, and precision thermal/flow instrumentation.',
        purpose: 'Isolates the primary dielectric fluid loop inside the immersion tanks from the building secondary water loop.',
        waterRelevance: 'Operates in a completely closed loop; no water is consumed, evaporated, or lost.',
        researchCitation: 'ITU-T L.Suppl.55 (2022): "CDUs enable closed-loop hydronic isolation, ensuring zero evaporative water consumption and enabling waste heat export."'
      },
      'piping_network': {
        name: 'Industrial Water Piping Network',
        category: 'Hydronic Distribution',
        icon: '🚰',
        workingPrinciple: 'Schedule 40 carbon steel or copper hydronic piping with elastomeric thermal insulation. Color-coded per ASME A13.1 standards: Blue = Chilled Water Supply (14°C), Sky Blue = Chilled Return (22°C), Green = Condenser Supply (27°C), Orange/Red = Condenser Return (35°C), Gray = Intake/Drain.',
        purpose: 'Transports thermal energy between server halls, chillers, and heat rejection equipment.',
        waterRelevance: 'Closed-loop piping ensures 100% of circulating water is recycled and never lost. Only open condenser loops experience evaporative losses.',
        researchCitation: 'David Mytton (2021): "Hydronic distribution loops in modern data centres are hermetically sealed, recycling millions of litres of water per hour without consumption."'
      }
    };

    this.initInteraction();
  }

  /**
   * Set callback for when a component is inspected
   */
  onSelect(callback) {
    this.onSelectCallback = callback;
  }

  /**
   * Initialize mouse click listener on the canvas and event bus
   */
  initInteraction() {
    window.addEventListener('component-selected', (event) => {
      if (event.detail) {
        this.selectComponent(event.detail);
      }
    });

    if (this.scene && this.scene.renderer && this.scene.renderer.domElement) {
      const canvas = this.scene.renderer.domElement;
      canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycastCheck();
      });
    }
  }

  /**
   * Check for intersected interactive components
   */
  raycastCheck() {
    this.raycaster.setFromCamera(this.mouse, this.scene.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.scene.children, true);

    for (let i = 0; i < intersects.length; i++) {
      let current = intersects[i].object;

      // Traverse up to find user data
      while (current && current !== this.scene.scene) {
        if (current.userData && (current.userData.componentData || current.userData.interactive)) {
          this.selectComponent(current.userData.componentData || current.userData);
          return;
        }
        current = current.parent;
      }
    }
  }

  /**
   * Select component and invoke callback
   */
  selectComponent(data) {
    const formatted = {
      name: data.name || 'Data Centre Component',
      category: data.category || 'Mechanical Infrastructure',
      icon: data.icon || '🔧',
      workingPrinciple: data.workingPrinciple || data.description || 'Standard industrial data centre mechanical equipment.',
      purpose: data.purpose || 'Supports data centre cooling, electrical distribution, or structural integrity.',
      waterRelevance: data.waterRelevance || 'Maintains hydronic circulation or thermal dissipation balance.',
      researchCitation: data.paperCitation || data.researchCitation || 'David Mytton (2021), npj Clean Water.'
    };

    if (this.onSelectCallback) {
      this.onSelectCallback(formatted);
    }
  }

  /**
   * Directly inspect a component by key (e.g. from UI buttons)
   */
  inspectByKey(key) {
    if (this.componentDatabase[key]) {
      if (this.onSelectCallback) {
        this.onSelectCallback(this.componentDatabase[key]);
      }
    }
  }
}
