// whiteboard.js
import * as THREE from 'three';

// Whiteboard class
export class Whiteboard {
    constructor(scene, wall, size = { width: 4, height: 3 }, position) {
        this.scene = scene;
        this.wall = wall;
        this.size = size;
        this.position = position;
        this.isDrawing = false;
        this.lastPoint = null;
        this.drawingEnabled = false;
        this.lines = [];
        this.friendsList = new Set();
        this.whiteboardContract = null;
        
        // Store original camera state for restoration after user exits whiteboard mode
        this.originalCameraState = null;
        this.originalControlsState = null;
        
        // Track if changes have been made and not saved
        this.hasUnsavedChanges = false;
        
        // Flag to handle multiple ESC presses
        this.isProcessingEsc = false;
        
        // Backup canvas before editing whiteboard in case user cancels
        this.canvasBackup = null;
        
        this.init();
        
    }
    
// Create a wooden frame around the whiteboard
createWhiteboardFrame() {
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513, // wood-like brown
        roughness: 0.7,
        metalness: 0.1
    });
    
    const frameThickness = 0.05;
    const frameDepth = 0.05;
    
    // Frame parts
    const topFrame = new THREE.Mesh(
        new THREE.BoxGeometry(this.size.width + frameThickness, frameThickness, frameDepth),
        frameMaterial
    );
    topFrame.position.set(0, this.size.height/2 + frameThickness/2, 0);
    
    const bottomFrame = new THREE.Mesh(
        new THREE.BoxGeometry(this.size.width + frameThickness, frameThickness, frameDepth),
        frameMaterial
    );
    bottomFrame.position.set(0, -this.size.height/2 - frameThickness/2, 0);
    
    const leftFrame = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, this.size.height, frameDepth),
        frameMaterial
    );
    leftFrame.position.set(-this.size.width/2 - frameThickness/2, 0, 0);
    
    const rightFrame = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, this.size.height, frameDepth),
        frameMaterial
    );
    rightFrame.position.set(this.size.width/2 + frameThickness/2, 0, 0);
    
    // Add all frame parts to the whiteboard group
    this.whiteboardGroup.add(topFrame);
    this.whiteboardGroup.add(bottomFrame);
    this.whiteboardGroup.add(leftFrame);
    this.whiteboardGroup.add(rightFrame);
}

async init() {
    // Create whiteboard group to contain board and frame, and add it to the scene
    this.whiteboardGroup = new THREE.Group();
    this.whiteboardGroup.position.set(this.position.x, this.position.y, this.position.z);
    this.scene.add(this.whiteboardGroup);
    
    // Create whiteboard backing slightly smaller than the frame
    const innerWidth = this.size.width - 0.1;
    const innerHeight = this.size.height - 0.1;
    const geometry = new THREE.PlaneGeometry(innerWidth, innerHeight);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        side: THREE.FrontSide,
        // Small offset to prevent glitching/fighting with the wall lol
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    });
    
    this.whiteboard = new THREE.Mesh(geometry, material);
    this.whiteboard.position.set(0, 0, 0.01); // Small z-offset from the frame
    this.whiteboard.userData.isWhiteboard = true;
    this.whiteboardGroup.add(this.whiteboard);
    
    // Create a border/frame around the whiteboard
    this.createWhiteboardFrame();
    
    // Create a canvas texture for drawing
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 768;
    this.ctx = this.canvas.getContext('2d');
    
    // Fill with white
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Create texture from canvas
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.whiteboard.material.map = this.texture;
    this.whiteboard.material.needsUpdate = true;
    
    // Create UI for drawing controls
    this.createDrawingUI();
    
    // Set up raycaster for interaction
    this.raycaster = new THREE.Raycaster();
    this.setupInteraction();
    
    console.log("Whiteboard initialized");
}

