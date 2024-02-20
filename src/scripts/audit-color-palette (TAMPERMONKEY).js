// ==UserScript==
// @name         Beeline Design System - Color Palette Audit
// @namespace    https://beeline.com
// @version      2024-02-14
// @description  try to take over the world!
// @author       Dylan Maxey
// @match        *://*/*
// @grant        none
// ==/UserScript==

let palettes;
let myColorService;
let toggled = false;

(async () => {
    'use strict';

    const start = performance.now();
    myColorService = colorService();
    palettes = {
        primary: ['#01256A', '#02308B', '#023EB3', '#0357FC', '#3579FD', '#568EFD', '#8BB2FE', '#B1CBFE', '#CCDDFF', '#E6EEFF', '#F5F9FF'],
        secondary: ['#000B29', '#000E35', '#001245', '#001858', '#001A61', '#334881', '#546695', '#8A96B6', '#B0B8CE', '#E6E8EF', '#F0F2F7'],
        tertiary: ['#244000', '#335300', '#3E6500', '#4C8300', '#5B9C00', '#86BF2A', '#A2D64F', '#BADE81', '#D3E9B0', '#EAF4D9', '#EFF6E6'],
        'neutral-gray': ['#191C1D', '#2E3132', '#444748', '#5C5F5F', '#747678', '#8E9192', '#A9ACAC', '#C4C7C7', '#E1E3E3', '#EFF1F1', '#FAFAFA'],
        'neutral-variant': ['#232C35', '#2E3A45', '#3B4B59', '#4C6073', '#53697E', '#758798', '#8C9BA9', '#B0BAC4', '#CAD1D7', '#EEF0F2', '#F7F9FA'],
        error: ['#640A0A', '#820C0C', '#A80F0F', '#D81313', '#ED1515', '#F14444', '#F36262', '#F79393', '#F9B6B6', '#FDE8E8', '#FEF6F6'],
        warning: ['#FEF6F6', '#8C6A02', '#B58803', '#E8AF04', '#FFC004', '#FFCD36', '#FFD557', '#FFE28C', '#FFEBB1', '#FFF9E6', '#FFFCF5'],
        success: ['#2A542F', '#3B7542', '#55A85E', '#72E37F', '#7DF98C', '#97FAA3', '#A8FBB2', '#B4FABD', '#C3FCCA', '#DCFDE0', '#F2FEF4'],
        info: ['#004964', '#005F83', '#007BA9', '#009DD9', '#00ADEE', '#33BDF1', '#54C8F4', '#8AD9F7', '#B0E6FA', '#E6F7ED', '#F2FCFF'],
        accent: ['#33326B', '#43418C', '#5754B5', '#6F6CE8', '#7A77FF', '#9592FF', '#A6A4FF', '#C2C0FF', '#D6D5FF', '#F2F1FF', '#F4F3FF'],
        other: ['#FFFFFF']
    }

    const colors = await auditColors();
    console.log('BDS color audit failures:', colors);
    console.log('Audit took', performance.now() - start, 'ms')

    document.addEventListener('keyup', (ev) => {
        toggled = !toggled;
        const { ctrlKey, shiftKey, key } = ev;
        if (ctrlKey && shiftKey && (key === 'C' || key === 'S')) {
            swapColors(colors, toggled);
            setTimeout(() => {
                alert(toggled ? 'Closest design system colors applied' : 'Colors reverted');
            }, 250);
        }
    });

    // document.addEventListener('transitionend', (ev) => {
    //     console.log('transitionend');
    //     watchProps(ev);
    // });
    // document.addEventListener('animationend', watchProps);

})();

function swapColors(colors, toggled) {
    let swapCount = 0;
    let missedCount = 0;
    for (const colorData of colors) {
        for (const [prop, states] of Object.entries(colorData.props)) {
            if (states.suggested) {
                swapCount++;
                colorData.el.style[prop] = toggled ? states.suggested.color : states.existing.color;
            }
            else {
                missedCount++;
                console.log('missed1', colorData.el, prop, states)
            }
        }
    }
    console.log('Swapped', swapCount, 'properties');
    console.log('Missed2', missedCount, 'properties');
}

