// main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { World } from './world.js';
import { EnemyManager } from './enemies.js';
import { Tower } from './towers.js';

// global variables
let scene, camera, renderer, controls;
let world, enemies;
let towers = [];            // List of all active towers
let lastTime = 0;           // Last frame time (for delta time)
let placingTower = null;    // Currently selected tower type ("basic")
let raycaster, mouse;
let health = 20;            // Player base health
let healthBar, healthFill, healthText;
let towerUI;

// Grid cell size (used to align towers neatly to the ground grid))
const GRID_SIZE = 2;

// Update the health bar UI whenever HP changes
function updateHealthUI() {
	const percentage = Math.max(0, (health / 20) * 100);
	healthFill.style.width = `${percentage}%`;
	healthText.textContent = `HP: ${health}`;

	// Change color depending on HP level
	if (percentage > 50) {
	healthFill.style.background = 'linear-gradient(to right, #00e676, #76ff03)';
	} else if (percentage > 25) {
	healthFill.style.background = 'linear-gradient(to right, #ffeb3b, #ffc107)';
	} else {
	healthFill.style.background = 'linear-gradient(to right, #f44336, #d32f2f)';
	}
}

// Initialize the 3D scene and start the game
function initGame() {
	console.log('initGame()');

	const container = document.getElementById('game-container');
	healthBar = document.getElementById('health-bar');
	towerUI = document.getElementById('tower-ui');
	healthFill = document.getElementById('health-fill');
	healthText = document.getElementById('health-text');

	// Show UI elements
	healthBar.style.display = 'block';
	towerUI.style.display = 'flex';
	health = 20;
	updateHealthUI();
	
	// Scene setup 
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x87ceeb);

	camera = new THREE.PerspectiveCamera(
		60,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);
	camera.position.set(25, 25, 25);
	camera.lookAt(0, 0, 0);

	// Renderer setup
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	container.innerHTML = '';
	container.appendChild(renderer.domElement);
	
	// mouse camera movement
	controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 0, 0);
	controls.update();

	// for detecting ground clicks
	raycaster = new THREE.Raycaster();
	mouse = new THREE.Vector2();

	// Initialize world and enemies
	world = new World(scene);
	world.init();

	enemies = new EnemyManager(scene, new THREE.Vector3(0, 0, 0));
	
	// Event listeners
	window.addEventListener('resize', onWindowResize);
	renderer.domElement.addEventListener('click', onMouseClick);

	initTowerUI();

	lastTime = performance.now();
	animate();
}

// Main animation, game loop
function animate() {
	requestAnimationFrame(animate);
	const now = performance.now();
	const delta = (now - lastTime) / 1000;
	lastTime = now;
	
	// Rotate the core slowly for effect
	if (world.core) world.core.rotation.y += 0.01;

	// Update enemies and detect collisions with the core
	if (enemies && world.core) {
		enemies.update(delta);
		enemies.checkCollisions(world.core.position, handleCoreHit);
	}

	// Update towers (target tracking + bullet updates)
	for (const tower of towers) {
		tower.update(enemies.enemies, delta);
	}
	
	// Update controls and render the scene
	controls.update();
	renderer.render(scene, camera);

	// Check for game over
	if (health <= 0) {
		showGameOver();
	}
}

// Handle when an enemy hits the core
function handleCoreHit() {
	health -= 1;
	console.log(`Core Hit! HP: ${health}`);
	updateHealthUI();
}

// Display the Game Over message
function showGameOver() {
	const text = document.createElement('div');
	text.style.position = 'absolute';
	text.style.top = '50%';
	text.style.left = '50%';
	text.style.transform = 'translate(-50%, -50%)';
	text.style.color = '#fff';
	text.style.fontSize = '48px';
	text.style.fontWeight = 'bold';
	text.textContent = 'GAME OVER';
	document.body.appendChild(text);

	enemies.spawnInterval = 999999; // no more enemies
}

// Handle mouse clicks for tower placement
function onMouseClick(event) {
	// If not in placement mode, ignore clicks
	if (!placingTower) return;

	const rect = renderer.domElement.getBoundingClientRect();
	mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
	mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObjects(scene.children, true);

	for (let i of intersects) {
    
		// Only allow placement on the ground (PlaneGeometry)
		if (i.object.geometry && i.object.geometry.type === 'PlaneGeometry') {
			let pos = i.point.clone();
			pos.y = 0;

			// 1) Snap to grid (Minecraft-style placement)
			pos.x = Math.round(pos.x / GRID_SIZE) * GRID_SIZE;
			pos.z = Math.round(pos.z / GRID_SIZE) * GRID_SIZE;

			// 2) Prevent placing too close to the core
			const distToCore = pos.length(); // core is at (0,0,0)
			if (distToCore < 4) {
			console.log('Cannot place tower too close to the core.');
			return;
			}

			// 3) Prevent placing on an already occupied grid cell
			const occupied = towers.some(
			(t) =>
			  Math.abs(t.mesh.position.x - pos.x) < 0.01 &&
			  Math.abs(t.mesh.position.z - pos.z) < 0.01
			);
			if (occupied) {
			console.log('There is already a tower on this tile.');
			return;
			}

			// 4) Create the tower at the final snapped position
			const newTower = new Tower(scene, pos, placingTower);
			towers.push(newTower);
			console.log(`Placed ${placingTower} tower at`, pos);

			// Exit placement mode
			placingTower = null;
			document
				.querySelectorAll('.tower-btn')
				.forEach((b) => b.classList.remove('placing'));
			return;
		}
	}
}

// Initialize the tower selection UI
function initTowerUI() {
	document.querySelectorAll('.tower-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			// Clear active highlighting
			document
				.querySelectorAll('.tower-btn')
				.forEach((b) => b.classList.remove('placing'));
			
			// Toggle selection
			if (placingTower === btn.dataset.type) {
			
			// Deselect if clicking same button again
				placingTower = null;
			} else {
				// Activate placement mode for the selected tower
				placingTower = btn.dataset.type;
				btn.classList.add('placing');
			}
		});
	});
}

// Handle browser window resize
function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize Start Screen and set up Start button
function initStartUI() {
  const startScreen = document.getElementById('start-screen'); 
  const startBtn = document.getElementById('start-btn');
  const gameContainer = document.getElementById('game-container');

  startBtn.addEventListener('click', () => { 
    startScreen.style.display = 'none';      // Hide start screen
    gameContainer.style.display = 'block';   // Show game canvas
    initGame();                              // Start the game
  });   
}

// Initialize start screen UI at page load
initStartUI();
