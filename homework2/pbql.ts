'use strict';

/**
 * Телефонная книга
 */
const phoneBook = new Map<string, Map<string, Set<string>>>();

/**
 * Вызывайте эту функцию, если есть синтаксическая ошибка в запросе
 * @param {number} lineNumber – номер строки с ошибкой
 * @param {number} charNumber – номер символа, с которого запрос стал ошибочным
 */
function syntaxError(lineNumber: number, charNumber: number) {
    throw new Error(`SyntaxError: Unexpected token at ${lineNumber}:${charNumber}`);
}

const processContactErrors = (command: string, lineNum: number, mode: number) => {
    // если вызов делался из создания контакта то mode=1, если из удаления то mode=0
    // это нужно для компенсации разницы между "Создай" и "Удали", после них синтаксис команд одинаковый
    if (command.slice(6 + mode, 14 + mode) !== 'контакт ') {
        syntaxError(lineNum, 7 + mode);
    }
    if (command.charAt(14 + mode) === ' ') {
        syntaxError(lineNum, 15 + mode);
    }
    if (!command.slice(14 + mode).includes(';')) {
        syntaxError(lineNum, command.length + mode);
    }
}

const createContact = (command: string, lineNum: number) => {
    const regex = /^Создай контакт (|[^;]*);$/;
    if (regex.test(command)) {
        const newContactKey: string = command.slice(15, -1);
        if (phoneBook.has(newContactKey)) {
            return;
        }
        const newContact = new Map();
        newContact.set('phones', new Set<string>());
        newContact.set('emails', new Set<string>());
        phoneBook.set(newContactKey, newContact);
    } else {
        processContactErrors(command, lineNum, 1);
    }
}

const deleteContact = (command: string, lineNum: number) => {
    const regex = /^Удали контакт (|[^;]*);$/;
    if (regex.test(command)) {
        const key = command.slice(14, -1)
        if (phoneBook.has(key)) {
            phoneBook.delete(key);
        }
    } else {
        processContactErrors(command, lineNum, 0);
    }
}

// mode=0 для удаления и mode=1 для добавления
const processPhoneOrEmail = (field: string, value: string, contactInfo: Map<string, Set<string>>, mode: number) => {
    if (field === 'телефон') {
        const formattedPhone = `+7 (${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 8)}-${value.slice(8, 10)}`;
        if (mode === 0) {
            contactInfo.get('phones').delete(formattedPhone);
        } else {
            contactInfo.get('phones').add(formattedPhone)
        }
    } else {
        if (mode === 0) {
            contactInfo.get('emails').delete(value);
        } else {
            contactInfo.get('emails').add(value)
        }
    }
}

const processAddInfoProbablyFields = (command: string, lineNum: number, mode: number) => {
    let probablyFields = command.slice(6 + mode).split(' ');
    let prevToken = 'и'
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
            } else if (curToken === 'телефон') {
                prevToken = 'телефон';
                position += curToken.length + 1;
            } else {
                syntaxError(lineNum, position);
            }//Добавь телефон 8005553535;
        } else if (prevToken === 'почту') {
            if (curToken === '' || curToken === ';') {
                syntaxError(lineNum, position + 1)
            } else {
                position += curToken.length + 1;
                prevToken = curToken;
            }
        } else if (prevToken === 'телефон') {
            if (curToken === '' || curToken === ';') {
                syntaxError(lineNum, position + 1)
            } else {
                if (!(/^\d{10}$/.test(curToken))) {
                    syntaxError(lineNum, position)
                } else {
                    position += curToken.length + 1;
                    prevToken = curToken;
                }
            }
        } else if (/^\d{10}$/.test(prevToken) || /^[^ ;]$/.test(prevToken)) {
            if (curToken !== 'и') {
                syntaxError(lineNum, position)
            } else {
                position += 2;
                prevToken = curToken;
            }
        }
    }
}

const processInfoErrors = (command: string, lineNum: number, mode: number) => {
    let position = processAddInfoProbablyFields(command, lineNum, mode);
    // если дожили до сюда, значит прошлая функция не выкинула ошибку и в position лежит позиция после "для", на которой должно начинаться " контактов"
    if (command.slice(position, position + 9) !== 'контакта ') {
        syntaxError(lineNum, position + 1);
    }
    if (command.charAt(position + 9) === ' ') {
        syntaxError(lineNum, position + 10);
    }
    if (command.charAt(command.length - 1) !== ';') {
        syntaxError(lineNum, command.length);
    }
}

