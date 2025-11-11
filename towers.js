// towers.js
import * as THREE from 'three';

export class Tower {
	constructor(scene, position, type = 'basic') {
		this.scene = scene;											// Reference to the main scene
		this.position = position.clone();							// Tower placement position
		this.type = type;											// Tower type: "basic" or "rapid"
		this.lastShot = 0;											// Timestamp of last fired bullet
		this.fireRate = type === 'rapid' ? 200 : 600; 				// Fire delay in ms
		this.range = 10;											// Attack range radius
		this.bullets = [];											// Array of active bullets fired by this tower


		// Tower appearance setup	
		const height = type === 'rapid' ? 2.5 : 3.5;
		const color = type === 'rapid' ? 0x00cec9 : 0xf1c40f;       // Cyan or Yellow
		const geo = new THREE.CylinderGeometry(0.8, 1, height, 12);
		const mat = new THREE.MeshStandardMaterial({ color });
		
		// Create the mesh and position it
		this.mesh = new THREE.Mesh(geo, mat);
		this.mesh.position.copy(position);
		this.mesh.position.y = height / 2;							// Raise tower above ground
		this.scene.add(this.mesh);
	}
 
	// Called every frame - handles targeting and bullet
	update(enemies, delta) {
		const now = performance.now();

		// 1. find the closest enemy
		let nearest = null;
		let minDist = this.range;
		for (const e of enemies) {
			const dist = this.mesh.position.distanceTo(e.position);
			if (dist < minDist) {
				minDist = dist;
				nearest = e;
			}
		}

		// 2. Fire a bullet if the cooldown (fireRate) has passed
		if (nearest && now - this.lastShot > this.fireRate) {
			this.shoot(nearest);
			this.lastShot = now;
		}

		// 3. Update bullet positions
		this.updateBullets(delta);
	}

	// Shoot a bullet toward a specific target
	shoot(target) {
		// Create a small white bullet sphere
		const bulletGeo = new THREE.SphereGeometry(0.2, 8, 8);
		const bulletMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
		const bullet = new THREE.Mesh(bulletGeo, bulletMat);
		
		// Start at tower position
		bullet.position.copy(this.mesh.position);
		
		// Store bullet properties
		bullet.userData = {
			target,             // Target enemy object
			speed: 20,			// Bullet travel speed
		};
    
		this.scene.add(bullet);
		this.bullets.push(bullet);
	}

	// Move bullets and detect hits with enemies
	updateBullets(delta) {
		const active = [];
		
		for (const b of this.bullets) {
			const target = b.userData.target;
			if (!target) continue;              // Skip if no target exists

		// Calculate direction from bullet → target
			const dir = new THREE.Vector3().subVectors(target.position, b.position);
			const dist = dir.length();

			// 1. Collision check — if close enough, destroy both
			if (dist < 0.5) {
			// eliminate enemies
				this.scene.remove(b);				// Remove bullet from scene
				target.position.y = -999; 			// Move target underground (treated as dead)
				continue;
			}
			
			// 2. Move bullet forward toward target
			dir.normalize();
			b.position.addScaledVector(dir, b.userData.speed * delta);
			active.push(b);							// Keep active bullets
		}
	
		// Update bullet array with only remaining bullets
		this.bullets = active;
	}
}
