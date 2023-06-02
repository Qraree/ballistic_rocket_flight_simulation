import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GUI} from 'three/addons/libs/lil-gui.module.min.js';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {MTLLoader} from 'three/addons/loaders/MTLLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';
import particleFire from 'three-particle-fire';
particleFire.install( { THREE: THREE } );
let sky, sun;


const startButton = document.querySelector('#start');

let start = false;

startButton.addEventListener('click', () => {
    start = true
})

function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;

    const camArray = [];


    function initSky() {

        // Add Sky
        sky = new Sky();
        sky.scale.setScalar( 1450000 );
        scene.add( sky );

        sun = new THREE.Vector3();

        /// GUI

        const effectController = {
            turbidity: 10,
            rayleigh: 3,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.7,
            elevation: 2,
            azimuth: 180,
            exposure: renderer.toneMappingExposure
        };

        const uniforms = sky.material.uniforms;
        uniforms[ 'turbidity' ].value = effectController.turbidity;
        uniforms[ 'rayleigh' ].value = effectController.rayleigh;
        uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
        uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
        const theta = THREE.MathUtils.degToRad( effectController.azimuth );

        sun.setFromSphericalCoords( 1, phi, theta );
        uniforms[ 'sunPosition' ].value.copy( sun );
        renderer.toneMappingExposure = effectController.exposure;

    }

    const fov = 45;
    const aspect = 2;
    const near = 0.1;
    const far = 10000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 1, 20);
    // camera.lookAt(0, 0, 0)
    camArray.push(camera);

    const rocketCam = new THREE.PerspectiveCamera(fov, aspect, near, far);
    rocketCam.position.set(0, 0, 2);
    rocketCam.rotation.set(0.8, 0, 0)

    camArray.push(rocketCam);

    const fixedCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    fixedCamera.position.set(1000, 0, 0)

    camArray.push(rocketCam);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color( "#4accea" );

    const rocketSystem = new THREE.Object3D();
    scene.add(rocketSystem)
    initSky();
    rocketSystem.add(camera)

    {
        const planeSize = 1400000;

        const loader = new THREE.TextureLoader();
        const texture = loader.load('/ground_texture.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = planeSize / 2;
        texture.repeat.set(repeats, repeats);

        const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMat = new THREE.MeshPhongMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(planeGeo, planeMat);
        mesh.rotation.x = Math.PI * -.5;
        scene.add(mesh);
    }
    let box;

    {
        const cubeSize = 4;
        const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const cubeMat = new THREE.MeshPhongMaterial({color: 'rgba(229,11,11,0.68)'});
        box = new THREE.Mesh(cubeGeo, cubeMat);
        box.position.set(cubeSize + 1, cubeSize / 2, 0);
        scene.add(box);

    }

    class ColorGUIHelper {
        constructor(object, prop) {
            this.object = object;
            this.prop = prop;
        }
        get value() {
            return `#${this.object[this.prop].getHexString()}`;
        }
        set value(hexString) {
            this.object[this.prop].set(hexString);
        }
    }

    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.AmbientLight(color, intensity);
        scene.add(light);

        const gui = new GUI();
        gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
        gui.add(light, 'intensity', 0, 2, 0.01);
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

    const MAX_POINTS = 100000;
    const lineGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array( MAX_POINTS * 3 );
    lineGeometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

    const lineMaterial = new THREE.LineBasicMaterial( { color: "blue", linewidth: 2 } );


    let line = new THREE.Line( lineGeometry,  lineMaterial );
    scene.add(line)
    let rocket;

    let particleFireMesh0;


    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();
    mtlLoader.load('/diplom_rocket.mtl', (mtl) => {
        mtl.preload();
        objLoader.setMaterials(mtl);

        objLoader.load('/diplom_rocket.obj', (root) => {
            rocket = root;
            rocketSystem.add(rocket)
            rocket.add(rocketCam)
            // console.log(rocket)

            {
                const fireRadius = 0.2;
                const fireHeight = 1.5;
                const particleCount = 800;
                const height = window.innerHeight;

                const geometry0 = new particleFire.Geometry( fireRadius, fireHeight, particleCount );
                const material0 = new particleFire.Material( { color: 0xff2200 } );
                material0.setPerspective( camera.fov, height );
                particleFireMesh0 = new THREE.Points( geometry0, material0 );
                particleFireMesh0.rotation.x = 3.14
                rocket.add( particleFireMesh0 );
            }
            requestAnimationFrame(render);
        });


    })




    // console.log(rocket)




    let rocketVelocity = 10;
    let rocketAngle = 1.57;
    let rocketX = 0;
    let rocketY = 0;

    const g0 = 9.8;
    const finishAngle = 0.68;
    const startAngle = 1.57;
    let m0 = 3800;
    let ta = 4;
    let tp = 40;
    let mut = 0.7;
    let tvp = 3.4;
    let mk = m0 * (1 - mut);
    const S = 0.92;

    let activePart = true;

    const relativeTime = (time) => {
        return (time - ta) / (tp - ta);
    }

    const getX = (Cx, ro, V) => {
        return 0.5 * Cx * ro * S * Math.pow(V, 2)
    }

    const getY = (Cy, ro, V, alpha) => {
        return 0.5 * Cy * ro * S * alpha * Math.pow(V, 2)
    }

    const getCx = (M) => {
        if (M >= 0 && M <= 0.8) {
            return 0.29
        } else if (M > 0.8 && M <= 1.068) {
            return M - 0.51
        } else {
            return 0.091 + (0.5 * Math.pow(M, -1))
        }
    }

    let mass;
    let mass_dot = 40;
    let time = 0;
    let P = 120000;
    let a = 343; // Исправить
    let ro0 = 1.23;
    let alpha = 0;
    let Y = 0;
    let ro;
    let M;
    let cx;
    let X;
    let trajectorySecondPart = false;

    let step = 0.01;



    let positionsArrays = line.geometry.attributes.position.array;
    let positionIndex = 0;



    function render() {
        time += step;


        ro = ro0 * Math.exp(-rocketSystem.position.y / 10000);
        M = rocketVelocity / a;
        cx = getCx(M);
        X = getX(cx, ro, rocketVelocity);






        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();

            particleFireMesh0.material.setPerspective( camera.fov, canvas.clientHeight );
        }

        if (rocketSystem.position.y >= 0) {
            console.log(`Угол - ${rocketAngle} | Масса - ${m0} | X - ${rocketSystem.position.x} | Y - ${rocketSystem.position.y} | Скорость - ${rocketVelocity}`)
            console.log(rocketSystem.rotation.z)
        }

        if (start) {
            if (time >= tp) {
                if (!activePart) {
                    rocketAngle += step * (((P * Math.sin(0) + Y) / (m0 * rocketVelocity)) - ((g0 * Math.cos(rocketAngle)) / rocketVelocity))
                } else {
                    rocketAngle = finishAngle;
                }
            } else {
                if (time < ta) {
                    rocketAngle = startAngle
                } else {
                    rocketAngle = startAngle - (2 * (startAngle - finishAngle) * relativeTime(time)) + ((startAngle - finishAngle) * Math.pow(relativeTime(time), 2))
                }
            }


            rocketVelocity += step * ((((P * Math.cos(alpha)) - X) / m0) - (g0 * Math.sin(rocketAngle)))
            rocketSystem.position.x += step * rocketVelocity * Math.cos(rocketAngle)
            rocketSystem.position.y += step * rocketVelocity * Math.sin(rocketAngle)
            rocket.rotation.z = 1.57 - rocketAngle
            camera.rotation.set(0, 0, 0)
        }



        if (m0 >= mk) {
            m0 -= step *  mass_dot;
        } else {
            activePart = false;
            rocket.remove(particleFireMesh0)
            P = 0;
        }

        // let delta = clock.getDelta();
        particleFireMesh0.material.update( step );



            // TRAJECTORY DRAWING
            // positionsArrays[positionIndex ++] = box.position.x;
            // positionsArrays[positionIndex ++] = box.position.y;
            // positionsArrays[positionIndex ++] = box.position.z;
            //
            // line.geometry.attributes.position.needsUpdate = true;




        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }


}

main();
