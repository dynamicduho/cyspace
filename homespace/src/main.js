// main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { initWhiteboard } from './whiteboard.js';
import Cookies from 'universal-cookie';
import { 
    loadAvatar, 
    updateAvatarAnimations, 
    createAvatarChatDialog, 
    setupAvatarInteraction 
} from './avatar.js';
import { initBookshelf } from './diary.js';
import { applySimpleTextures } from './simple-textures.js';


// Initialize cookies to access session
const cookies = new Cookies();
const visitorAuthSession = cookies.get('auth_session'); //token: idToken (okto), userId: user (wallet), isLoggedIn

let scene, camera, renderer, controls;
const objects = [];
const clock = new THREE.Clock(); // For animation timing
const roomSize = 12;

function init() {
    const currentUrl = new URL(window.location.href);
    const pathMatch = currentUrl.pathname.match(/^\/u\/([a-zA-Z0-9_-]+)$/);
    
    if (!pathMatch) {
        userNotFound();
        return;
    }
    const username = pathMatch[1]
    console.log(`Loading homespace for user: ${username}`);
    // Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    // Camera Setup
    camera = new THREE.PerspectiveCamera(
        50,                                    // Field of view
        window.innerWidth / window.innerHeight, // Aspect ratio
        0.01,                                  // Near clipping plane (reduced from 0.1)
        1000                                   // Far clipping plane
    );
    camera.position.set(4, 5, 4); // Adjusted for better view
    camera.lookAt(0, 1, 0); // Look at center at human height

    // Renderer Setup - Compatible with different Three.js versions
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Enable shadows
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
    
    // Handle different versions of Three.js
    if (typeof renderer.outputColorSpace !== 'undefined') {
        // For newer versions of Three.js (r152+)
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if (typeof renderer.outputEncoding !== 'undefined') {
        // For older versions
        renderer.outputEncoding = THREE.sRGBEncoding;
    }
    
    // Tone mapping that works in most versions
    if (typeof THREE.ACESFilmicToneMapping !== 'undefined') {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
    }
    
    document.body.appendChild(renderer.domElement);

    // Controls Setup
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.5;  // Reduced from 1 to allow closer inspection
    controls.maxDistance = 30;
    controls.target.set(0, 1, 0); // Set orbit target to center at human height
    controls.enableZoom = true;   // Make sure zoom is enabled
    
    // Prevent camera from going below the floor
    controls.minPolarAngle = 0.1; // Slightly above horizontal
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Slightly less than 90 degrees

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true; // Enable shadows
    
    // Adjust shadow properties for softer shadows
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.bias = -0.0005; // Helps reduce shadow acne
    
    // Not using shadow.intensity as it's not supported in all versions
    scene.add(directionalLight);
    
    // Add a secondary fill light from the opposite direction
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xECE2D4,
        roughness: 0.7,
        metalness: 0.2
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = "floor"; // Add a name to easily find it later
    scene.add(floor);


    addWalls();

    applySimpleTextures(scene).catch(error => {
        console.error("Failed to apply textures:", error);
    });
    
    
    // Create chat dialog before loading models so it's ready when needed
    createAvatarChatDialog(visitorAuthSession, username);
    
    // Setup click interaction for avatar
    setupAvatarInteraction(visitorAuthSession, scene, camera, controls);

    // Load Room Model and Avatar with loading manager
    const loadingManager = new THREE.LoadingManager(
        // onLoad
        () => {
            console.log('All models loaded successfully');
        },
        // onProgress
        (url, itemsLoaded, itemsTotal) => {
            console.log(`Loading: ${url} (${itemsLoaded}/${itemsTotal})`);
        },
        // onError
        (url) => {
            console.error(`Error loading: ${url}`);
        }
    );

    loadRoom(loadingManager);
    
    // Load avatar using the new module
    // TODO: update avatar asset with user's avatar
    loadAvatar(visitorAuthSession, username, scene, loadingManager, objects);
    
    // Initialize whiteboard
    initWhiteboard(visitorAuthSession, username, scene, camera, controls, roomSize);

    initBookshelf(visitorAuthSession, username, scene, camera, controls, loadingManager);


    addUsernameUI(username);

    // Resize Handling
    window.addEventListener('resize', onWindowResize);

    animate();
}

function userNotFound() {
    // Clear the current page content
    document.body.innerHTML = '';
    
    // Create error container
    const errorContainer = document.createElement('div');
    errorContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333;
    `;
    
    // Add error message
    const errorHeading = document.createElement('h1');
    errorHeading.textContent = 'User Space Not Found';
    errorHeading.style.marginBottom = '16px';
    
    const errorMessage = document.createElement('p');
    errorMessage.textContent = 'The requested user space does not exist or the URL format is invalid.';
    errorMessage.style.marginBottom = '24px';
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close Page';
    closeButton.style.cssText = `
      padding: 12px 24px;
      background-color: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
    `;
    closeButton.addEventListener('click', () => {
      // Attempt to close the window
      window.close();
      
      // If window.close() doesn't work (due to browser security restrictions),
      // show a message instructing the user to close the tab manually
      setTimeout(() => {
        errorMessage.textContent = 'Please close this tab manually. Some browsers prevent pages from closing themselves.';
        closeButton.style.display = 'none';
      }, 300);
    });
    
    // Add all elements to the container
    errorContainer.appendChild(errorHeading);
    errorContainer.appendChild(errorMessage);
    errorContainer.appendChild(closeButton);
    
    // Add container to the body
    document.body.appendChild(errorContainer);
    
    // Stop any further loading or initialization
    console.error('Invalid URL pattern - user space not loaded');
}
    


function addUsernameUI(username) {
    const ui = document.createElement('div');
    ui.id = 'ui';
    ui.innerHTML = `
        <div style="background-color: rgba(0,0,0,0.5); color: white; padding: 10px; border-radius: 5px;">
            <h3>Welcome to @${username}'s homespace</h3>
        </div>
    `;
    document.body.appendChild(ui);
}

// Walls
function createWall(width, height, depth, x, y, z, name) {
    const wallGeometry = new THREE.BoxGeometry(width, height, depth);
    
    // Create a basic material (will be replaced with textured material)
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xe0f7fa,
        roughness: 0.9,
        metalness: 0.1 
    });
    
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.name = name;
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    return wall;
}

// Add four walls
function addWalls() {
    const wallHeight = 5;
    const wallThickness = 0.2;

    const walls = [
        createWall(roomSize, wallHeight, wallThickness, 0, wallHeight / 2, -roomSize / 2, "backwall"), // Back wall
        createWall(roomSize, wallHeight, wallThickness, 0, wallHeight / 2, roomSize / 2, "frontwall"),  // Front wall
        createWall(wallThickness, wallHeight, roomSize, -roomSize / 2, wallHeight / 2, 0, "leftwall"), // Left wall
        createWall(wallThickness, wallHeight, roomSize, roomSize / 2, wallHeight / 2, 0, "rightwall")   // Right wall
    ];
    
    return walls;
}

function loadRoom(manager) {
    const loader = new GLTFLoader(manager);
    loader.load(
        '/public/models/room.glb', 
        // onLoad callback
        (gltf) => {
            const roomModel = gltf.scene;
            
            // Enable shadows for room model and fix culling
            roomModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Fix frustum culling issues
                    if (child.geometry) {
                        child.geometry.computeBoundingSphere();
                        // Increase the bounding sphere radius to prevent culling
                        if (child.geometry.boundingSphere) {
                            child.geometry.boundingSphere.radius *= 1.2;
                        }
                    }
                }
            });
            
            scene.add(roomModel);
        }, 
        // onProgress callback
        (xhr) => {
            console.log(`Room ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
        }, 
        // onError callback
        (error) => {
            console.error('Error loading room model:', error);
        }
    );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Keep camera within room boundaries
    keepCameraInRoom();
    
    // Update animations using the imported function
    const delta = clock.getDelta();
    updateAvatarAnimations(delta);
    
    renderer.render(scene, camera);
}

