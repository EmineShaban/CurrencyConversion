const readlineSync = require('readline-sync');
const moment = require('moment');
const axios = require('axios');
const config = require('./config.json');
const conversionsFile = ('conversions.json');
const fs = require('fs');

const apiUrl = 'https://api.fastforex.io/historical';
const apiKey = config.api_key;

const isValidCurrencyCode = (code) => /^[A-Z]{3}$/.test(code.toUpperCase());
const isValidAmount = (amount) => !isNaN(amount) && parseFloat(amount).toFixed(2) === amount.toFixed(2);

const start = async () => {
    while (true) {
        const dateInput = readlineSync.question('Date: ');
        if (!moment(dateInput, 'YYYY-MM-DD', true).isValid()) {
            console.log('Please enter a valid date in format YYYY-MM-DD.');
            continue;
        }
        const amountInput = readlineSync.question('Amount: ');
        const amount = parseFloat(amountInput);
        if (!isValidAmount(amount)) {
            console.log('Please enter a valid amount');
            continue;
        }
        const baseCurrency = readlineSync.question('Base currency: ').toUpperCase();
        if (!isValidCurrencyCode(baseCurrency)) {
            console.log('Please enter a valid currency code');
            continue;
        }
        const targetCurrency = readlineSync.question('Target currency: ').toUpperCase();
        if (!isValidCurrencyCode(targetCurrency)) {
            console.log('Please enter a valid currency code');
            continue;
        }

        try {
            const rates = await getExchangeRate(dateInput, baseCurrency)
            const result = await convertCurrency(rates, amount, targetCurrency)
            console.log(`${amount} ${baseCurrency} is ${result} ${targetCurrency}`)
            const conversion = {
                dateInput,
                amount: amount.toFixed(2),
                base_currency: baseCurrency,
                target_currency: targetCurrency,
                converted_amount: result.toFixed(2),
            };
            saveConversion(conversion);
        } catch (error) {
            console.log(error.message);
        }

        const exit = readlineSync.question('Type "END" to exit or press Enter to continue: ');
        if (exit.toUpperCase() === 'END') {
            break;
        }
    }
}

const getExchangeRate = async (dateInput, baseCurrency) => {
 
    const url = `${apiUrl}?date=${dateInput}&from=${baseCurrency}&api_key=${apiKey}`;
    const response = await axios.get(url);
    const rates = response.data.results;
 
    return rates
}

const convertCurrency = async (rates, amount, targetCurrency) => {
    const rate = rates[targetCurrency];
    if (!rate) {
        throw new Error(`Rate for ${targetCurrency} not found.`);
    }
    return parseFloat((amount * rate).toFixed(2));
};

const saveConversion = (conversion) => {
    let conversions = [];
    if (fs.existsSync(conversionsFile)) {
        conversions = JSON.parse(fs.readFileSync(conversionsFile));
    }
    conversions.push(conversion);
    fs.writeFileSync(conversionsFile, JSON.stringify(conversions, null, 2));
};

start()