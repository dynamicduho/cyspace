// avatar.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { initializeAgent, sendMessageToAgent, getWelcomeMessage, resetAgent } from './agentBridge.js';

let mixer; // Animation mixer for avatar
// TODO: load avatar from ethstorage or walrus instead of from public asset folder
/**
 * Loads an avatar model and adds it to the scene
 * @param {string} avatar_file_name - Name of the avatar file
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {THREE.LoadingManager} manager - Loading manager
 * @param {Array} objects - Array to track objects for dragging
 * @returns {Promise<THREE.Group>} - Promise resolving to the avatar group
 */
export function loadAvatar(visitorAuthSession, username, scene, manager, objects) {
    const avatar_file_name = `avatar_${username}`;
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader(manager);
        loader.load(
            '/public/models/' + avatar_file_name + '.glb', 
            (gltf) => {
                const avatar = gltf.scene;

                // Setup animations
                if (gltf.animations && gltf.animations.length > 0) {
                    mixer = new THREE.AnimationMixer(avatar);
                    
                    // Log available animations
                    console.log(`Loaded ${gltf.animations.length} animations for avatar`);
                    gltf.animations.forEach((clip, index) => {
                        console.log(`Animation ${index}: ${clip.name}`);
                    });

                    // Play all animations or select specific ones
                    gltf.animations.forEach((clip) => {
                        const action = mixer.clipAction(clip);
                        action.play();
                    });
                }

                // Create an avatar group to ensure all parts stay together
                const avatarGroup = new THREE.Group();
                avatarGroup.add(avatar);
                
                // Fix avatar position based on model
                fixAvatarPosition(avatar, avatarGroup);
                
                // Default avatar properties
                avatarGroup.rotation.y = Math.PI/4; // Face diagonally
                
                // Mark the avatar for interaction
                avatarGroup.userData.isAvatar = true;
                
                // Also mark all child meshes for interaction
                avatar.traverse((child) => {
                    if (child.isMesh) {
                        child.userData.isAvatar = true;
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                // Add to scene and objects array
                scene.add(avatarGroup);
                objects.push(avatarGroup);
                
                console.log('Avatar loaded successfully');
                resolve(avatarGroup);
            },
            // onProgress callback
            (xhr) => {
                console.log(`Avatar ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
            },
            // onError callback
            (error) => {
                console.error('Error loading avatar:', error);
                reject(error);
            }
        );
    });
}


/**
 * Fixes avatar position based on model examination
 * @param {THREE.Object3D} avatar - The avatar model
 * @param {THREE.Group} avatarGroup - The group containing the avatar
 */
function fixAvatarPosition(avatar, avatarGroup) {
    // Get the bounding box of the avatar to determine its dimensions
    const boundingBox = new THREE.Box3().setFromObject(avatar);
    const height = boundingBox.max.y - boundingBox.min.y;
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    console.log(`Avatar dimensions - Height: ${height}, Center Y: ${center.y}, Min Y: ${boundingBox.min.y}`);
    
    // If the model has a negative minimum Y, it means part of it is below the origin
    // We need to adjust it so the bottom is at Y=0 (ground level)
    if (boundingBox.min.y < 0) {
        // Adjust avatar position by setting Y position to compensate for the part below ground
        avatarGroup.position.y = Math.abs(boundingBox.min.y);
        console.log(`Adjusting avatar Y position to: ${avatarGroup.position.y}`);
    } else {
        // If the model's bottom is already at or above ground level, 
        // make sure it's exactly at ground level
        avatarGroup.position.y = 0;
    }
    
    // Set X and Z position
    avatarGroup.position.x = 0;
    avatarGroup.position.z = 0;
}

/**
 * Updates avatar animations
 * @param {number} delta - Time delta for animation
 */
export function updateAvatarAnimations(delta) {
    if (mixer) {
        mixer.update(delta);
    }
}

/**
 * Creates a chat dialog for avatar interaction
 */
export function createAvatarChatDialog(visitorAuthSession, username) {
    // Create dialog container
    const dialogContainer = document.createElement('div');
    dialogContainer.id = 'chat-dialog';
    dialogContainer.style.position = 'fixed';
    dialogContainer.style.top = '50%';
    dialogContainer.style.left = '50%';
    dialogContainer.style.transform = 'translate(-50%, -50%)';
    dialogContainer.style.width = '400px';
    dialogContainer.style.maxHeight = '500px';
    dialogContainer.style.backgroundColor = 'white';
    dialogContainer.style.borderRadius = '10px';
    dialogContainer.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
    dialogContainer.style.zIndex = '1000';
    dialogContainer.style.display = 'none';
    dialogContainer.style.flexDirection = 'column';
    dialogContainer.style.overflow = 'hidden';
    dialogContainer.style.fontFamily = "'Inter', sans-serif"; 
    
    // Create dialog header
    const header = document.createElement('div');
    header.style.padding = '15px';
    header.style.backgroundColor = '#3f51b5';
    header.style.color = 'white';
    header.style.fontWeight = 'bold';
    header.style.borderTopLeftRadius = '10px';
    header.style.borderTopRightRadius = '10px';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.innerHTML = `<span>Chat with @${username}'s Avatar</span>`;
    
    // Add close button to header
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.padding = '0';
    closeButton.style.lineHeight = '1';

    closeButton.onclick = () => closeChatDialog(window.controls);
    document.addEventListener('keydown', (event) => {
        if (event.key == 'Escape') {
            closeChatDialog(window.controls);
        }
    });
    header.appendChild(closeButton);
    
    // Create messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.id = 'chat-messages';
    messagesContainer.style.padding = '15px';
    messagesContainer.style.maxHeight = '300px';
    messagesContainer.style.overflowY = 'auto';
    messagesContainer.style.backgroundColor = '#f5f5f5';
    
    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.style.display = 'none';
    loadingIndicator.style.textAlign = 'center';
    loadingIndicator.style.padding = '10px';
    loadingIndicator.style.color = '#666';
    loadingIndicator.innerHTML = 'Initializing AI agent...';
    messagesContainer.appendChild(loadingIndicator);
    
    // Create input area
    const inputContainer = document.createElement('div');
    inputContainer.style.padding = '15px';
    inputContainer.style.display = 'flex';
    inputContainer.style.borderTop = '1px solid #eee';
    
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.placeholder = 'Type your message...';
    textInput.style.flexGrow = '1';
    textInput.style.padding = '10px';
    textInput.style.border = '1px solid #ddd';
    textInput.style.borderRadius = '20px';
    textInput.style.marginRight = '10px';
    
    const sendButton = document.createElement('button');
    sendButton.innerHTML = 'Send';
    sendButton.style.padding = '10px 15px';
    sendButton.style.backgroundColor = '#3f51b5';
    sendButton.style.color = 'white';
    sendButton.style.border = 'none';
    sendButton.style.borderRadius = '20px';
    sendButton.style.cursor = 'pointer';
    
    // Flag to track if agent is initialized
    let isAgentInitialized = false;
    
    // Function to add a message to the chat
    const addMessage = (text, isUser = false) => {
        const messageDiv = document.createElement('div');
        messageDiv.style.backgroundColor = isUser ? '#bbdefb' : '#e0f7fa';
        messageDiv.style.color = 'black';
        messageDiv.style.borderRadius = '10px';
        messageDiv.style.padding = '10px';
        messageDiv.style.marginBottom = '10px';
        messageDiv.style.maxWidth = '80%';
        
        if (isUser) {
            messageDiv.style.marginLeft = 'auto';
            messageDiv.style.textAlign = 'right';
        } else {
            messageDiv.style.marginRight = 'auto';
        }
        
        // Handle newlines in the text
        const formattedText = text.replace(/\n/g, '<br>');
        messageDiv.innerHTML = formattedText;
        
        messagesContainer.appendChild(messageDiv);
        
        // Auto scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };
    
    // Function to handle agent responses
    const handleAgentResponse = (response) => {
        addMessage(response, false);
    };
    
    // Function to initialize the agent when the dialog is shown
    window.initializeAgentForChat = async () => {
        if (!isAgentInitialized) {
            console.log('Starting agent initialization...');
            
            // Show loading indicator
            loadingIndicator.style.display = 'block';
            
            try {
                // Initialize agent
                console.log('Calling initializeAgent...');
                const success = await initializeAgent({ character: username }, handleAgentResponse);
                
                if (success) {
                    console.log('Agent initialized successfully');
                    isAgentInitialized = true;
                    // Hide loading indicator
                    loadingIndicator.style.display = 'none';
                    // Add welcome message
                    addMessage(getWelcomeMessage(), false);
                } else {
                    console.error('Failed to initialize agent');
                    // Hide loading indicator
                    loadingIndicator.style.display = 'none';
                    // Show error message
                    addMessage("Failed to initialize AI agent. Please try again later.", false);
                }
            } catch (error) {
                console.error('Error initializing agent:', error);
                // Hide loading indicator
                loadingIndicator.style.display = 'none';
                // Show error message
                addMessage("Error initializing AI agent: " + error.message, false);
            }
        } else {
            console.log('Agent already initialized');
        }
    };
    
    // Add event listener for sending messages
    const sendMessage = async () => {
        const messageText = textInput.value.trim();
        if (messageText) {
            console.log('Sending message:', messageText);
            
            // Add user message to chat
            addMessage(messageText, true);
            
            // Clear input
            textInput.value = '';
            
            try {
                // Send message to agent
                console.log('Calling sendMessageToAgent...');
                const result = await sendMessageToAgent(messageText, handleAgentResponse);
                console.log('Message sent, result:', result);
                
                // Check if we should close the dialog
                if (result && result.exit) {
                    console.log('Exit flag received, closing dialog in 2 seconds');
                    setTimeout(() => {
                        closeChatDialog(window.controls);
                        // Reset agent state
                        console.log('Resetting agent state');
                        resetAgent();
                        isAgentInitialized = false;
                        // Clear messages
                        while (messagesContainer.firstChild) {
                            messagesContainer.removeChild(messagesContainer.firstChild);
                        }
                    }, 2000);
                }
            } catch (error) {
                console.error('Error sending message:', error);
                addMessage("Error sending message: " + error.message, false);
            }
        }
    };
    
    sendButton.onclick = sendMessage;
    textInput.onkeypress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };
    
    inputContainer.appendChild(textInput);
    inputContainer.appendChild(sendButton);
    
    // Assemble the dialog
    dialogContainer.appendChild(header);
    dialogContainer.appendChild(messagesContainer);
    dialogContainer.appendChild(inputContainer);
    
    // Add to document
    document.body.appendChild(dialogContainer);
    
    return dialogContainer;
}

/**
 * Closes the chat dialog
 * @param {OrbitControls} controls - The camera controls
 */
function closeChatDialog(controls) {
    const dialog = document.getElementById('chat-dialog');
    if (dialog) {
        dialog.style.display = 'none';
        if (controls) controls.enabled = true;
        
        // Reset agent state
        resetAgent();
        
        // Clear messages
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            // Keep only the loading indicator
            while (messagesContainer.childNodes.length > 1) {
                messagesContainer.removeChild(messagesContainer.lastChild);
            }
        }
    }
}

/**
 * Shows the avatar chat dialog
 * @param {OrbitControls} controls - The camera controls
 */
export function showAvatarChatDialog(controls) {
    const dialog = document.getElementById('chat-dialog');
    if (dialog) {
        dialog.style.display = 'flex';
        if (controls) controls.enabled = false;
        
        // Initialize the agent when the dialog is shown
        if (window.initializeAgentForChat) {
            console.log('Initializing agent for chat...');
            window.initializeAgentForChat();
        } else {
            console.error('initializeAgentForChat function not found');
        }
    } else {
        console.error('Chat dialog element not found');
    }
}

/**
 * Sets up click interaction for avatar
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {THREE.Camera} camera - The camera
 * @param {OrbitControls} controls - The camera controls
 */
export function setupAvatarInteraction(visitorAuthSession, scene, camera, controls) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Store controls in window for access in event handlers
    window.controls = controls;
    
    // Track whether we're dragging the camera
    let isDragging = false;
    let mouseDownTime = 0;
    let mouseDownPos = { x: 0, y: 0 };
    let mouseDownOnAvatar = false;
    
    // Make sure the global interaction tracking variable exists
    if (typeof window.lastInteractionHandledBy === 'undefined') {
        window.lastInteractionHandledBy = null;
    }
    
    // Mouse down event to track potential drag start
    window.addEventListener('mousedown', (event) => {
        mouseDownTime = Date.now();
        mouseDownPos = { x: event.clientX, y: event.clientY };
        isDragging = false;
        
        // Check if mouse down happened on avatar
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        mouseDownOnAvatar = false;
        if (intersects.length > 0) {
            for (let i = 0; i < intersects.length; i++) {
                const object = intersects[i].object;
                if (object.userData && object.userData.isAvatar) {
                    mouseDownOnAvatar = true;
                    break;
                }
            }
        }
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
    
    // Click event listener (mouseup)
    window.addEventListener('mouseup', (event) => {
        // Check if it was a short click (not a drag) and not holding the mouse button for long
        const clickDuration = Date.now() - mouseDownTime;
        const isShortClick = clickDuration < 300; // Less than 300ms for a click
        
        if (isShortClick && !isDragging && mouseDownOnAvatar) {
            // Calculate mouse position in normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Update the raycaster
            raycaster.setFromCamera(mouse, camera);
            
            // Find intersections with objects in the scene
            const intersects = raycaster.intersectObjects(scene.children, true);
            
            if (intersects.length > 0) {
                // Check if the clicked object is the avatar
                for (let i = 0; i < intersects.length; i++) {
                    const object = intersects[i].object;
                    
                    // Check if the clicked object is part of the avatar
                    if (object.userData && object.userData.isAvatar) {
                        // Set the global interaction flag to indicate avatar handled this interaction
                        window.lastInteractionHandledBy = 'avatar';
                        
                        // Show chat dialog
                        showAvatarChatDialog(controls);
                        break;
                    }
                }
            }
        }
        
        // Reset tracking variables
        mouseDownTime = 0;
        isDragging = false;
    });
    
    // Touch handling for mobile devices
    let touchStartTime = 0;
    let touchStartPos = { x: 0, y: 0 };
    let isTouchMoving = false;
    let touchStartOnAvatar = false;
    
    window.addEventListener('touchstart', (event) => {
        if (event.touches.length === 1) {
            touchStartTime = Date.now();
            touchStartPos = { 
                x: event.touches[0].clientX, 
                y: event.touches[0].clientY 
            };
            isTouchMoving = false;
            
            // Check if touch started on avatar
            mouse.x = (touchStartPos.x / window.innerWidth) * 2 - 1;
            mouse.y = -(touchStartPos.y / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);
            
            touchStartOnAvatar = false;
            if (intersects.length > 0) {
                for (let i = 0; i < intersects.length; i++) {
                    const object = intersects[i].object;
                    if (object.userData && object.userData.isAvatar) {
                        touchStartOnAvatar = true;
                        break;
                    }
                }
            }
        }
    });
    
    window.addEventListener('touchmove', (event) => {
        if (!isTouchMoving && event.touches.length === 1) {
            const dx = event.touches[0].clientX - touchStartPos.x;
            const dy = event.touches[0].clientY - touchStartPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If moved more than 10 pixels, consider it a swipe
            if (distance > 10) {
                isTouchMoving = true;
            }
        }
    });
    
    window.addEventListener('touchend', (event) => {
        const touchDuration = Date.now() - touchStartTime;
        const isShortTouch = touchDuration < 300; // Less than 300ms for a tap
        
        if (isShortTouch && !isTouchMoving && touchStartOnAvatar) {
            // Use the stored touchStartPos for the raycaster since touchend doesn't have coordinates
            mouse.x = (touchStartPos.x / window.innerWidth) * 2 - 1;
            mouse.y = -(touchStartPos.y / window.innerHeight) * 2 + 1;
            
            // Update the raycaster
            raycaster.setFromCamera(mouse, camera);
            
            // Find intersections with objects in the scene
            const intersects = raycaster.intersectObjects(scene.children, true);
            
            if (intersects.length > 0) {
                // Check if the tapped object is the avatar
                for (let i = 0; i < intersects.length; i++) {
                    const object = intersects[i].object;
                    
                    // Check if the tapped object is part of the avatar
                    if (object.userData && object.userData.isAvatar) {
                        // Set the global interaction flag
                        window.lastInteractionHandledBy = 'avatar';
                        
                        // Show chat dialog
                        showAvatarChatDialog(controls);
                        break;
                    }
                }
            }
        }
        
        // Reset touch tracking
        touchStartTime = 0;
        isTouchMoving = false;
    });
}