createDrawingUI() {
    // Create a container for our drawing controls
    const container = document.createElement('div');
    container.id = 'whiteboard-controls';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.display = 'none'; // Hidden by default
    container.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    container.style.padding = '10px';
    container.style.borderRadius = '10px';
    container.style.zIndex = '100';
    
    // Color picker
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = '#000000';
    colorPicker.id = 'whiteboard-color';
    colorPicker.style.marginRight = '10px';
    
    // Stroke width slider
    const strokeLabel = document.createElement('label');
    strokeLabel.textContent = 'Stroke Width:';
    strokeLabel.style.fontFamily = "'Inter', sans-serif"; 
    strokeLabel.style.marginRight = '5px';
    
    const strokeSlider = document.createElement('input');
    strokeSlider.type = 'range';
    strokeSlider.min = '1';
    strokeSlider.max = '20';
    strokeSlider.value = '5';
    strokeSlider.id = 'whiteboard-stroke';
    strokeSlider.style.marginRight = '10px';
    
    // Clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.style.padding = '5px 10px';
    clearButton.style.marginRight = '10px';
    clearButton.onclick = () => this.clearWhiteboard();
    
    // Save button
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.style.padding = '5px 10px';
    saveButton.onclick = () => this.saveToBlockchain(); // TODO: does nothing rn, need to update
    
    // Add all elements to the container
    container.appendChild(colorPicker);
    container.appendChild(strokeLabel);
    container.appendChild(strokeSlider);
    container.appendChild(clearButton);
    container.appendChild(saveButton);
    
    // Add container to the document
    document.body.appendChild(container);
    
    this.uiContainer = container;
}

setupInteraction() {
    // Track if we're dragging the camera (not clicking the whiteboard)
    let isDragging = false;
    let mouseDownTime = 0;
    let mouseDownPos = { x: 0, y: 0 };
    let mouseDownOnWhiteboard = false;
    
    // Global flag to track if avatar interaction was handled
    window.lastInteractionHandledBy = null;
    
    // Mouse down event to track where the interaction began
    window.addEventListener('mousedown', (event) => {
        mouseDownTime = Date.now();
        mouseDownPos = { x: event.clientX, y: event.clientY };
        isDragging = false;
        window.lastInteractionHandledBy = null;
        
        // Check if mouse down happened on whiteboard
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        
        this.raycaster.setFromCamera(mouse, window.camera);
        const groupIntersects = this.raycaster.intersectObject(this.whiteboardGroup, true);
        mouseDownOnWhiteboard = groupIntersects.length > 0;
    });
    
    // Mouse move to detect dragging
    window.addEventListener('mousemove', (event) => {
        // If the mouse has moved more than a small threshold since mousedown, consider it dragging
        if (!isDragging && mouseDownTime > 0) {
            const dx = event.clientX - mouseDownPos.x;
            const dy = event.clientY - mouseDownPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If moved more than 5 pixels, consider it a drag
            if (distance > 5) {
                isDragging = true;
            }
        }
    });
    
    // Handle click on whiteboard - only respond to real clicks, not drag operations
    window.addEventListener('mouseup', (event) => {
        // Check if it was a short click (not a drag)
        const clickDuration = Date.now() - mouseDownTime;
        const isShortClick = clickDuration < 300; // Less than 300ms for a click
        
        // Only process whiteboard clicks if:
        // 1. It was a short click, not a drag
        // 2. The click started on the whiteboard
        // 3. No other interaction (like avatar) has handled this click yet
        if (isShortClick && !isDragging && mouseDownOnWhiteboard && window.lastInteractionHandledBy === null) {
            this.handleWhiteboardClick(event);
        }
        
        // Reset tracking variables
        mouseDownTime = 0;
        isDragging = false;
        mouseDownOnWhiteboard = false;
    });
    
    // Drawing events remain separate from the click detection
    window.addEventListener('mousedown', (event) => this.handleMouseDown(event));
    window.addEventListener('mousemove', (event) => this.handleMouseMove(event));
    window.addEventListener('mouseup', () => this.handleMouseUp());
        
    // Keyboard event for ESC key to exit drawing mode
    window.addEventListener('keydown', async (event) => {
        if (event.key === 'Escape' && this.drawingEnabled && !this.isProcessingEsc) {
            // Set flag to prevent multiple ESC handling
            this.isProcessingEsc = true;
            
            try {
                // Call disableDrawingMode and wait for it to complete
                await this.disableDrawingMode();
            } finally {
                // Reset the flag when done processing, regardless of outcome
                // Use a short timeout to prevent immediate re-triggering
                setTimeout(() => {
                    this.isProcessingEsc = false;
                }, 300);
            }
        }
    });
}

