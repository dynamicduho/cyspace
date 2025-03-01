// texture-loader.js
import * as THREE from 'three';

/**
 * Loads a texture with proper error handling and repeat settings
 * @param {string} path - Path to the texture file
 * @param {number} repeatX - X-axis repeat value
 * @param {number} repeatY - Y-axis repeat value
 * @returns {Promise<THREE.Texture>} - Promise resolving to the loaded texture
 */
export function loadTexture(path, repeatX = 1, repeatY = 1) {
    return new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader();
        
        // Add loading manager for better error handling
        const loadingManager = new THREE.LoadingManager();
        loadingManager.onError = (url) => {
            console.error(`Error loading texture: ${url}`);
            reject(new Error(`Failed to load texture: ${url}`));
        };
        
        loader.manager = loadingManager;
        
        loader.load(
            path,
            // onLoad callback
            (texture) => {
                // Configure texture
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(repeatX, repeatY);
                
                // Set proper encoding
                if (typeof THREE.SRGBColorSpace !== 'undefined') {
                    // For newer versions of Three.js
                    texture.colorSpace = THREE.SRGBColorSpace;
                } else if (typeof THREE.sRGBEncoding !== 'undefined') {
                    // For older versions
                    texture.encoding = THREE.sRGBEncoding;
                }
                
                console.log(`Texture loaded successfully: ${path}`);
                resolve(texture);
            },
            // onProgress callback
            (xhr) => {
                console.log(`${path}: ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
            },
            // onError callback
            (error) => {
                console.error(`Error loading texture (${path}):`, error);
                
                // Create a fallback texture (solid color)
                const canvas = document.createElement('canvas');
                canvas.width = 128;
                canvas.height = 128;
                const context = canvas.getContext('2d');
                context.fillStyle = '#AAAAAA'; // Default gray
                context.fillRect(0, 0, canvas.width, canvas.height);
                
                // Create texture from canvas
                const fallbackTexture = new THREE.CanvasTexture(canvas);
                fallbackTexture.wrapS = THREE.RepeatWrapping;
                fallbackTexture.wrapT = THREE.RepeatWrapping;
                fallbackTexture.repeat.set(repeatX, repeatY);
                
                console.warn(`Using fallback texture for: ${path}`);
                resolve(fallbackTexture);
            }
        );
    });
}

/**
 * Applies texture to a mesh
 * @param {THREE.Mesh} mesh - The mesh to apply texture to
 * @param {THREE.Texture} texture - The texture to apply
 * @param {Object} options - Additional material options
 */
export function applyTexture(mesh, texture, options = {}) {
    if (!mesh || !texture) return;
    
    // Create material with texture
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: options.roughness || 0.7,
        metalness: options.metalness || 0.2,
        ...options
    });
    
    // Apply material to mesh
    mesh.material = material;
    mesh.material.needsUpdate = true;
}