async function auditColors() {
    const allEls = [ ...document.querySelectorAll("*") ];
    let filtered = []; // This ensures `filtered` is always an array

    for (const el of allEls) {
        const colors = { props: {} };
        const styles = getComputedStyle(el);

        if (!isHidden(el)) {
            //console.log('bg?', rgbStringHasAlpha(styles.backgroundColor), styles.backgroundColor, el)
            if (rgbStringHasAlpha(styles.backgroundColor)) {
                await auditProp(colors, styles, el, 'backgroundColor');
            }

            //console.log('border?', (styles.borderWidth !== '0px' && rgbStringHasAlpha(styles.borderColor)), styles.borderWidth, rgbStringHasAlpha(styles.borderColor), el);
            if (styles.borderWidth !== '0px' && rgbStringHasAlpha(styles.borderColor)) {
                await auditProp(colors, styles, el, 'borderColor');
            }

            //console.log('text?', elHasText(el), rgbStringHasAlpha(styles.color), el)
            if (elHasText(el) && rgbStringHasAlpha(styles.color)) {
                //console.log('textmatch', colorInPalette(hex), hex)
                await auditProp(colors, styles, el, 'color');
            }

            if (Object.keys(colors.props).length) {
                //console.log('push', colors)
                colors.el = el;
                filtered.push(colors);
            }
        }

        // if (!el._watched) {
        //     el.addEventListener('mouseenter', ev => {
        //         setTimeout(watchProps.bind(this, ev), 25)
        //     });
        //     el._watched = true;
        // }
    }

    return filtered; // Return the filtered array
}

async function auditProp(colors, styles, el, propName) {
    const hex = rgbToHex(styles[propName]);

    console.log('auditprop', hex, propName, styles[propName], el)

    if (!colorInPalette(hex)) {
        const rgba = parseRgbString(styles[propName]);
        colors.props[propName] = { 
            existing: { color: styles[propName], hex }, 
            suggested: await getClosestPaletteColor(hex, rgba.a, el, propName) 
        }
    }
}

function watchProps({ target }) {
    let updated = false;
    let elementInfoObject = target._wcc?._info;
    const previousInfo = JSON.parse(JSON.stringify(elementInfoObject || {}));
    
    const directStyles = { 
        color: target.style.color, 
        backgroundColor: target.style.backgroundColor, 
        borderColor: target.style.borderColor 
    };
    const directStyleKeys = Object.keys(directStyles);

    for (const prop of directStyleKeys) {
        if (directStyles[prop]) {
            target.style[prop] = '';
        }
    }

    setTimeout(() => {
        const computedStyles = getComputedStyle(target);
        const bgColor = myColorService.RGBStringToObject(computedStyles.backgroundColor);
        const opacity = parseFloat(computedStyles.opacity);

        if (!elementInfoObject) {
            elementInfoObject = { bgColor, opacity };
            target._wcc = { '_info': elementInfoObject };
            //console.log('updated0')
            //updated = true;
        } else {
            if (!objectsAreIdentical(bgColor, elementInfoObject.bgColor)) {
                console.log('updated bg', bgColor, elementInfoObject.bgColor, target)
                elementInfoObject.bgColor = bgColor;
                updated = true;
            }
            if (opacity !== elementInfoObject.opacity) {
                console.log('updated opacity', opacity, elementInfoObject.opacity, target)
                elementInfoObject.opacity = opacity;
                updated = true;
            }
        }

        if (updated) {
            console.log('Final color value after transition/animation:', { toggled, previousInfo, elementInfoObject, target });
        }

        for (const prop of directStyleKeys) {
            if (directStyles[prop]) {
                target.style[prop] = directStyles[prop];
            }
        }
    }, 25);
}

function stringifySorted(obj) {
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj = {};
    for (const key of sortedKeys) {
        sortedObj[key] = obj[key];
    }
    return JSON.stringify(sortedObj);
}

function objectsAreIdentical(obj1, obj2) {
    return stringifySorted(obj1) === stringifySorted(obj2);
}

function applyAlphaToColor(hex, alpha) {
    hex = hex.replace('#', '');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const rgba = `rgba(${r}, ${g}, ${b}, ${alpha})`;

    return rgba;
}

function elHasText(el) {
    const directText = [...el.childNodes].reduce((filtered, node) => {
        if (node.nodeType !== Node.COMMENT_NODE) {
            const trimmed = node.nodeValue?.trim();
            if (trimmed) {
                filtered.push(trimmed);
            }
        }
        return filtered;
    }, []).join();

    return !!directText
}

