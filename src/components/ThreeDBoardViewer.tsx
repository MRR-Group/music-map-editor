import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { type BoardState } from '../utils/types';
import { useThreeJSScene } from '../hooks/useThreeJSScene';

interface ThreeDBoardViewerProps {
  boardStates: BoardState[];
  activeBoardIndex: number;
  currentTime: number;
  duration: number;
}

export const ThreeDBoardViewer: React.FC<ThreeDBoardViewerProps> = ({ boardStates, activeBoardIndex, currentTime, duration }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const boardGroupRef = useRef(new THREE.Group());
  const boardMeshesRef = useRef<THREE.Group[]>([]);
  const highlightMeshRef = useRef<THREE.Mesh | null>(null);

  const CELL_SIZE = 1;
  const CELL_GAP = 0.1;
  const BOARD_DEPTH = 0.2;
  const BOARD_GAP_Z = 15;

  const materials = useMemo(() => ({
    blank: new THREE.MeshStandardMaterial({ color: new THREE.Color('#374151'), roughness: 0.7, metalness: 0.1 }),
    black: new THREE.MeshStandardMaterial({ color: new THREE.Color('#1F2937'), roughness: 0.7, metalness: 0.1 }),
    purple: new THREE.MeshStandardMaterial({ color: new THREE.Color('#9333EA'), roughness: 0.4, metalness: 0.2 }),
    highlight: new THREE.MeshStandardMaterial({ color: new THREE.Color('#FDE68A'), emissive: new THREE.Color('#FDE68A'), emissiveIntensity: 0.5, transparent: true, opacity: 0.7 }),
  }), []);

  const cellGeometry = useMemo(() => new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, BOARD_DEPTH), []);

  const handleAnimation = useCallback(() => {
    if (duration > 0 && boardStates.length > 0) {
      // This calculation makes the boards "fly" towards the camera.
      // The board corresponding to the current time will be kept near z=0.
      const timePerBoard = duration / boardStates.length;
      boardGroupRef.current.position.z = (currentTime / timePerBoard) * BOARD_GAP_Z;

      if (highlightMeshRef.current) {
        const activeBoardMesh = boardMeshesRef.current[activeBoardIndex];
        if (activeBoardMesh) {
          // The highlight mesh is a child of the boardGroup, so its position is relative
          // to the group. We want it to overlay the active board.
          highlightMeshRef.current.position.copy(activeBoardMesh.position);
          highlightMeshRef.current.position.z += 0.1; // Offset to be visible
          highlightMeshRef.current.visible = true;
        } else {
          highlightMeshRef.current.visible = false;
        }
      }
    }
  }, [currentTime, duration, boardStates.length, activeBoardIndex, BOARD_GAP_Z]);

  const { scene } = useThreeJSScene(mountRef, boardGroupRef, { cameraZ: 25 }, handleAnimation);

  const createBoardMesh = useCallback((boardState: BoardState): THREE.Group => {
    const group = new THREE.Group();
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const state = boardState[r][c];
        let material: THREE.MeshStandardMaterial;
        switch (state) {
          case 1: material = materials.black; break;
          case 2: material = materials.purple; break;
          default: material = materials.blank;
        }
        const mesh = new THREE.Mesh(cellGeometry, material);
        mesh.position.set(
          c * (CELL_SIZE + CELL_GAP) - (CELL_SIZE * 3.5 + CELL_GAP * 3) / 2,
          -r * (CELL_SIZE + CELL_GAP) + (CELL_SIZE * 1.5 + CELL_GAP) / 2,
          0
        );
        group.add(mesh);
      }
    }
    return group;
  }, [materials, cellGeometry, CELL_SIZE, CELL_GAP]);

  useEffect(() => {
    if (!scene || !boardGroupRef.current) return;

    // Clear previous boards
    boardMeshesRef.current.forEach(mesh => boardGroupRef.current.remove(mesh));
    boardMeshesRef.current = [];
    if (highlightMeshRef.current) {
      boardGroupRef.current.remove(highlightMeshRef.current);
      highlightMeshRef.current = null;
    }

    // Create and position new boards
    boardStates.forEach((boardState, i) => {
      const boardMesh = createBoardMesh(boardState);
      boardMesh.position.z = i * -BOARD_GAP_Z;
      boardGroupRef.current.add(boardMesh);
      boardMeshesRef.current.push(boardMesh);
    });

    // Create and add highlight mesh
    const boardWidth = CELL_SIZE * 4 + CELL_GAP * 3;
    const boardHeight = CELL_SIZE * 2 + CELL_GAP;
    const highlightGeometry = new THREE.BoxGeometry(boardWidth + 0.5, boardHeight + 0.5, BOARD_DEPTH + 0.5);
    const highlightMesh = new THREE.Mesh(highlightGeometry, materials.highlight);
    highlightMesh.visible = false;
    boardGroupRef.current.add(highlightMesh);
    highlightMeshRef.current = highlightMesh;

  }, [boardStates, scene, createBoardMesh, materials.highlight, BOARD_GAP_Z]);

  useEffect(() => {
    return () => {
      Object.values(materials).forEach(material => material.dispose());
      cellGeometry.dispose();
    };
  }, [materials, cellGeometry]);

  return <div ref={mountRef} className="w-full h-96 rounded-lg overflow-hidden shadow-xl" />;
};