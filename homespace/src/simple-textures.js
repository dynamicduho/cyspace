// simple-textures.js
import * as THREE from 'three';
import { loadTexture, applyTexture } from './texture-loader.js';

/**
 * Applies simple textures to walls and floor
 * @param {THREE.Scene} scene - The Three.js scene
 */
export async function applySimpleTextures(scene) {
    console.log("Applying simple textures to walls and floor");
    
    try {
        // Load textures with proper error handling
        const wallTexture = await loadTexture('/public/textures/wallpaper_brick.jpg', 4, 2);
        const floorTexture = await loadTexture('/public/textures/floor_minecraftwood.png', 30, 30);
        
        // Find walls and floor to update
        scene.traverse((object) => {
            if (object.isMesh) {
                // Update walls
                if (object.name && object.name.includes("wall")) {
                    console.log("Applying texture to wall:", object.name);
                    applyTexture(object, wallTexture, {
                        roughness: 0.8,
                        metalness: 0.2
                    });
                }
                // Update floor
                else if (object.name === "floor" || (object.material && object.rotation.x === -Math.PI / 2)) {
                    console.log("Applying texture to floor");
                    applyTexture(object, floorTexture, {
                        roughness: 0.7,
                        metalness: 0.1
                    });
                }
            }
        });
        
        console.log("Textures applied successfully");
    } catch (error) {
        console.error("Error applying textures:", error);
    }
}