// Function to keep the camera within the room boundaries
function keepCameraInRoom() {
    const roomSize = 10; // Should match the wall creation
    const wallThickness = 0.2;
    const padding = 0.5; // Extra padding from walls
    
    const minX = -roomSize/2 + wallThickness + padding;
    const maxX = roomSize/2 - wallThickness - padding;
    const minZ = -roomSize/2 + wallThickness + padding;
    const maxZ = roomSize/2 - wallThickness - padding;
    
    // Clamp position coordinates
    if (camera.position.x < minX) camera.position.x = minX;
    if (camera.position.x > maxX) camera.position.x = maxX;
    if (camera.position.z < minZ) camera.position.z = minZ;
    if (camera.position.z > maxZ) camera.position.z = maxZ;
    
    // Optional: Adjust target if needed to prevent looking through walls
    // This ensures the avatar stays in view
    const targetDistanceToWall = 0.5;
    
    if (controls.target.x < minX + targetDistanceToWall) 
        controls.target.x = minX + targetDistanceToWall;
    if (controls.target.x > maxX - targetDistanceToWall) 
        controls.target.x = maxX - targetDistanceToWall;
    if (controls.target.z < minZ + targetDistanceToWall) 
        controls.target.z = minZ + targetDistanceToWall;
    if (controls.target.z > maxZ - targetDistanceToWall) 
        controls.target.z = maxZ - targetDistanceToWall;
}

// Expose functions for UI
window.init = init;

// Initialize the scene
init();