function rgbStringHasAlpha(colorString) {
    const rgba = parseRgbString(colorString);
    return rgba.a !== 0
}

function parseRgbString(colorString) {
    const isRgba = colorString.startsWith('rgba');
    const inner = colorString.substring(isRgba ? 5 : 4, colorString.length - 1);
    const parts = inner.split(',');

    const r = parseInt(parts[0].trim(), 10);
    const g = parseInt(parts[1].trim(), 10);
    const b = parseInt(parts[2].trim(), 10);
    const a = isRgba ? parseFloat(parts[3].trim()) : 1; // Default alpha to 1 for RGB colors
    return { r, g, b, a };
}

function decToHex(positionInDecimalBase) {
    if (positionInDecimalBase == null) {
        return '00';
    }

    let positionAsNumber = parseInt(positionInDecimalBase);

    if (isNaN(positionAsNumber)) {
        return '00';
    } else if (positionAsNumber <= 0) {
        return '00';
    } else if (positionAsNumber > 255) {
        return 'FF';
    }

    positionAsNumber = Math.round(positionAsNumber);

    const baseString = '0123456789ABCDEF';
    return baseString.charAt((positionAsNumber - positionAsNumber % 16) / 16) + baseString.charAt(positionAsNumber % 16);
}

function rgbToHex(rgbString) {
    const RGBColor = parseRgbString(rgbString);
    return '#' + decToHex(RGBColor.r) + decToHex(RGBColor.g) + decToHex(RGBColor.b);
}

function isHidden(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        return true;
    }

    return rect.width === 0 || rect.height === 0 || (el.offsetParent === null && getComputedStyle(el).position !== 'fixed')
}

function colorInPalette(color) {
    color = color.toUpperCase();
    for (const type in palettes) {
        if (palettes[type].includes(color)) {
            return true;
        }
    }

    return false;
}

async function getClosestPaletteColor(color, alpha, el, prop) {
    const isForeground = prop === 'color';
    const isBackground = prop === 'backgroundColor';
    const paletteData = [];

    let borderMatchesBG = prop === 'borderColor' && color === rgbToHex(myColorService.getElementComputedStyle(el, 'background-color'));
    let isBgDarker;

    for (const type in palettes) {
        for (const pColor of palettes[type]) {
            const delta = getColorDiff(color, pColor);

            if (delta < 25)
                paletteData.push({ type, pColor, delta });
        }
    }

    paletteData.sort((a, b) => a.delta - b.delta);

    if (!isForeground) {
        const directText = myColorService.getDirectText(el);
        let paletteItem = paletteData[0];

        if (isBackground || borderMatchesBG) {
            if (directText.color) {
                console.log({directText, prop, el})
                const directTextHex = myColorService.rgbToHex(directText.color);
                const sizeCheck = directText.size + 'AA';
                
                paletteItem = paletteData.find(item => {
                    const evaluation = myColorService.singleEvaluation(directTextHex, item.pColor);
                    return evaluation[sizeCheck];
                });
                //console.log('filteredData', directText.color, {paletteItem, paletteData})
            }
            else {
                paletteItem = paletteData[0];
            }
            
            // if (isBgDarker === true) {
            //     const filteredData = paletteData.filter(item => singleEvaluation(directText.color, item.pColor).isValidAA);
            //     paletteItem = filteredData[filteredData.length - 1];
            // } else if (isBgDarker === false) {
            //     paletteItem = paletteData[0];
            // }
        }

        if (paletteItem) {
            const { type, pColor, delta } = paletteItem;
            const adjustedColor = (alpha && alpha !== '0') ? applyAlphaToColor(pColor, alpha) : pColor;

            if (prop === 'backgroundColor') {
                el._wcc._info.bgColor = { ...myColorService.hexToRGB(pColor), o: 1};
                //console.log('setbg', myColorService.hexToRGB(pColor), el)
            }

            return { delta, hex: pColor, color: adjustedColor, palette: type }
        }

        console.warn('no paletteItem', prop, color, directText, el)
        return { delta: 0, hex: color, color, palette: 'none' }
    }
    else {
        const ancestorsStack = myColorService.getAncestorsStackInfo(el);
        const bgColor = myColorService.rgbToHex(myColorService.getColorFromStack(ancestorsStack));

        const { size } = myColorService.getFontInfo(el);
        const sizeCheck = size + 'AA';

        for (const { type, pColor, delta } of paletteData) {
            const contrastEvaluation = myColorService.singleEvaluation(pColor, bgColor);
            // if (el === document.querySelector("#hs_cos_wrapper_Menu > div > div:nth-child(1) > div > a:nth-child(1) > span")) {
            //     console.log('contrastEvaluation', {prop, color, pColor, bgColor, evalpass: contrastEvaluation[sizeCheck], contrastEvaluation})
            // }
            if (contrastEvaluation[sizeCheck]) {
                const adjustedColor = (alpha && alpha !== '0') ? applyAlphaToColor(pColor, alpha) : pColor;
                const closest = { delta: delta, hex: pColor, color: adjustedColor, palette: type }
                //console.log('closest 2 yes', closest)
                return closest;
            }
            //el.style[prop] = currentColor;
        }

        //console.log('closest 2 no', color, prop, el)
    }
}

