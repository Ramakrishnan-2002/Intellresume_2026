import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeAIBrain: React.FC<{ className?: string }> = ({ className = 'absolute inset-0 w-full h-full' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // AI Core Icosahedron Wireframe
    const coreGeometry = new THREE.IcosahedronGeometry(1.4, 1);
    const coreMaterial = new THREE.MeshNormalMaterial({ wireframe: true });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    // Inner glowing sphere
    const innerGeom = new THREE.SphereGeometry(0.7, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x4edea3,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const innerSphere = new THREE.Mesh(innerGeom, innerMat);
    group.add(innerSphere);

    // Orbital ring 1 (Emerald)
    const ringGeom = new THREE.TorusGeometry(2.3, 0.025, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ring1 = new THREE.Mesh(ringGeom, ringMat1);
    group.add(ring1);

    // Orbital ring 2 (Hyper Blue)
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const ring2 = new THREE.Mesh(ringGeom, ringMat2);
    ring2.rotation.x = Math.PI / 2.2;
    ring2.rotation.y = Math.PI / 6;
    group.add(ring2);

    // Orbital ring 3 (Violet)
    const ringMat3 = new THREE.MeshBasicMaterial({ color: 0xd0bcff });
    const ring3 = new THREE.Mesh(ringGeom, ringMat3);
    ring3.rotation.y = Math.PI / 2.5;
    ring3.rotation.z = Math.PI / 4;
    group.add(ring3);

    camera.position.z = 5.6;

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      group.rotation.y += 0.007;
      group.rotation.x += 0.004;
      core.rotation.z += 0.01;
      innerSphere.rotation.y -= 0.01;
      ring1.rotation.z += 0.005;
      ring2.rotation.z -= 0.006;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 320;
      const h = container.clientHeight || 320;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className={className} />;
};
