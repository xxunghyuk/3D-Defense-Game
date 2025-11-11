// world.js
import * as THREE from 'three';

export class World {
	constructor(scene) {
		this.scene = scene;  // Reference to the main Three.js scene
		this.core = null;    // The central core object (target for enemies)
	}

	//Create the ground plane and grid
	createField() {
		const FIELD_SIZE = 400;
		const planeGeo = new THREE.PlaneGeometry(FIELD_SIZE, FIELD_SIZE);
		const planeMat = new THREE.MeshStandardMaterial({
			color: 0x2ecc71,   // Green (grass)
			roughness: 0.9,    // Matte surface
			metalness: 0.0,    // No metallic reflection
		}); 
		const ground = new THREE.Mesh(planeGeo, planeMat);
		ground.rotation.x = -Math.PI / 2;   // Rotate to lie flat (XZ plane)
		ground.receiveShadow = true;
		this.scene.add(ground);

		const grid = new THREE.GridHelper(
			FIELD_SIZE,           // Grid size
			FIELD_SIZE / 2,       // Number of grid divisions
			0xffffff,             // Main grid line color
			0xaaaaaa              // Secondary line color
		);
		grid.position.y = 0.01;   // Slightly above the ground to prevent z-fighting
		this.scene.add(grid);
	}

	// Create the player's central core (base)
	createCore() {
		const coreGeo = new THREE.BoxGeometry(2, 4, 2);
		const coreMat = new THREE.MeshStandardMaterial({
			color: 0xe74c3c,
			metalness: 0.2,
			roughness: 0.4,
		});
		
		this.core = new THREE.Mesh(coreGeo, coreMat);
		this.core.position.set(0, 2, 0);    // Center of the map, elevated slightly
		this.core.castShadow = true;        // Core casts a shadow
		this.scene.add(this.core);
	}

// Add lighting (directional + ambient)
	createLights() {
		// Main directional light (like sunlight)
		const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
		dirLight.position.set(20, 40, 10);
		dirLight.castShadow = true;
		this.scene.add(dirLight);
		
		// Soft ambient light for general illumination
		const ambient = new THREE.AmbientLight(0xffffff, 0.3);
		this.scene.add(ambient);
	}

	init() {
		this.createField();   // Create ground + grid
		this.createCore();    // Create central base
		this.createLights();  // Add lights to the scene
	}
}
