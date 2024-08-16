import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Splitting from "splitting";

export class Diary {
    constructor(container) {
        this.container = container;
        this.items = Array.from(container.querySelectorAll('.stills-item'));
        this.imageUrls = this.items.map(item => item.querySelector('img').src);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.images = [];
        this.hoveredImage = null;
        this.currentlyFocused = null;
        this.originalFOV = 75;
        this.zoomedFOV = 40;

        this.init();

    }

    init() {
        this.initSplitting()

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.set(0, 0, 20);


    }


    initSplitting() {
        //Initialize Splitting, split the text into characters and get the results
        this.targets = [...document.querySelectorAll(".diary-text")];

        const results = Splitting({target: this.targets, by: "chars"});

        //Get all the words and wrap each word in a span
        this.chars = results.map((result) => result.chars).flat();

        this.chars.forEach((word) => {
            let wrapper = document.createElement("span");
            wrapper.classList.add("char-wrap");
            word.parentNode.insertBefore(wrapper, word);
            wrapper.appendChild(word);
        });
        gsap.set('.diary-text-wrapper', {opacity:1})

        //Get all the characters and move them off the screen
        //gsap.set([this.chars], {yPercent: 120});
        this.revealText()
    }

    revealText() {
        // Query all individual characters in the line for animation.
        gsap.fromTo(this.chars, {
            filter: 'blur(10px) brightness(30%)',
            willChange: 'filter'
        }, {
            ease: 'none', // Animation easing.
            filter: 'blur(0px) brightness(100%)',
            stagger: 0.03, // Delay between starting animations for each character.
            duration: 0.5, // Animation duration.
            onComplete: ()=>{
                gsap.to(this.chars, { filter: 'blur(10px) brightness(30%)', delay: 1.5})
            }
        });

        gsap.to(this.chars,  {
            ease: 'none', // Animation easing.
            stagger: 0.025, // Delay between starting animations for each character.
            onComplete: () => {
                // Use requestAnimationFrame to defer 3D scene setup
                requestAnimationFrame(() => this.initScene());
            }
        });
    }

    initScene() {
        this.setupControls();
        this.setupLights();
        this.loadImages();
        this.addEventListeners();
        this.animate();
    }


    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);
    }

    loadImages() {
        const loader = new THREE.TextureLoader();
        const radius = 20;

        // Load images in batches to reduce GPU load
        const batchSize = 5;
        const loadBatch = (startIndex) => {
            const endIndex = Math.min(startIndex + batchSize, this.imageUrls.length);
            for (let index = startIndex; index < endIndex; index++) {
                this.loadSingleImage(loader, radius, index);
            }
            if (endIndex < this.imageUrls.length) {
                setTimeout(() => loadBatch(endIndex), 100);
            }
        };

        loadBatch(0);
    }

    loadSingleImage(loader, radius, index) {
        loader.load(this.imageUrls[index], (texture) => {
            const aspect = texture.image.width / texture.image.height;
            const geometry = new THREE.PlaneGeometry(aspect, 1);
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide,
                transparent: false,
                opacity: 1
            });
            const mesh = new THREE.Mesh(geometry, material);

            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.format = THREE.RGBAFormat;

            const phi = Math.acos(-1 + (2 * index) / this.imageUrls.length);
            const theta = Math.sqrt(this.imageUrls.length * Math.PI) * phi;

            mesh.position.setFromSphericalCoords(radius, phi, theta);
            mesh.lookAt(0, 0, 0);

            const scale = 1 + Math.random() * 0.5;
            mesh.scale.set(scale * aspect, scale, 1);

            this.scene.add(mesh);
            this.images.push(mesh);

            gsap.from(mesh.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 1,
                ease: "back.out(1.7)",
                delay: index * 0.1
            });
        });
    }


    addEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize(), false);
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event), false);
        this.renderer.domElement.addEventListener('click', (event) => this.onClick(event), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

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

    onClick() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.images);

        if (intersects.length > 0) {
            const clickedImage = intersects[0].object;
            this.focusOnImage(clickedImage);
        } else {
            this.resetCamera();
        }
    }

    focusOnImage(image) {
        if (this.currentlyFocused === image) {
            return;
        }

        this.currentlyFocused = image;

        const imagePosition = image.position.clone();
        const direction = imagePosition.clone().sub(this.camera.position).normalize();
        const distance = image.scale.x * 1.25;
        const cameraPosition = imagePosition.clone().sub(direction.multiplyScalar(distance));

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

    resetCamera() {
        if (!this.currentlyFocused) return;

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

    hoverEffect(image) {
        if (image !== this.currentlyFocused) {
            gsap.to(image.scale, {
                x: image.scale.x * 1.1,
                y: image.scale.y * 1.1,
                duration: 0.3
            });
            gsap.to(image.material, { opacity: 1, duration: 0.3 });
        }
    }

    resetImageScale(image) {
        if (image !== this.currentlyFocused) {
            gsap.to(image.scale, {
                x: image.scale.x / 1.1,
                y: image.scale.y / 1.1,
                duration: 0.3
            });
            gsap.to(image.material, { opacity: 0.8, duration: 0.3 });
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}