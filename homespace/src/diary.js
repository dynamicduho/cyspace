// diary.js - New file to handle diary functionality
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { getBaseWallet } from './supabase';
import { GET_DIARY_ENTRIES } from './query/diary-query';

let bookshelfModel;
let diaryEntries = [];
let scene, camera, controls;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const GRAPHQL_ENDPOINT = 'https://api.studio.thegraph.com/query/105689/cyspacenetwork-base/version/latest/';

export function initBookshelf(visitorAuthSession, username, sceneRef, cameraRef, controlsRef, loadingManager) {
    scene = sceneRef;
    camera = cameraRef;
    controls = controlsRef;
    
    // Load the bookshelf model
    const loader = new GLTFLoader(loadingManager);
    loader.load(
        '/public/models/bookshelf.glb',
        (gltf) => {
            bookshelfModel = gltf.scene;
            
            // Enable shadows and fix culling
            bookshelfModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Add name to make the mesh identifiable for raycasting
                    child.name = "bookshelf";
                    
                    // Fix frustum culling issues
                    if (child.geometry) {
                        child.geometry.computeBoundingSphere();
                        if (child.geometry.boundingSphere) {
                            child.geometry.boundingSphere.radius *= 1.2;
                        }
                    }
                }
            });
            
            // Position the bookshelf against a wall
            bookshelfModel.position.set(-5.8, 1, 0); // Adjust position as needed
            bookshelfModel.rotation.y = -Math.PI / 2; // Rotate to face into the room (corrected orientation)
            bookshelfModel.scale.set(2, 2, 2); // Increased scale by 50%
            
            scene.add(bookshelfModel);
            console.log('Bookshelf loaded successfully');
            
            // Setup click interaction
            window.addEventListener('click', onMouseClick);
            
            // Load existing diary entries if available
            loadDiaryEntries(username);
        },
        (xhr) => {
            console.log(`Bookshelf ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
        },
        (error) => {
            console.error('Error loading bookshelf model:', error);
        }
    );
}

function onMouseClick(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Check if bookshelf was clicked
    for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object.name === "bookshelf" || 
            (intersects[i].object.parent && intersects[i].object.parent.name === "bookshelf")) {
            console.log('Bookshelf clicked');
            openDiaryUI();
            break;
        }
    }
}

function openDiaryUI() {
    // Check if UI already exists
    if (document.getElementById('diary-ui')) {
        return;
    }
    
    // Disable camera controls when diary UI is open
    if (window.controls) {
        window.controls.enabled = false;
    }
    
    // Create an overlay to block interactions with elements behind
    const overlay = document.createElement('div');
    overlay.id = 'diary-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999;
    `;
    
    // Add overlay click handler to keep clicks from reaching elements behind
    overlay.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Prevent the click from reaching any element behind
        return false;
    });
    
    // Add more robust pointer handlers
    overlay.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Prevent the pointerdown from reaching any element behind
        return false;
    });
    
    // Capture phase event listeners to ensure events are caught before they reach other elements
    document.addEventListener('click', blockEventsWhileDiaryOpen, true);
    document.addEventListener('mousedown', blockEventsWhileDiaryOpen, true);
    document.addEventListener('mouseup', blockEventsWhileDiaryOpen, true);
    
    // Function to block events while diary is open
    function blockEventsWhileDiaryOpen(e) {
        const diaryUI = document.getElementById('diary-ui');
        const overlay = document.getElementById('diary-overlay');
        
        // If diary is open and click is outside diary UI, block it
        if (diaryUI && overlay) {
            // If the click is not inside the diary UI, block it
            if (!diaryUI.contains(e.target) && e.target !== diaryUI) {
                e.stopPropagation();
                e.preventDefault();
                return false;
            }
        }
    }
    
    // Add overlay to the DOM
    document.body.appendChild(overlay);
    
    // Create diary UI
    const diaryUI = document.createElement('div');
    diaryUI.id = 'diary-ui';
    diaryUI.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 600px;
        height: 500px;
        background-color: #f5f3e6;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        display: flex;
        flex-direction: column;
        font-family: 'Courier New', monospace;
        z-index: 1000;
    `;
    
    // Prevent clicks from passing through
    diaryUI.addEventListener('mousedown', (e) => e.stopPropagation());
    diaryUI.addEventListener('mouseup', (e) => e.stopPropagation());
    diaryUI.addEventListener('click', (e) => e.stopPropagation());
    
    // Title
    const title = document.createElement('h2');
    title.textContent = 'Diary Entries';
    title.style.textAlign = 'center';
    title.style.color = '#3e2723';
    title.style.margin = '0 0 15px 0';
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #3e2723;
    `;
    
    // Cleanup function to remove all event listeners and elements
    function cleanupDiaryUI() {
        // Remove global event listeners
        document.removeEventListener('click', blockEventsWhileDiaryOpen, true);
        document.removeEventListener('mousedown', blockEventsWhileDiaryOpen, true);
        document.removeEventListener('mouseup', blockEventsWhileDiaryOpen, true);
        document.removeEventListener('keydown', handleKeyDown);
        
        // Remove the diary UI safely
        if (document.getElementById('diary-ui')) {
            document.body.removeChild(diaryUI);
        }
        
        // Remove the overlay safely
        const overlay = document.getElementById('diary-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
        
        // Re-enable camera controls
        if (window.controls) {
            window.controls.enabled = true;
        }
        
        console.log("Diary closed, all listeners removed, camera controls re-enabled");
    }
    
    // Close button click handler
    closeButton.onclick = (e) => {
        e.stopPropagation(); // Prevent the click from passing through
        cleanupDiaryUI();
    };
    
    // Entries container - now takes full height since we removed the text entry section
    const entriesContainer = document.createElement('div');
    entriesContainer.style.cssText = `
        flex: 1;
        overflow-y: auto;
        background-color: #fff;
        border-radius: 5px;
        padding: 10px;
        border: 1px solid #d7ccc8;
    `;
    
    // Assemble UI - now without the text entry section
    diaryUI.appendChild(title);
    diaryUI.appendChild(closeButton);
    diaryUI.appendChild(entriesContainer);
    document.body.appendChild(diaryUI);
    
    // Add keyboard event listener to close diary with ESC key
    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            cleanupDiaryUI();
        }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Display existing entries
    updateEntriesDisplay(entriesContainer);
}

