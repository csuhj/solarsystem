// https://threejsfundamentals.org/threejs/lessons/threejs-scenegraph.html
// Also investigate https://dev.to/pahund/animating-camera-movement-in-three-js-17e9
import * as THREE from './three.module.js';

const SunRadius = 2;

function main(canvas) {
  const renderer = new THREE.WebGLRenderer({canvas});

  const fov = 40;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 1000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 500, 0);
  camera.up.set(0, 0, 1);
  camera.lookAt(0, 0, 0);

  const scene = new THREE.Scene();

  {
    const color = 0xFFFFFF;
    const intensity = 2;
    const light = new THREE.PointLight(color, intensity);
    scene.add(light);
  }

  const objects = [];

  const solarSystem = new THREE.Object3D();
  scene.add(solarSystem);

  solarSystem.add(createSun());

  const mercury = createPlanet('mercury', 57.91, 2440, 0xcc5200, objects);
  const venus = createPlanet('venus', 108.2, 6052, 0xffffb3,  objects);
  const earth = createPlanet('earth',148, 6371, 0x66a3ff, objects);
  addMoon(earth, 0.384, 1737, objects);

  const mars = createPlanet('mars', 239.67, 3390, 0xff471a, objects);
  const jupiter = createPlanet('jupiter', 778, 69911, 0xff9966, objects);
  const saturn = createPlanet('saturn', 1434, 58232, 0xcca300, objects);
  const uranus = createPlanet('uranus', 2871, 25362, 0x99ccff, objects);
  const neptune = createPlanet('neptune', 4495, 24262, 0x0066cc, objects);

  solarSystem.add(mercury);
  solarSystem.add(venus);
  solarSystem.add(earth);
  solarSystem.add(mars);
  solarSystem.add(jupiter);
  solarSystem.add(saturn);
  solarSystem.add(uranus);
  solarSystem.add(neptune);
  
  //Should really move the camera instead
  solarSystem.rotation.x = Math.PI * 0.4;

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
      let factor;
      if (obj.name === 'mercury') {
        factor = 1 / (88 / 365);
      } else if (obj.name === 'venus') {
        factor = 1 / (225 / 365);
      } else if (obj.name === 'mars') {
        factor = 1 / (687 / 365);
      } else if (obj.name === 'jupiter') {
        factor = 1 / (4333 / 365);
      } else if (obj.name === 'saturn') {
        factor = 1 / (10759 / 365);
      } else if (obj.name === 'uranus') {
        factor = 1 / (30688 / 365);
      } else if (obj.name === 'neptune') {
        factor = 1 / (60195 / 365);
      } else {
        factor = 1;
      }

      obj.rotation.y = (time * factor);
    });

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
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

function createPlanet(name, orbitRadiusInMKm, planetRadiusInKm, colour, objectsToRotate) {
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
  objectsToRotate.push(planetOrbit);

  const planetGroup = new THREE.Object3D();
  planetGroup.name = name;
  planetGroup.position.x = orbitRadius;
  planetOrbit.add(planetGroup);
  objectsToRotate.push(planetGroup);

  const planetMaterial = new THREE.MeshPhongMaterial({color: colour, emissive: 0x444444});
  const planetMesh = new THREE.Mesh(sphereGeometry, planetMaterial);
  planetGroup.add(planetMesh);
  objectsToRotate.push(planetMesh);

  return planetOrbit;
}

function addMoon(planetOrbit, orbitRadius, moonRadiusInKm, objectsToRotate) {
    const planetGroup = planetOrbit.children.filter(c => c.name)[0];

    const radius = (moonRadiusInKm / 6371);
    const widthSegments = 10;
    const heightSegments = 10;
    const sphereGeometry = new THREE.SphereGeometry(
        radius, widthSegments, heightSegments);

    const moonOrbit = new THREE.Object3D();
    moonOrbit.position.x = 1; //orbitRadius; - needs to be orbitRadius plus planet's radius
    planetGroup.add(moonOrbit);
  
    const moonMaterial = new THREE.MeshPhongMaterial({color: 0x888888, emissive: 0x222222});
    const moonMesh = new THREE.Mesh(sphereGeometry, moonMaterial);
    moonMesh.scale.set(.25, .25, .25);
    moonOrbit.add(moonMesh);
    objectsToRotate.push(moonMesh);

    return moonOrbit;
}

export { main };