// Backup state of whiteboard before it was clicked in case user clicks "Don't Save"
createCanvasBackup() {
    // Create a backup of the current canvas state
    this.canvasBackup = document.createElement('canvas');
    this.canvasBackup.width = this.canvas.width;
    this.canvasBackup.height = this.canvas.height;
    const backupCtx = this.canvasBackup.getContext('2d');
    backupCtx.drawImage(this.canvas, 0, 0);
    console.log("Canvas backup created");
}

restoreCanvasFromBackup() {
    if (this.canvasBackup) {
        // Clear current canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw the backup onto the current canvas
        this.ctx.drawImage(this.canvasBackup, 0, 0);
        
        // Update the texture
        this.texture.needsUpdate = true;
        
        console.log("Canvas restored from backup");
        
        // Clear the backup
        this.canvasBackup = null;
    } else {
        console.log("No canvas backup to restore from");
    }
}

handleWhiteboardClick(event) {
    // Get normalized mouse position
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    
    // Update raycaster
    this.raycaster.setFromCamera(mouse, window.camera);
    
    // Check for intersection with whiteboard or any part of the whiteboard group
    const groupIntersects = this.raycaster.intersectObject(this.whiteboardGroup, true);
    
    if (groupIntersects.length > 0) {
        // Check if user is a friend before enabling drawing
        if (this.canEdit()) {
            // Only reposition camera if we're not already in drawing mode
            if (!this.drawingEnabled && window.camera && window.controls) {
                // Store original camera and controls state
                this.storeOriginalCameraState();
                // Create a backup of the current canvas state
                this.createCanvasBackup();
                // Move camera to face the whiteboard
                this.positionCameraForEditing();
                // Disable camera controls while drawing
                window.controls.enabled = false;
            }
            this.drawingEnabled = true;
            this.uiContainer.style.display = 'block';
            console.log("Whiteboard interaction enabled");
        } else {
            this.showMessage("Only friends can edit the whiteboard! Maybe talk to the avatar?");
        }
    } else if (this.drawingEnabled) {
        // If clicking elsewhere, stop drawing mode
        this.disableDrawingMode();
    }
}


// Store the original camera state for restoration
storeOriginalCameraState() {
    if (window.camera && window.controls) {
        this.originalCameraState = {
            position: window.camera.position.clone(),
            rotation: window.camera.rotation.clone(),
            target: window.controls.target.clone()
        };
        
        this.originalControlsState = {
            enabled: window.controls.enabled
        };
        
        console.log("Stored original camera state");
    }
}

// Position the camera in front of the whiteboard for optimal editing
positionCameraForEditing() {
    if (window.camera && window.controls) {
        // Calculate ideal position in front of whiteboard
        // Position camera 2 meters in front of whiteboard and centered
        const idealPosition = new THREE.Vector3(
            this.whiteboardGroup.position.x, 
            this.whiteboardGroup.position.y, 
            this.whiteboardGroup.position.z + 5 // 2 meters in front of whiteboard
        );
        
        // Use animation to smoothly move camera
        this.animateCameraMove(idealPosition, this.whiteboardGroup.position);
    }
}

// Animate camera movement to avoid sudden jumps
animateCameraMove(newPosition, lookAtPosition) {
    // Get current positions
    const startPosition = window.camera.position.clone();
    const startTarget = window.controls.target.clone();
    
    // Animation parameters
    const duration = 1000; // milliseconds
    const startTime = Date.now();
    
    // Animation function
    const animateFrame = () => {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Ease in-out function for smoother motion
        const easing = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        // Interpolate position
        window.camera.position.lerpVectors(startPosition, newPosition, easing);
        
        // Interpolate controls target 
        window.controls.target.lerpVectors(startTarget, lookAtPosition, easing);
        
        // Update controls
        window.controls.update();
        
        // Continue animation if not finished
        if (progress < 1) {
            requestAnimationFrame(animateFrame);
        }
    };
    
    // Start animation
    animateFrame();
}

