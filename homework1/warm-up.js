'use strict';

/**
 * Складывает два целых числа
 * @param {Number} a Первое целое
 * @param {Number} b Второе целое
 * @throws {TypeError} Когда в аргументы переданы не числа
 * @returns {Number} Сумма аргументов
 */
function abProblem(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new TypeError();
    }
    return a+b;
}

/**
 * Определяет век по году
 * @param {Number} year Год, целое положительное число
 * @throws {TypeError} Когда в качестве года передано не число
 * @throws {RangeError} Когда год – отрицательное значение
 * @returns {Number} Век, полученный из года
 */
function centuryByYearProblem(year) {
    if (typeof year !== 'number') {
        throw new TypeError();
    }
    if (!Number.isInteger(year) || year < 0){
        throw new RangeError();
    }
    return Math.ceil(year / 100);
}

/**
 * Переводит цвет из формата HEX в формат RGB
 * @param {String} hexColor Цвет в формате HEX, например, '#FFFFFF'
 * @throws {TypeError} Когда цвет передан не строкой
 * @throws {RangeError} Когда значения цвета выходят за пределы допустимых
 * @returns {String} Цвет в формате RGB, например, '(255, 255, 255)'
 */
function colorsProblem(hexColor) {
    if (typeof hexColor !== 'string') {
        throw new TypeError();
    }
    if (!(hexColor.match(/^#[\da-fA-F]{6}$/))) {
        throw new RangeError();
    }
    
    const rgbColor = new Array(3);
    rgbColor[0] = parseInt(hexColor.substr(1, 2), 16);
    rgbColor[1] = parseInt(hexColor.substr(3, 2), 16);
    rgbColor[2] = parseInt(hexColor.substr(5, 2), 16);
    return `(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]})`;
}

/**
 * Находит n-ое число Фибоначчи
 * @param {Number} n Положение числа в ряде Фибоначчи
 * @throws {TypeError} Когда в качестве положения в ряде передано не число
 * @throws {RangeError} Когда положение в ряде не является целым положительным числом
 * @returns {Number} Число Фибоначчи, находящееся на n-ой позиции
 */
function fibonacciProblem(n) {
    if (typeof n !== 'number'){
        throw new TypeError();
    }
    if (!Number.isInteger(n) || n < 1){
        throw new RangeError();
    }
    let x = 0;
    let y = 1;
    for (let i = 0; i < n; i++) {
        const tmpY = x + y;
        x = y;
        y = tmpY;
    }
    return x;
}

/**
 * Транспонирует матрицу
 * @param {(Any[])[]} matrix Матрица размерности MxN
 * @throws {TypeError} Когда в функцию передаётся не двумерный массив
 * @returns {(Any[])[]} Транспонированная матрица размера NxM
 */
function matrixProblem(matrix) {
    if (!Array.isArray(matrix)  || matrix.length === 0 || !matrix.every(Array.isArray) || !matrix.every(x => x.length === matrix[0].length)) {
        throw new TypeError();
    }
    const transponatedMatrix = []
    for (let n = 0; n < matrix[0].length; n++) {
        transponatedMatrix[n] = []
        for (let m = 0; m < matrix.length; m++) {
            transponatedMatrix[n][m] = matrix[m][n]
        }
    }
    return transponatedMatrix;
}

/**
 * Переводит число в другую систему счисления
 * @param {Number} n Число для перевода в другую систему счисления
 * @param {Number} targetNs Система счисления, в которую нужно перевести (Число от 2 до 36)
 * @throws {TypeError} Когда переданы аргументы некорректного типа
 * @throws {RangeError} Когда система счисления выходит за пределы значений [2, 36]
 * @returns {String} Число n в системе счисления targetNs
 */
function numberSystemProblem(n, targetNs) {
    if (typeof n !== 'number' || typeof targetNs !== 'number') {
        throw new TypeError();
    }
    if (!Number.isInteger(targetNs) || targetNs < 2 || targetNs > 36) {
        throw new RangeError();
    }
    return n.toString(targetNs);
}

/**
 * Проверяет соответствие телефонного номера формату
 * @param {String} phoneNumber Номер телефона в формате '8–800–xxx–xx–xx'
 * @throws {TypeError} Когда в качестве аргумента передаётся не строка
 * @returns {Boolean} Если соответствует формату, то true, а иначе false
 */
 function phoneProblem(phoneNumber) {
    if (typeof(phoneNumber) !== 'string')
        throw new TypeError();

    if (phoneNumber.length !== 15){
        return false;
    }

    return /8-800-\d{3}-\d{2}-\d{2}/.test(phoneNumber);
}

/**
 * Определяет количество улыбающихся смайликов в строке
 * @param {String} text Строка в которой производится поиск
 * @throws {TypeError} Когда в качестве аргумента передаётся не строка
 * @returns {Number} Количество улыбающихся смайликов в строке
 */
function smilesProblem(text) {
    if (typeof text !== 'string') {
        throw new TypeError();
    }
    return (text.match(/:-\)|\(-:/g) || []).length
}

/**
 * Определяет победителя в игре "Крестики-нолики"
 * Тестами гарантируются корректные аргументы.
 * @param {(('x' | 'o')[])[]} field Игровое поле 3x3 завершённой игры
 * @returns {'x' | 'o' | 'draw'} Результат игры
 */
function ticTacToeProblem(field) {
    let checkRows = (field) => {
        for (let i = 0; i < field.length; i++) {
            if (field[i].filter(x => x === 'x').length === 3) return 'x';
            if (field[i].filter(x => x === 'o').length === 3) return 'o';
        }
        return ''
    }
    let transpose = (matrix) => {
        if (!Array.isArray(matrix)  || matrix.length === 0 || !matrix.every(Array.isArray) || !matrix.every(x => x.length === matrix[0].length)) {
            throw new TypeError();
        }
        const transponatedMatrix = []
        for (let n = 0; n < matrix[0].length; n++) {
            transponatedMatrix[n] = []
            for (let m = 0; m < matrix.length; m++) {
                transponatedMatrix[n][m] = matrix[m][n]
            }
        }
        return transponatedMatrix;
    }
    let winner = checkRows(field);
    if (winner) return winner;

    let transpField = transpose(field);
    winner = checkRows(transpField);
    if (winner) return winner;
    if ((field[0][0] === field[1][1] && field[1][1] === field[2][2]) ||
        (field[0][2] === field[1][1] && field[1][1] === field[2][0]))
        winner = field[1][1];
    if (winner) return winner
    return 'draw';
}

module.exports = {
    abProblem,
    centuryByYearProblem,
    colorsProblem,
    fibonacciProblem,
    matrixProblem,
    numberSystemProblem,
    phoneProblem,
    smilesProblem,
    ticTacToeProblem
};