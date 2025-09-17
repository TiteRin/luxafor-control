import {device} from "luxafor-api";
import {Device} from "luxafor-api/device";

// États prédéfinis (requirements)
// available → green, dnd → red
export const STATES: Record<string, string> = {
    "available": "#00FF00",
    "dnd": "#FF0000",
    "on": "#FFFFFF",
    "off": "#000000",
};


export function setColor(hexCode: string) {
    try {
        const flag: Device = device();

        flag.fadeTo(hexCode);
        console.log(`✅ Luxafor → ${hexCode}`);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("❌ Impossible de changer la couleur:", error.message);
        } else {
            console.error("❌ Erreur inconnue:", error);
        }
    }
}

export function setState(stateName: keyof typeof STATES) {
    const hex = STATES[stateName];
    if (!hex) {
        console.error(`❌ État inconnu: ${stateName}`);
        return;
    }
    return setColor(hex);
}