// restore camera to original position before clicking whiteboard
restoreCameraPosition() {
    // Restore original camera state
    if (window.camera && window.controls && this.originalCameraState) {
        console.log("Restoring camera position");
        
        // Animate camera back to original position
        this.animateCameraMove(
            this.originalCameraState.position,
            this.originalCameraState.target
        );
        
        // Restore controls state after animation completes
        setTimeout(() => {
            if (window.controls) {
                window.controls.enabled = this.originalControlsState.enabled;
                console.log("Camera controls rexstored");
            }
            this.originalCameraState = null;
            this.originalControlsState = null;
        }, 1000); // Match duration from animateCameraMove
    } else {
        console.log("No camera state to restore");
    }
}


// Disable drawing mode and restore camera controls
async disableDrawingMode() {
    if (this.drawingEnabled) {
        // Temporarily set drawing disabled (will revert if user cancels)
        const wasDrawingEnabled = this.drawingEnabled;
        this.drawingEnabled = false;
        
        if (this.hasUnsavedChanges) {
            const decision = await this.checkUnsavedChanges();
            if (!decision) {
                // User canceled, stay in drawing mode and DON'T restore camera
                this.drawingEnabled = true;
                window.controls.enabled = false;
                return false;
            }
        }
        
        // Only restore camera if we're actually exiting drawing mode
        this.uiContainer.style.display = 'none';
        this.restoreCameraPosition();
        
        return true;
    }
    
    return true; // No change needed
}


