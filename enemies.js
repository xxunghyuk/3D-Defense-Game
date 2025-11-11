// enemies.js
import * as THREE from 'three';

export class EnemyManager {
	constructor(scene, target) {
		this.scene = scene;           // Reference to the main scene
		this.target = target;         // Vector3 position of the core (enemy destination)
		this.enemies = [];            // Active enemy objects currently in the scene
		this.spawnInterval = 1000;    // Spawn rate (milliseconds between spawns)
		this.lastSpawn = 0;           // Timestamp of last enemy spawn
	} 

	// Spawn a new enemy at a random map edge
	spawnEnemy() {
		// Enemy geometry and material (blue sphere)
		const enemyGeo = new THREE.SphereGeometry(0.7, 16, 16);
		const enemyMat = new THREE.MeshStandardMaterial({ color: 0x3498db });
		const enemy = new THREE.Mesh(enemyGeo, enemyMat);
		
		// Determine spawn side (0~3: left, right, top, bottom)
		const range = 20; // Distance from center to spawn
		const side = Math.floor(Math.random() * 4);
		let x = 0, z = 0;
		
		// Left side
		if (side === 0) {
			x = -range;
			z = Math.random() * range * 2 - range; 
		}
		// Right side
		if (side === 1) {
			x = range;
			z = Math.random() * range * 2 - range; 
		}		
		// Top side
		if (side === 2) { 
			z = -range; 
			x = Math.random() * range * 2 - range; 
		}
		// Bottom side
		if (side === 3) {
			z = range;
			x = Math.random() * range * 2 - range;
		}
		// Set initial position and add to scene
		enemy.position.set(x, 0.7, z);
		this.scene.add(enemy);
		this.enemies.push(enemy);
	}

	// Update enemy positions each frame
	update(deltaTime) {
		const now = performance.now();
		
		// Spawn new enemies periodically
		if (now - this.lastSpawn > this.spawnInterval) {
			this.spawnEnemy();
			this.lastSpawn = now;
		}
		
		// Move each enemy toward the target (the core)
		for (const e of this.enemies) {
			const dir = new THREE.Vector3(
				this.target.x - e.position.x,
				0,
				this.target.z - e.position.z
			);
			dir.normalize();                                  // Get unit direction vector
			e.position.addScaledVector(dir, deltaTime * 3);   // Move at 3 units/sec
		}
	}

	// Check if enemies have collided with the core
	checkCollisions(corePosition, onHit) {
		const remaining = [];  								  // Enemies that stay in the game after collision check
		
		for (const e of this.enemies) {
			const dist = e.position.distanceTo(corePosition);

			if (dist < 2) {
				// Collision detected with core
				this.scene.remove(e);   // Remove enemy from scene
				onHit();				// Trigger callback (e.g., reduce HP)
			} else {
				// Keep enemy in the array if not collided
				remaining.push(e);
			}
		}
		// Update the enemy list to only keep remaining enemies
		this.enemies = remaining;
	}
}
