'use strict';
const phoneBook = new Map();
function syntaxError(lineNumber, charNumber) {
    throw new Error(`SyntaxError: Unexpected token at ${lineNumber}:${charNumber}`);
}
const processContactErrors = (command, lineNum, mode) => {
    if (command.slice(6 + mode, 14 + mode) !== 'контакт ') {
        syntaxError(lineNum, 7 + mode);
    }
    if (command.charAt(command.length - 1) !== ';') {
        syntaxError(lineNum, command.length + mode);
    }
};
const createContact = (command, lineNum) => {
    const regex = /^Создай контакт (|[^;]*);$/;
    if (regex.test(command)) {
        const newContactKey = command.slice(15, -1);
        if (phoneBook.has(newContactKey)) {
            return;
        }
        const newContact = new Map();
        newContact.set('phones', new Set());
        newContact.set('emails', new Set());
        phoneBook.set(newContactKey, newContact);
    }
    else {
        processContactErrors(command, lineNum, 1);
    }
};
const deleteContact = (command, lineNum) => {
    const regex = /^Удали контакт (|[^;]*);$/;
    if (regex.test(command)) {
        const key = command.slice(14, -1);
        if (phoneBook.has(key)) {
            phoneBook.delete(key);
        }
    }
    else {
        processContactErrors(command, lineNum, 0);
    }
};
const processPhoneOrEmail = (field, value, contactInfo, mode) => {
    if (field === 'телефон') {
        const formattedPhone = `+7 (${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 8)}-${value.slice(8, 10)}`;
        if (mode === 0) {
            contactInfo.get('phones').delete(formattedPhone);
        }
        else {
            contactInfo.get('phones').add(formattedPhone);
        }
    }
    else {
        if (mode === 0) {
            contactInfo.get('emails').delete(value);
        }
        else {
            contactInfo.get('emails').add(value);
        }
    }
};
const processAddInfoProbablyFields = (command, lineNum, mode) => {
    let probablyFields = command.slice(6 + mode).split(' ');
    let prevToken = 'и';
    let position = 7 + mode;
    for (let k = 0; k < probablyFields.length; k++) {
        let curToken = probablyFields[k];
        if (prevToken !== 'и' && curToken === 'для') {
            return position + 3;
        }
        if (prevToken === 'и') {
            if (curToken === 'почту') {
                prevToken = 'почту';
                position += curToken.length + 1;
            }
            else if (curToken === 'телефон') {
                prevToken = 'телефон';
                position += curToken.length + 1;
            }
            else {
                syntaxError(lineNum, position);
            }
        }
        else if (prevToken === 'почту') {
            if (curToken === '' || curToken === ';') {
                syntaxError(lineNum, position);
            }
            else {
                position += curToken.length + 1;
                prevToken = curToken;
            }
        }
        else if (prevToken === 'телефон') {
            if (curToken === '' || curToken === ';') {
                syntaxError(lineNum, position);
            }
            else {
                if (!(/^\d{10}$/.test(curToken))) {
                    syntaxError(lineNum, position);
                }
                else {
                    position += curToken.length + 1;
                    prevToken = curToken;
                }
            }
        }
        else if (/^\d{10}$/.test(prevToken) || /^[^ ;]$/.test(prevToken)) {
            if (curToken !== 'и') {
                syntaxError(lineNum, position);
            }
            else {
                position += 2;
                prevToken = curToken;
            }
        } else {
            syntaxError(lineNum, position)
        }
    }
};
const processInfoErrors = (command, lineNum, mode) => {
    let position = processAddInfoProbablyFields(command, lineNum, mode);
    if (command.slice(position, position + 9) !== 'контакта ') {
        syntaxError(lineNum, position + 1);
    }
    if (command.charAt(position + 9) === ' ') {
        syntaxError(lineNum, position + 10);
    }
    if (command.charAt(command.length - 1) !== ';') {
        syntaxError(lineNum, command.length + 1);
    }
};
const processInfo = (command, lineNum, mode) => {
    const curCommand = command.slice(6 + mode);
    const regex = /^((телефон \d{10})|(почту [^ ;]+))( и ((телефон \d{10})|(почту [^ ;]+)))* для контакта (|[^;]*);$/;
    if (regex.test(curCommand)) {
        const phonesAndMails = command.slice(6 + mode, command.indexOf(' для контакта'))
            .split(' ')
            .filter(el => el !== 'и');
        const key = command.slice(command.indexOf(' для контакта') + 14, -1);
        if (!phoneBook.has(key))
            return;
        const contactInfo = phoneBook.get(key);
        for (let k = 0; k < phonesAndMails.length; k += 2) {
            processPhoneOrEmail(phonesAndMails[k], phonesAndMails[k + 1], contactInfo, mode);
        }
    }
    else {
        processInfoErrors(command, lineNum, mode);
    }
};
const getStringForFields = (fields, phoneBookKey) => {
    const value = phoneBook.get(phoneBookKey);
    let result = [];
    for (let k = 0; k < fields.length; k++) {
        switch (fields[k]) {
            case 'имя':
                result.push(phoneBookKey);
                break;
            case 'почты':
                result.push(Array.from(value.get('emails')).join(','));
                break;
            case 'телефоны':
                result.push(Array.from(value.get('phones')).join(','));
                break;
        }
    }
    return result.join(';');
};
//+7 (800) 555-35-35
const testForQuery = (key, value, query) => {
    return key.includes(query) ||
        Array.from(value.get('phones')).some((phone) => {
            let unformatted = phone.slice(4,7)+phone.slice(9,12)+phone.slice(13,15)+phone.slice(16,18);
            return unformatted.includes(query)
        }) ||
        Array.from(value.get('emails')).some((el) => el.includes(query));
};
const processProbablySearchFields = (command, lineNum) => {
    let position = 7;
    while (true) {
        if (command.slice(position, position + 6) === "почты ") {
            position += 6;
        }
        else if (command.slice(position, position + 9) === "телефоны ") {
            position += 9;
        }
        else if (command.slice(position, position + 4) === "имя ") {
            position += 4;
        }
        else if (command.slice(position, position + 2) === "и ") {
            position += 2;
        }
        else
            syntaxError(lineNum, position + 1);
        if (command.slice(position, position + 2) === "и ") {
            position += 2;
        }
        else if (command.slice(position, position + 4) === "для ") {
            position += 4;
            break;
        }
        else
            syntaxError(lineNum, position + 1);
    }
    return position;
};
const processShowErrors = (command, lineNum) => {
    let position = processProbablySearchFields(command, lineNum);
    if (command.slice(position, position + 11) !== 'контактов, ') {
        syntaxError(lineNum, position + 1);
    }
    if (command.slice(position + 11, position + 15) !== 'где ') {
        syntaxError(lineNum, position + 12);
    }
    if (command.slice(position + 15, position + 20) !== 'есть ') {
        syntaxError(lineNum, position + 16);
    }
    if (command.charAt(command.length - 1) !== ';') {
        syntaxError(lineNum, command.length + 1);
    }
};
const showForQuery = (command, lineNum) => {
    const regex = /^Покажи (имя|почты|телефоны)( и (имя|почты|телефоны))* для контактов, где есть (|[^;]*);$/;
    if (regex.test(command)) {
        let p = processProbablySearchFields(command, lineNum);
        const fields = command
            .slice(7, p-4)
            .split(' ')
            .filter(word => word !== 'и' && word !== '');
        const query = command.slice(p + 20, -1);
        if (query === '')
            return [];
        const result = [];
        for (const [key, value] of phoneBook.entries()) {
            if (testForQuery(key, value, query)) {
                result.push(getStringForFields(fields, key));
            }
        }
        return result;
    }
    else {
        processShowErrors(command, lineNum);
    }
};
const processDeleteByQueryErrors = (command, lineNum) => {
    if (command.slice(6, 16) !== 'контакты, ') {
        syntaxError(lineNum, 7);
    }
    if (command.slice(16, 20) !== 'где ') {
        syntaxError(lineNum, 17);
    }
    if (command.slice(20, 25) !== 'есть ') {
        syntaxError(lineNum, 21);
    }
    if (command.charAt(25) === ' ') {
        syntaxError(lineNum, 26);
    }
    if (command.charAt(command.length - 1) !== ';') {
        syntaxError(lineNum, command.length + 1);
    }
};
const deleteContactByQuery = (command, lineNum) => {
    const regex = /^Удали контакты, где есть (|[^;]*);$/;
    if (regex.test(command)) {
        const query = command.slice(25, -1);
        if (query === '')
            return;
        for (const [key, value] of phoneBook.entries()) {
            if (testForQuery(key, value, query)) {
                phoneBook.delete(key);
            }
        }
    }
    else {
        processDeleteByQueryErrors(command, lineNum);
    }
};
const commands = new Set(['Создай', 'Удали', 'Добавь', 'Покажи']);
const deleteThings = new Set(['телефон', 'почту']);
function handleCommand(command, lineNum) {
    const words = command.split(' ');
    if (!commands.has(words[0])) {
        syntaxError(lineNum, 1);
        return;
    }
    let result = [];
    if (words[0] === 'Создай')
        createContact(command, lineNum);
    if (words[0] === 'Покажи')
        result = showForQuery(command, lineNum);
    if (words[0] === 'Добавь')
        processInfo(command, lineNum, 1);
    if (words[0] === 'Удали') {
        if (deleteThings.has(words[1])) {
            processInfo(command, lineNum, 0);
        }
        else if (words[1] === 'контакт') {
            deleteContact(command, lineNum);
        }
        else if (words[1] === 'контакты,') {
            deleteContactByQuery(command, lineNum);
        }
        else {
            syntaxError(lineNum, 7);
        }
    }
    return result;
}
function run(query) {
    const commands = query
        .replace(/;/g, ';\r\n')
        .split('\r\n')
        .filter(command => command !== '');
    let result = [];
    for (let i = 0; i < commands.length; i++) {
        let curRes = handleCommand(commands[i], i + 1);
        if (curRes.length !== 0)
            result.push(curRes);
    }
    return result.flat();
}
module.exports = { phoneBook, run };