// https://threejsfundamentals.org/threejs/lessons/threejs-scenegraph.html
// Also investigate https://dev.to/pahund/animating-camera-movement-in-three-js-17e9
import * as THREE from './three.module.js';
import { TWEEN } from './tween.module.min.js';
import { InteractionManager } from 'https://cdn.skypack.dev/pin/three.interactive@v1.1.0-eKjdHSAKuD6J7ONJYNYB/mode=imports,min/optimized/three.interactive.js';

const SunRadius = 2;
const CameraPositions = [
  {x: 0, y: 60, z: 0},
  {x: 0, y: 500, z: 0},
  {x: 0, y: 1000, z: 0},
  {x: 0, y: 30, z: -100},
];
let cameraPositionIndex = 0;

function main(canvas, pausePlayButton, changeViewButton) {
  const popupDialogs = [...document.querySelectorAll('.popup-window'), ...document.querySelectorAll('.popup-close-button')];
  for (const popupDialog of popupDialogs) {
    popupDialog.addEventListener('click', hidePopup, false);
  }

  pausePlayButton.addEventListener('click', pausePlay, false);
  changeViewButton.addEventListener('click', changeView, false);

  let paused = false;
  let previousPausedElapsedDuration = 0;
  let lastPausedTime = performance.now();

  const renderer = new THREE.WebGLRenderer({canvas});

  const fov = 40;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 1500;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 100, 0);
  camera.up.set(0, 0, 1);
  setCameraPosition(camera);

  const scene = new THREE.Scene();

  {
    const color = 0xFFFFFF;
    const intensity = 2;
    const light = new THREE.PointLight(color, intensity);
    scene.add(light);
  }

  const interactionManager = new InteractionManager(
    renderer,
    camera,
    renderer.domElement
  );

  const objectsToRotate = [];

  const solarSystem = new THREE.Object3D();
  scene.add(solarSystem);

  solarSystem.add(createSun(interactionManager, camera));

  const mercury = createPlanet('mercury', 57.91, 2440, 88, 58.5, 2, 0xcc5200, objectsToRotate, interactionManager, camera);
  const venus = createPlanet('venus', 108.2, 6052, 225, 116.6, 3, 0xffffb3,  objectsToRotate, interactionManager, camera);
  const earth = createPlanet('earth',148, 6371, 365.25, 1, 23.5, 0x66a3ff, objectsToRotate, interactionManager, camera);
  addMoon(earth, 0.384, 1737, 27.3, 23.5, objectsToRotate, interactionManager, camera);

  const mars = createPlanet('mars', 239.67, 3390, 687, 1, 25, 0xff471a, objectsToRotate, interactionManager, camera);
  const jupiter = createPlanet('jupiter', 778, 69911, 4333, 0.3, 3, 0xff9966, objectsToRotate, interactionManager, camera);
  const saturn = createPlanet('saturn', 1434, 58232, 10759, 0.4, 26.7, 0xcca300, objectsToRotate, interactionManager, camera);
  addRings(saturn, 7000, 73000, 26.7, 0xcca300);

  const uranus = createPlanet('uranus', 2871, 25362, 30688, 0.7, 97.7, 0x99ccff, objectsToRotate, interactionManager, camera);
  const neptune = createPlanet('neptune', 4495, 24262, 60195, 0.7, 28.3, 0x0066cc, objectsToRotate, interactionManager, camera);

  solarSystem.add(mercury);
  solarSystem.add(venus);
  solarSystem.add(earth);
  solarSystem.add(mars);
  solarSystem.add(jupiter);
  solarSystem.add(saturn);
  solarSystem.add(uranus);
  solarSystem.add(neptune);
  
  solarSystem.rotation.y = Math.PI * 1.6;

  function pausePlay(event) {
    paused = !paused;
    if (paused) {
      pausePlayButton.innerHTML = 'Play'
      lastPausedTime = performance.now();
    } else {
      pausePlayButton.innerHTML = 'Pause'
      previousPausedElapsedDuration += (performance.now() - lastPausedTime);
    }
  }

  function changeView(event) {
    cameraPositionIndex = (cameraPositionIndex + 1) % CameraPositions.length;
    setCameraPosition(camera);
  }

  function hidePopup(event) {
    const popupDialogs = [...document.querySelectorAll('.popup-window')];
    for (const popupDialog of popupDialogs) {
      popupDialog.style.display = 'none';
    }
    
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
    if (paused) {
      time = lastPausedTime;
    }
    time -= previousPausedElapsedDuration;
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
  const destCoords = new THREE.Vector3( position.x, position.y, position.z );

  new TWEEN.Tween(coords)
    .to(destCoords)
    .onUpdate(() => {
      camera.position.set(coords.x, coords.y, coords.z);
      camera.lookAt(0, 0, 0);
    })
    .easing(TWEEN.Easing.Cubic.Out)
    .start();
}

