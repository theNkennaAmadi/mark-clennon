import * as THREE from 'three'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import ScrollToPlugin from "gsap/ScrollToPlugin";


gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

export class StillListing {
    constructor(container) {
        this.container = container
        this.scene = null
        this.camera = null
        this.renderer = null
        this.imagePlanes = []
        this.items = [...container.querySelectorAll('.stills-item')];
        this.itemLinks = [...container.querySelectorAll('.stills-link')]
        this.imageUrls = this.items.map(item => item.querySelector('img').src);
        this.imageNames = this.items.map(item => item.querySelector('.s-name').textContent);
        this.totalItems = this.items.length

        this.spacing = 3
        this.radius = 15

        this.totalHeight = this.spacing * this.totalItems

        this.angle = Math.PI * 2.5 * (this.totalItems / 10)

        this.xAngle = (angle) => this.radius * Math.sin(angle)
        this.zAngle = (angle) => this.radius * Math.cos(angle)


        this.currentMiddleIndex = 0;
        this.loadedImages = 0

        this.isTouching = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.isScrolling = false;
        this.clickThreshold = 10; // pixels
        this.scrollThreshold = 50; // pixels
        this.clickTimeout = 300; // milliseconds

        this.init()
    }

    init() {
        this.setupThreeJS()
        this.loadImagesSequentially()
        this.setupAnimation()
        this.setupMouseInteraction();
        this.setupTouchInteraction();
        this.addEventListeners()
        this.updateImagePositions(0);
        this.updateHTMLPositions()
    }

