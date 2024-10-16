import barba from "@barba/core";
import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import {Motion} from "./motion.js";
import {NotFound} from "./404.js";
import {Still} from "./still.js";
import {Nav} from "./global.js";
import {StillListing} from "./still-listing.js";
import {Info} from "./info.js";
import {Diary} from "./diary.js";
import {Home} from "./home.js";
import {MotionListing} from "./motion-listing.js";

gsap.config({
    nullTargetWarn: false,
});

let lenis;

export function setupLenis() {
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        syncTouch: false,
        infinite: false,
    });

    const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    return lenis;
}

export function setupLenisInfinite() {
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        syncTouch: false,
        infinite: true,
    });

    const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    return lenis;
}

function resetWebflow(data) {
    const parser = new DOMParser();
    const dom = parser.parseFromString(data.next.html, "text/html");
    const webflowPageId = dom.querySelector("html").getAttribute("data-wf-page");
    const siteId = dom.querySelector("html").getAttribute("data-wf-site");

    document.querySelector("html").setAttribute("data-wf-page", webflowPageId);
    if (window.Webflow) {
        window.Webflow.destroy();
        window.Webflow.ready();
        window.Webflow.require('commerce').init({ siteId: siteId });
        window.Webflow.require('ix2').init();
    }
}

barba.hooks.beforeLeave((data) => {
    // Kill ScrollTrigger instances
    ScrollTrigger.killAll()

    // Kill GSAP tweens
    gsap.getTweensOf(data.current.container.querySelectorAll('*')).forEach((tween) => {
        tween.revert();
        tween.kill();
    });

    ScrollTrigger.clearScrollMemory();
});

barba.hooks.enter((data) => {
    gsap.set([data.next.container, data.current.container], { position: "fixed", top: 0, left: 0, width: "100%", height:'100vh' });
});
barba.hooks.after((data) => {
    gsap.set(data.next.container, { position: "relative", height: "auto", clearProps: "all" });
    resetWebflow(data);
    ScrollTrigger.refresh();
});


let firstLoad = true;
let stillListingInstance;
barba.init({
    preventRunning: true,
    views: [
        {
            namespace: "home",
            afterEnter(data) {
                new Home(data.next.container)
                if (firstLoad && !sessionStorage.getItem("firstLoad")) {
                   // new Loader(data.next.container);
                    firstLoad = false;
                }else{
                    //new Home(data.next.container);
                }
                new Nav(data.next.container);
                setupLenis();
            }
        },
        {
            namespace: "motion",
            afterEnter(data) {
                new Motion(data.next.container);
                new Nav(data.next.container);
                setupLenis();
            },
        },
        {
            namespace: "stills",
            afterEnter(data) {
                new Nav(data.next.container);
                new Still(data.next.container);
                setupLenis();
            },
        },
        {
            namespace: "info",
            afterEnter(data) {
                new Nav(data.next.container);
                new Info(data.next.container);
                setupLenis();
            },
        },
        {
            namespace: "stills-listing",
            afterEnter(data) {
                new Nav(data.next.container);
                stillListingInstance = new StillListing(data.next.container);

                // Set up Lenis based on the current view
                if (stillListingInstance.view === 'gallery') {
                    lenis = setupLenisInfinite();
                } else {
                    lenis = setupLenis();
                }

                // Set up the animation loop for Lenis
                const raf = (time) => {
                    lenis.raf(time);
                    requestAnimationFrame(raf);
                };
                requestAnimationFrame(raf);

                // Add an event listener to switch Lenis setup when the view changes
                stillListingInstance.container.addEventListener('viewChange', (event) => {
                    if (lenis) {
                        lenis.destroy();
                    }

                    if (event.detail.view === 'gallery') {
                        lenis = setupLenisInfinite();
                    } else {
                        lenis = setupLenis();
                    }

                    // Set up the new animation loop
                    const newRaf = (time) => {
                        lenis.raf(time);
                        requestAnimationFrame(newRaf);
                    };
                    requestAnimationFrame(newRaf);
                });
            },
            beforeLeave() {
                // Destroy the Lenis instance when leaving the page
                if (lenis) {
                    lenis.destroy();
                    lenis = null;
                }
            },
        },
        {
            namespace: "motion-listing",
            afterEnter(data) {
                new Nav(data.next.container);
                new MotionListing(data.next.container);
                setupLenisInfinite();
            },
        },
        {
            namespace: "diary",
            afterEnter(data) {
                new Nav(data.next.container);
                new Diary(data.next.container);
                setupLenis();
            },
        },
        {
            namespace: "404",
            afterEnter(data) {
                new NotFound(data.next.container);
            },
        }
    ],
    transitions: [
        {
            name: 'still-listing-to-still',
            from: {
                namespace: ['stills-listing']
            },
            to: {
                namespace: ['stills']
            },
            async leave(data) {
                // Get the current view from the StillListing instance
                const currentView = stillListingInstance.view;

                if (currentView === 'gallery') {
                    // Store the clicked image index in the Barba data object
                    const clickedImageIndex = stillListingInstance.getClickedImageIndex();
                    data.clickedImageIndex = clickedImageIndex;

                    // Prepare the StillListing scene for transition
                    await stillListingInstance.prepareForTransition(clickedImageIndex);
                }
            },
            async enter(data) {
                const currentView = stillListingInstance.view;

                if (currentView === 'gallery') {
                    // Get the still-intro-image from the new page
                    const stillIntroImage = data.next.container.querySelector('.still-intro-image');
                    gsap.set(data.next.container, {opacity: 0});

                    if (!stillIntroImage) {
                        console.error('still-intro-image not found in the new page');
                        return;
                    }

                    // Get the bounding rectangle of the still-intro-image
                    const targetRect = stillIntroImage.getBoundingClientRect();

                    // Animate the clicked mesh to match the still-intro-image
                    await stillListingInstance.transitionToStillsPage(data.clickedImageIndex, targetRect);

                    // Fade in the new page content
                    gsap.to(data.next.container, {
                        opacity: 1,
                        duration: 1,
                        onComplete: () => {
                            // Clean up the old page
                            data.current.container.remove();
                            stillListingInstance.cleanupAfterTransition();
                        }
                    });
                } else {
                    // For list view, use default Barba transition
                    const nextContainer = data.next.container;
                    let tlTransition = gsap.timeline({defaults: {ease: "expo.out", onComplete: () => {ScrollTrigger.refresh();}}});
                    tlTransition.from(nextContainer, {clipPath: `inset(100% 0 0 0)`, duration: 1}, "<")
                    return tlTransition;
                }
            }
        },
        {
            sync: true,
            enter(data) {
                const nextContainer = data.next.container;
                let tlTransition = gsap.timeline({defaults: {ease: "expo.out", onComplete: () => {ScrollTrigger.refresh();}}});
                tlTransition.from(nextContainer, {clipPath: `inset(100% 0 0 0)`, duration: 1}, "<")
                return tlTransition;
            }
        }
    ]
});