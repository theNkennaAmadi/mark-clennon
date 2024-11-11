import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Diary {
    constructor(container) {
        this.container = container;
        this.items = Array.from(container.querySelectorAll('.stills-item'));
        this.imageUrls = this.items.map(item => item.querySelector('img').src);
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.mainMouse = []
        this.images = [];
        this.hoveredImage = null;
        this.currentlyFocused = null;
        this.originalFOV = 75;
        this.zoomedFOV = 50;
        this.view = localStorage.getItem('diary-view') || 'grid';
        this.viewSwitchBtns = [...this.container.querySelectorAll('.diary-switch-btn')];
        this.textView = this.container.querySelector('.diary-text-view');

        // Cameras
        this.perspectiveCamera = new THREE.PerspectiveCamera(this.originalFOV, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.orthographicCamera = new THREE.OrthographicCamera();
        this.camera = this.view === 'grid' ? this.orthographicCamera : this.perspectiveCamera;

        // Controls
        this.controls = null;

        this.init();
    }

    init() {
        this.initViews();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);
        this.setupLights();
        this.loadImages();
        this.setupControls();
        this.addEventListeners();
        this.animate();
    }

    initViews() {
        this.canvasElement = this.container.querySelector('canvas');
        if (this.view !== 'grid') {
            this.viewSwitchBtns.forEach(btn => btn.classList.toggle('inactive'));
        }

        this.viewSwitchBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.view !== btn.dataset.view) {
                    this.view = btn.dataset.view;
                    localStorage.setItem('diary-view', this.view);
                    this.viewSwitchBtns.forEach(b => b.classList.toggle('inactive'));
                    this.switchView();
                }
            });
        });
    }

    setupLights() {
        // Clear previous lights
        const lights = this.scene.children.filter(child => child.isLight);
        lights.forEach(light => this.scene.remove(light));

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);
    }

    loadImages() {
        const loader = new THREE.TextureLoader();
        this.imagePositions = []; // To store positions for both views

        const numImages = this.imageUrls.length;
        const gridSize = Math.ceil(Math.sqrt(numImages));
        const spacing = 3.25;
        const radius = 20;

        this.imageUrls.forEach((url, index) => {
            loader.load(url, (texture) => {
                const aspect = texture.image.width / texture.image.height;
                const geometry = new THREE.PlaneGeometry(aspect * 2, 2);
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 1,
                });
                const mesh = new THREE.Mesh(geometry, material);

                texture.colorSpace = THREE.SRGBColorSpace;
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;

                // Grid position
                const row = Math.floor(index / gridSize);
                const col = index % gridSize;
                const xOffset = (col - gridSize / 2 + 0.5) * spacing*0.85;
                const yOffset = (row - gridSize / 2 + 0.5) * spacing*0.85;
                const gridPosition = new THREE.Vector3(xOffset, -yOffset, Math.random());
                const gridRotation = (Math.random() - 0.5) * 0.2;

                // Globe position
                const phi = Math.acos(-1 + (2 * index) / numImages);
                const theta = Math.sqrt(numImages * Math.PI) * phi;
                const globePosition = new THREE.Vector3().setFromSphericalCoords(radius, phi, theta);
                const globeRotation = 0; // Facing the center

                // Store positions
                this.imagePositions.push({
                    grid: { position: gridPosition, rotation: gridRotation },
                    globe: { position: globePosition, rotation: globeRotation },
                });

                // Set initial position based on current view
                if (this.view === 'grid') {
                    mesh.position.copy(gridPosition);
                    mesh.rotation.z = gridRotation;
                } else {
                    mesh.position.copy(globePosition);
                    mesh.lookAt(0, 0, 0);
                }

                this.scene.add(mesh);
                this.images.push(mesh);

                gsap.from(mesh.scale, {
                    x: 0,
                    y: 0,
                    z: 0,
                    duration: 0.5,
                    ease: 'back.out(1.7)',
                    delay: index * 0.05,
                });
            });
        });
    }

    setupControls() {
        if (this.controls) {
            this.controls.dispose();
        }

        if (this.view === 'grid') {
            this.camera = this.orthographicCamera;
            this.updateCameraAspect();
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);


            this.controls.enableRotate = false;
            this.controls.enableZoom = true;
            this.controls.enablePan = true;
            this.controls.dampingFactor = 0.1;
            this.controls.zoomSpeed = 0.8;


            this.controls.addEventListener('change', () => {
               // console.log(this.controls.target)
               // this.controls.target.set()
            });

            this.controls.minZoom = 0.3;  // Adjust this value to set maximum zoom out
            this.controls.maxZoom = 3;     // Your existing maximum zoom in limit


            this.controls.mouseButtons = {
                LEFT: THREE.MOUSE.PAN,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: null
            };
            this.controls.touches = {
                ONE: THREE.TOUCH.PAN,
                TWO: THREE.TOUCH.DOLLY_PAN
            };

            this.camera.position.set(0, 0, 10);
            this.camera.lookAt(0, 0, 0);
            this.controls.enableDamping = true;
        } else {
            this.camera = this.perspectiveCamera;
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();

            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.screenSpacePanning = false;
            this.controls.minDistance = 5;
            this.controls.maxDistance = 50;

            this.camera.position.set(0, 0, 20);
        }
    }

    switchView() {
        // Update controls
        this.setupControls();

        // Animate images to new positions
        this.images.forEach((mesh, index) => {
            const positions = this.imagePositions[index];
            const targetPosition = this.view === 'grid' ? positions.grid.position : positions.globe.position;
            const targetRotation = this.view === 'grid' ? positions.grid.rotation : positions.globe.rotation;

            gsap.to(mesh.position, {
                x: targetPosition.x,
                y: targetPosition.y,
                z: targetPosition.z,
                duration: 1.5,
                ease: 'power2.inOut'
            });

            if (this.view === 'grid') {
                gsap.to(mesh.rotation, {
                    x: 0,
                    y: 0,
                    z: targetRotation,
                    duration: 1.5,
                    ease: 'power2.inOut'
                });
            } else {
                // Make the image face the center in globe view
                gsap.to(mesh.quaternion, {
                    x: 0,
                    y: 0,
                    z: 0,
                    w: 1,
                    duration: 1.5,
                    ease: 'power2.inOut',
                    onUpdate: () => mesh.lookAt(0, 0, 0)
                });
            }
        });

        // Animate camera transition
        if (this.view === 'grid') {
            // Switch to OrthographicCamera
            const newCam = this.orthographicCamera;
            this.updateCameraAspect();
            newCam.position.set(0, 0, 10);
            newCam.lookAt(0, 0, 0);

            gsap.to(this.camera.position, {
                x: newCam.position.x,
                y: newCam.position.y,
                z: newCam.position.z,
                duration: 1.5,
                ease: 'power2.inOut',
                onUpdate: () => this.camera.updateProjectionMatrix(),
                onComplete: () => {
                    this.camera = newCam;
                    this.setupControls();
                }
            });
        } else {
            // Switch to PerspectiveCamera
            const newCam = this.perspectiveCamera;
            newCam.position.set(0, 0, 20);
            newCam.lookAt(0, 0, 0);
            newCam.aspect = window.innerWidth / window.innerHeight;
            newCam.updateProjectionMatrix();

            gsap.to(this.camera.position, {
                x: newCam.position.x,
                y: newCam.position.y,
                z: newCam.position.z,
                duration: 1.5,
                ease: 'power2.inOut',
                onUpdate: () => this.camera.updateProjectionMatrix(),
                onComplete: () => {
                    this.camera = newCam;
                    this.setupControls();
                }
            });
        }
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize(), false);
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event), false);
        this.renderer.domElement.addEventListener('click', (event) => this.onClick(event), false);


    }

    onWindowResize() {
        if (this.view === 'grid') {
            this.updateCameraAspect();
        } else if (this.view === 'globe') {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateCameraAspect() {
        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = 5;
        this.orthographicCamera.left = frustumSize * aspect / -2;
        this.orthographicCamera.right = frustumSize * aspect / 2;
        this.orthographicCamera.top = frustumSize / 2;
        this.orthographicCamera.bottom = frustumSize / -2;
        this.orthographicCamera.near = -1000;
        this.orthographicCamera.far = 1000;
        this.orthographicCamera.updateProjectionMatrix();
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.mainMouse.x = event.clientX
        this.mainMouse.y = event.clientY

        if (this.view === 'grid') {
            this.addParallaxEffect(); // Apply parallax effect
            gsap.to(this.textView, {x: this.mainMouse.x, y: this.mainMouse.y, duration: 0.3 });
        }

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.images);

        if (intersects.length > 0) {
            if (this.hoveredImage !== intersects[0].object) {
                if (this.hoveredImage) this.resetImageScale(this.hoveredImage);
                this.hoveredImage = intersects[0].object;
                this.hoverEffect(this.hoveredImage);

            }
        } else if (this.hoveredImage) {
            this.resetImageScale(this.hoveredImage);
            this.hoveredImage = null;
        }
    }

    addParallaxEffect() {
        // Implement parallax effect if needed
    }

    onClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.images);

        if (intersects.length > 0) {
            const clickedImage = intersects[0].object;
            this.focusOnImage(clickedImage);
        } else if (this.currentlyFocused) {
            this.resetCamera();
        }
    }

    focusOnImage(image) {
        if (this.view === 'grid') {
            const targetPosition = new THREE.Vector3();
            image.getWorldPosition(targetPosition);

            gsap.to(image.scale, {
                x: image.scale.x * 1.2,
                y: image.scale.y * 1.2,
                duration: 0.3,
            });
        } else if (this.view === 'globe') {
            if (this.currentlyFocused === image) {
                return;
            }

            this.currentlyFocused = image;

            const imagePosition = image.position.clone();
            const direction = imagePosition.clone().sub(this.camera.position).normalize();
            const distance = image.scale.x * 1.25;
            const cameraPosition = imagePosition.clone().sub(direction.multiplyScalar(distance));

            gsap.to(this.textView, { display: 'none', opacity: 0, duration: 0.3 });

            gsap.to(this.camera.position, {
                x: cameraPosition.x,
                y: cameraPosition.y,
                z: cameraPosition.z,
                duration: 1.5,
                ease: "power2.out"
            });

            gsap.to(this.camera, {
                fov: this.zoomedFOV,
                duration: 1.5,
                ease: "power2.out",
                onUpdate: () => this.camera.updateProjectionMatrix()
            });

            gsap.to(this.controls.target, {
                x: imagePosition.x,
                y: imagePosition.y,
                z: imagePosition.z,
                duration: 1.5,
                ease: "power2.out",
                onUpdate: () => this.controls.update()
            });

            gsap.to(image.scale, {
                x: image.scale.x * 1.2,
                y: image.scale.y * 1.2,
                duration: 0.5
            });

            this.images.forEach(otherImage => {
                if (otherImage !== image) {
                    gsap.to(otherImage.material, { opacity: 0.1, duration: 0.5 });
                } else {
                    gsap.to(otherImage.material, { opacity: 1, duration: 0.5 });
                }
            });

            this.controls.enabled = false;
            setTimeout(() => {
                this.controls.enabled = true;
            }, 1500);
        }
    }

    resetCamera() {
        if (this.view === 'globe' && this.currentlyFocused) {
            gsap.to(this.camera.position, {
                x: 0,
                y: 0,
                z: 20,
                duration: 1.5,
                ease: "power2.out"
            });

            gsap.to(this.camera, {
                fov: this.originalFOV,
                duration: 1.5,
                ease: "power2.out",
                onUpdate: () => this.camera.updateProjectionMatrix()
            });

            gsap.to(this.controls.target, {
                x: 0,
                y: 0,
                z: 0,
                duration: 1.5,
                ease: "power2.out",
                onUpdate: () => this.controls.update()
            });

            gsap.to(this.currentlyFocused.scale, {
                x: this.currentlyFocused.scale.x / 1.2,
                y: this.currentlyFocused.scale.y / 1.2,
                duration: 0.5
            });

            this.images.forEach(image => {
                gsap.to(image.material, { opacity: 0.8, duration: 0.5 });
            });

            this.currentlyFocused = null;

            this.controls.enabled = false;
            setTimeout(() => {
                this.controls.enabled = true;
            }, 1500);
        }
    }

    hoverEffect(image) {
        if (this.view === 'grid') {
            gsap.to(image.scale, {
                x: image.scale.x * 1.1,
                y: image.scale.y * 1.1,
                duration: 0.3,
            });
            gsap.to(image.rotation, {
                z: 0,
                duration: 0.3,
            });
            gsap.to(this.textView, { display: 'inline-block', width: 'max-content', opacity:1, duration: 0.3 });
            gsap.to(this.textView.children, {backgroundColor: 'black'})
        } else if (this.view === 'globe') {
            if (image !== this.currentlyFocused) {
                gsap.to(image.scale, {
                    x: image.scale.x * 1.1,
                    y: image.scale.y * 1.1,
                    duration: 0.3
                });
                gsap.to(image.material, { opacity: 1, duration: 0.3 });
                gsap.to(this.textView, { display: 'flex', opacity:1, duration: 0.3, });
                gsap.to(this.textView.children, {backgroundColor: 'transparent'})
            }
        }
    }

    resetImageScale(image) {
        if (this.view === 'grid') {
            gsap.to(image.scale, {
                x: 1,
                y: 1,
                duration: 0.3,
            });
            gsap.to(image.rotation, {
                z: (Math.random() - 0.5) * 0.2,
                duration: 0.3,
            });
            gsap.to(this.textView, { display: 'none', opacity: 0, duration: 0.3 });
        } else if (this.view === 'globe') {
            gsap.set(this.textView, {clearProps: 'all' });
            if (image !== this.currentlyFocused) {
                gsap.to(image.scale, {
                    x: image.scale.x / 1.1,
                    y: image.scale.y / 1.1,
                    duration: 0.3
                });
                gsap.to(image.material, { opacity: 0.8, duration: 0.3 });
                gsap.to(this.textView, { display: 'none', opacity: 0, duration: 0.3 });
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.controls) {
            this.controls.update();
        }
        if (this.controls && this.view === 'grid') {
            // Calculate max pan from grid size
            const gridSize = Math.ceil(Math.sqrt(this.imageUrls.length));
            const spacing = 3 * 0.85; // Match your spacing from loadImages
            const maxPan = (gridSize * spacing) / 2;

            this.controls.target.set(
                Math.min(Math.max(this.controls.target.x, -maxPan), maxPan),
                Math.min(Math.max(this.controls.target.y, -maxPan), maxPan),
                0
            );
            this.controls.update();
        }
        this.renderer.render(this.scene, this.camera);
    }
}