// Create save prompt dialog
createSavePrompt() {
    // Save the current state of controls - they should already be disabled
    // but we'll store the current state to be safe
    const previousControlsState = window.controls ? window.controls.enabled : false;
    
    // Ensure camera controls are disabled while dialog is open
    if (window.controls) {
        window.controls.enabled = false;
    }
    
    // Create prompt container
    const promptContainer = document.createElement('div');
    promptContainer.id = 'save-prompt';
    promptContainer.style.position = 'fixed';
    promptContainer.style.top = '50%';
    promptContainer.style.left = '50%';
    promptContainer.style.transform = 'translate(-50%, -50%)';
    promptContainer.style.backgroundColor = 'white';
    promptContainer.style.padding = '20px';
    promptContainer.style.borderRadius = '10px';
    promptContainer.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    promptContainer.style.zIndex = '2000';
    promptContainer.style.minWidth = '300px';
    promptContainer.style.textAlign = 'center';
    
    // Prevent click events from passing through to the canvas
    promptContainer.addEventListener('mousedown', (e) => e.stopPropagation());
    promptContainer.addEventListener('mouseup', (e) => e.stopPropagation());
    promptContainer.addEventListener('click', (e) => e.stopPropagation());
    promptContainer.addEventListener('touchstart', (e) => e.stopPropagation());
    promptContainer.addEventListener('touchend', (e) => e.stopPropagation());
    promptContainer.addEventListener('touchmove', (e) => e.stopPropagation());
    
    // Prompt message
    const message = document.createElement('p');
    message.textContent = 'You have unsaved changes. Do you want to save before exiting?';
    message.style.marginBottom = '20px';
    
    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.justifyContent = 'space-around';
    
    // Save button
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.style.padding = '8px 20px';
    saveButton.style.backgroundColor = '#4CAF50';
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '5px';
    saveButton.style.cursor = 'pointer';
    
    // Don't save button
    const dontSaveButton = document.createElement('button');
    dontSaveButton.textContent = "Don't Save";
    dontSaveButton.style.padding = '8px 20px';
    dontSaveButton.style.backgroundColor = '#f44336';
    dontSaveButton.style.color = 'white';
    dontSaveButton.style.border = 'none';
    dontSaveButton.style.borderRadius = '5px';
    dontSaveButton.style.cursor = 'pointer';
    
    // Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.padding = '8px 20px';
    cancelButton.style.backgroundColor = '#ccc';
    cancelButton.style.color = 'black';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '5px';
    cancelButton.style.cursor = 'pointer';
    
    // Add buttons to container
    buttonsContainer.appendChild(saveButton);
    buttonsContainer.appendChild(dontSaveButton);
    buttonsContainer.appendChild(cancelButton);
    
    // Add elements to prompt
    promptContainer.appendChild(message);
    promptContainer.appendChild(buttonsContainer);
    
    // Add prompt to document
    document.body.appendChild(promptContainer);
    
    // Function to clean up the dialog and restore previous controls state
    const cleanupDialog = () => {
        document.removeEventListener('keydown', escHandler);
        if (promptContainer.parentNode) {
            document.body.removeChild(promptContainer);
        }
        
        // Only restore controls to previous state if we're NOT in drawing mode
        // This is important because we don't want to re-enable controls if the
        // user chose to stay in drawing mode
        if (!this.drawingEnabled && window.controls) {
            window.controls.enabled = previousControlsState;
        }
    };
    
    // Add ESC key handler for the prompt
    const escHandler = (event) => {
        if (event.key === 'Escape') {
            cleanupDialog();
            resolve('cancel');
        }
    };
    
    document.addEventListener('keydown', escHandler);
    
    // Return a promise that resolves based on user action
    return new Promise((resolve) => {
        // Use mousedown and stopPropagation to prevent events from bubbling
        saveButton.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            cleanupDialog();
            resolve('save');
        };
        
        dontSaveButton.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            cleanupDialog();
            resolve('dont-save');
        };
        
        cancelButton.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            cleanupDialog();
            resolve('cancel');
        };
    });
}
// Check for unsaved changes and prompt if needed
async checkUnsavedChanges() {
    if (this.hasUnsavedChanges) {
        const decision = await this.createSavePrompt();
        
        switch (decision) {
            case 'save':
                const saveSuccess = await this.saveToBlockchain();
                this.hasUnsavedChanges = !saveSuccess;
                return saveSuccess;
                
            case 'dont-save':
                this.restoreCanvasFromBackup();
                this.hasUnsavedChanges = false;
                return true; // Exit drawing mode
                
            case 'cancel':
                // Don't change drawing state, don't restore camera
                this.drawingEnabled = true; // Ensure drawing is still enabled
                return false; // Don't exit drawing mode
                
            default:
                return false;
        }
    }
    
    return true;
}


handleMouseDown(event) {
    if (!this.drawingEnabled) return;
    
    const intersectionPoint = this.getIntersectionPoint(event.clientX, event.clientY);
    if (intersectionPoint) {
        this.isDrawing = true;
        this.lastPoint = this.convertTo2D(intersectionPoint);
    }
}

handleMouseMove(event) {
    if (!this.isDrawing || !this.drawingEnabled) return;
    
    const intersectionPoint = this.getIntersectionPoint(event.clientX, event.clientY);
    if (intersectionPoint) {
        const currentPoint = this.convertTo2D(intersectionPoint);
        this.drawLine(this.lastPoint, currentPoint);
        this.lastPoint = currentPoint;
    }
}

handleMouseUp() {
    if (this.isDrawing) {
        this.isDrawing = false;
        this.lastPoint = null;
        // Store the drawing state for undo functionality or saving
        this.storeLine();
    }
}

// Get the 3D intersection point with the whiteboard
getIntersectionPoint(clientX, clientY) {
    const mouse = new THREE.Vector2(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
    );
    
    this.raycaster.setFromCamera(mouse, window.camera);
    
    // Check for intersection with whiteboard only (not the frame)
    const intersects = this.raycaster.intersectObject(this.whiteboard);
    
    if (intersects.length > 0) {
        return intersects[0].point.clone();  // Return a clone to avoid reference issues
    }
    
    return null;
}

