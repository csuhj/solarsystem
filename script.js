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

  const solarSystem = new THREE.Object3D();
  scene.add(solarSystem);

  solarSystem.add(createSun());

  const mercury = createPlanet('mercury', 0.39, 0.3, objects);
  const venus = createPlanet('venus', 0.72, 1, objects);
  const earth = createPlanet('earth', 1, 1, objects);
  addMoon(earth, 1, objects);

  solarSystem.add(mercury);
  solarSystem.add(venus);
  solarSystem.add(earth);
  
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
        factor = 1 / (224 / 365);
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

function createPlanet(name, orbitRadiusInAU, planetRadiusInEarths, objectsToRotate) {
  const orbitRadius = (orbitRadiusInAU * 10) + SunRadius;
  const planetRadius = planetRadiusInEarths * 0.5;

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

  const planetMaterial = new THREE.MeshPhongMaterial({color: 0x2233FF, emissive: 0x112244});
  const planetMesh = new THREE.Mesh(sphereGeometry, planetMaterial);
  planetGroup.add(planetMesh);
  objectsToRotate.push(planetMesh);

  return planetOrbit;
}

function addMoon(planetOrbit, orbitRadius, objectsToRotate) {
    const planetGroup = planetOrbit.children.filter(c => c.name)[0];

    const radius = 1;
    const widthSegments = 10;
    const heightSegments = 10;
    const sphereGeometry = new THREE.SphereGeometry(
        radius, widthSegments, heightSegments);

    const moonOrbit = new THREE.Object3D();
    moonOrbit.position.x = orbitRadius;
    planetGroup.add(moonOrbit);
  
    const moonMaterial = new THREE.MeshPhongMaterial({color: 0x888888, emissive: 0x222222});
    const moonMesh = new THREE.Mesh(sphereGeometry, moonMaterial);
    moonMesh.scale.set(.25, .25, .25);
    moonOrbit.add(moonMesh);
    objectsToRotate.push(moonMesh);

    return moonOrbit;
}

export { main };