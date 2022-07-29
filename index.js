import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, usePhysics, useLocalPlayer, useLoaders, useCameraManager} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

let lastShootTime = 1;
let fireDelay = 1000;
let cubeArray = [];
let cannonObj = null;
let origin = new THREE.Vector3(0,0,0);
let cannonFlash = null;

export default () => {
  const app = useApp();
  const localPlayer = useLocalPlayer();
  const physics = usePhysics();
  const cameraManager = useCameraManager();



  const _shootTowardsPoint = (obj, pos) => {

    let dif = new THREE.Vector3();
    let dist = pos.distanceTo(obj.position);
    let power = 50;

    dif.subVectors(pos, obj.position).normalize();

    physics.setVelocity(obj.physicsObject, dif.multiplyScalar(power));

    // setTimeout(() => {
    //   app.remove();
    // }, hurtAnimationDuration * 1000);


  }

  useFrame(({timestamp}) => {

    if(!localPlayer || !cannonObj || !cannonFlash) {
      return;
    }

    let lookAtPosition = new THREE.Vector3();
    lookAtPosition.copy(localPlayer.position);
    lookAtPosition.y = THREE.MathUtils.clamp(localPlayer.position.y, cannonObj.position.y-2, cannonObj.position.y+20);

    cannonObj.lookAt(lookAtPosition);

    cannonObj.updateMatrixWorld();

    origin.copy(cannonObj.position).add(new THREE.Vector3(0,0,5).applyQuaternion(cannonObj.quaternion));

    cannonFlash.position.copy(cannonObj.position).add(new THREE.Vector3(0,0,-0.5).applyQuaternion(cannonObj.quaternion));
    cannonFlash.updateMatrixWorld();

    if((timestamp - lastShootTime) > fireDelay) {
      lastShootTime = timestamp;

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial();
      material.color = new THREE.Color( 0xffffff ).setHex( Math.random() * 0xffffff );
      const cube = new THREE.Mesh(geometry, material);

      cube.position.copy(origin);
      cube.updateMatrixWorld();

      let physicsObject = physics.addBoxGeometry(cube.position, cube.quaternion, new THREE.Vector3().copy(cube.scale).multiplyScalar(0.5), true);
      cube.physicsObject = physicsObject;

      app.add(cube);

      cubeArray.push(cube);

      _shootTowardsPoint(cube, localPlayer.position);

      cannonFlash.intensity = 100;
      cameraManager.addShake( cannonObj.position, 0.2, 60, 500);

       setTimeout(() => {
         cannonFlash.intensity = 0;

       }, 70);
     }

     for (var i = 0; i < cubeArray.length; i++) {
       cubeArray[i].position.copy(cubeArray[i].physicsObject.position);
       cubeArray[i].quaternion.copy(cubeArray[i].physicsObject.quaternion);
       cubeArray[i].updateMatrixWorld();
     }
  });

  (async () => {
    const u = `${baseUrl}cannon.glb`;
    let o = await new Promise((accept, reject) => {
      const {gltfLoader} = useLoaders();
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    o = o.scene;
    app.add(o);

    cannonObj = o.getObjectByName('cannon');

    //explosionMesh = cannonObj.children[2];
    //console.log(explosionMesh.material.name);

    cannonFlash = new THREE.PointLight( 0xfac491, 0, 5 );
    cannonFlash.position.copy(cannonObj.position);
    app.add( cannonFlash );
    
    
    const physicsId = physics.addGeometry(o);
    //physicsIds.push(physicsId);
  })();
  
  return app;
};
