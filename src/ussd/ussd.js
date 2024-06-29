require("dotenv").config({ path: ".env.local" });

const UssdMenu = require('ussd-builder');
const { TOKENS, TOKENKEY, AUTO_YIELD_ABI } = require("../constants");
const { parseUnits, formatUnits, parsePhoneNumber, getTokenBalance } = require("../helpers/utils");

const Africatalking = require("africastalking")({
    username: "sandbox",
    apiKey: process.env.AFRICASTALKING_API_KEY,
});


const makeMenu = ({ walletList, accountList, webList } = {}) => {
    const sms = Africatalking.SMS

    let menu = new UssdMenu();

    const authenticate = (message, nextState, failState) => {
        return ({
            run: () => {
                menu.con(message || 'Enter your pin:')
            },
            next: {
                // using regex to match user input to next state
                '*\\d{4,}': async () => {

                    const authenticated = await accountList.authenticate({ phonenumber: parsePhoneNumber(menu.args.phoneNumber), pin: menu.val });

                    if (!authenticated) return failState;

                    return nextState;
                }
            }
        })
    }

    menu.startState({
        run: () => {
            // use menu.con() to send response without terminating session      
            menu.con('Welcome. Choose option:' +
                '\n1. Create Account' +
                '\n2. Get Wallet address' +
                '\n3. Check balance' +
                '\n4. Send Crypto' +
                '\n5. Buy Crypto'
            );
        },

        next: {
            '1': async () => {
                const result = await accountList.findByPhonenumber({ phonenumber: parsePhoneNumber(menu.args.phoneNumber) });
                if (result) return "createOrClaimAccount.authenticate";

                return "createOrClaimAccount.firstname"
            },
            '2': 'getAccountWalletAddress',
            '3': 'getTokenBalance.selectToken',
            '4': 'sendCrypto.selectToken',
            '5': 'savings.tokens'
        }
    });


    menu.state('sendCrypto.selectToken', {
        run: () => {
            menu.con(
                'Select Token:\n' + TOKENKEY.reduce((acc, val, idx) => acc + `${idx + 1}: ${val} \n`, "")
            );
        },
        next: {
            // using regex to match user input to next state
            '*\\d': 'sendCrypto.enterAmount'
        }
    });

    menu.state('sendCrypto.enterAmount', {
        run: () => {
            menu.con('Enter amount:');
        },
        next: {
            // using regex to match user input to next state
            '*\\d+': 'sendCrypto.recipientNumber'
        }
    });

    menu.state('sendCrypto.recipientNumber', {
        run: () => {
            menu.con(
                'Enter recipient full phonenumber (no spaces)'
            );
        },
        next: {
            // using regex to match user input to next state
            '*\\d{1,3}\\d{9}': 'sendCrypto.repeatNumber'
        }
    });

    menu.state('sendCrypto.repeatNumber', {
        run: () => {
            menu.con(
                'Enter repeat phonenumber'
            );
        },
        next: {
            // using regex to match user input to next state
            '*\\d{1,3}\\d{9}': async () => {
                const [, , , phonenumber] = menu.args.text.split("*");
                if (menu.val != phonenumber) return 'sendCrypto.repeatNumber';

                return 'sendCrypto.authenticate';
            }
        }
    });

    menu.state('sendCrypto.authenticate', authenticate("", "sendCrypto.amount", "sendCrypto.authenticateFailed"));
    menu.state('sendCrypto.authenticateFailed', authenticate("Incorrect pin. Try again", "sendCrypto.amount", "sendCrypto.authenticateFailed"));

    menu.state('sendCrypto.amount', {
        run: async () => {
            try {

                const [, selectNumber, _amount, recipientPhonenumber, , pin] = menu.args.text.split("*");
                const tokenKey = TOKENKEY[parseInt(selectNumber) - 1];
                const token = TOKENS[tokenKey];

                if (!token) menu.end("Incorrect token specified");

                if (recipientPhonenumber === parsePhoneNumber(menu.args.phoneNumber)) menu.end("Invalid recipient phone number")

                const amount = parseUnits(_amount, token.decimals)

                menu.end("Transfer is processing");

                webList.transferToken({
                    fromPhonenumber: parsePhoneNumber(menu.args.phoneNumber),
                    toPhonenumber: parsePhoneNumber(recipientPhonenumber),
                    tokenAddress: token.address.trim(),
                    amount,
                    pin
                })

            } catch (error) {

            }
        }
    });

    menu.state('getTokenBalance.selectToken', {
        run: () => {
            menu.con(
                'Select Token:\n' + TOKENKEY.reduce((acc, val, idx) => acc + `${idx + 1}: ${val} \n`, "")
            );
        },
        next: {
            '*\\d': 'getTokenBalance.balance'
        }
    });


    menu.state('getTokenBalance.autheticate', authenticate("", "getTokenBalance.balance", "getTokenBalance.autheticateFailed"));

    menu.state('getTokenBalance.autheticateFailed', authenticate("Incorrect pin. Try again", "getTokenBalance.balance", "getTokenBalance.autheticateFailed"));

    menu.state('getTokenBalance.balance', {
        run: async () => {
            const [, selectNumber,] = menu.args.text.split("*");
            const tokenKey = TOKENKEY[parseInt(selectNumber) - 1];

            const token = TOKENS[tokenKey];

            if (!token) menu.end("Incorrect token specified");

            const wallet = await accountList.findByPhonenumber({ phonenumber: parsePhoneNumber(menu.args.phoneNumber) });

            if (!wallet) return menu.end(`Wallet not found`);

            const balance = token.address ? await getTokenBalance(token.address, wallet.evmAddress) : await getAccountBalance(evmAddress);

            menu.end(`Balance is ${balance} ${tokenKey}`);

        }
    });

    menu.state('getAccountWalletAddress', {
        run: async () => {
            const wallet = await accountList.findByPhonenumber({ phonenumber: parsePhoneNumber(menu.args.phoneNumber) });

            if (!wallet) return menu.end(`Wallet not found`);

            const { evmAddress } = wallet;

            return menu.end(`Wallet address is ${evmAddress}`);

        }
    });

    menu.state('createOrClaimAccount.firstname', {
        run: () => {
            menu.con('Enter your firstname:')
        },
        next: {
            // using regex to match user input to next state
            '*[a-zA-Z_0-9\-]{2,}': 'createOrClaimAccount.lastname'
        }
    });

    menu.state('createOrClaimAccount.lastname', {
        run: () => {
            menu.con('Enter your lastname:')

        },
        next: {
            // using regex to match user input to next state
            '*[a-zA-Z_0-9\-]{2,}': 'createOrClaimAccount.enterPin'
        }
    });

    menu.state('createOrClaimAccount.enterPin', {
        run: () => {
            menu.con('Enter your pin (at least 4 characters):')

        },
        next: {
            // using regex to match user input to next state
            '*\\d{4,}': 'createOrClaimAccount.confirmPin'
        }
    });

    menu.state('createOrClaimAccount.confirmPin', {
        run: () => {
            menu.con('Enter your pin again:')
        },
        next: {
            // using regex to match user input to next state
            '*\\d{4,}': () => {
                [, , , pin] = menu.args.text.split("*");
                console.log(pin, menu.val, pin !== menu.val)
                if (pin !== menu.val) return "createOrClaimAccount.pinsDontMatch";

                return "createOrClaimAccount.register";
            }
        }
    });

    menu.state('createOrClaimAccount.pinsDontMatch', {
        run: () => {
            menu.con('Pins do not match. Confirm pin again:')
        },
        next: {
            // using regex to match user input to next state
            '*\\d{4,}': () => {
                [, , , pin,] = menu.args.text.split("*");
                if (pin !== menu.val) return "createOrClaimAccount.pinsDontMatch";

                return "createOrClaimAccount.register";
            }
        }
    });

    menu.state('createOrClaimAccount.authenticate', {
        run: () => {
            menu.con('Enter your pin:')
        },
        next: {
            // using regex to match user input to next state
            '*\\d{4,}': async () => {

                const authenticated = await accountList.authenticate({ phonenumber: parsePhoneNumber(menu.args.phoneNumber), pin: menu.val });

                if (!authenticated) return "createOrClaimAccount.authenticationFailed";

                return "createOrClaimAccount.createWalletOnly";
            }
        }
    });

    menu.state('createOrClaimAccount.authenticationFailed', {
        run: () => {
            menu.con('Invalid Pin. Try again:')
        },
        next: {
            // using regex to match user input to next state
            '*\\d{4,}': async () => {

                const authenticated = await accountList.authenticate({ phonenumber: parsePhoneNumber(menu.args.phoneNumber), pin: menu.val });

                if (!authenticated) return "createOrClaimAccount.authenticationFailed";

                return "createOrClaimAccount.createWalletOnly";
            }
        }
    });

    menu.state('createOrClaimAccount.register', {
        run: async () => {
            menu.end('Account is registered successfully.');
            [, firstname, lastname, pin,] = menu.args.text.split("*");

            await webList.createWallet({ pin, firstname, lastname, phonenumber: parsePhoneNumber(menu.args.phoneNumber) });
        }
    });

    menu.state('createOrClaimAccount.createWalletOnly', {
        run: async () => {

            menu.end('Account is registered successfully.');

            const walletRes = await walletList.createOrClaimWallet({ phonenumber: parsePhoneNumber(menu.args.phoneNumber) });

        }
    });


    return menu;

}

module.exports = makeMenu