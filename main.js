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
const nextCamButton = document.querySelector('#next-cam');
const ellipsisCameraButton = document.querySelector('#ellipsis-cam');
const nozzleCameraButton = document.querySelector('#nozzle-cam');
const mainCameraButton = document.querySelector('#main-cam');


const data = document.querySelector('#data');
const tex = document.querySelector('.tex');
const currentCamNote = document.querySelector('#current-camera');

const a_array = [340.3, 338.4, 336.4, 334.5, 332.5, 330.6, 328.6, 324.6, 320.6, 316.5, 312.3, 308.1, 303.9, 299.6, 295.2, 295.1, 295.1, 295.1, 295.1, 295.1, 297.7, 300.4, 303, 310.1, 317.2, 329.8, 315.1, 282.5];
const h_array = [0, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 14000, 16000, 18000, 20000, 24000, 28000, 32000, 36000, 40000, 50000, 60000, 80000]



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
    const far = 5000;
    const ellipsisFar = 4800000
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(-5, 3, 16);
    // camera.lookAt(0, 0, 0)
    camArray.push({cam: camera, caption: "Rocket main camera"});


    const nozzleCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    nozzleCamera.position.set(-1, -2, 2)
    nozzleCamera.rotation.set(0.68, 0,  0)
    camArray.push({cam: nozzleCamera, caption: "Rocket nozzle camera"})


    const ellipsisCamera = new THREE.PerspectiveCamera(fov, aspect, near, ellipsisFar);
    // ellipsisCamera.position.set(0, 3, 100);
    ellipsisCamera.position.set(180000, 0, 450000);
    camArray.push({cam: ellipsisCamera, caption: "Fixed ground camera"});




    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color( "#4accea" );
    scene.add(ellipsisCamera);

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
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(0, 1000, 1000);

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
            rocket.add(nozzleCamera)

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
            }
            requestAnimationFrame(render);
        });
    })



    const relativeTime = (time) => {
        return (time - ta) / (tp - ta);
    }

    const getX = (Cx, ro, V) => {
        return 0.5 * Cx * ro * S * Math.pow(V, 2)
    }

    const getA = (h) => {

        if (h > 80000) {
            return 282.5
        }

        for (let i = 0; i < h_array.length; i++) {
            if (h <= h_array[i]) {
                return a_array[i]
            }
        }
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

    const roundNum = (value, num=2) => {
        return Math.round(value * 10 * num) / (10 * num)
    }

    const rad = 6371210;

    const dir = new THREE.Vector3( 10, 2, 0 );
    dir.normalize();

    const origin = new THREE.Vector3( 285000, -rad, 0 );
    const length = 10;
    const hex = `#000000`;

    const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );



    ///////////////////
    /// ROCKET DATA ///
    ///////////////////

    let rocketVelocity = 10;
    let rocketAngle = 1.57;

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


    const mass_dot = 40;
    let time = 0;
    let P = 110000;
    let a = 343; // Исправить
    let ro0 = 1.23;
    let alpha = 0;
    let Y = 0;
    let ro;
    let M;
    let cx;
    let X;
    let p;
    const IP = 2559.5
    const IO = 2324.7

    /////////////////////////
    // ELLIPSIS PARAMETERS //
    /////////////////////////

    let vk;
    let eccentricity;
    let focal;
    let beta;

    const p0 = Math.pow(10, 5);
    let trajectorySecondPart = false;

    let line;
    let secondLine;
    let dashedLine;


    let strLatex =  '\\begin{array}{cc} a & b \\\\ c & d \\end{array}';
    let step = 0.05;


    // let MAX_POINTS = 100000;
    // const positions = new Float32Array( MAX_POINTS * 3 );
    // lineGeometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    // let drawCount = 2;
    // lineGeometry.setDrawRange( 0, drawCount );
    // const material = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 2 } );
    // let trajectoryLine = new THREE.Line( lineGeometry,  material );
    // scene.add(trajectoryLine)
    // let positionsArrays = trajectoryLine.geometry.attributes.position.array;


    // scene.add(trajectoryLine);

    let positionIndex = 0;

    let currentString = '';

    let activePartTime = false;
    let ellipticPartTime = false
    let activeTime;
    let ellipticTime;



    let currentCamera = camera;
    let currentCameraIndex = 0;
    currentCamNote.innerHTML = `${camArray[currentCameraIndex].caption}`



    mainCameraButton.addEventListener('click', () => {
        currentCamera = camera
    })
    nozzleCameraButton.addEventListener('click', () => {
        currentCamera = nozzleCamera
    })

    ellipsisCameraButton.addEventListener('click', () => {
        currentCamera = ellipsisCamera
    })






    const changeCamera = () => {
        currentCameraIndex += 1
        if (camArray[currentCameraIndex]) {
            currentCamera = camArray[currentCameraIndex].cam
            currentCamNote.innerHTML = `${camArray[currentCameraIndex].caption}`
        } else {
            currentCameraIndex = 0;
            currentCamera = camArray[0].cam;
            currentCamNote.innerHTML = `${camArray[currentCameraIndex].caption}`
        }
    }

    nextCamButton.addEventListener('click', changeCamera);

    let drawLine = false;
    let drawSecondLine = false;

    let rocketX = 0;
    let rocketY = 0;
    let rocketZ = 0;
    let trajectoryLine;


    function render() {


        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();

            particleFireMesh0.material.setPerspective( camera.fov, canvas.clientHeight );
        }


        const thetaLatexString = `
        \\theta = \\theta_{0} - 2(\\theta_{0} - \\theta_{k})\\frac{${Math.round(time)}-t_{a}}{t_{p} - t_{a}} + (\\theta_{0} - \\theta_{k})(\\frac{t-t_{a}}{t_{k} - t_{a}})^2 = ${Math.round(rocketAngle * 100) / 100}\\newline 
        \\ \\newline
        \\theta_{0} = ${startAngle} \\ rad\\newline
        \\ \\newline
        \\theta_{k} = ${finishAngle} \\ rad\\newline
        \\ \\newline
        t_{a} = ${ta} \\ c\\newline
        \\ \\newline
        t_{p} = ${tp} \\ c`

        if (time > ta && time < tp) {
            currentString = thetaLatexString;
        }


        const differentialLatexString = `\\frac{dv}{dt} = \\frac{Pcos\\alpha - X}{m} - gsin \\ \\theta = ${roundNum((((P * Math.cos(alpha)) - X) / m0) - (g0 * Math.sin(rocketAngle)))}\\newline
        \\ \\newline
        \\frac{d\\theta}{dt} = \\frac{1}{m}(Psin\\alpha + Y) - gsin \\ \\theta = ${Math.round((((P * Math.sin(0) + Y) / (m0 * rocketVelocity)) - ((g0 * Math.cos(rocketAngle)) / rocketVelocity)) * 10000) / 10000}\\newline
        \\ \\newline
        \\frac{dh}{dt} = vsin \\ \\theta = ${roundNum(rocketVelocity * Math.sin(rocketAngle))}\\newline
        \\ \\newline
        \\frac{dL}{dt} = \\frac{vcos \\ \\theta}{1 + \\frac{h}{R}} = ${roundNum(rocketVelocity * Math.cos(rocketAngle))}
        `
        let radVectorLength = Math.sqrt(Math.pow((Math.abs(rocketSystem.position.x - 285000)), 2) + (Math.pow((rocketSystem.position.y + rad), 2)))

        const ellipticLatexString = `
        v_{k} = \\frac{V_{k}^2(R+h_{k})}{\\pi_{0}} = ${roundNum(vk, 4)}\\newline
        \\ \\newline
        \\beta_{B} = arctan\\frac{v_{k}tg\\theta_{k}}{1+tg^2\\theta_{k}-v_{k}} = ${roundNum(beta, 4)}\\newline
        \\ \\newline
        p = v_{k}(R+h_{k})cos^2\\theta_{k} = ${roundNum(focal)}\\newline
        \\ \\newline
        e = \\sqrt{(1-v_{k})^2cos^2\\theta_{k}+sin^2\\theta_{k}} = ${roundNum(eccentricity)}\\newline
        \\ \\newline
        r = \\frac{p}{1-e\\cos(\\beta_{B}-\\beta)} = ${roundNum(radVectorLength)} м
        `

        const massLatexString =`
            \\theta = \\theta_{k} = ${rocketAngle}\\newline
            \\ \\newline
            "Сухая" \\ масса = ${roundNum(mk)}\\newline
            \\ \\newline
            Масса = ${m0}
        `

        arrowHelper.setLength(radVectorLength, 10000, 5000)
        arrowHelper.setDirection(new THREE.Vector3( rocketSystem.position.x - 285000, rocketSystem.position.y+rad, 0 ).normalize())

        if (start) {
            time += step;

            p = p0 * Math.exp(-rocketSystem.position.y / 10000);
            ro = ro0 * Math.exp(-rocketSystem.position.y / 10000);
            // P = (IP - ((IP - IO)*(p / p0))) * mass_dot
            P = 120000;
            a = getA(rocketSystem.position.y)
            M = rocketVelocity / a;
            cx = getCx(M);
            X = getX(cx, ro, rocketVelocity);




            rocket.add(particleFireMesh0)
            if (time >= tp) {
                tex.style.opacity = 0;
                if (!activePart) {
                    P = 0;

                    if (!activePartTime) {
                        activePartTime = true
                        activeTime = time;
                    }

                    if (time >= activeTime+3) {
                        tex.style.opacity = 1;
                        currentString = differentialLatexString;
                    }



                    rocketAngle += step * (((P * Math.sin(0) + Y) / (m0 * rocketVelocity)) - ((g0 * Math.cos(rocketAngle)) / rocketVelocity))
                } else {
                    if (time >= tp + 3) {
                        tex.style.opacity = 1;
                        currentString = massLatexString;
                    }


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
            rocket.rotation.z = rocketAngle - 1.57


            let point1 = new THREE.Vector3( rocketSystem.position.x, rocketSystem.position.y,  rocketSystem.position.z );
            let point2 = new THREE.Vector3(rocketX, rocketY, rocketZ);

            const lineGeometry = new THREE.BufferGeometry().setFromPoints([point1, point2]);
            const lineMaterial = new THREE.LineBasicMaterial( { color: 'black' } );

            trajectoryLine = new THREE.Line( lineGeometry, lineMaterial );
            scene.add( trajectoryLine );

            rocketX = rocketSystem.position.x;
            rocketY = rocketSystem.position.y;
            rocketZ = rocketSystem.position.z;





            camera.rotation.set(0, 0, 0)

            data.innerHTML =  `
            <div class="data-wrapper">
                <div>x - ${Math.round(rocketSystem.position.x * 100) / 100} м</div>
                <div>y - ${Math.round(rocketSystem.position.y * 100) / 100} м</div>
                <div>&theta; - ${Math.round(rocketAngle * 100) / 100} рад</div>
                <div>v - ${Math.round(rocketVelocity * 100) / 100} м/c</div>
                <div>t - ${Math.round(time * 100) / 100} c</div>
            </div>
            `


            if (m0 >= mk) {
                m0 -= step *  mass_dot;
                console.log(m0)
            } else {
                activePart = false;
                console.log(m0)
                rocket.remove(particleFireMesh0)
                P = 0;
            }

        }



        if (rocketSystem.position.y > 95000 && !drawLine) {
            const pi0 = 3.98 * Math.pow(10, 14);
            const points = [];
            points.push( new THREE.Vector3( rocketSystem.position.x, rocketSystem.position.y, 0 ) );
            points.push( new THREE.Vector3( 285000, -rad, 0 ) );

            const geometry = new THREE.BufferGeometry().setFromPoints( points );
            const material = new THREE.LineBasicMaterial( { color: 'black' } );
            line = new THREE.Line( geometry, material );
            scene.add( line );

            scene.add(arrowHelper)
            drawLine = true

            let v = rocketVelocity / 1000
            const l = 2 * rad * (Math.atan((Math.pow(v, 2) * Math.tan(rocketAngle)) / ((62.57 * (1 + (Math.pow(Math.tan(rocketAngle), 2))) - Math.pow(v, 2)))))

            vk = (Math.pow(rocketVelocity, 2) * (rad + rocketSystem.position.y)) / pi0;
            beta = Math.atan((vk * Math.tan(rocketAngle)) / (1 + Math.pow(Math.tan(rocketAngle), 2) - vk));
            focal = vk * (rad + rocketSystem.position.y) * Math.pow(Math.cos(rocketAngle), 2);
            eccentricity = Math.sqrt((Math.pow(1 - vk, 2) * Math.pow(Math.cos(rocketAngle), 2)) + Math.pow(Math.sin(rocketAngle), 2));
            const radVector = focal / (1 - (eccentricity * Math.cos(beta - (0.99 * beta)) ))

            const secondPoints = []
            secondPoints.push( new THREE.Vector3( rocketSystem.position.x + l - 35000, 95000, 0 ) );
            secondPoints.push( new THREE.Vector3( 285000, -rad, 0 ) );

            const secondGeometry = new THREE.BufferGeometry().setFromPoints( secondPoints );
            secondLine = new THREE.Line( secondGeometry, material );
            scene.add( secondLine );

            const thirdPoints = [];
            thirdPoints.push( new THREE.Vector3( -300000, 95000, 0 ) )
            thirdPoints.push(new THREE.Vector3( 700000, 95000, 0 ))
            const dashedMaterial = new THREE.LineDashedMaterial( { color: 'black',
                linewidth: 100,
                scale: 1,
                dashSize: 10000,
                gapSize: 50000, } );
            const thirdGeometry = new THREE.BufferGeometry().setFromPoints( thirdPoints );

            dashedLine = new THREE.Line( thirdGeometry, dashedMaterial );
            scene.add( dashedLine )


        }

        if (rocketSystem.position.y > 95000) {
            activePartTime = false;

            if (!ellipticPartTime) {
                ellipticPartTime = true
                ellipticTime = time;
            }

            if (time >= ellipticTime+3) {
                tex.style.opacity = 1;
                currentString = ellipticLatexString;
            }


        }

        if (rocketSystem.position.y < 95000 && drawLine) {
            scene.remove(line)
            scene.remove(secondLine)
            scene.remove(arrowHelper)
            scene.remove(dashedLine)
            drawLine = true;
        }

        particleFireMesh0.material.update( step );



        katex.render(currentString, tex, {
            throwOnError: false
        });



        //     // TRAJECTORY DRAWING
        // positionsArrays[positionIndex ++] = rocketSystem.position.x;
        // positionsArrays[positionIndex ++] = rocketSystem.position.y;
        // positionsArrays[positionIndex ++] = rocketSystem.position.z;
        //
        //
        // let drawCount = positionsArrays.length / 3
        // trajectoryLine.geometry.setDrawRange( 0, drawCount );
        //
        // trajectoryLine.geometry.attributes.position.needsUpdate = true;


        renderer.render(scene, currentCamera);
        requestAnimationFrame(render);
    }


}

main();
