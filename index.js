import fs from 'fs'
import path from 'path'



const CONCEPTS_DIRECTORY_URL = '/home/psadkowski/webwave/psadkowski/webwavecms/webwaver_front/webpack/src/com/webwave/scss/concepts'
const listOfFiles = []

const folders = await fs.promises.readdir(CONCEPTS_DIRECTORY_URL, async function(error, files) {
    if (error) return error;
})


folders.forEach((file) => {
    if (file.includes('.scss')) {
        listOfFiles.push({ type: 'file', fileName: file, path: `${CONCEPTS_DIRECTORY_URL}/${file}` })
    } else {
        listOfFiles.push({ type: 'directory', fileName: file, path: `${CONCEPTS_DIRECTORY_URL}/${file}`, files: [] })
    }
})


for (let index = 0; index < listOfFiles.length; index++) {
    const file = listOfFiles[index];
    if (file.type === 'directory') {
        const directoryFiles = await fs.promises.readdir(file.path, async function(error, files) {
            if (error) return error;
        })

        file.files = directoryFiles.map((fi) => ({
            type: fi.includes('.scss') ? 'file' : 'directory',
            fileName: fi,
            path: `${file.path}/${fi}`,
            files: fi.includes('.scss') ? undefined : []
        }))
    }
}

let obj = {}


let buttonsFile = listOfFiles.find(file => file.fileName === 'atoms').files.find((file) => file.fileName === 'buttons.scss')


let buttonFileContent = fs.readFileSync(buttonsFile.path, 'utf-8');
buttonFileContent = buttonFileContent.split(/\r?\n/).map(s => s.trim());
let buttonSizeConcepts = buttonFileContent.filter((bfc) => bfc.trim().startsWith('--concept--size'))

/**
 * Jak dostać modyfikator modyfikatora? 
 * Należy pobrać nazwę modyfikatora, który jest już używany i dołączyć go do Regexa
 * 
 * Jak pracować na dobrym obiekcie?
 * Przekazać go w funkcji jako prametr.
 * 
 * Co ma robić funkcja?
 * Funkcja ma dodawać obiekt, który ma nazwę mydyfikatora, a w środku style i puste warianty
 */

const findComponentNameFromConcept = (lines) => {
    const componentNames = [];
    lines.forEach((line) => {
        const componentNameRegex = /(?<=--size-)(.*?)(?=--)/g;
        const componentName = componentNameRegex.exec(line)
        if (Array.isArray(componentName)) componentNames.push(componentName[0])
    })

    return Array.from(new Set(componentNames))[0];
}

const findAllComponentModificatiorsFromConcept = (lines, componentName) => {
    const modificators = [];
    lines.forEach((line) => {
        const sizeModificatorRegex = new RegExp(`(?<=${componentName}--)(.*?)(?=(_|__))`, 'g');
        const sizeModificator = sizeModificatorRegex.exec(line);
        if (Array.isArray(sizeModificator)) modificators.push(sizeModificator[0]);
    })

    return Array.from(new Set(modificators))
}

const findSubmodifiactionsFromModificators = (mainModificator, modificators) => {
    const subModifactions = []
    const subModificationRegex = new RegExp(`(?<=${mainModificator}--)(.*)`, '');
    modificators.forEach((mod) => {
        const subModification = subModificationRegex.exec(mod);
        if (Array.isArray(subModification)) subModifactions.push(subModification[0]);
    })

    return Array.from(new Set(subModifactions))
}

const createComponentVariation = (nameOfVariation, obj) => {
    let newVariation = {
        styles: {},
        variations: {},
    }
    if (!obj.hasOwnProperty('variations')) obj['variations'] = {}
    obj['variations'][nameOfVariation] = {...newVariation }
}

const createComponentConfiguration = (options) => {
    return ({
        componentName: options.componentName,
        variations: {},
    })
}

const sizeMods = ['xsmall', 'small', 'medium', 'large', 'xlarge']
const componentName = findComponentNameFromConcept(buttonFileContent)
const componentModificators = findAllComponentModificatiorsFromConcept(buttonFileContent, componentName);
const componentBasicModificators = componentModificators.filter((mod) => !mod.includes('--') && !sizeMods.includes(mod));

const buttonConfiguration = createComponentConfiguration({
    componentName,
})




createComponentVariation('primary', buttonConfiguration);

componentBasicModificators.forEach((mod) => createComponentVariation(mod, buttonConfiguration))


Object.keys(buttonConfiguration.variations).forEach((key) => {
    const subMods = findSubmodifiactionsFromModificators(key, componentModificators);
    const directSubMod = subMods.filter((mod) => !mod.includes('--'))
    if (subMods.length) {
        console.log(key, directSubMod);
    }
})