function getColorDiff(hex1, hex2) {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);

    return deltaE([rgb1.r, rgb1.g, rgb1.b], [rgb2.r, rgb2.g, rgb2.b])
}

function deltaE(rgbA, rgbB) {
    let labA = rgb2lab(rgbA);
    let labB = rgb2lab(rgbB);
    let deltaL = labA[0] - labB[0];
    let deltaA = labA[1] - labB[1];
    let deltaB = labA[2] - labB[2];
    let c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
    let c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
    let deltaC = c1 - c2;
    let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
    deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
    let sc = 1.0 + 0.045 * c1;
    let sh = 1.0 + 0.015 * c1;
    let deltaLKlsl = deltaL / (1.0);
    let deltaCkcsc = deltaC / (sc);
    let deltaHkhsh = deltaH / (sh);
    let i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
    return i < 0 ? 0 : Math.sqrt(i);
}

function rgb2lab(rgb) {
    let r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255, x, y, z;
    r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
    x = (x > 0.008856) ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
    y = (y > 0.008856) ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
    z = (z > 0.008856) ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;
    return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}

function hexToRgb(hex, alpha) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: alpha
    } : null;
}

























function colorService() {
    const largeFontSize = 24;
    const normalFontSize = 18.6667;
    const highThreshold = 7;
    const midThreshold = 4.5;
    const lowThreshold = 3;
    const defaultView = document.defaultView;

    return {
        singleEvaluation,
        getBodyBackgroundColor,
        evaluateColorContrastFromElement,
        isValidHex,
        hexShorthandToExtended,
        rgbToHex,
        getLuminosity, getDirectText,
        getAncestorsStackInfo, getColorFromStack,
        getFontInfo, hexToRGB, RGBStringToObject,
        getElementComputedStyle
    };

    function singleEvaluation(foregroundColor, backgroundColor) {
        if (!isValidHex(foregroundColor) || !isValidHex(backgroundColor)) {
            return false;
        }

        const contrast = getContrastRatio(hexToRGB(foregroundColor), hexToRGB(backgroundColor));
        const validation = {contrast, smallAA: true, smallAAA: true, largeAA: true, largeAAA: true};

        if (contrast < highThreshold && contrast >= midThreshold) {
            validation.smallAAA = false;
        } else if (contrast < midThreshold && contrast >= lowThreshold) {
            validation.smallAA = false;
            validation.smallAAA = false;
            validation.largeAAA = false;
        } else if (contrast < lowThreshold) {
            validation.smallAA = false;
            validation.smallAAA = false;
            validation.largeAA = false;
            validation.largeAAA = false;
        }

        return validation;
    }

    function getContrastRatio(foreground, background) {
        const foregroundLuminosity = getLuminosity(foreground);
        const backgroundLuminosity = getLuminosity(background);
        let higherValue;
        let lowerValue;

        if (foregroundLuminosity > backgroundLuminosity) {
            higherValue = foregroundLuminosity;
            lowerValue = backgroundLuminosity;
        } else {
            higherValue = backgroundLuminosity;
            lowerValue = foregroundLuminosity;
        }
        let contrastDiff = (higherValue + 0.05) / (lowerValue + 0.05);
        
        return Math.round(contrastDiff * 100) / 100; // round to two decimals
    }

    function getLuminosity(RGBAColor) {
        const {r, g, b} = RGBAColor;
        const fLinearisedRed = linearisedColorComponent(r / 255);
        const fLinearisedGreen = linearisedColorComponent(g / 255);
        const fLinearisedBlue = linearisedColorComponent(b / 255);

        return (0.2126 * fLinearisedRed + 0.7152 * fLinearisedGreen + 0.0722 * fLinearisedBlue);
    }

    function linearisedColorComponent(colorSegment) {
        let linearised;
        if (colorSegment <= 0.03928) {
            linearised = colorSegment / 12.92;
        } else {
            linearised = Math.pow(((colorSegment + 0.055) / 1.055), 2.4);
        }

        return linearised;
    }

    function evaluateColorContrastFromElement(element, colorMatrix) {
        const getComputedStyle = defaultView.getComputedStyle(element, null);
        const ancestorsStack = getAncestorsStackInfo(element);
        let backgroundColor = getColorFromStack(ancestorsStack);
        //const hasOpacity = getOpacityFromStack(ancestorsStack) > 0;
        //const isVisible = hasOpacity && isElementVisible(element);
        const isVisible = true;
        const fontSize = parseInt(getComputedStyle.getPropertyValue('font-size').replace('px', ''));
        const fontWeight = getComputedStyle.getPropertyValue('font-weight');
        const isBold = parseInt(fontWeight) >= 700 || fontWeight === 'bold' || fontWeight === 'bolder';
        const size = (fontSize >= largeFontSize || (fontSize >= normalFontSize && isBold)) ? 'large' : 'small';

        let foregroundColor = getForegroundColor(element, ancestorsStack);
        //console.log('foreground?', foregroundColor, getComputedStyle.getPropertyValue('color'), element)

        if (colorMatrix) {
            foregroundColor = applyMatrixToColor(foregroundColor, colorMatrix);
            backgroundColor = applyMatrixToColor(backgroundColor, colorMatrix);
        }

        const contrast = getContrastRatio(foregroundColor, backgroundColor);

        const evaluation = {
            element,
            fontSize,
            fontWeight,
            size,
            foregroundColor,
            backgroundColor,
            contrast,
            isVisible
        };

        if (size === 'small') {
            evaluation.isValidAA = contrast >= midThreshold;
            evaluation.isValidAAA = contrast >= highThreshold;
        } else {
            evaluation.isValidAA = contrast >= lowThreshold;
            evaluation.isValidAAA = contrast >= midThreshold;
        }

        return evaluation;
    }

    function getForegroundColor(element, stack) {
        const bgColor = RGBStringToObject(getElementComputedStyle(element, 'color'));
        const opacity = parseFloat(getElementComputedStyle(element, 'opacity'));
        const fullStack = [{bgColor, opacity}].concat(stack)
        //console.log('foreground', {fullStack})
        return getColorFromStack(fullStack)
    }

    function applyMatrixToColor(color, matrix) {
        const {r, g, b, o} = color;
        const rUpdated = r * matrix[0] + g * matrix[1] + b * matrix[2] + o * matrix[3] + matrix[4];
        const gUpdated = r * matrix[5] + g * matrix[6] + b * matrix[7] + o * matrix[8] + matrix[9];
        const bUpdated = r * matrix[10] + g * matrix[11] + b * matrix[12] + o * matrix[13] + matrix[14];
        const oUpdated = r * matrix[15] + g * matrix[16] + b * matrix[17] + o * matrix[18] + matrix[19];

        return {r: rUpdated, g: gUpdated, b: bUpdated, o: oUpdated};
    }

    function getElementComputedStyle(element, propertyName) {
        const getComputedStyle = defaultView.getComputedStyle(element, null);
        return getComputedStyle.getPropertyValue(propertyName);
    }

    function getBodyBackgroundColor() {
        const body = document.body;
        const bodyBackgroundColor = getElementComputedStyle(body, 'background-color');
        let RGBBodyBackgroundColorObject = RGBStringToObject(bodyBackgroundColor);
        if (!RGBBodyBackgroundColorObject.o) {
            return {r: 255, g: 255, b: 255, o: 1};
        }
        return RGBBodyBackgroundColorObject;
    }

    function getAncestorsStackInfo(element) {
        const ancestors = [];

        for (; element && element.tagName.toLowerCase() !== 'body'; element = element.parentNode) {
            let elementInfoObject = element._wcc?._info;
            if (!elementInfoObject) {
                
                const bgColor = RGBStringToObject(getElementComputedStyle(element, 'background-color'));
                const opacity = parseFloat(getElementComputedStyle(element, 'opacity'));

                // if (element === document.querySelector("#hs_cos_wrapper_Menu > div > div:nth-child(1) > div")) {
                //     console.log('targetbg', getElementComputedStyle(element, 'background-color'), bgColor, opacity, element)
                // }

                elementInfoObject = { bgColor, opacity };
                element._wcc = { '_info': elementInfoObject };
            }
            // const opacity = elementInfoObject.opacity;
            // const alpha = elementInfoObject.bgColor.o * opacity;
            // if (alpha > 0 || opacity < 1) {
            //     ancestors.push({ el: element, ...elementInfoObject});
            // }

//console.log('loop stack', elementInfoObject.bgColor, element)

            if (elementInfoObject.bgColor.o > 0) {
                ancestors.push({ el: element, ...elementInfoObject });
            }
        }
        const bgColor = getBodyBackgroundColor();
        ancestors.push({el: document.body, bgColor, opacity: 1});

        return ancestors;
    }

    function getColorFromStack(ancestors) {
        let updated = ancestors[0].bgColor;
        //updated.o = updated.o * ancestors[0].opacity

        for (let i = 1; i < ancestors.length; i++) {
            updated = flattenColors(updated, ancestors[i].bgColor);
            //updated.o = ancestors[i].opacity;
        }

        return updated
    }

    function getOpacityFromStack(stack){
        let opacity = 1;
        stack.forEach(element => {
            opacity = opacity * element.opacity;
        });
        return opacity;
    }

    function flattenColors(fgColor, bgColor) {
        const alpha = fgColor.o;
        if(alpha === 1){
            return fgColor;
        }
        const r = (1 - alpha) * bgColor.r + alpha * fgColor.r;
        const g = (1 - alpha) * bgColor.g + alpha * fgColor.g;
        const b = (1 - alpha) * bgColor.b + alpha * fgColor.b;
        const o = fgColor.o + bgColor.o * (1 - fgColor.o);

        return {r, g, b, o};
    }

    function isValidHex(hexToCheck) {
        if (!hexToCheck || typeof hexToCheck !== 'string' || hexToCheck.indexOf('#') > 0) {
            return false;
        }

        hexToCheck = hexToCheck.replace('#', '');

        switch (hexToCheck.length) {
            case 3:
                return /^[0-9A-F]{3}$/i.test(hexToCheck);
            case 6:
                return /^[0-9A-F]{6}$/i.test(hexToCheck);
            case 8:
                return /^[0-9A-F]{8}$/i.test(hexToCheck);
            default:
                return false;
        }
    }

    function hexShorthandToExtended(shorthandHex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;

        return shorthandHex.replace(shorthandRegex, function (m, r, g, b) {
            return '#' + r + r + g + g + b + b;
        });
    }

    function RGBStringToObject(color) {
        let separator;
        const plainParameters = color.replace('rgb(', '').replace('rgba(', '').replace('(', '').replace(')', '').replace(/ /g, '');

        if (plainParameters.indexOf(',') > -1) {
            separator = ',';
        } else if (plainParameters.indexOf(':') > -1) {
            separator = ':';
        } else if (plainParameters.indexOf('/') > -1) {
            separator = '/';
        } else if (plainParameters.indexOf('.') > -1) {
            separator = '.';
        }

        const rgbValues = plainParameters.split(separator);

        return {
            r: parseInt(rgbValues[0]),
            g: parseInt(rgbValues[1]),
            b: parseInt(rgbValues[2]),
            o: rgbValues[3] === undefined ? 1 : parseFloat(rgbValues[3])
        }
    }

    function decToHex(positionInDecimalBase) {
        if (positionInDecimalBase == null) {
            return '00';
        }

        let positionAsNumber = parseInt(positionInDecimalBase);

        if (isNaN(positionAsNumber)) {
            return '00';
        } else if (positionAsNumber <= 0) {
            return '00';
        } else if (positionAsNumber > 255) {
            return 'FF';
        }

        positionAsNumber = Math.round(positionAsNumber);

        const baseString = '0123456789ABCDEF';
        return baseString.charAt((positionAsNumber - positionAsNumber % 16) / 16) + baseString.charAt(positionAsNumber % 16);
    }

    function hexToRGB(hex) {
        hex = hexShorthandToExtended(hex);

        const rgbValue = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return rgbValue ? {
            r: parseInt(rgbValue[1], 16),
            g: parseInt(rgbValue[2], 16),
            b: parseInt(rgbValue[3], 16)
        } : null;
    }


    function rgbToHex(RGBColor) {
        return '#' + decToHex(RGBColor.r) + decToHex(RGBColor.g) + decToHex(RGBColor.b);
    }

    function getFontInfo(el) {
        const computedStyle = document.defaultView.getComputedStyle(el, null);
    
        const weight = computedStyle.getPropertyValue('font-weight');
        const fontSize = parseInt(computedStyle.getPropertyValue('font-size').replace('px', ''));
        const isBold = parseInt(weight) >= 700 || weight === 'bold' || weight === 'bolder';
    
        return {
            isBold: isBold,
            size: (fontSize >= largeFontSize || (fontSize >= normalFontSize && isBold)) ? 'large' : 'small'
        }
    }

    function getDirectText(el) {
        const elStackInfo = getAncestorsStackInfo(el);
        const colorFromElStack = getColorFromStack(elStackInfo);
        const walker = document.createTreeWalker(
            el,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
    
        let textNode = null;
        while (textNode = walker.nextNode()) {
            if (textNode.nodeValue.trim().length > 0) {
                const current = textNode.parentElement;
                const ancestorsStackInfo = getAncestorsStackInfo(current);
                //const bgColorStack = ancestorsStackInfo.map(info => info.bgColor);
                const colorFromStack = getColorFromStack(ancestorsStackInfo);
    
                // Assuming getColorFromStack returns an RGBA object
                // Check if the effective background color is fully transparent
                //console.log('checkopacity', { colorFromElStack, colorFromStack, current, ancestorsStackInfo })
                if (colorFromStack.r === colorFromElStack.r && colorFromStack.g === colorFromElStack.g && colorFromStack.b === colorFromElStack.b) {
                    const textColor = getForegroundColor(current, ancestorsStackInfo);
                    // Found an element that has text and does not have any background interference

                    const { size } = getFontInfo(current);
                    return { color: textColor, bgColor: colorFromStack, size: size };
                }
            }
        }
    
        return { color: null, bgColor: null, size: null }; // No suitable element found
    }
};



function isElementVisible(element) {
    if(!element._wcc){
        element._wcc = {};
    }
    let isVisible = element._wcc._isVisible;
    if(isVisible === false){
        return isVisible;
    }

    if(element.tagName.toLowerCase() === 'body'){
        return true;
    }
    const parentNode = element.parentNode;
    if(!parentNode._wcc){
        parentNode._wcc = {};
    }
    const isParentVisible = parentNode._wcc._isVisible;

    if(isParentVisible === false){
        element._wcc._isVisible = false;
        return isParentVisible;
    }

    const getComputedStyle = document.defaultView.getComputedStyle(element, null);
    isVisible = getComputedStyle.getPropertyValue('display') !== 'none'
        && getComputedStyle.getPropertyValue('visibility') !== 'hidden'
        && isVisibleByPosition(getComputedStyle);

    if (isVisible && isParentVisible) {
        element._wcc._isVisible = isVisible;

        return isVisible;
    }

    if (isVisible && parentNode.tagName.toLowerCase() !== 'body') {
        //isVisible = isElementVisible(parentNode);
        isVisible = true;
    }

    element._wcc._isVisible = isVisible;

    return isVisible;
}

function isVisibleByPosition(getComputedStyle) {
    const position = getComputedStyle.getPropertyValue('position');
    const isPositioned = position === 'relative' || position === 'absolute';
    const top = getComputedStyle.getPropertyValue('top').replace('px', '');
    const left = getComputedStyle.getPropertyValue('left').replace('px', '');
    const zIndex = getComputedStyle.getPropertyValue('z-index');

    return !(isPositioned && ((top.indexOf('-') === 0 && parseInt(top) < -1000) || (left.indexOf('-') === 0 && parseInt(left) < -1000) || zIndex.indexOf('-') === 0));
}
