const cleanFor = (str) => {
    return str.replace(/_for_/, 'For');
};

export const cleanse = (obj) => {
    var copy;
    // Handle the 3 simple types, and null or undefined
    if (null == obj || 'object' != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = cleanse(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object || typeof obj === 'object') {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) {

                if (/_for_/.test(attr)) {
                    copy[cleanFor(attr)] = cleanse(obj[attr]);
                } else {
                    switch (attr) {
                        case 'title':
                        case '$ref':
                            if (typeof obj[attr] === 'string') {
                                copy[attr] = cleanse(cleanFor(obj[attr]));
                            } else {
                                copy[attr] = cleanse(obj[attr]);
                            }
                            break;
                        default:
                            copy[attr] = cleanse(obj[attr]);
                    }
                }

            } else {
                copy[attr] = cleanse(obj[attr]);
            }
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
};