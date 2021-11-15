// https://threejsfundamentals.org/threejs/lessons/threejs-scenegraph.html
import * as THREE from './three.module.js';

function main(canvas) {
  const renderer = new THREE.WebGLRenderer({canvas});

  const fov = 40;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 1000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 50, 0);
  camera.up.set(0, 0, 1);
  camera.lookAt(0, 0, 0);

  const scene = new THREE.Scene();

  {
    const color = 0xFFFFFF;
    const intensity = 3;
    const light = new THREE.PointLight(color, intensity);
    scene.add(light);
  }

  const objects = [];

  const radius = 1;
  const widthSegments = 6;
  const heightSegments = 6;
  const sphereGeometry = new THREE.SphereGeometry(
      radius, widthSegments, heightSegments);

  const solarSystem = new THREE.Object3D();
  scene.add(solarSystem);

  const sunMaterial = new THREE.MeshPhongMaterial({emissive: 0xFFFF00});
  const sunMesh = new THREE.Mesh(sphereGeometry, sunMaterial);
  sunMesh.scale.set(5, 5, 5);
  solarSystem.add(sunMesh);

  solarSystem.add(createEarth(10, objects));

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  function render(time) {
    time *= 0.001;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    objects.forEach((obj) => {
      obj.rotation.y = time;
    });

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

function createEarth(orbitRadius, objectsToRotate) {
    const radius = 1;
    const widthSegments = 6;
    const heightSegments = 6;
    const sphereGeometry = new THREE.SphereGeometry(
        radius, widthSegments, heightSegments);

    const earthOrbit = new THREE.Object3D();
    const earthOrbitCurve = new THREE.EllipseCurve(
      0,  0,                    // ax, aY
      orbitRadius, orbitRadius, // xRadius, yRadius
      0,  2 * Math.PI,          // aStartAngle, aEndAngle
    );
    const earthOrbitGeometry = new THREE.BufferGeometry().setFromPoints( earthOrbitCurve.getPoints( 50 ) );
    const earthOrbitMaterial = new THREE.LineBasicMaterial( { color: 0xFF0000 } );
    const earthOrbitMesh = new THREE.LineLoop( earthOrbitGeometry, earthOrbitMaterial );
    earthOrbitMesh.rotation.x = Math.PI / 2;
  
    earthOrbit.add(earthOrbitMesh);
    objectsToRotate.push(earthOrbit);
  
    const earthGroup = new THREE.Object3D();
    earthGroup.position.x = orbitRadius;
    earthOrbit.add(earthGroup);
    objectsToRotate.push(earthGroup);
  
    const earthMaterial = new THREE.MeshPhongMaterial({color: 0x2233FF, emissive: 0x112244});
    const earthMesh = new THREE.Mesh(sphereGeometry, earthMaterial);
    earthGroup.add(earthMesh);
    objectsToRotate.push(earthMesh);
  
    const moonOrbit = new THREE.Object3D();
    moonOrbit.position.x = 2;
    earthGroup.add(moonOrbit);
  
    const moonMaterial = new THREE.MeshPhongMaterial({color: 0x888888, emissive: 0x222222});
    const moonMesh = new THREE.Mesh(sphereGeometry, moonMaterial);
    moonMesh.scale.set(.5, .5, .5);
    moonOrbit.add(moonMesh);
    objectsToRotate.push(moonMesh);

    return earthOrbit;
}

export { main };