function updateEntriesDisplay(container) {
    container.innerHTML = '';
    
    if (diaryEntries.length === 0) {
        const noEntries = document.createElement('p');
        noEntries.textContent = 'No diary entries yet...!';
        noEntries.style.color = '#9e9e9e';
        noEntries.style.textAlign = 'center';
        noEntries.style.marginTop = '20px';
        container.appendChild(noEntries);
        return;
    }
    
    diaryEntries.forEach(entry => {
        const entryDiv = document.createElement('div');
        entryDiv.style.cssText = `
            background-color: #fffdeb;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 15px;
            border-left: 4px solid #5d4037;
        `;
        
        const entryDate = document.createElement('div');
        entryDate.textContent = entry.date;
        entryDate.style.cssText = `
            font-size: 12px;
            color: #795548;
            margin-bottom: 8px;
        `;
        
        const entryContent = document.createElement('div');
        entryContent.textContent = entry.content;
        entryContent.style.cssText = `
            line-height: 1.5;
            white-space: pre-wrap;
        `;
        
        
        entryDiv.appendChild(entryDate);
        entryDiv.appendChild(entryContent);
        container.appendChild(entryDiv);
    });
}


async function loadDiaryEntries(username) {
    try {
        // Get the wallet address for the user
        const baseWalletID = await getBaseWallet(username);
        console.log(username);
        
        if (!baseWalletID) {
            console.warn('No wallet address available for user:', username);
            return;
        }
        
        // Fetch diary entries from the GraphQL endpoint
        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: GET_DIARY_ENTRIES,
                variables: {
                    walletAddress: String(baseWalletID)
                }
            })
        });
        
        const result = await response.json();
        console.log("diary result:", result);
        
        if (result.errors) {
            console.error('Error fetching diary entries from GraphQL:', result.errors);
            return;
        }
        
        // Update diary entries with the fetched data
        if (result.data && result.data.diaryEntries) {
            // Transform the GraphQL data structure to match what updateEntriesDisplay expects
            diaryEntries = result.data.diaryEntries.map(entry => {
                // Convert timestamp to Date object and format as locale string
                const entryDate = new Date(parseInt(entry.timestamp) * 1000).toLocaleString();
                
                return {
                    id: entry.id, // Keep the original ID or use timestamp
                    content: entry.text, // GraphQL has 'text' but we need 'content'
                    date: entryDate // Convert timestamp to formatted date string
                };
            });
            console.log(`Loaded ${diaryEntries.length} diary entries from GraphQL`);
        } else {
            console.log('No diary entries found in GraphQL, checking local storage');
            // Try to load from local storage as fallback
            const savedEntries = localStorage.getItem('diaryEntries');
            if (savedEntries) {
                diaryEntries = JSON.parse(savedEntries);
            }
        }
    } catch (error) {
        console.error('Error loading diary entries:', error);
        // Try to load from local storage as fallback
        const savedEntries = localStorage.getItem('diaryEntries');
        if (savedEntries) {
            diaryEntries = JSON.parse(savedEntries);
        }
    }
}