const processInfo = (command: string, lineNum: number, mode: number) => {
    const curCommand = command.slice(6 + mode)
    const regex = /^((телефон \d{10})|(почту [^ ;]+))( и ((телефон \d{10})|(почту [^ ;]+)))* для контакта (|[^;]*);$/;
    if (regex.test(curCommand)) {
        const phonesAndMails = command.slice(6 + mode, command.indexOf(' для контакта'))
            .split(' ')
            .filter(el => el !== 'и');
        const key = command.slice(command.indexOf(' для контакта') + 14, -1);
        if (!phoneBook.has(key)) return;
        const contactInfo = phoneBook.get(key);
        for (let k = 0; k < phonesAndMails.length; k += 2) {
            processPhoneOrEmail(phonesAndMails[k], phonesAndMails[k + 1], contactInfo, mode);
        }
    } else {
        processInfoErrors(command, lineNum, mode);
    }
}

const getStringForFields = (fields: string[], phoneBookKey: string,) => {
    const value = phoneBook.get(phoneBookKey);
    let result = [];
    for (let k = 0; k < fields.length; k++) {
        switch (fields[k]) {
            case 'имя':
                result.push(phoneBookKey)
                break;
            case 'почты':
                result.push(Array.from(value.get('emails')).join(','))
                break;
            case 'телефоны':
                result.push(Array.from(value.get('phones')).join(','))
                break;
        }
    }
    return result.join(';');
}

const testForQuery = (key: string, value: { get: (arg0: string) => Set<string>; }, query: string) => {
    const keyContainsQuery: boolean = key.includes(query);
    const phonesContainsQuery: boolean = Array.from(value.get('phones')).some((el: string) => el.includes(query));
    const emailsContainsQuery: boolean = Array.from(value.get('emails')).some((el: string) => el.includes(query));
    return keyContainsQuery || phonesContainsQuery || emailsContainsQuery;
}

const processProbablySearchFields = (command: string, lineNum: number) => {
    let position = 7;
    while (true) {
        if (command.slice(position, position+6) === "почты ") {
            position += 6
        } else if (command.slice(position, position + 9) === "телефоны ") {
            position += 9
        } else if (command.slice(position, position + 4) === "имя ") {
            position += 4
        } else if (command.slice(position, position + 2) === "и ") {
            position += 2
        } else syntaxError(lineNum, position+1)

        if (command.slice(position, position + 2) === "и ") {
            position += 2
        } else if (command.slice(position, position + 4) === "для ") {
            position += 4
            break
        } else syntaxError(lineNum, position+1)
    }
    return position;
}

const processShowErrors = (command: string, lineNum: number) => {
    let position = processProbablySearchFields(command, lineNum);
    // если предыдущая функция не кинула ошибку, то в position лежит позиция после "для", на которой должно начинаться " контактов"
    if (command.slice(position, position + 11) !== 'контактов, ') {
        syntaxError(lineNum, position + 1);
    }
    if (command.slice(position + 11, position + 15) !== 'где ') {
        syntaxError(lineNum, position + 12)
    }
    if (command.slice(position + 15, position + 20) !== 'есть ') {
        syntaxError(lineNum, position + 16)
    }
    if (command.charAt(command.length - 1) !== ';') {
        syntaxError(lineNum, command.length);
    }
}

const showForQuery = (command: string, lineNum: number) => {
    const regex = /^Покажи (имя|почты|телефоны)( и (имя|почты|телефоны))* для контактов, где есть (|[^;]*);$/;
    if (regex.test(command)) {
        const fields: string[] = command
            .slice(7, command.indexOf('для контактов'))
            .split(' ')
            .filter(word => word !== 'и' && word !== '');
        const query: string = command.slice(command.indexOf('где есть') + 9, -1);
        if (query === '') return [];
        const result: string[] = [];
        for (const [key, value] of phoneBook) {
            if (testForQuery(key, value, query)) {
                result.push(getStringForFields(fields, key));
            }
        }
        return result;
    } else {
        processShowErrors(command, lineNum);
    }
}

const processDeleteByQueryErrors = (command:string, lineNum:number) => {
    if (command.slice(6,16) !== 'контакты, ') {
        syntaxError(lineNum, 7);
    }
    if (command.slice(16,20) !== 'где ') {
        syntaxError(lineNum, 17)
    }
    if (command.slice(20,25) !== 'есть ') {
        syntaxError(lineNum, 21);
    }
    if (command.charAt(25) === ' ') {
        syntaxError(lineNum,26)
    }
    if (command.charAt(command.length-1) !== ';') {
        syntaxError(lineNum, command.length)
    }
}

