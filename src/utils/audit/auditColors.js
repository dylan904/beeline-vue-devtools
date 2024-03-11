const palettes = {
    primary: ['#01256A', '#02308B', '#023EB3', '#0357FC', '#3579FD', '#568EFD', '#8BB2FE', '#B1CBFE', '#CCDDFF', '#E6EEFF', '#F5F9FF'],
    secondary: ['#000B29', '#000E35', '#001245', '#001858', '#001A61', '#334881', '#546695', '#8A96B6', '#B0B8CE', '#E6E8EF', '#F0F2F7'],
    tertiary: ['#244000', '#335300', '#3E6500', '#4C8300', '#5B9C00', '#86BF2A', '#A2D64F', '#BADE81', '#D3E9B0', '#EAF4D9', '#EFF6E6'],
    'neutral-gray': ['#191C1D', '#2E3132', '#444748', '#5C5F5F', '#747678', '#8E9192', '#A9ACAC', '#C4C7C7', '#E1E3E3', '#EFF1F1', '#FAFAFA'],
    'neutral-variant': ['#232C35', '#2E3A45', '#3B4B59', '#4C6073', '#53697E', '#758798', '#8C9BA9', '#B0BAC4', '#CAD1D7', '#EEF0F2', '#F7F9FA'],
    error: ['#640A0A', '#820C0C', '#A80F0F', '#D81313', '#ED1515', '#F14444', '#F36262', '#F79393', '#F9B6B6', '#FDE8E8', '#FEF6F6'],
    warning: ['#FEF6F6', '#8C6A02', '#B58803', '#E8AF04', '#FFC004', '#FFCD36', '#FFD557', '#FFE28C', '#FFEBB1', '#FFF9E6', '#FFFCF5'],
    success: ['#2A542F', '#3B7542', '#55A85E', '#72E37F', '#7DF98C', '#97FAA3', '#A8FBB2', '#B4FABD', '#C3FCCA', '#DCFDE0', '#F2FEF4'],
    info: ['#004964', '#005F83', '#007BA9', '#009DD9', '#00ADEE', '#33BDF1', '#54C8F4', '#8AD9F7', '#B0E6FA', '#E6F7ED', '#F2FCFF'],
    accent: ['#33326B', '#43418C', '#5754B5', '#6F6CE8', '#7A77FF', '#9592FF', '#A6A4FF', '#C2C0FF', '#D6D5FF', '#F2F1FF', '#F4F3FF']
}

let toggled = false;

// document.addEventListener('keyup', (ev) => {
//     toggled = !toggled;
//     const { ctrlKey, shiftKey, key } = ev;
//     if (ctrlKey && shiftKey && key === 'C') {
//         swapColors(colors, toggled);
//         alert(toggled ? 'Closest design system colors applied' : 'Colors reverted');
//     }
// });

function swapColors(colors, toggled) {
    for (const colorData of colors) {
        console.log('check', colorData)
        for (const [prop, states] of Object.entries(colorData.props)) {
            colorData.el.style[prop] = toggled ? states.suggested.color : states.existing.color;
        }
    }
}

function auditColors(rootElement = document.body) {
    const allEls = [ rootElement, ...rootElement.querySelectorAll('*') ];

    return allEls.reduce((filtered, el) => {
        const colors = { props: {} };
        const styles = getComputedStyle(el);

        if (!isHidden(el)) {
            //console.log('bg?', rgbStringHasAlpha(styles.backgroundColor), styles.backgroundColor, el)
            if (rgbStringHasAlpha(styles.backgroundColor)) {
                const hex = rgbToHex(styles.backgroundColor);
                const rgba = parseRgbString(styles.backgroundColor);
                if (!colorInPalette(hex)) {
                    colors.props.backgroundColor = { existing: { color: styles.backgroundColor, hex }, suggested: getClosestPaletteColor(hex, rgba.a) }
                }
            }

            //console.log('border?', (styles.borderWidth !== '0px' && rgbStringHasAlpha(styles.borderColor)), styles.borderWidth, rgbStringHasAlpha(styles.borderColor), el);
            if (styles.borderWidth !== '0px' && rgbStringHasAlpha(styles.borderColor)) {
                const hex = rgbToHex(styles.borderColor);
                const rgba = parseRgbString(styles.borderColor);
                if (!colorInPalette(hex)) {
                    colors.props.borderColor = { existing: { color: styles.borderColor, hex }, suggested: getClosestPaletteColor(hex, rgba.a) }
                }
            }

            //console.log('text?', elHasText(el), rgbStringHasAlpha(styles.color), el)
            if (elHasText(el) && rgbStringHasAlpha(styles.color)) {
                const hex = rgbToHex(styles.color);
                //console.log('textmatch', colorInPalette(hex), hex)
                const rgba = parseRgbString(styles.color);
                if (!colorInPalette(hex)) {
                    colors.props.color = { existing: { color: styles.color, hex }, suggested: getClosestPaletteColor(hex, rgba.a) }
                }
            }

            if (Object.keys(colors.props).length) {
                //console.log('push', colors)
                colors.el = generateUniqueSelector(el);
                filtered.push(colors);
            }
        }

        return filtered;
    }, []);
}

function generateUniqueSelector(el) {
    if (!el || !el.parentElement) {
      return null;
    }
  
    const parts = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
      let selector = el.nodeName.toLowerCase();
      if (el.id) {
        selector += '#' + el.id;
        parts.unshift(selector);
        break; // An ID should be unique, so we can stop.
      } else {
        let sib = el, nth = 1;
        while (sib = sib.previousElementSibling) {
          if (sib.nodeName.toLowerCase() == selector) nth++;
        }
        if (nth != 1) selector += `:nth-child(${nth})`;
      }
      parts.unshift(selector);
      el = el.parentElement;
    }
    return parts.join(' > ');
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
        if (node.nodeType === Node.TEXT_NODE) {
            const trimmed = node.nodeValue.trim();
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

function getClosestPaletteColor(color, alpha) {
    let closest;

    for (const type in palettes) {
        for (const pColor of palettes[type]) {
            const delta = getColorDiff(color, pColor);
            if (!closest || delta < closest.delta) {
                const adjustedColor = (alpha && alpha !== '0') ? applyAlphaToColor(pColor, alpha) : pColor;
                closest = { delta: delta, hex: pColor, color: adjustedColor, palette: type }
            }
        }
    }

    return closest;
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

export default auditColors;