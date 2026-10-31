/**
 * datacenterModel.js
 * Procedural 3D Architectural & Mechanical Data Centre Generator
 */
import * as THREE from 'three';

export class DataCenterModel {
  constructor(sceneManager) {
    this.sm = sceneManager && sceneManager.scene ? sceneManager : null;
    this.scene = sceneManager && sceneManager.scene ? sceneManager.scene : sceneManager;
    
    this.rootGroup = new THREE.Group();
    this.roofGroup = new THREE.Group();
    this.pipingGroup = new THREE.Group();
    this.equipmentGroup = new THREE.Group();
    this.serverGroup = new THREE.Group();
    this.liquidCoolingGroup = new THREE.Group();
    this.evaporativeGroup = new THREE.Group();
    this.airCoolingGroup = new THREE.Group();

    // Material library
    this.materials = {};
    this.animatedComponents = [];
    this.blinkingLEDs = [];
    this.waterLevelMesh = null;

    this.initMaterials();
    this.buildWorld();
  }

  initMaterials() {
    this.materials.concrete = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.85,
      metalness: 0.1
    });

    this.materials.floorGrid = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.5,
      metalness: 0.4
    });

    this.materials.perforatedTile = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.4,
      metalness: 0.6,
      wireframe: false
    });

    this.materials.wall = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.2
    });

    this.materials.steel = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.3,
      metalness: 0.85
    });

    this.materials.glass = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.5
    });

    this.materials.acrylicRoof = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.4,
      roughness: 0.2,
      metalness: 0.1
    });

    this.materials.rackFrame = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.7
    });

    this.materials.serverChassis = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.5
    });

    // Pipe materials (Color-coded)
    this.materials.chilledSupply = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Cold Blue
      roughness: 0.3,
      metalness: 0.5
    });

    this.materials.chilledReturn = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Light Blue/Cyan
      roughness: 0.3,
      metalness: 0.5
    });

    this.materials.condenserSupply = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Green
      roughness: 0.3,
      metalness: 0.5
    });

    this.materials.condenserReturn = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Warm Amber
      roughness: 0.3,
      metalness: 0.5
    });

    this.materials.makeupWater = new THREE.MeshStandardMaterial({
      color: 0x2563eb, // Royal Blue
      roughness: 0.3,
      metalness: 0.5
    });

    this.materials.blowdown = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Rust / Red
      roughness: 0.4,
      metalness: 0.4
    });

    this.materials.liquidCoolant = new THREE.MeshStandardMaterial({
      color: 0xc084fc, // Magenta / Purple
      roughness: 0.2,
      metalness: 0.7
    });

    this.materials.waterBody = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.6
    });

    this.materials.chillerBody = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.35,
      metalness: 0.65
    });

    this.materials.pumpBody = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.35,
      metalness: 0.7
    });

    this.materials.towerFiberglass = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.3
    });
  }

  buildWorld() {
    this.createFoundation();
    this.createBuildingShell();
    this.createServerRoom();
    this.createCoolingEquipmentRoom();
    this.createOutdoorHeatRejectionYard();
    this.createPipingNetwork();

    this.rootGroup.add(this.serverGroup);
    this.rootGroup.add(this.equipmentGroup);
    this.rootGroup.add(this.pipingGroup);
    this.rootGroup.add(this.roofGroup);
    this.rootGroup.add(this.evaporativeGroup);
    this.rootGroup.add(this.airCoolingGroup);
    this.rootGroup.add(this.liquidCoolingGroup);

    this.scene.add(this.rootGroup);

    // Register animation hook
    this.sm.addRenderCallback(this.onUpdate.bind(this));
  }

  createFoundation() {
    // Ground site slab
    const groundGeo = new THREE.PlaneGeometry(140, 100);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f18,
      roughness: 0.95,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.rootGroup.add(ground);

    // Concrete building basepad
    const baseGeo = new THREE.BoxGeometry(90, 0.5, 46);
    const baseMesh = new THREE.Mesh(baseGeo, this.materials.concrete);
    baseMesh.position.set(0, 0.25, 0);
    baseMesh.receiveShadow = true;
    this.rootGroup.add(baseMesh);

    // Yard fence / boundaries
    const fenceGeo = new THREE.BoxGeometry(26, 2.5, 0.1);
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x334155, wireframe: true });
    const fence1 = new THREE.Mesh(fenceGeo, fenceMat);
    fence1.position.set(31, 1.25, 22.8);
    this.rootGroup.add(fence1);
  }

  createBuildingShell() {
    const wallHeight = 11;
    const wallThick = 0.5;

    // Outer Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(62, wallHeight, wallThick), this.materials.wall);
    backWall.position.set(-13, wallHeight / 2, -22);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.rootGroup.add(backWall);

    // Outer Left Wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, 44), this.materials.wall);
    leftWall.position.set(-44, wallHeight / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.rootGroup.add(leftWall);

    // Divider Wall between Server Room and Mechanical Room
    const dividerWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, 44), this.materials.wall);
    dividerWall.position.set(4, wallHeight / 2, 0);
    dividerWall.castShadow = true;
    dividerWall.receiveShadow = true;
    this.rootGroup.add(dividerWall);

    // Divider Wall between Mechanical Room and Outdoor Yard
    const yardDivider = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, 44), this.materials.wall);
    yardDivider.position.set(22, wallHeight / 2, 0);
    yardDivider.castShadow = true;
    yardDivider.receiveShadow = true;
    this.rootGroup.add(yardDivider);

    // Front low perimeter wall (Allows viewing inside even with roof on)
    const frontLowWall = new THREE.Mesh(new THREE.BoxGeometry(66, 1.8, wallThick), this.materials.wall);
    frontLowWall.position.set(-11, 0.9, 22);
    this.rootGroup.add(frontLowWall);

    // Steel Structural Columns
    const colGeo = new THREE.BoxGeometry(0.7, wallHeight, 0.7);
    const colPositions = [
      [-43, 0, -21], [-43, 0, 21],
      [3.5, 0, -21], [3.5, 0, 21],
      [21.5, 0, -21], [21.5, 0, 21],
      [-20, 0, -21], [-20, 0, 21]
    ];
    colPositions.forEach(([x, y, z]) => {
      const col = new THREE.Mesh(colGeo, this.materials.steel);
      col.position.set(x, wallHeight / 2, z);
      col.castShadow = true;
      this.rootGroup.add(col);
    });

    // Removable / Transparent Industrial Roof
    const roofSlabGeo = new THREE.BoxGeometry(66.5, 0.4, 44.5);
    const roofSlab = new THREE.Mesh(roofSlabGeo, this.materials.acrylicRoof);
    roofSlab.position.set(-11, wallHeight + 0.2, 0);
    roofSlab.castShadow = true;
    this.roofGroup.add(roofSlab);

    // Roof Trusses
    for (let x = -40; x <= 18; x += 10) {
      const truss = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 44), this.materials.steel);
      truss.position.set(x, wallHeight - 0.6, 0);
      this.roofGroup.add(truss);
    }
  }

  createServerRoom() {
    // Raised Floor Platform
    const raisedFloor = new THREE.Mesh(new THREE.BoxGeometry(47, 0.6, 43), this.materials.floorGrid);
    raisedFloor.position.set(-20, 0.55, 0);
    raisedFloor.receiveShadow = true;
    this.serverGroup.add(raisedFloor);

    // Perforated Cold Aisle Floor Tiles (Blue illuminated strips)
    const coldAisle1 = new THREE.Mesh(new THREE.BoxGeometry(28, 0.02, 3.2), this.materials.perforatedTile);
    coldAisle1.position.set(-20, 0.86, 6.5);
    this.serverGroup.add(coldAisle1);

    const coldAisle2 = new THREE.Mesh(new THREE.BoxGeometry(28, 0.02, 3.2), this.materials.perforatedTile);
    coldAisle2.position.set(-20, 0.86, -6.5);
    this.serverGroup.add(coldAisle2);

    // Server Racks Setup: 4 rows of racks
    // Row 1: z = 9.2 (facing cold aisle 1)
    // Row 2: z = 3.8 (facing cold aisle 1, back to hot aisle center)
    // Row 3: z = -3.8 (facing cold aisle 2, back to hot aisle center)
    // Row 4: z = -9.2 (facing cold aisle 2)
    const rowZ = [9.2, 3.8, -3.8, -9.2];
    const racksPerRow = 6;
    const rackWidth = 1.6;
    const rackDepth = 1.8;
    const rackHeight = 5.2;

    for (let r = 0; r < rowZ.length; r++) {
      const z = rowZ[r];
      for (let i = 0; i < racksPerRow; i++) {
        const x = -30 + i * (rackWidth + 0.9);
        const rack = this.createIndividualServerRack(rackWidth, rackDepth, rackHeight);
        rack.position.set(x, 0.85 + rackHeight / 2, z);

        // Metadata for Raycasting inspection
        rack.userData.componentData = {
          id: `rack-R${r + 1}-U${i + 1}`,
          name: `High-Density Server Rack #${r * racksPerRow + i + 1} (45U)`,
          category: 'IT Equipment & Heat Generation',
          description: `Houses 42-45 standard 1U blade servers and network switches consuming 12-25 kW per rack. Converts electrical energy into dense thermal waste heat.`,
          workingPrinciple: `Joule heating (P = I²R) within microprocessors (CPUs/GPUs). 100% of electricity consumed by chips is converted directly into heat.`,
          purpose: `Computes mission-critical cloud and AI workloads while requiring continuous heat extraction to stay below 27°C ASHRAE guidelines.`,
          waterRelevance: `Directly drives the cooling load. In evaporative cooling, each kilowatt-hour of rack power dissipated can vaporize 1.5 to 2.2 litres of cooling water at the cooling tower.`,
          paperCitation: `David Mytton (2021) npj Clean Water; Bora Ristic et al. (2015) Sustainability 7.`
        };

        this.sm.registerInteractiveObject(rack);
        this.serverGroup.add(rack);
      }
    }

    // Hot Aisle Containment Canopy & Acrylic Doors
    const hotAisleCanopy = new THREE.Mesh(new THREE.BoxGeometry(26, 0.1, 5.8), this.materials.glass);
    hotAisleCanopy.position.set(-18.5, 6.2, 0);
    this.serverGroup.add(hotAisleCanopy);

    // End-of-row containment sliding doors
    const door1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5.2, 5.8), this.materials.glass);
    door1.position.set(-32, 3.5, 0);
    this.serverGroup.add(door1);

    const door2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5.2, 5.8), this.materials.glass);
    door2.position.set(-5, 3.5, 0);
    this.serverGroup.add(door2);

    // CRAH Units (Computer Room Air Handlers) along walls
    const crahPositions = [
      [-38, 0.85, 12], [-38, 0.85, -12],
      [-5, 0.85, 14], [-5, 0.85, -14]
    ];
    crahPositions.forEach(([cx, cy, cz], idx) => {
      const crah = this.createCRAHUnit();
      crah.position.set(cx, cy + 3.2, cz);
      crah.userData.componentData = {
        id: `crah-${idx + 1}`,
        name: `CRAH Unit #${idx + 1} (Computer Room Air Handler)`,
        category: 'In-Room Air Conditioning',
        description: `Uses internal chilled water coils to cool the hot air return from server racks and supply pressurized cool air into the underfloor plenum.`,
        workingPrinciple: `Forced-convection heat transfer: warm exhaust air passes across finned copper tube heat exchanger coils carrying chilled water at 7-18°C.`,
        purpose: `Maintains server room air within ASHRAE thermal envelope (18-27°C).`,
        waterRelevance: `Acts as the internal heat-transfer bridge, absorbing heat from air into the recirculating chilled water loop without consuming or evaporating water directly.`,
        paperCitation: `Bora Ristic et al. (2015) Section 3.2 Direct WF - HVAC; David Mytton (2021).`
      };
      this.sm.registerInteractiveObject(crah);
      this.serverGroup.add(crah);
    });
  }

  createIndividualServerRack(w, d, h) {
    const rack = new THREE.Group();

    // Frame
    const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.materials.rackFrame);
    frameMesh.castShadow = true;
    rack.add(frameMesh);

    // Server units slots (horizontal bars)
    const slotCount = 8;
    for (let s = 0; s < slotCount; s++) {
      const slotY = -h / 2 + 0.4 + s * ((h - 0.8) / slotCount);
      const chassis = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.92, (h / slotCount) * 0.75, d * 0.95),
        this.materials.serverChassis
      );
      chassis.position.set(0, slotY, 0);
      rack.add(chassis);

      // Blinking status LEDs on front and back
      const ledMat1 = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
      const led1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), ledMat1);
      led1.position.set(-w * 0.38, slotY, d / 2 + 0.01);
      rack.add(led1);

      const ledMat2 = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const led2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), ledMat2);
      led2.position.set(-w * 0.28, slotY, d / 2 + 0.01);
      rack.add(led2);

      this.blinkingLEDs.push(ledMat1, ledMat2);
    }

    return rack;
  }

  createCRAHUnit() {
    const crah = new THREE.Group();
    const w = 3.2, h = 6.4, d = 2.4;

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.materials.wall);
    body.castShadow = true;
    crah.add(body);

    // Front intake grill
    const grill = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.8, h * 0.4), new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      wireframe: true
    }));
    grill.position.set(0, 1.2, d / 2 + 0.02);
    crah.add(grill);

    // Chilled water pipe supply and return ports
    const portGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 16);
    const inPort = new THREE.Mesh(portGeo, this.materials.chilledSupply);
    inPort.rotation.x = Math.PI / 2;
    inPort.position.set(-0.8, -h / 2 + 0.6, d / 2 + 0.2);
    crah.add(inPort);

    const outPort = new THREE.Mesh(portGeo, this.materials.chilledReturn);
    outPort.rotation.x = Math.PI / 2;
    outPort.position.set(0.8, -h / 2 + 0.6, d / 2 + 0.2);
    crah.add(outPort);

    return crah;
  }

  createCoolingEquipmentRoom() {
    // 1. Water-Cooled Centrifugal Chiller
    const chiller = this.createCentrifugalChiller();
    chiller.position.set(13, 3.2, 6);
    chiller.userData.componentData = {
      id: 'chiller-centrifugal-1',
      name: 'Water-Cooled Centrifugal Chiller (1,000 kWth)',
      category: 'Primary Mechanical Refrigeration',
      description: `Generates chilled water for the server hall by transferring thermal energy from the low-pressure evaporator loop into the condenser loop via vapor-compression.`,
      workingPrinciple: `Vapor-compression refrigeration cycle using eco-friendly refrigerant. Compressor pressurizes vapor; condenser rejects heat to cooling tower water; evaporator chills loop to 7-18°C.`,
      purpose: `Primary refrigeration machine when ambient temperatures exceed free cooling thresholds.`,
      waterRelevance: `Requires condenser water flow of ~35-45 L/s. Raising chilled water setpoint from 7°C to 18-20°C reduces compressor energy consumption by up to 40% (Mytton 2021).`,
      paperCitation: `David Mytton (2021) npj Clean Water; Bora Ristic et al. (2015) Sustainability 7, 11268.`
    };
    this.sm.registerInteractiveObject(chiller);
    this.equipmentGroup.add(chiller);

    // 2. Plate Heat Exchanger (PHE / Free Cooling Water Economizer)
    const phe = this.createPlateHeatExchanger();
    phe.position.set(13, 2.5, -6);
    phe.userData.componentData = {
      id: 'phe-economizer-1',
      name: 'Plate Heat Exchanger (Free Cooling Economizer)',
      category: 'Waterside Economization',
      description: `Allows chilled water to be produced directly from cold outdoor cooling tower water without operating the energy-intensive chiller compressor during favorable weather.`,
      workingPrinciple: `Indirect liquid-to-liquid conduction across corrugation stainless steel plates with counterflow thermal exchange.`,
      purpose: `Enables 'chillerless' data centre operation during cool weather (ambient wet-bulb < 12-15°C).`,
      waterRelevance: `Saves huge amounts of electrical energy, directly reducing the indirect water footprint of electricity generation at thermal power plants.`,
      paperCitation: `David Mytton (2021); Bora Ristic et al. (2015) Psychrometric Bin Analysis (Metzger et al.).`
    };
    this.sm.registerInteractiveObject(phe);
    this.equipmentGroup.add(phe);

    // 3. Primary & Secondary Chilled Water Pumps
    const pump1 = this.createWaterPump('CHW Pump A');
    pump1.position.set(7.5, 1.4, 12);
    pump1.userData.componentData = {
      id: 'pump-chw-1',
      name: 'Primary Chilled Water Pump Skid A',
      category: 'Hydraulic Pumping',
      description: `Circulates chilled water through the closed internal loop between chiller/PHE and CRAH units.`,
      workingPrinciple: `Centrifugal impeller driven by variable frequency drive (VFD) electric motor creating pressure head.`,
      purpose: `Maintains constant differential pressure and flow velocity across server hall cooling coils.`,
      waterRelevance: `Closed-loop operation with zero direct evaporative loss. Energy consumed contributes to indirect water footprint (EWIF).`,
      paperCitation: `Semenov & Oganesyan (2021); ITU-T L Suppl. 55.`
    };
    this.sm.registerInteractiveObject(pump1);
    this.equipmentGroup.add(pump1);

    const pump2 = this.createWaterPump('CW Pump B (Condenser)');
    pump2.position.set(18.5, 1.4, 12);
    pump2.userData.componentData = {
      id: 'pump-cw-1',
      name: 'Condenser Water Pump Skid B',
      category: 'Hydraulic Pumping',
      description: `Pumps warm condenser water from the chiller condenser barrel out to the external cooling tower and returns cooled water.`,
      workingPrinciple: `Heavy-duty industrial centrifugal pump with cast-iron casing and mechanical seal.`,
      purpose: `Transfers waste heat from chiller out to atmospheric heat rejection equipment.`,
      waterRelevance: `Circulates the active evaporative loop. Any leaks or seal blowouts represent direct water losses.`,
      paperCitation: `David Mytton (2021) npj Clean Water.`
    };
    this.sm.registerInteractiveObject(pump2);
    this.equipmentGroup.add(pump2);

    // 4. Water Storage Tanks (Raw Intake & Buffer)
    const storageTank = this.createWaterStorageTank();
    storageTank.position.set(13, 4.0, -14);
    storageTank.userData.componentData = {
      id: 'tank-storage-1',
      name: 'Central Water Storage & Make-up Buffer Tank',
      category: 'Hydraulic Storage & Quality Management',
      description: `Stores 50,000 litres of treated water providing 24-48 hours of emergency cooling ride-through during municipal water supply disruptions.`,
      workingPrinciple: `Atmospheric vented vertical storage vessel with automated level transmitters and ultrasonic level sensors.`,
      purpose: `Guarantees uninterruptible cooling resilience; buffers intake water from municipal, groundwater, or recycled effluent.`,
      waterRelevance: `Central hub of the facility water balance: Water Input = Evaporation + Blowdown + Drift + ΔStored Water.`,
      paperCitation: `Bora Ristic et al. (2015) Water Footprint Accounting; Ugruymova et al. (2026).`
    };
    this.sm.registerInteractiveObject(storageTank);
    this.equipmentGroup.add(storageTank);

    // 5. Water Treatment Skid (Reverse Osmosis & Dosing)
    const treatmentSkid = this.createWaterTreatmentSkid();
    treatmentSkid.position.set(8, 1.8, -14);
    treatmentSkid.userData.componentData = {
      id: 'skid-treatment-ro',
      name: 'Water Treatment & Reverse Osmosis Skid',
      category: 'Water Quality & Scale Prevention',
      description: `Filters incoming make-up water, removes hardness ions (Ca²⁺, Mg²⁺), controls dissolved silica, and doses biocide to prevent Legionella.`,
      workingPrinciple: `Multi-media filtration, reverse osmosis membrane separation, and anti-scalant dosing.`,
      purpose: `Allows the cooling tower to operate at higher Cycles of Concentration (CoC = 6 to 8 instead of 3), reducing blowdown water waste by over 65%.`,
      waterRelevance: `Direct enabler of water conservation and non-potable greywater utilization.`,
      paperCitation: `David Mytton (2021); Semenov & Oganesyan (2021); ITU-T L Suppl. 55.`
    };
    this.sm.registerInteractiveObject(treatmentSkid);
    this.equipmentGroup.add(treatmentSkid);

    // 6. Liquid Cooling Immersion Tanks & CDU (Setup for Mode 3)
    this.createLiquidCoolingEquipment();
  }

  createCentrifugalChiller() {
    const chiller = new THREE.Group();

    // Evaporator Barrel (Lower cylinder)
    const evpGeo = new THREE.CylinderGeometry(1.3, 1.3, 8.5, 24);
    const evpMesh = new THREE.Mesh(evpGeo, this.materials.chillerBody);
    evpMesh.rotation.z = Math.PI / 2;
    evpMesh.position.set(0, -0.7, 0);
    evpMesh.castShadow = true;
    chiller.add(evpMesh);

    // Condenser Barrel (Upper cylinder)
    const cndGeo = new THREE.CylinderGeometry(1.2, 1.2, 8.2, 24);
    const cndMesh = new THREE.Mesh(cndGeo, this.materials.chillerBody);
    cndMesh.rotation.z = Math.PI / 2;
    cndMesh.position.set(0, 1.3, 0);
    cndMesh.castShadow = true;
    chiller.add(cndMesh);

    // Compressor dome on top
    const compGeo = new THREE.SphereGeometry(1.0, 16, 16);
    const compMesh = new THREE.Mesh(compGeo, this.materials.steel);
    compMesh.position.set(0, 2.6, 0);
    chiller.add(compMesh);

    // Control cabinet
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.0, 1.2), this.materials.steel);
    panel.position.set(-3.2, 0.8, 1.4);
    chiller.add(panel);

    return chiller;
  }

  createPlateHeatExchanger() {
    const phe = new THREE.Group();
    // Frame plates
    const frameGeo = new THREE.BoxGeometry(0.8, 3.8, 2.2);
    const frameMesh = new THREE.Mesh(frameGeo, this.materials.steel);
    phe.add(frameMesh);

    // Corrugated plate pack
    const plateGeo = new THREE.BoxGeometry(2.4, 3.2, 1.8);
    const plateMesh = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.3,
      metalness: 0.8
    }));
    plateMesh.position.set(1.4, 0, 0);
    phe.add(plateMesh);

    // Four Connection Nozzles
    const portGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.6, 16);
    const ports = [
      [-0.4, 1.1, 0.6, this.materials.chilledSupply],
      [-0.4, -1.1, 0.6, this.materials.chilledReturn],
      [-0.4, 1.1, -0.6, this.materials.condenserSupply],
      [-0.4, -1.1, -0.6, this.materials.condenserReturn]
    ];
    ports.forEach(([px, py, pz, mat]) => {
      const p = new THREE.Mesh(portGeo, mat);
      p.rotation.z = Math.PI / 2;
      p.position.set(px, py, pz);
      phe.add(p);
    });

    return phe;
  }

  createWaterPump(label) {
    const pump = new THREE.Group();

    // Pump base
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 1.4), this.materials.steel);
    pump.add(base);

    // Motor (cylinder)
    const motorGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 16);
    const motor = new THREE.Mesh(motorGeo, this.materials.pumpBody);
    motor.rotation.z = Math.PI / 2;
    motor.position.set(-0.4, 0.8, 0);
    pump.add(motor);

    // Impeller volute casing
    const voluteGeo = new THREE.TorusGeometry(0.55, 0.25, 12, 24);
    const volute = new THREE.Mesh(voluteGeo, this.materials.pumpBody);
    volute.rotation.y = Math.PI / 2;
    volute.position.set(0.6, 0.8, 0);
    pump.add(volute);

    // Flange
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16), this.materials.steel);
    flange.position.set(0.6, 1.5, 0);
    pump.add(flange);

    return pump;
  }

  createWaterStorageTank() {
    const tank = new THREE.Group();

    // Outer cylindrical tank shell
    const tankGeo = new THREE.CylinderGeometry(2.2, 2.2, 6.5, 32);
    const tankMesh = new THREE.Mesh(tankGeo, new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.6
    }));
    tankMesh.castShadow = true;
    tank.add(tankMesh);

    // Vertical transparent inspection sight glass
    const glassGeo = new THREE.BoxGeometry(0.1, 5.0, 0.4);
    const sightGlass = new THREE.Mesh(glassGeo, this.materials.glass);
    sightGlass.position.set(2.21, 0, 0);
    tank.add(sightGlass);

    // Internal water level mesh (animated in simulation)
    const waterLevelGeo = new THREE.CylinderGeometry(2.1, 2.1, 4.5, 24);
    this.waterLevelMesh = new THREE.Mesh(waterLevelGeo, this.materials.waterBody);
    this.waterLevelMesh.position.set(0, -0.8, 0);
    tank.add(this.waterLevelMesh);

    return tank;
  }

  createWaterTreatmentSkid() {
    const skid = new THREE.Group();

    const base = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.3, 2.4), this.materials.steel);
    skid.add(base);

    // 3 RO pressure vessels
    for (let i = 0; i < 3; i++) {
      const roGeo = new THREE.CylinderGeometry(0.25, 0.25, 3.2, 16);
      const roMesh = new THREE.Mesh(roGeo, new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 }));
      roMesh.rotation.z = Math.PI / 2;
      roMesh.position.set(0, 0.8 + i * 0.7, 0);
      skid.add(roMesh);
    }

    // Chemical dosing drum
    const drumGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16);
    const drum = new THREE.Mesh(drumGeo, new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    drum.position.set(1.2, 0.9, 0.7);
    skid.add(drum);

    return skid;
  }

  createOutdoorHeatRejectionYard() {
    // 1. Evaporative Cooling Tower
    const coolingTower = this.createEvaporativeCoolingTower();
    coolingTower.position.set(32, 5.5, 7);
    coolingTower.userData.componentData = {
      id: 'tower-cooling-1',
      name: 'Induced-Draft Evaporative Cooling Tower',
      category: 'Atmospheric Heat Rejection',
      description: `The primary water-consuming component in conventional data centres. Rejects building heat into the ambient air by spraying warm condenser water over PVC fill media while drawing air upward with a large motorized fan.`,
      workingPrinciple: `Evaporative cooling: consumes ~2,260 kJ (0.63 kWh) of latent heat for every 1 kg (1 Litre) of water evaporated. Lowers water temperature close to the ambient wet-bulb temperature.`,
      purpose: `Cools condenser water from 35°C back to 29°C for reuse in the chiller.`,
      waterRelevance: `Consumes huge volumes of water! In a 1 MW facility, evaporation consumes ~20-22 million L/year, and blowdown discharges another 3.5-5 million L/year to purge minerals.`,
      paperCitation: `David Mytton (2021) npj Clean Water; Bora Ristic et al. (2015) Section 3.2; Ugruymova et al. (2026).`
    };
    this.sm.registerInteractiveObject(coolingTower);
    this.evaporativeGroup.add(coolingTower);

    // 2. Air-Cooled Dry Coolers / Radiator Bank
    const dryCooler = this.createAirCooledDryCooler();
    dryCooler.position.set(32, 4.0, -9);
    dryCooler.userData.componentData = {
      id: 'drycooler-radiator-1',
      name: 'Air-Cooled Dry Cooler Radiator Bank',
      category: 'Sensible Air Heat Rejection',
      description: `A closed-circuit heat rejection unit that cools recirculating fluid solely through ambient air forced across copper finned tubes by axial fans, with ZERO evaporative water consumption.`,
      workingPrinciple: `Sensible heat transfer ($\dot{Q} = \dot{m} C_p \Delta T$). Limited by ambient dry-bulb temperature rather than wet-bulb temperature.`,
      purpose: `Provides 100% waterless heat rejection in Air-Cooled mode and dry fluid cooling for Liquid Immersion CDUs.`,
      waterRelevance: `Direct Water Use = 0 L/kWh (WUEsite = 0.0). However, electric fan and compressor power increases PUE to 1.4-1.6, which increases the indirect grid water footprint (WUEsource).`,
      paperCitation: `Bora Ristic et al. (2015) Phoenix, Arizona Case Study (United Metal Products); David Mytton (2021).`
    };
    this.sm.registerInteractiveObject(dryCooler);
    this.airCoolingGroup.add(dryCooler);
  }

  createEvaporativeCoolingTower() {
    const tower = new THREE.Group();

    // FRP Structure box
    const bodyGeo = new THREE.BoxGeometry(7.5, 7.0, 7.5);
    const bodyMesh = new THREE.Mesh(bodyGeo, this.materials.towerFiberglass);
    bodyMesh.castShadow = true;
    tower.add(bodyMesh);

    // Lower Air Intake Louvers (wireframe/grill look)
    const louverGeo = new THREE.BoxGeometry(7.6, 2.2, 7.6);
    const louverMesh = new THREE.Mesh(louverGeo, new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      wireframe: true
    }));
    louverMesh.position.set(0, -2.2, 0);
    tower.add(louverMesh);

    // Cold Water Basin at bottom
    const basinGeo = new THREE.BoxGeometry(8.0, 0.8, 8.0);
    const basinMesh = new THREE.Mesh(basinGeo, this.materials.steel);
    basinMesh.position.set(0, -3.6, 0);
    tower.add(basinMesh);

    // Top Fan Cowl / Cylinder
    const cowlGeo = new THREE.CylinderGeometry(2.4, 2.6, 1.6, 24);
    const cowlMesh = new THREE.Mesh(cowlGeo, this.materials.steel);
    cowlMesh.position.set(0, 4.2, 0);
    tower.add(cowlMesh);

    // Rotating 4-Blade Fan
    const fanHub = new THREE.Group();
    fanHub.position.set(0, 4.2, 0);
    for (let f = 0; f < 4; f++) {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.06, 2.1),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 })
      );
      blade.rotation.y = (f * Math.PI) / 2;
      blade.position.set(Math.sin((f * Math.PI) / 2) * 1.0, 0, Math.cos((f * Math.PI) / 2) * 1.0);
      fanHub.add(blade);
    }
    tower.add(fanHub);
    this.animatedComponents.push({
      type: 'fan',
      obj: fanHub,
      speed: 4.5
    });

    return tower;
  }

  createAirCooledDryCooler() {
    const dc = new THREE.Group();

    // V-Bank Radiator Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(8.5, 4.2, 6.5), this.materials.steel);
    dc.add(frame);

    // Fin-tube coils (textured dark slats)
    const coil = new THREE.Mesh(new THREE.BoxGeometry(8.2, 3.6, 6.2), new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.6,
      wireframe: true
    }));
    dc.add(coil);

    // 4 Top Axial Fans
    const fanCoords = [
      [-2.4, 2.2, -1.6], [2.4, 2.2, -1.6],
      [-2.4, 2.2, 1.6], [2.4, 2.2, 1.6]
    ];
    fanCoords.forEach(([fx, fy, fz]) => {
      const cowl = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.4, 16), this.materials.steel);
      cowl.position.set(fx, fy, fz);
      dc.add(cowl);

      const fan = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 1.9), this.materials.steel);
      fan.position.set(fx, fy, fz);
      dc.add(fan);

      this.animatedComponents.push({
        type: 'fan',
        obj: fan,
        speed: 5.5
      });
    });

    return dc;
  }

  createLiquidCoolingEquipment() {
    // 1. Coolant Distribution Unit (CDU)
    const cdu = new THREE.Group();
    const cduBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.5, 2.2), this.materials.chillerBody);
    cdu.add(cduBody);
    cdu.position.set(13, 2.8, 1);
    cdu.userData.componentData = {
      id: 'cdu-liquid-1',
      name: 'Coolant Distribution Unit (CDU)',
      category: 'Liquid Cooling Management',
      description: `Separates the facility water system (FWS) from the secondary technology cooling loop (TCS). Controls liquid coolant pressure, flow rate, and temperature feeding direct-to-chip cold plates and immersion tanks.`,
      workingPrinciple: `Liquid-to-liquid heat exchange with redundant variable-speed circulating pumps and deionized water conditioning.`,
      purpose: `Delivers precise fluid flow to high-density racks (>40-100 kW/rack, such as Nvidia DGX systems).`,
      waterRelevance: `Direct water savings of 90-98%! Heat is transferred directly to liquid with 96% capture efficiency, eliminating evaporative tower requirements when paired with dry coolers.`,
      paperCitation: `David Mytton (2021) Section 'Liquid Cooling'; Ellsworth et al. (2012) IBM Power 775 Supercomputer Water Cooling System.`
    };
    this.sm.registerInteractiveObject(cdu);
    this.liquidCoolingGroup.add(cdu);

    // 2. Immersion Cooling Tank 1 & 2
    for (let t = 0; t < 2; t++) {
      const tank = new THREE.Group();
      const tankBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 4.2), this.materials.steel);
      tank.add(tankBody);

      // Glass viewing window on top
      const topGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3.8), this.materials.glass);
      topGlass.rotation.x = -Math.PI / 2;
      topGlass.position.set(0, 1.11, 0);
      tank.add(topGlass);

      // Submerged server blades inside
      const bladeGeo = new THREE.BoxGeometry(1.8, 1.4, 3.4);
      const bladeMesh = new THREE.Mesh(bladeGeo, this.materials.waterBody);
      bladeMesh.position.set(0, 0, 0);
      tank.add(bladeMesh);

      tank.position.set(18.5, 1.6, t * 5.5 - 2.5);
      tank.userData.componentData = {
        id: `immersion-tank-${t + 1}`,
        name: `Immersion Cooling Tank #${t + 1}`,
        category: 'Next-Gen Direct Immersion',
        description: `Submerges entire server blades directly into dielectric synthetic or fluorochemical liquid. Fluid directly contacts CPUs, GPUs, and power supplies, carrying away thermal energy via natural and pumped convection.`,
        workingPrinciple: `Single-phase or two-phase liquid thermal submersion. High dielectric strength prevents electrical shorting while thermal conductivity exceeds air by orders of magnitude.`,
        purpose: `Eliminates all fans and air conditioning overhead; allows supply fluid temperatures up to 45°C.`,
        waterRelevance: `Zero direct water evaporation. Enables free dry cooling worldwide, slashing WUEsite to near zero (0.02 L/kWh).`,
        paperCitation: `David Mytton (2021); Chi et al. (2014) Case Study of Immersion Cooling (Semi-Therm); Semenov & Oganesyan (2021).`
      };
      this.sm.registerInteractiveObject(tank);
      this.liquidCoolingGroup.add(tank);
    }
  }

  createPipingNetwork() {
    // 1. Chilled Water Supply (CWS - Blue) Chiller -> Server CRAHs
    this.createPipePath([
      new THREE.Vector3(13, 0.4, 6),
      new THREE.Vector3(7.5, 0.4, 12),
      new THREE.Vector3(-4, 0.4, 12),
      new THREE.Vector3(-38, 0.4, 12)
    ], this.materials.chilledSupply, 0.28, 'pipe-cws', 'Chilled Water Supply Pipe (7°C-18°C)');

    // 2. Chilled Water Return (CWR - Light Cyan) CRAHs -> Chiller
    this.createPipePath([
      new THREE.Vector3(-38, 0.4, -12),
      new THREE.Vector3(-4, 0.4, -12),
      new THREE.Vector3(7.5, 0.4, -6),
      new THREE.Vector3(13, 0.4, 2)
    ], this.materials.chilledReturn, 0.28, 'pipe-cwr', 'Chilled Water Return Pipe (14°C-24°C)');

    // 3. Condenser Water Loop: Chiller -> Cooling Tower (Warm Amber Return)
    this.createPipePath([
      new THREE.Vector3(13, 2.2, 6),
      new THREE.Vector3(22, 2.2, 6),
      new THREE.Vector3(26, 7.8, 6),
      new THREE.Vector3(32, 7.8, 7)
    ], this.materials.condenserReturn, 0.3, 'pipe-cwr-c', 'Warm Condenser Water Return to Tower (35°C)');

    // 4. Condenser Water Supply: Cooling Tower -> Chiller (Green Supply)
    this.createPipePath([
      new THREE.Vector3(32, 2.2, 7),
      new THREE.Vector3(26, 2.2, 9),
      new THREE.Vector3(18.5, 2.2, 12),
      new THREE.Vector3(13, 2.2, 9)
    ], this.materials.condenserSupply, 0.3, 'pipe-cws-c', 'Cooled Condenser Water from Basin (29°C)');

    // 5. Make-up Water Supply: Storage Tank -> Cooling Tower Basin
    this.createPipePath([
      new THREE.Vector3(13, 1.2, -14),
      new THREE.Vector3(24, 1.2, -14),
      new THREE.Vector3(28, 1.2, 3),
      new THREE.Vector3(32, 1.8, 4)
    ], this.materials.makeupWater, 0.2, 'pipe-makeup', 'Make-up Water Supply Line');

    // 6. Blowdown Line: Cooling Tower Basin -> Drainage
    this.createPipePath([
      new THREE.Vector3(32, 1.6, 10.5),
      new THREE.Vector3(35, 1.6, 12),
      new THREE.Vector3(42, 0.2, 12)
    ], this.materials.blowdown, 0.18, 'pipe-blowdown', 'Cooling Tower Blowdown Drain Line (Mineral Purge)');

    // 7. Liquid Cooling Loop (CDU -> Immersion Tanks & Dry Cooler)
    this.createPipePath([
      new THREE.Vector3(13, 3.2, 1),
      new THREE.Vector3(18.5, 3.2, 0),
      new THREE.Vector3(24, 3.2, -4),
      new THREE.Vector3(32, 4.0, -7)
    ], this.materials.liquidCoolant, 0.22, 'pipe-liquid', 'Closed-Circuit Liquid Coolant Loop (Immersion / Cold Plates)');
  }

  createPipePath(points, material, radius, id, name) {
    const curve = new THREE.CatmullRomCurve3(points);
    curve.curveType = 'catmullrom';
    curve.tension = 0.1;

    const tubeGeo = new THREE.TubeGeometry(curve, 48, radius, 12, false);
    const pipeMesh = new THREE.Mesh(tubeGeo, material);
    pipeMesh.castShadow = true;
    pipeMesh.userData.componentData = {
      id: id,
      name: name,
      category: 'Hydraulic Piping Infrastructure',
      description: `Heavy-duty insulated schedule 40 carbon steel or stainless steel pipeline carrying conditioned thermal transfer fluid.`,
      workingPrinciple: `Fluid mechanics: forced pressure differential flow governed by Bernoulli and Darcy-Weisbach friction equations.`,
      purpose: `Transports fluid between heat-generating equipment, pumps, chillers, and heat rejection units.`,
      waterRelevance: `Crucial hydraulic link for direct water loops. Color-coded per ASME A13.1 scheme to separate clean potable/chilled streams from warm recirculated or blowdown streams.`,
      paperCitation: `David Mytton (2021); Bora Ristic et al. (2015).`
    };
    this.sm.registerInteractiveObject(pipeMesh);
    this.pipingGroup.add(pipeMesh);
    return curve;
  }

  setRoofVisibility(visible) {
    this.roofGroup.visible = visible;
  }

  setRoofOpacity(opacity) {
    this.materials.acrylicRoof.opacity = opacity;
  }

  setCoolingTechnology(tech) {
    // tech: 'evaporative' | 'air' | 'liquid'
    if (tech === 'evaporative') {
      this.evaporativeGroup.visible = true;
      this.airCoolingGroup.visible = false;
      this.liquidCoolingGroup.visible = false;
    } else if (tech === 'air') {
      this.evaporativeGroup.visible = false;
      this.airCoolingGroup.visible = true;
      this.liquidCoolingGroup.visible = false;
    } else if (tech === 'liquid') {
      this.evaporativeGroup.visible = false;
      this.airCoolingGroup.visible = true; // Used as dry cooler for CDU
      this.liquidCoolingGroup.visible = true;
    }
  }

  update(delta, time) {
    this.onUpdate(delta, time);
  }

  setWireframe(enabled) {
    this.rootGroup.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.wireframe = enabled);
        } else {
          child.material.wireframe = enabled;
        }
      }
    });
  }

  setHeatMapMode(enabled) {
    // Traverse server racks and tint warm/cool
    this.serverGroup.traverse((child) => {
      if (child.isMesh && child.userData && child.userData.isServerChassis) {
        if (enabled) {
          child.material.color.setHex(0xff3b30); // Hot red
        } else {
          child.material.color.setHex(0x1e293b); // Slate dark
        }
      }
    });
  }

  onUpdate(delta, time) {
    // Animate fan blades
    for (let i = 0; i < this.animatedComponents.length; i++) {
      const comp = this.animatedComponents[i];
      if (comp.type === 'fan' && comp.obj.parent && comp.obj.parent.visible) {
        comp.obj.rotation.y += comp.speed * delta;
      }
    }

    // Blink server LEDs
    const blink = Math.sin(time * 6) > 0.1;
    for (let i = 0; i < this.blinkingLEDs.length; i++) {
      this.blinkingLEDs[i].opacity = blink ? 1.0 : 0.3;
    }

    // Dynamic water level wave in tank
    if (this.waterLevelMesh) {
      this.waterLevelMesh.scale.y = 1.0 + Math.sin(time * 1.5) * 0.02;
    }
  }
}

export { DataCenterModel as DatacenterModel };