const deleteContactByQuery = (command: string, lineNum: number) => {
    const regex = /^Удали контакты, где есть (|[^;]*);$/;
    if (regex.test(command)) {
        const query = command.slice(25, -1);
        if (query === '') return;
        for (const [key, value] of phoneBook) {
            if (testForQuery(key, value, query)) {
                phoneBook.delete(key);
            }
        }
    } else {
        processDeleteByQueryErrors(command, lineNum);
    }
}

const commands = new Set(['Создай', 'Удали', 'Добавь', 'Покажи'])
const deleteThings = new Set(['телефон', 'почту'])

function handleCommand(command: string, lineNum: number) {
    const words: string[] = command.split(' ');
    if (!commands.has(words[0])) {
        syntaxError(lineNum, 1);
        return;
    }
    let result: string[] = [];
    if (words[0] === 'Создай')
        createContact(command, lineNum);
    if (words[0] === 'Покажи')
        result = showForQuery(command, lineNum);
    if (words[0] === 'Добавь')
        processInfo(command, lineNum, 1);
    if (words[0] === 'Удали') {
        if (deleteThings.has(words[1])) {
            processInfo(command, lineNum, 0);
        } else if (words[1] === 'контакт') {
            deleteContact(command, lineNum)
        } else if (words[1] === 'контакты,') {
            deleteContactByQuery(command, lineNum)
        } else {
            syntaxError(lineNum, 7);
        }
    }
    return result;
}

/**
 * Выполнение запроса на языке pbQL
 * @param {string} query
 * @returns {string[]} - строки с результатами запроса
 */
function run(query: string) {
    const commands: string[] = query
        .replace(/;/g, ';\r\n')
        .split('\r\n')
        .filter(command => command !== '');
    let result: string[][] = [];
    for (let i: number = 0; i < commands.length; i++) {
        let curRes = handleCommand(commands[i], i + 1);
        if (curRes.length !== 0) result.push(curRes);
    }
    return result.flat();
}

module.exports = {phoneBook, run};

console.log('1. ')
console.log(run('Покажи имя для контактов, где есть ий;'))
console.log('----------------------------------------------------------------------------------------------------------');
phoneBook.clear();
console.log('2. ')
console.log(run(
    'Создай контакт Григорий;' +
    'Создай контакт Василий;' +
    'Создай контакт Иннокентий;' +
    'Покажи имя для контактов, где есть ий;'
))
console.log('----------------------------------------------------------------------------------------------------------');
phoneBook.clear();
console.log('3. ')
console.log(run(
    'Создай контакт Григорий;' +
    'Создай контакт Василий;' +
    'Создай контакт Иннокентий;' +
    'Покажи имя и имя и имя для контактов, где есть ий;'
))
console.log('----------------------------------------------------------------------------------------------------------');
phoneBook.clear();
console.log('4. ')
console.log(run(
    'Создай контакт Григорий;' +
    'Покажи имя для контактов, где есть ий;' +
    'Покажи имя для контактов, где есть ий;'
))
console.log('----------------------------------------------------------------------------------------------------------');
phoneBook.clear();
console.log('5. ')
console.log(run(
    'Создай контакт Григорий;' +
    'Создай контакт Вася;' +
    'Создай контакт ;' +
    'Удали контакт Григорий;' +
    'Покажи имя для контактов, где есть ий;' +
    'Покажи имя для контактов, где есть ;'
))
console.log('----------------------------------------------------------------------------------------------------------');
phoneBook.clear();
console.log('6. ')
console.log(run(
    'Создай контакт Григорий;' +
    'Добавь телефон 5556667787 для контакта Григорий;' +
    'Добавь телефон 5556667788 и почту grisha@example.com для контакта Григорий;' +
    'Покажи имя и телефоны и почты для контактов, где есть ий;'
))
console.log('----------------------------------------------------------------------------------------------------------');
phoneBook.clear();
console.log('7. ')
console.log(run(
    'Создай контакт Григорий;' +
    'Добавь телефон 5556667788 для контакта Григорий;' +
    'Удали телефон 5556667788 для контакта Григорий;' +
    'Покажи имя и телефоны для контактов, где есть ий;'
))
console.log('----------------------------------------------------------------------------------------------------------');
phoneBook.clear();
console.log('8. ' + run(''))
console.log('----------------------------------------------------------------------------------------------------------');
phoneBook.clear();
console.log('9. ')
console.log(run('Создай контакт ;' + 'Добавь телефон 8005553535 для контакта ;' +'Покажи имя для контактов, где есть 8;'));
console.log('----------------------------------------------------------------------------------------------------------');
phoneBook.clear();
console.log('10. ')
console.log(run('Покажи имя для контактов, где есть  ;'))