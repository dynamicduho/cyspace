// diary.js - New file to handle diary functionality
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let bookshelfModel;
let diaryEntries = [];
let scene, camera, controls;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

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
            loadDiaryEntries();
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
    title.textContent = 'Personal Diary';
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
    
    // Entries container
    const entriesContainer = document.createElement('div');
    entriesContainer.style.cssText = `
        flex: 1;
        overflow-y: auto;
        background-color: #fff;
        border-radius: 5px;
        padding: 10px;
        margin-bottom: 15px;
        border: 1px solid #d7ccc8;
    `;
    
    // New entry section
    const newEntrySection = document.createElement('div');
    newEntrySection.style.cssText = `
        display: flex;
        flex-direction: column;
    `;
    
    const textArea = document.createElement('textarea');
    textArea.placeholder = 'Write a new diary entry...';
    textArea.style.cssText = `
        height: 100px;
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 5px;
        border: 1px solid #d7ccc8;
        font-family: 'Courier New', monospace;
        resize: none;
    `;
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Entry';
    saveButton.style.cssText = `
        background-color: #5d4037;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 5px;
        cursor: pointer;
        font-family: 'Courier New', monospace;
    `;
    saveButton.onclick = () => {
        if (textArea.value.trim() !== '') {
            addDiaryEntry(textArea.value);
            textArea.value = '';
            updateEntriesDisplay(entriesContainer);
        }
    };
    
    // Assemble UI
    newEntrySection.appendChild(textArea);
    newEntrySection.appendChild(saveButton);
    diaryUI.appendChild(title);
    diaryUI.appendChild(closeButton);
    diaryUI.appendChild(entriesContainer);
    diaryUI.appendChild(newEntrySection);
    document.body.appendChild(diaryUI);
    
    // Add keyboard event listener to close diary with ESC key
    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            cleanupDiaryUI();
        }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Display existing entries
    updateEntriesDisplay(entriesContainer);
}

function addDiaryEntry(content) {
    const newEntry = {
        id: Date.now(),
        content: content,
        date: new Date().toLocaleString()
    };
    
    diaryEntries.unshift(newEntry); // Add to beginning of array
    saveDiaryEntries();
}

function updateEntriesDisplay(container) {
    container.innerHTML = '';
    
    if (diaryEntries.length === 0) {
        const noEntries = document.createElement('p');
        noEntries.textContent = 'No diary entries yet. Start writing!';
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

function saveDiaryEntries() {
    localStorage.setItem('diaryEntries', JSON.stringify(diaryEntries));
}

function loadDiaryEntries() {
    const savedEntries = localStorage.getItem('diaryEntries');
    if (savedEntries) {
        diaryEntries = JSON.parse(savedEntries);
    }
}