function createSun(interactionManager, camera) {
  const radius = 1;
  const widthSegments = 50;
  const heightSegments = 50;
  const sphereGeometry = new THREE.SphereGeometry(
      radius, widthSegments, heightSegments);

  const sunMaterial = new THREE.MeshPhongMaterial({emissive: 0xFFFF00});
  const sunMesh = new THREE.Mesh(sphereGeometry, sunMaterial);
  sunMesh.scale.set(SunRadius, SunRadius, SunRadius);

  sunMesh.addEventListener("click", (event) => {
    event.stopPropagation();
    setPopupMessage('sun');
  });
  interactionManager.add(sunMesh);

  return sunMesh;
}

function createPlanet(name, orbitRadiusInMKm, planetRadiusInKm, lengthOfYearInEarthDays, lengthOfDayInEarthDays, angleOfTiltInDegrees, colour, objectsToRotate, interactionManager, camera) {
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
  planetMesh.rotation.x = degreesToRadians(-90 + angleOfTiltInDegrees);

  planetGroup.add(planetMesh);
  objectsToRotate.push({ obj: planetMesh, periodInEarthDays: lengthOfDayInEarthDays });

  planetMesh.addEventListener("click", (event) => {
    event.stopPropagation();
    setPopupMessage(name);
  });
  interactionManager.add(planetMesh);

  return planetOrbit;
}

function addMoon(planetOrbit, orbitRadiusInMKm, moonRadiusInKm, lengthOfMonthInEarthDays, angleOfTiltInDegrees, objectsToRotate, interactionManager, camera) {
    const planetGroup = planetOrbit.children.filter(c => c.name)[0];
    const planetMesh = planetGroup.children[0];
    const planetRadius = planetMesh.geometry.parameters.radius;
  
    const radius = (moonRadiusInKm / 6371) * 0.5;
    const widthSegments = 10;
    const heightSegments = 10;
    const sphereGeometry = new THREE.SphereGeometry(
        radius, widthSegments, heightSegments);

    const moonOrbit = new THREE.Object3D();
    moonOrbit.rotation.x = degreesToRadians(-90 + angleOfTiltInDegrees);

    planetGroup.add(moonOrbit);
  
    const moonMaterial = new THREE.MeshPhongMaterial({color: 0x888888, emissive: 0x222222});
    const moonMesh = new THREE.Mesh(sphereGeometry, moonMaterial);
    moonMesh.position.x = planetRadius + 0.3;

    moonOrbit.add(moonMesh);
    objectsToRotate.push({ obj: moonOrbit, periodInEarthDays: lengthOfMonthInEarthDays });

    moonMesh.addEventListener("click", (event) => {
      event.stopPropagation();
      setPopupMessage('moon');
    });
    interactionManager.add(moonMesh);

    return moonOrbit;
}

function addRings(planetOrbit, distanceFromPlanetInKm, widthOfRingsInKm, angleOfTiltInDegrees, colour) {
  const planetGroup = planetOrbit.children.filter(c => c.name)[0];
  const planetMesh = planetGroup.children[0];
  const planetRadius = planetMesh.geometry.parameters.radius;

  const distanceFromPlanet = planetRadius + ((distanceFromPlanetInKm / 6371) * 0.5);
  const width = (widthOfRingsInKm / 6371) * 0.5;
  const segments = 50;
  const ringGeometry = new THREE.RingGeometry(
    distanceFromPlanet, distanceFromPlanet + width, segments);

  const ringMaterial = new THREE.MeshPhongMaterial({color: colour, emissive: 0x444444, side: THREE.DoubleSide});
  const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
  ringMesh.rotation.x = degreesToRadians(-90 + angleOfTiltInDegrees);

  planetGroup.add(ringMesh);

  return ringMesh;
}

function setPopupMessage(name) {
  document.querySelector('.popup-window-message').innerHTML = document.querySelector(`#popup-message-${name}`).innerHTML;
  document.querySelector('.popup-window').style.display = 'block';
}

function degreesToRadians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

export { main };