import { useRef, useEffect } from 'react';
import * as THREE from 'three';

// Interface defining the return type of the hook
interface UseThreeJSSceneResult {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
}

// New interface for optional parameters
interface UseThreeJSSceneOptions {
  cameraZ?: number;
}

export const useThreeJSScene = (
  mountRef: React.RefObject<HTMLDivElement | null>, // Ref to the DOM element where the scene will be mounted
  objectGroup: React.RefObject<THREE.Group | null>, // Ref to a Three.js group that will be added to the scene
  options?: UseThreeJSSceneOptions, // Optional parameters for the scene
  onAnimate?: () => void // Optional callback for custom animation logic
): UseThreeJSSceneResult => {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return; // Exit if the mount element is not available

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#121212'); // Set a dark background color
    sceneRef.current = scene; // Store scene in ref

    // --- Camera Setup ---
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(0, 5, options?.cameraZ || 15); // Use cameraZ from options
    cameraRef.current = camera; // Store camera in ref
    scene.add(camera); // Add camera to the scene

    // --- Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({ antialias: true }); // Enable anti-aliasing for smoother edges
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight); // Set renderer size to match container
    renderer.setPixelRatio(window.devicePixelRatio); // Adjust pixel ratio for high-DPI screens
    currentMount.appendChild(renderer.domElement); // Add renderer's canvas to the DOM
    rendererRef.current = renderer; // Store renderer in ref

    // --- Lighting Setup ---
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white ambient light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Directional light for shadows/highlights
    directionalLight.position.set(5, 10, 7.5); // Position the light source
    scene.add(directionalLight);

    // Add the provided object group (e.g., boards) to the scene
    if (objectGroup.current) {
      scene.add(objectGroup.current);
    }

    // --- Event Listeners for Responsiveness and Camera Controls ---

    // Handle window resizing
    const onWindowResize = () => {
      if (currentMount && cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
        cameraRef.current.updateProjectionMatrix(); // Update camera's projection matrix
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight); // Resize renderer
      }
    };
    window.addEventListener('resize', onWindowResize);

    // Basic mouse controls for camera rotation (custom implementation)
    let isDragging = false; // Flag to check if mouse is being dragged
    let previousMousePosition = { x: 0, y: 0 }; // Stores previous mouse coordinates

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !cameraRef.current) return;

      const deltaX = e.clientX - previousMousePosition.x; // Change in X
      const deltaY = e.clientY - previousMousePosition.y; // Change in Y

      const sensitivity = 0.005; // Rotation speed

      // Rotate around Y-axis (yaw) for horizontal mouse movement
      cameraRef.current.rotation.y -= deltaX * sensitivity;
      // Rotate around X-axis (pitch) for vertical mouse movement, clamped to prevent flipping
      cameraRef.current.rotation.x -= deltaY * sensitivity;
      cameraRef.current.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRef.current.rotation.x));

      previousMousePosition = { x: e.clientX, y: e.clientY }; // Update previous position
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // --- Animation Loop ---
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      if (onAnimate) {
        onAnimate();
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      requestAnimationFrame(animate);
    };

    animate(); // Start the animation loop

    // --- Cleanup ---
    // This runs when the component using this hook unmounts
    return () => {
      window.removeEventListener('resize', onWindowResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement); // Remove canvas from DOM
      }
      // Remove event listeners to prevent memory leaks
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mouseleave', onMouseUp);
      renderer.dispose(); // Dispose of Three.js renderer resources
    };
  }, [objectGroup]); // Dependency array: Re-run effect if objectGroup ref changes

  // Return the current instances of scene, camera, and renderer
  return { scene: sceneRef.current, camera: cameraRef.current, renderer: rendererRef.current };
};
