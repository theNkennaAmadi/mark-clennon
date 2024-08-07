import barba from "@barba/core";
import gsap from "gsap";
import Lenis from "@studio-freight/lenis";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {Motion} from "./motion.js";
import {NotFound} from "./404.js";
import {Still} from "./still.js";
import {Nav} from "./global.js";
import {StillListing} from "./still-listing.js";
import {Info} from "./info.js";



gsap.config({
    nullTargetWarn: false,
});


let firstLoad = true;
barba.init({
    preventRunning: true,
    views: [
        {
            namespace: "home",
            afterEnter(data) {
                if (firstLoad && !sessionStorage.getItem("firstLoad")) {
                   // new Loader(data.next.container);
                    firstLoad = false;
                }else{
                    //new Home(data.next.container);
                }
                new Nav(data.next.container);
            }
        },
        {
            namespace: "motion",
            afterEnter(data) {
                new Motion(data.next.container);
                new Nav(data.next.container);
            },
        },
        {
            namespace: "stills",
            afterEnter(data) {
                new Nav(data.next.container);
                new Still(data.next.container);
            },
        },
        {
            namespace: "info",
            afterEnter(data) {
                new Nav(data.next.container);
                new Info(data.next.container);
            },
        },
        {
            namespace: "stills-listing",
            afterEnter(data) {
                //new Shop(data.next.container);
                new Nav(data.next.container);
                new StillListing(data.next.container);
                //new Footer(data.next.container);
            },
        },
        {
            namespace: "motion-listing",
            afterEnter(data) {
                //new Product(data.next.container);
                new Nav(data.next.container);
                //new Footer(data.next.container);
            },
        },
        {
            namespace: "diary",
            afterEnter(data) {
                new Nav(data.next.container);
                //new Footer(data.next.container);
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
            sync: true,
            beforeLeave() {
                lenis.start();
                gsap.getTweensOf("*").forEach((animation) => {
                    animation.revert();
                    animation.kill();
                });
                ScrollTrigger.clearScrollMemory();

                ScrollTrigger.getAll().forEach((t) => t.kill());
                ScrollTrigger.refresh();

            },
            enter(data) {
                const currentContainer = data.current.container;
                const nextContainer = data.next.container;
                let insetValue = '40%'
                let tlTransition = gsap.timeline({defaults: {ease: "expo.inOut", onComplete: () => {
                            ScrollTrigger.refresh();
                        }}});
                tlTransition.set(nextContainer, {clipPath: `inset(${insetValue})`, xPercent: 120})
                    .set([currentContainer.querySelector(".section-transition"),nextContainer.querySelector(".section-transition")], {scale: 1, duration: 0.3})
                    .to(currentContainer, {clipPath: `inset(${insetValue})`, duration: 1})
                    .to(currentContainer.querySelector('.section-transition-bg'), {clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: 0.75}, "<")
                    .to(currentContainer, {xPercent: -120, duration: 1})
                    .set(nextContainer.querySelector('.section-transition-bg'), {clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'}, "<")
                    .to(nextContainer, {xPercent: 0, duration: 1}, "<")
                    .to(nextContainer, {clipPath: `inset(0%)`, duration: 1})
                    .to(nextContainer.querySelector('.section-transition-bg'), {clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', ease: 'power2.inOut',  duration: 1.1}, "<")
                    .to([nextContainer.querySelector(".section-transition")], {opacity: 0, display:'hidden', duration: 1}, ">")
                    .set([nextContainer.querySelector(".section-transition")], {opacity: 1, scale: 0})
                    .set(nextContainer, {overflow: "auto", height: "auto", clearProps: "all"})
                return tlTransition;
            }
        }
    ]
});