// Convert 3D point to 2D canvas coordinates - adjusted for the group transformation
convertTo2D(point3D) {
    // Convert world point to local point in the whiteboard's coordinate system
    const localPoint = this.whiteboard.worldToLocal(point3D);
    
    // Calculate relative position on the whiteboard
    // We add half the size to convert from -size/2 to +size/2 range to 0 to 1 range
    const relativeX = (localPoint.x + this.size.width/2) / this.size.width;
    const relativeY = 1 - (localPoint.y + this.size.height/2) / this.size.height;
    
    // Convert to canvas coordinates
    return {
        x: relativeX * this.canvas.width,
        y: relativeY * this.canvas.height
    };
}

// Draw a line on the canvas
drawLine(start, end) {
    if (!start || !end) return;
    
    const colorPicker = document.getElementById('whiteboard-color');
    const strokeSlider = document.getElementById('whiteboard-stroke');
    
    this.ctx.strokeStyle = colorPicker ? colorPicker.value : '#000000';
    this.ctx.lineWidth = strokeSlider ? parseInt(strokeSlider.value) : 5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
    
    // Update the texture
    this.texture.needsUpdate = true;
    
    // Mark that we have unsaved changes
    this.hasUnsavedChanges = true;
}

// Store the current line for saving
storeLine() {
    const colorPicker = document.getElementById('whiteboard-color');
    const strokeSlider = document.getElementById('whiteboard-stroke');
    
    // Store the last drawn line data
    this.lines.push({
        color: colorPicker ? colorPicker.value : '#000000',
        width: strokeSlider ? parseInt(strokeSlider.value) : 5,
        // We'd store points here for a complete implementation
        // For simplicity, we're just storing the canvas data
        timestamp: Date.now()
    });
}

// Clear the whiteboard
clearWhiteboard() {
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.texture.needsUpdate = true;
    this.lines = [];
    
    // Mark that we have unsaved changes
    this.hasUnsavedChanges = true;
}

// Check if the current user can edit
canEdit() {
    // For dev, always allow editing
    if (process.env.NODE_ENV === 'development') return true;
    
    // If user is owner, always allow
    if (this.userAddress === window.homeOwnerAddress) return true;
    
    // TODO: check if user is in friend list
    // If user is in friends list, allow
    return this.friendsList.has(this.userAddress);
}

// Show a message to the user
showMessage(message) {
    const messageContainer = document.createElement('div');
    messageContainer.style.position = 'fixed';
    messageContainer.style.top = '50%';
    messageContainer.style.left = '50%';
    messageContainer.style.transform = 'translate(-50%, -50%)';
    messageContainer.style.padding = '20px';
    messageContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    messageContainer.style.color = 'white';
    messageContainer.style.borderRadius = '5px';
    messageContainer.style.zIndex = '1000';
    messageContainer.style.fontFamily = "'Inter', sans-serif"; 
    messageContainer.textContent = message;
    
    document.body.appendChild(messageContainer);
    
    setTimeout(() => {
        document.body.removeChild(messageContainer);
    }, 3000);
}


async saveToBlockchain() {
    // Convert canvas to data URL
    const dataUrl = this.canvas.toDataURL('image/png');
    localStorage.setItem('whiteboardData', dataUrl);
    this.showMessage("Whiteboard saved (local storage)");

    this.hasUnsavedChanges = false;
        
    return true;
}


}


// Extend the main.js init function to add the whiteboard
export function initWhiteboard(visitorAuthSession, scene, camera, controls, roomSize) {
    // Store camera and controls references globally
    window.camera = camera;
    window.controls = controls;

    // Find the back wall
    let backWall;
    scene.traverse((object) => {
        // Look for the back wall based on position
        if (object.isMesh && (object.name === "backwall")) {     // x position near center
            backWall = object;
        }
    });

    // If back wall wasn't found, create a position anyway
    const whiteboardPosition = { x: 0, y: 2.5, z: -(roomSize / 2) + 0.11};

    // Create whiteboard with adjusted position and size
    const whiteboard = new Whiteboard(
        scene, 
        backWall,
        { width: 4, height: 3 },  // Size of the whiteboard
        whiteboardPosition        // Position on back wall
    );

    // Store whiteboard reference globally
    window.whiteboard = whiteboard;

    console.log("Whiteboard initialized successfully");

    return whiteboard;
}