    setupThreeJS() {
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(
            window.innerWidth < 768 ? 50 : 35,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        )
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0xffffff, 0)
        this.container.querySelector('.main').appendChild(this.renderer.domElement)
        this.camera.position.set(0, 0, 1)
    }

    updatePositions(currentMiddleIndex, totalItems) {
        const items = document.querySelectorAll('.still-name-item h1');
        const items2 = document.querySelectorAll('.still-name-item .still-year');
        const halfTotal = Math.floor(totalItems / 2);

        items.forEach((item, index) => {
            let relativePosition = index - currentMiddleIndex;
            if (relativePosition > halfTotal) relativePosition -= totalItems;
            if (relativePosition < -halfTotal) relativePosition += totalItems;

            const yPercentage = relativePosition * 100;
            item.style.transform = `translateY(${yPercentage}%)`;
            item.style.transition = 'transform 0.75s ease-out';
            item.style.opacity = index === currentMiddleIndex ? 1 : 0;
        });

        items2.forEach((item, index) => {
            let relativePosition = index - currentMiddleIndex;
            if (relativePosition > halfTotal) relativePosition -= totalItems;
            if (relativePosition < -halfTotal) relativePosition += totalItems;

            const yPercentage = relativePosition * 100;
            item.style.transform = `translateY(${yPercentage}%)`;
            item.style.transition = 'transform 0.75s ease-out';
            item.style.opacity = index === currentMiddleIndex ? 1 : 0;
        });
    }

    updateHTMLPositions() {
       setTimeout(()=>{
           requestAnimationFrame(() => {
               window.scrollBy({
                   top: 1,
                   left: 0,
                   behavior: "smooth",
               });
           });
       },400)

        //console.log(this.currentMiddleIndex)
        this.updatePositions(this.currentMiddleIndex, this.totalItems);
    }

    loadImagesSequentially() {
        const loadNextImage = (index) => {
            if (index >= this.imageUrls.length) {
                // All images loaded
                return;
            }

            const url = this.imageUrls[index];
            new THREE.TextureLoader().load(url, (texture) => {
                let width = texture.image.width
                let height = texture.image.height
                let aspect = width / height
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: true,
                })
                const scale = 8
                const geometry = new THREE.PlaneGeometry(scale * aspect, scale)
                const mesh = new THREE.Mesh(geometry, material)
                mesh.userData.name = this.imageNames[index]

                texture.colorSpace = THREE.SRGBColorSpace
                texture.minFilter = THREE.LinearFilter
                texture.magFilter = THREE.LinearFilter
                texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
                texture.format = THREE.RGBAFormat

                const angle = (index / this.imageUrls.length) * this.angle
                const yPosition = index * (this.spacing+15) - this.totalHeight / 2
                mesh.position.set(this.xAngle(angle), yPosition, this.zAngle(angle))


                this.scene.add(mesh)
                this.imagePlanes.push(mesh)

                if (index === 0) {
                    this.camera.position.set(
                        this.xAngle(angle),
                        yPosition + 12,
                        this.zAngle(angle) - 2
                    )
                }

                this.loadedImages++
                //console.log(`Loaded image ${this.loadedImages} of ${this.imageUrls.length}`)

                loadNextImage(index + 1)
            })
        }

        loadNextImage(0)
    }

    setupAnimation() {
        ScrollTrigger.create({
            trigger: this.container.querySelector('.main'),
            start: 'top top',
            end: `+=${this.totalItems * 40}%`,
            scrub: true,
            pin: true,
            onUpdate: (self) => {
                const progress = self.progress;
                this.updateImagePositions(progress);
            },
        });

        const animate = () => {
            requestAnimationFrame(animate)
            this.renderer.render(this.scene, this.camera)
        }

        animate()
        gsap.to('.still-name-list', {opacity: 1, duration: 1})
    }

    updateImagePositions(scrollProgress) {
        const scrollY = scrollProgress * this.totalHeight;

        let closestIndex = null;
        let closestDistance = Infinity;

        const middleScreenY = window.innerHeight / 2;

        this.imagePlanes.forEach((plane, index) => {
            const yPos =
                ((scrollY + index * this.spacing+15) % this.totalHeight) - this.totalHeight / 2;
            plane.position.y = yPos;

            const angle = (yPos / this.totalHeight + 0.5) * this.angle;
            plane.position.x = this.xAngle(angle);
            plane.position.z = this.zAngle(angle);

            const vector = plane.position.clone().project(this.camera);
            const screenY = (vector.y * window.innerHeight) / 2 + window.innerHeight / 2;

            const distance = Math.abs(screenY - middleScreenY);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });

        if (closestIndex !== this.currentMiddleIndex) {
            this.currentMiddleIndex = closestIndex;
            this.updateHTMLPositions();
        }
    }

    setupMouseInteraction() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.renderer.domElement.addEventListener('mousemove', (event) => this.onPointerMove(event), false);
        this.renderer.domElement.addEventListener('click', (event) => this.onPointerClick(event), false);
    }

    setupTouchInteraction() {
        this.renderer.domElement.addEventListener('touchstart', (event) => this.onTouchStart(event), { passive: true });
        this.renderer.domElement.addEventListener('touchmove', (event) => this.onTouchMove(event), { passive: true });
        this.renderer.domElement.addEventListener('touchend', (event) => this.onTouchEnd(event), { passive: true });
    }

    onPointerMove(event) {
        const x = event.clientX || (event.touches && event.touches[0].clientX);
        const y = event.clientY || (event.touches && event.touches[0].clientY);

        this.mouse.x = (x / window.innerWidth) * 2 - 1;
        this.mouse.y = - (y / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.imagePlanes);

        if (intersects.length > 0) {
            this.renderer.domElement.style.cursor = 'pointer';

            const hoveredObject = intersects[0].object;

            if (this.hoveredObject && this.hoveredObject !== hoveredObject) {
                gsap.to(this.hoveredObject.scale, { x: 1, y: 1, duration: 0.5 });
            }

            gsap.to(hoveredObject.scale, { x: 1.2, y: 1.2, duration: 0.5 });

            this.hoveredObject = hoveredObject;
        } else {
            this.renderer.domElement.style.cursor = 'default';

            if (this.hoveredObject) {
                gsap.to(this.hoveredObject.scale, { x: 1, y: 1, duration: 1 });
                this.hoveredObject = null;
            }
        }
    }

    onPointerClick(event) {
        if (this.isScrolling) return;

        const x = event.clientX || (event.changedTouches && event.changedTouches[0].clientX);
        const y = event.clientY || (event.changedTouches && event.changedTouches[0].clientY);

        this.mouse.x = (x / window.innerWidth) * 2 - 1;
        this.mouse.y = - (y / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.imagePlanes);

        if (intersects.length > 0) {
            const clickedImageIndex = this.imagePlanes.indexOf(intersects[0].object);
            this.lastClickedImageIndex = clickedImageIndex;
            this.itemLinks[clickedImageIndex].click();
        }
    }

    onTouchStart(event) {
        this.isTouching = true;
        this.isScrolling = false;
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
        this.touchStartTime = Date.now();
        this.onPointerMove(event);
    }

    onTouchMove(event) {
        if (!this.isTouching) return;

        const touchX = event.touches[0].clientX;
        const touchY = event.touches[0].clientY;
        const deltaX = Math.abs(touchX - this.touchStartX);
        const deltaY = Math.abs(touchY - this.touchStartY);

        if (!this.isScrolling && (deltaX > this.scrollThreshold || deltaY > this.scrollThreshold)) {
            this.isScrolling = true;
        }

        this.onPointerMove(event);
    }

    onTouchEnd(event) {
        if (!this.isTouching) return;

        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - this.touchStartTime;

        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;
        const deltaX = Math.abs(touchEndX - this.touchStartX);
        const deltaY = Math.abs(touchEndY - this.touchStartY);

        if (!this.isScrolling && deltaX < this.clickThreshold && deltaY < this.clickThreshold && touchDuration < this.clickTimeout) {
            this.onPointerClick(event);
        }

        this.isTouching = false;
        this.isScrolling = false;
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    getClickedImageIndex() {
        // Implement logic to return the index of the clicked image
        // This could be stored when the user clicks on an image
        return this.lastClickedImageIndex;
    }

    async prepareForTransition(clickedImageIndex) {
        // Disable further interactions
        this.renderer.domElement.style.pointerEvents = 'none';

        // Fade out other meshes
        const fadeOutPromises = this.imagePlanes.map((mesh, i) => {
            if (i !== clickedImageIndex) {
                return new Promise(resolve => {
                    gsap.to(mesh.material, {
                        opacity: 0,
                        duration: 0.5,
                        onComplete: resolve
                    });
                });
            }
            return Promise.resolve();
        });

        gsap.to('.still-name-wrapper', {opacity: 0, duration: 0.2})

        await Promise.all(fadeOutPromises);

        // Move the Three.js canvas to be a direct child of the body
        document.body.appendChild(this.renderer.domElement);
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.zIndex = '9999';
    }

    async transitionToStillsPage(clickedImageIndex, targetRect) {
        const clickedMesh = this.imagePlanes[clickedImageIndex];

        // Calculate the scale to match the target dimensions
        const viewportHeight = window.innerHeight;
        const fov = this.camera.fov * (Math.PI / 180);
        const targetHeight = 2 * Math.tan(fov / 2) * this.camera.position.z;
        const targetWidth = targetHeight * this.camera.aspect;

        const scaleX = (targetRect.width / window.innerWidth) * targetWidth / clickedMesh.geometry.parameters.width;
        const scaleY = (targetRect.height / window.innerHeight) * targetHeight / clickedMesh.geometry.parameters.height;

        // Calculate the target position in world coordinates
        const targetX = ((targetRect.left + targetRect.width / 2) / window.innerWidth) * targetWidth - targetWidth / 2;
        const targetY = -((targetRect.top + targetRect.height / 2) / window.innerHeight) * targetHeight + targetHeight / 2;

        //console.log(clickedMesh)
        // Animate the clicked mesh
        return new Promise(resolve => {
            gsap.to(clickedMesh.position, {
                x: targetX,
                y: targetY,
                z: 0,
                duration: 1,
                ease: 'expo.out',
                onComplete: ()=>{
                    clickedMesh.visible = false
                }
            });

            gsap.to(clickedMesh.scale, {
                x: scaleX,
                y: scaleY,
                duration: 1,
                ease: 'expo.out',
                onComplete: resolve
            });

            // Optionally, animate the camera if needed
            gsap.to(this.camera.position, {
                x: 0,
                y: 0,
                z: this.camera.position.z, // Keep the same z distance
                duration: 1,
                ease: 'expo.out'
            });
        });
    }

    cleanupAfterTransition() {
        // Remove the Three.js canvas from the DOM
        this.renderer.domElement.remove();

        // Dispose of Three.js resources
        this.scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        this.renderer.dispose();
    }
}