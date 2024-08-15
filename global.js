import gsap from 'gsap'

let mmNav = gsap.matchMedia()


export class Nav{
    constructor(container){
        this.container = container
        this.navBlocks = this.container.querySelectorAll('.nav-block-wrapper')
        this.stillMain = this.container.querySelector('.stills-main-wrapper')
        this.stillDropdownItems = this.container.querySelectorAll('.still-dropdown-item-text')
        this.mobIcon = this.container.querySelector('.mob-icon')
        this.navLinksWrapper = this.container.querySelector('.nav-links-wrapper')
        this.navLinks = this.container.querySelectorAll('.nav-link')
        this.nav = this.container.querySelector('nav')
        this.init()
    }
    init(){
        this.hoverAnimation()
        this.mobileReveal()
        this.disableRightClick()
    }

    hoverAnimation(){
        this.navBlocks.forEach(block=>{
            const nonActiveBlocks = [...this.navBlocks].filter(b=> b !== block)

            block.addEventListener('mouseenter', ()=>{
                gsap.to(block.querySelector('.nav-block'), {clipPath: 'inset(0% 0% 0% 0%)', ease: "expo.out"})
                gsap.to(block, {opacity: 1, duration: 0.3}, "<")
                gsap.to(nonActiveBlocks, {opacity: 0.5, duration: 0.3}, "<")
            })
            block.addEventListener('mouseleave', ()=>{
                gsap.to(block.querySelector('.nav-block'), {clipPath: 'inset(50% 50% 50% 50%)', ease: "expo.out"})
                gsap.to(block, {opacity: 1, duration: 0.3}, "<")
                gsap.to(nonActiveBlocks, {opacity: 1, duration: 0.3}, "<")
            })
        })


        const tlStillMain = gsap.timeline({paused: true})
        tlStillMain.to('.icon-v', {scaleY: 0})
            .to('.stills-list-dropdown-wrapper', {clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5}, "<")
            .fromTo(this.stillDropdownItems, {yPercent: 110}, {yPercent: 0, duration: 0.5, stagger: 0.1}, "<")

        this.stillMain.addEventListener('mouseenter', ()=>{
            tlStillMain.play()
        })
        this.stillMain.addEventListener('mouseleave', ()=>{
            tlStillMain.reverse()
        })

    }

    mobileReveal(){
        mmNav.add("(max-width: 767px)", () => {

            this.navOpen = false;
            const tlMob = gsap.timeline({paused: true})
            tlMob.to(this.navLinksWrapper, {clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5})
                .to(this.mobIcon, {rotate: 180, duration: 0.5}, "<")
                .to(this.nav, {color: '#000', duration: 0.5}, "<")
                .fromTo([this.stillDropdownItems, this.navLinks], {yPercent: 110}, {yPercent: 0, duration: 0.5, stagger: 0.1}, "<")

            this.mobIcon.addEventListener('click', ()=>{
                this.navOpen ? tlMob.reverse() : tlMob.play()
                this.navOpen = !this.navOpen
            })
        });
    }

    disableRightClick(){
        const images = document.querySelectorAll('img');

        images.forEach(image => {
            image.addEventListener('contextmenu', function (event) {
                event.preventDefault();

                // Create the grey box
                const greyBox = document.createElement('div');
                greyBox.textContent = `This photo is Copyright © ${new Date().getFullYear()} Mark Clennon Creative, LLC. All rights reserved.`;
                greyBox.style.position = 'fixed';
                greyBox.style.top = `${event.clientY}px`;
                greyBox.style.left = `${event.clientX}px`;
                greyBox.style.backgroundColor = 'rgba(128, 128, 128, 0.9)';
                greyBox.style.color = '#fff';
                greyBox.style.padding = '10px';
                greyBox.style.borderRadius = '5px';
                greyBox.style.zIndex = '1000';
                greyBox.style.pointerEvents = 'none';
                greyBox.style.fontFamily = 'Arial, sans-serif';
                greyBox.style.fontSize = '0.75rem';
                greyBox.style.maxWidth = '28ch'

                document.body.appendChild(greyBox);

                // Remove the grey box after 3 seconds
                setTimeout(() => {
                    greyBox.remove();
                }, 2000);
            });
        });
    }
}



/**
 * Linear interpolation
 * @param {Number} a - first value to interpolate
 * @param {Number} b - second value to interpolate
 * @param {Number} n - amount to interpolate
 */
const lerp = (a, b, n) => (1 - n) * a + n * b;

/**
 * Gets the cursor position
 * @param {Event} ev - mousemove event
 */
const getCursorPos = ev => {
    return {
        x : ev.clientX,
        y : ev.clientY
    };
};

/**
 * Map number x from range [a, b] to [c, d]
 */
const map = (x, a, b, c, d) => (x - a) * (d - c) / (b - a) + c;

/**
 * Calculates the viewport size
 */
const calcWinsize = () => {
    return {
        width: window.innerWidth,
        height: window.innerHeight
    }
}

// Exporting utility functions for use in other modules.
export {
    lerp,
    getCursorPos,
    map,
    calcWinsize
};
