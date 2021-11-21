// https://threejsfundamentals.org/threejs/lessons/threejs-scenegraph.html
// Also investigate https://dev.to/pahund/animating-camera-movement-in-three-js-17e9
import * as THREE from './three.module.js';
import { TWEEN } from './tween.module.min.js';

const SunRadius = 2;
const CameraPositions = [
  {x: 0, y: 60, z: 0},
  {x: 0, y: 1000, z: 0},
  {x: 0, y: 30, z: -100},
];
let cameraPositionIndex = 0;

function main(canvas) {
  canvas.addEventListener('mousedown', mouseDown, false);

  const renderer = new THREE.WebGLRenderer({canvas});

  const fov = 40;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 1000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 100, 0);
  setCameraPosition(camera);

  const scene = new THREE.Scene();

  {
    const color = 0xFFFFFF;
    const intensity = 2;
    const light = new THREE.PointLight(color, intensity);
    scene.add(light);
  }

  const objectsToRotate = [];

  const solarSystem = new THREE.Object3D();
  scene.add(solarSystem);

  solarSystem.add(createSun());

  const mercury = createPlanet('mercury', 57.91, 2440, 88, 58.5, 0xcc5200, objectsToRotate);
  const venus = createPlanet('venus', 108.2, 6052, 225, 116.6, 0xffffb3,  objectsToRotate);
  const earth = createPlanet('earth',148, 6371, 365.25, 1, 0x66a3ff, objectsToRotate);
  addMoon(earth, 0.384, 1737, 27.3, objectsToRotate);

  const mars = createPlanet('mars', 239.67, 3390, 687, 1, 0xff471a, objectsToRotate);
  const jupiter = createPlanet('jupiter', 778, 69911, 4333, 0.3, 0xff9966, objectsToRotate);
  const saturn = createPlanet('saturn', 1434, 58232, 10759, 0.4, 0xcca300, objectsToRotate);
  const uranus = createPlanet('uranus', 2871, 25362, 30688, 0.7, 0x99ccff, objectsToRotate);
  const neptune = createPlanet('neptune', 4495, 24262, 60195, 0.7, 0x0066cc, objectsToRotate);

  solarSystem.add(mercury);
  solarSystem.add(venus);
  solarSystem.add(earth);
  solarSystem.add(mars);
  solarSystem.add(jupiter);
  solarSystem.add(saturn);
  solarSystem.add(uranus);
  solarSystem.add(neptune);
  
  solarSystem.rotation.y = Math.PI * 1.6;

  function mouseDown(event) {
    cameraPositionIndex = (cameraPositionIndex + 1) % CameraPositions.length;
    setCameraPosition(camera);
  }

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

    objectsToRotate.forEach((objToRotate) => {
      let factor = 1 / (objToRotate.periodInEarthDays / 365.25);
      objToRotate.obj.rotation.y = (time * factor);
    });

    renderer.render(scene, camera);

    requestAnimationFrame(render);
    TWEEN.update();
  }

  requestAnimationFrame(render);
}

function setCameraPosition(camera) {
  const position = CameraPositions[cameraPositionIndex];

  const coords = new THREE.Vector3( camera.position.x, camera.position.y, camera.position.z );
  const dest = new THREE.Vector3( position.x, position.y, position.z )

  new TWEEN.Tween(coords)
    .to(dest)
    .onUpdate(() => {
      camera.position.set(coords.x, coords.y, coords.z);
      camera.up.set(0, 0, 1);
      camera.lookAt(0, 0, 0);
    })
    .easing(TWEEN.Easing.Cubic.Out)
    .start();
}

function createSun() {
  const radius = 1;
  const widthSegments = 50;
  const heightSegments = 50;
  const sphereGeometry = new THREE.SphereGeometry(
      radius, widthSegments, heightSegments);

  const sunMaterial = new THREE.MeshPhongMaterial({emissive: 0xFFFF00});
  const sunMesh = new THREE.Mesh(sphereGeometry, sunMaterial);
  sunMesh.scale.set(SunRadius, SunRadius, SunRadius);
  return sunMesh;
}

function createPlanet(name, orbitRadiusInMKm, planetRadiusInKm, lengthOfYearInEarthDays, lengthOfDayInEarthDays, colour, objectsToRotate) {
  const orbitRadius = ((orbitRadiusInMKm / 149) * 10) + SunRadius;
  const planetRadius = (planetRadiusInKm / 6371) * 0.5;

  const radius = planetRadius;
  const widthSegments = 10;
  const heightSegments = 10;
  const sphereGeometry = new THREE.SphereGeometry(
      radius, widthSegments, heightSegments);

  const planetOrbit = new THREE.Object3D();
  planetOrbit.name = name;
  const planetOrbitCurve = new THREE.EllipseCurve(
    0,  0,                    // ax, aY
    orbitRadius, orbitRadius, // xRadius, yRadius
    0,  2 * Math.PI,          // aStartAngle, aEndAngle
  );
  const planetOrbitGeometry = new THREE.BufferGeometry().setFromPoints( planetOrbitCurve.getPoints( 50 ) );
  const planetOrbitMaterial = new THREE.LineBasicMaterial( { color: 0xFF0000 } );
  const planetOrbitMesh = new THREE.LineLoop( planetOrbitGeometry, planetOrbitMaterial );
  planetOrbitMesh.rotation.x = Math.PI / 2;

  planetOrbit.add(planetOrbitMesh);
  objectsToRotate.push({ obj: planetOrbit, periodInEarthDays: lengthOfYearInEarthDays });

  const planetGroup = new THREE.Object3D();
  planetGroup.name = name;
  planetGroup.position.x = orbitRadius;
  planetOrbit.add(planetGroup);

  const planetMaterial = new THREE.MeshPhongMaterial({color: colour, emissive: 0x444444});
  const planetMesh = new THREE.Mesh(sphereGeometry, planetMaterial);
  planetGroup.add(planetMesh);
  objectsToRotate.push({ obj: planetMesh, periodInEarthDays: lengthOfDayInEarthDays });

  return planetOrbit;
}

function addMoon(planetOrbit, orbitRadius, moonRadiusInKm, lengthOfMonthInEarthDays, objectsToRotate) {
    const planetGroup = planetOrbit.children.filter(c => c.name)[0];

    const radius = (moonRadiusInKm / 6371) * 0.5;
    const widthSegments = 10;
    const heightSegments = 10;
    const sphereGeometry = new THREE.SphereGeometry(
        radius, widthSegments, heightSegments);

    const moonOrbit = new THREE.Object3D();
    planetGroup.add(moonOrbit);
  
    const moonMaterial = new THREE.MeshPhongMaterial({color: 0x888888, emissive: 0x222222});
    const moonMesh = new THREE.Mesh(sphereGeometry, moonMaterial);
    moonMesh.position.x = 1; //orbitRadius; - needs to be orbitRadius plus planet's radius
    moonOrbit.add(moonMesh);
    objectsToRotate.push({ obj: moonOrbit, periodInEarthDays: lengthOfMonthInEarthDays });

    return moonOrbit;
}

export { main };